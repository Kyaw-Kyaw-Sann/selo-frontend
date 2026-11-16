import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import Dialog from '../../../components/ui/dialog'
import Button from '../../../components/ui/button'
import Input from '../../../components/ui/input'
import Select from '../../../components/ui/select'
import LoadingState from '../../../components/shared/loading-state'
import ErrorState from '../../../components/shared/error-state'
import type { ApiError } from '../../../types/api'
import { useSaveCategoryMutation, useRootCategoriesQuery } from '../categories.queries'
import { categoryFormSchema } from '../categories.schema'
import type { CategoryFormInput } from '../categories.schema'
import type { Category } from '../categories.types'

type CategoryFormDialogProps = {
  category?: Category
  onClose: () => void
  onSaved: () => void
}

export default function CategoryFormDialog({ category, onClose, onSaved }: CategoryFormDialogProps) {
  const rootsQuery = useRootCategoriesQuery()
  const saveMutation = useSaveCategoryMutation(category)
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: category?.name ?? '', parentId: category?.parentId ?? '' },
  })

  const pending = isSubmitting || saveMutation.isPending
  const roots = rootsQuery.data ?? []
  const hasChildren = roots.some((root) => root.id === category?.id && root.children.length > 0)
  const parentMissing = Boolean(category?.parentId && !roots.some((root) => root.id === category.parentId))

  const onSubmit = async (input: CategoryFormInput) => {
    clearErrors('root')
    const parentId = input.parentId || null

    if (category && parentId === category.id) {
      setError('parentId', { message: 'Category cannot be its own parent' })
      return
    }
    if (hasChildren && parentId !== null) {
      setError('parentId', { message: 'A category with children must remain a root category' })
      return
    }
    if (parentId !== null && !roots.some((root) => root.id === parentId)) {
      setError('parentId', { message: 'Select an available root category or choose None' })
      return
    }
    if (category && input.name === category.name && parentId === category.parentId) {
      onClose()
      return
    }
    try {
      // Empty select option = root; selected root ID = child category ဖြစ်သည်။
      await saveMutation.mutateAsync({ name: input.name, parentId })
      onSaved()
      toast.success(category ? 'Category updated successfully' : 'Category created successfully')
      onClose()
    } catch (error) {
      if (isAxiosError<ApiError>(error)) {
        if (error.response?.status === 401) return
        const code = error.response?.data?.code
        if (code === 'PARENT_CATEGORY_NOT_FOUND' || code === 'CATEGORY_DEPTH_EXCEEDED' || code === 'CATEGORY_SELF_PARENT') {
          setError('parentId', { message: error.response?.data?.message || 'Select a valid root category' })
          // တခြား session က hierarchy ပြောင်းထားနိုင်လို့ parent options ပြန်ယူသည်။
          void rootsQuery.refetch()
          return
        }
        setError('root', {
          message: !error.response
            ? 'Unable to connect. Check your connection and try again'
            : error.response.status === 403
              ? 'You do not have permission to save categories'
              : error.response.data?.message || 'Unable to save category. Please try again',
        })
      } else {
        setError('root', { message: 'Unable to save category. Please try again' })
      }
    }
  }

  const parentsDenied = isAxiosError(rootsQuery.error) && rootsQuery.error.response?.status === 403

  return (
    <Dialog title={category ? 'Edit category' : 'Add category'} onClose={onClose} closeDisabled={pending}>
      {rootsQuery.isPending ? (
        <LoadingState message="Loading parent categories…" />
      ) : rootsQuery.isError ? (
        <ErrorState
          title={parentsDenied ? 'Permission denied' : 'Unable to load parent categories'}
          message={parentsDenied ? 'You do not have permission to view categories' : 'Please try again'}
          onRetry={parentsDenied ? undefined : () => void rootsQuery.refetch()}
          isRetrying={rootsQuery.isFetching}
        />
      ) : (
        <form noValidate onSubmit={handleSubmit(onSubmit)} aria-busy={pending} className="space-y-4">
          <div>
            <label htmlFor="category-name" className="mb-1.5 block font-medium text-heading">Name</label>
            <Input
              id="category-name"
              autoFocus
              maxLength={150}
              readOnly={pending}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'category-name-error' : undefined}
              {...register('name')}
            />
            {errors.name && <p id="category-name-error" role="alert" className="mt-1 text-sm text-danger">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="category-parent" className="mb-1.5 block font-medium text-heading">Parent category (optional)</label>
            <Select
              id="category-parent"
              disabled={pending}
              aria-invalid={Boolean(errors.parentId)}
              aria-describedby={errors.parentId ? 'category-parent-hint category-parent-error' : 'category-parent-hint'}
              {...register('parentId')}
            >
              <option value="">None — root category</option>
              {parentMissing && category?.parentId && (
                <option value={category.parentId} disabled>Current parent unavailable — choose another parent</option>
              )}
              {/* Self ကိုဖယ်ပြီး children ရှိတဲ့ root အတွက် None တစ်ခုသာ ခွင့်ပြုသည်။ */}
              {roots.filter((root) => root.id !== category?.id && !hasChildren).map((root) => (
                <option key={root.id} value={root.id}>
                  {root.name}{root.isActive ? '' : ' (Inactive)'}
                </option>
              ))}
            </Select>
            <p id="category-parent-hint" className="mt-1 text-sm text-muted">
              {hasChildren ? 'This category has children and must remain a root category' : 'Choose a root for a child category, or None for a root category'}
            </p>
            {errors.parentId && <p id="category-parent-error" role="alert" className="mt-1 text-sm text-danger">{errors.parentId.message}</p>}
          </div>

          {errors.root && <p role="alert" className="rounded-control bg-danger-soft p-3 text-sm text-danger">{errors.root.message}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={pending} className="rounded-control border border-input-border px-4 py-2 disabled:opacity-50">Cancel</button>
            <Button type="submit" disabled={pending || Boolean(category && !isDirty)}>{pending ? 'Saving…' : 'Save category'}</Button>
          </div>
        </form>
      )}
    </Dialog>
  )
}

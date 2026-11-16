import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import Dialog from '../../../components/ui/dialog'
import Input from '../../../components/ui/input'
import Button from '../../../components/ui/button'
import type { ApiError } from '../../../types/api'
import { useSaveUnitMutation } from '../units.queries'
import { unitSchema } from '../units.schema'
import type { CreateUnitInput, Unit } from '../units.types'

type UnitFormDialogProps = {
  unit?: Unit
  onClose: () => void
}

export default function UnitFormDialog({
  unit,
  onClose,
}: UnitFormDialogProps) {
  const saveMutation = useSaveUnitMutation(unit?.id)

  // Form values/errors ကို React Hook Form က ပိုင်ဆိုင်သည်။
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateUnitInput>({
    resolver: zodResolver(unitSchema),
    // Edit အတွက် ရွေးထားတဲ့ row ကို initial values အဖြစ်သာ သုံးသည်။
    defaultValues: { name: unit?.name ?? '', code: unit?.code ?? '' },
  })

  const pending = isSubmitting || saveMutation.isPending

  const onSubmit = async (input: CreateUnitInput) => {
    clearErrors('root')

    if (unit && input.name === unit.name && input.code === unit.code) {
      onClose()
      return
    }

    try {
      // Create/edit နှစ်မျိုးလုံး server save ပြီး list invalidation ကို စောင့်သည်။
      await saveMutation.mutateAsync(input)
      toast.success(unit ? 'Unit updated successfully' : 'Unit created successfully')
      onClose()
    } catch (error) {
      if (isAxiosError<ApiError>(error)) {
        if (error.response?.status === 401) {
          // Mutation hook က session ရှင်းပြီး AuthGuard ကို လွှဲထားသည်။
          return
        }

        if (
          error.response?.status === 409 &&
          error.response.data?.code === 'UNIT_CODE_EXISTS'
        ) {
          // သိထားတဲ့ field-specific backend error ကို field နားမှာပြသည်။
          setError(
            'code',
            { message: 'Unit code already exists' },
            { shouldFocus: true },
          )
          return
        }

        setError('root', {
          message:
            !error.response
              ? 'Unable to connect. Check your connection and try again'
              : error.response.status === 403
              ? 'You do not have permission to save units'
              : error.response?.data?.message ||
                'Unable to save unit. Please try again',
        })
      } else {
        setError('root', {
          message: 'Unable to save unit. Please try again',
        })
      }

      // Failure မှာ reset မလုပ်လို့ ရေးထားတဲ့ values ဆက်ရှိသည်။
    }
  }

  return (
    <Dialog
      title={unit ? 'Edit unit' : 'Add unit'}
      onClose={onClose}
      closeDisabled={pending}
    >
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        aria-busy={pending}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="unit-name"
            className="mb-1.5 block font-medium text-heading"
          >
            Name
          </label>
          <Input
            id="unit-name"
            autoFocus
            maxLength={80}
            readOnly={pending}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'unit-name-error' : undefined}
            {...register('name')}
          />
          {errors.name && (
            <p id="unit-name-error" role="alert" className="mt-1 text-sm text-danger">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="unit-code"
            className="mb-1.5 block font-medium text-heading"
          >
            Code
          </label>
          <Input
            id="unit-code"
            maxLength={30}
            readOnly={pending}
            aria-invalid={Boolean(errors.code)}
            aria-describedby={errors.code ? 'unit-code-error' : undefined}
            {...register('code')}
          />
          {errors.code && (
            <p id="unit-code-error" role="alert" className="mt-1 text-sm text-danger">
              {errors.code.message}
            </p>
          )}
        </div>

        {errors.root && (
          <p role="alert" className="rounded-control bg-danger-soft p-3 text-sm text-danger">
            {errors.root.message}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-control border border-input-border px-4 py-2 disabled:opacity-50"
          >
            Cancel
          </button>

          <Button type="submit" disabled={pending || Boolean(unit && !isDirty)}>
            {pending ? 'Saving…' : 'Save unit'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

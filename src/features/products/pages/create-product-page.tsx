import { isAxiosError } from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import PageHeader from '../../../components/shared/page-header'
import LoadingState from '../../../components/shared/loading-state'
import ErrorState from '../../../components/shared/error-state'
import EmptyState from '../../../components/shared/empty-state'
import { useRootCategoriesQuery } from '../../categories/categories.queries'
import { useUnitOptionsQuery } from '../../units/units.queries'
import ProductForm from '../components/product-form'
import { useCreateProductMutation } from '../products.queries'
import type { CreateProductInput } from '../products.types'

export default function CreateProductPage() {
  const navigate = useNavigate()
  const categoriesQuery = useRootCategoriesQuery()
  const unitsQuery = useUnitOptionsQuery()
  const createMutation = useCreateProductMutation()
  const activeUnits = unitsQuery.data?.filter((unit) => unit.isActive) ?? []
  const denied = [categoriesQuery.error, unitsQuery.error].some((error) => isAxiosError(error) && error.response?.status === 403)
  const retryOptions = () => { void categoriesQuery.refetch(); void unitsQuery.refetch() }

  const onSubmit = async (input: CreateProductInput) => {
    await createMutation.mutateAsync(input)
    toast.success('Product created successfully')
    navigate('/products', { replace: true })
  }

  let content
  if (denied) {
    content = <ErrorState title="Permission denied" message="You do not have permission to view these options" />
  } else if (categoriesQuery.isPending || unitsQuery.isPending) {
    content = <LoadingState message="Loading product options…" />
  } else if (!categoriesQuery.data || !unitsQuery.data) {
    content = (
      <ErrorState
        title="Unable to load product options"
        message="Please try again"
        onRetry={retryOptions}
        isRetrying={categoriesQuery.isFetching || unitsQuery.isFetching}
      />
    )
  } else if (activeUnits.length === 0) {
    content = <><EmptyState title="An active unit is required" description="Create or activate a shared unit before adding a product" /><Link to="/units" className="mt-3 inline-block font-medium text-primary underline">Manage units</Link></>
  } else {
    content = <ProductForm categories={categoriesQuery.data} units={activeUnits} onSubmit={onSubmit} onCancel={() => navigate('/products')} />
  }

  return (
    <>
      <PageHeader title="Add product" description="Set up product details, units and selling prices" />
      {/* Cached options ရှိရင် refresh failure ကြောင့် form ကို unmount မလုပ်ပါ။ */}
      {!denied && categoriesQuery.data && unitsQuery.data && activeUnits.length > 0 && (categoriesQuery.isError || unitsQuery.isError) && (
        <div className="mb-4">
          <ErrorState title="Unable to refresh product options" message="Showing previously loaded options. Your unsaved values are kept; the server will validate them when saving." onRetry={retryOptions} isRetrying={categoriesQuery.isFetching || unitsQuery.isFetching} />
        </div>
      )}
      {content}
    </>
  )
}

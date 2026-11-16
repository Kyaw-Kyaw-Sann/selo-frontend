import { useState } from 'react'
import { isAxiosError } from 'axios'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import PageHeader from '../../../components/shared/page-header'
import LoadingState from '../../../components/shared/loading-state'
import ErrorState from '../../../components/shared/error-state'
import { useRootCategoriesQuery } from '../../categories/categories.queries'
import { useUnitOptionsQuery } from '../../units/units.queries'
import ProductForm from '../components/product-form'
import { buildProductUpdate } from '../products.form'
import { useProductQuery, useUpdateProductMutation } from '../products.queries'
import type { ProductFormData, ProductDetail } from '../products.types'
import type { RootCategory } from '../../categories/categories.types'
import type { Unit } from '../../units/units.types'

type EditProductFormProps = {
  product: ProductDetail
  categories: RootCategory[]
  units: Unit[]
}

function EditProductForm({ product, categories, units }: EditProductFormProps) {
  // Form စဖွင့်ချိန် snapshot နဲ့သာ diff စစ်သည်။ Background refetch က baseline မပြောင်းပါ။
  const [originalProduct] = useState(product)
  const navigate = useNavigate()
  const updateMutation = useUpdateProductMutation(originalProduct.id)

  const onSubmit = async (input: ProductFormData) => {
    const changes = buildProductUpdate(originalProduct, input)
    if (Object.keys(changes).length > 0) {
      await updateMutation.mutateAsync(changes)
      toast.success('Product updated successfully')
    }
    navigate('/products', { replace: true })
  }

  return <ProductForm product={originalProduct} categories={categories} units={units} onSubmit={onSubmit} onCancel={() => navigate('/products')} />
}

export default function EditProductPage() {
  const { id = '' } = useParams()
  const validId = /^[1-9]\d*$/.test(id) && (id.length < 19 || (id.length === 19 && id <= '9223372036854775807'))
  const productQuery = useProductQuery(validId ? id : '')
  const categoriesQuery = useRootCategoriesQuery()
  const unitsQuery = useUnitOptionsQuery()
  const productStatus = isAxiosError(productQuery.error) ? productQuery.error.response?.status : undefined
  const optionsDenied = [categoriesQuery.error, unitsQuery.error].some((error) => isAxiosError(error) && error.response?.status === 403)
  const retryOptions = () => { void categoriesQuery.refetch(); void unitsQuery.refetch() }
  let showForm = false

  let content
  if (!validId) {
    content = <ErrorState title="Invalid product ID" message="Open a product from the products list" />
  } else if (productQuery.isError && (!productQuery.data || productStatus === 403 || productStatus === 404)) {
    const status = productStatus
    content = <ErrorState
      title={status === 404 ? 'Product not found' : status === 403 ? 'Permission denied' : 'Unable to load product'}
      message={status === 404 ? 'This product is no longer available' : status === 403 ? 'You do not have permission to edit this product' : 'Please try again'}
      onRetry={status === 404 || status === 403 ? undefined : () => void productQuery.refetch()}
      isRetrying={productQuery.isFetching}
    />
  } else if (optionsDenied) {
    content = <ErrorState title="Permission denied" message="You do not have permission to view these options" />
  } else if (productQuery.isPending || categoriesQuery.isPending || unitsQuery.isPending) {
    content = <LoadingState message="Loading product…" />
  } else if (!categoriesQuery.data || !unitsQuery.data) {
    content = <ErrorState
      title="Unable to load product options"
      message="Please try again"
      onRetry={retryOptions}
      isRetrying={categoriesQuery.isFetching || unitsQuery.isFetching}
    />
  } else {
    showForm = true
    content = <EditProductForm key={productQuery.data.id} product={productQuery.data} categories={categoriesQuery.data} units={unitsQuery.data} />
  }

  return (
    <>
      <PageHeader title="Edit product" description="Update product details and units. The base unit stays fixed." />
      {/* Background request ပျက်လည်း form snapshot နဲ့ unsaved inputs ကို ဆက်ထိန်းသည်။ */}
      {showForm && (productQuery.isError || categoriesQuery.isError || unitsQuery.isError) && (
        <div className="mb-4">
          <ErrorState title="Unable to refresh product data" message="Showing previously loaded data. Your unsaved values are kept; the server will validate them when saving." onRetry={() => { void productQuery.refetch(); retryOptions() }} isRetrying={productQuery.isFetching || categoriesQuery.isFetching || unitsQuery.isFetching} />
        </div>
      )}
      {content}
      {!showForm && <Link to="/products" className="mt-4 inline-block font-medium text-primary underline">Back to Products</Link>}
    </>
  )
}

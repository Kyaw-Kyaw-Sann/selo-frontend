import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { Plus, Search } from 'lucide-react'
import PageHeader from '../../../components/shared/page-header'
import LoadingState from '../../../components/shared/loading-state'
import ErrorState from '../../../components/shared/error-state'
import EmptyState from '../../../components/shared/empty-state'
import Pagination from '../../../components/shared/pagination'
import Input from '../../../components/ui/input'
import Select from '../../../components/ui/select'
import Badge from '../../../components/ui/badge'
import Button from '../../../components/ui/button'
import SupplierFormDialog from '../components/supplier-form-dialog'
import SupplierDetailDialog from '../components/supplier-detail-dialog'
import SupplierStatusDialog from '../components/supplier-status-dialog'
import { useSuppliersQuery } from '../suppliers.queries'
import type { Supplier, SupplierStatus } from '../suppliers.types'

export default function SuppliersPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<SupplierStatus>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null)
  const [detailSupplierId, setDetailSupplierId] = useState<string | null>(null)
  const [statusSupplier, setStatusSupplier] = useState<Supplier | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // ရိုက်နေဆဲ input ကို local state မှာထားပြီး list/pagination ကို Query က ပိုင်သည်။
  const suppliersQuery = useSuppliersQuery({ search, status, page, limit: 10 })
  const hasFilters = Boolean(search || status !== 'ALL')

  let content
  if (suppliersQuery.isPending) {
    content = <LoadingState message="Loading suppliers…" />
  } else if (suppliersQuery.isError) {
    const denied = isAxiosError(suppliersQuery.error) && suppliersQuery.error.response?.status === 403
    content = denied ? (
      <ErrorState title="Permission denied" message="You do not have permission to view suppliers" />
    ) : (
      <ErrorState title="Unable to load suppliers" onRetry={() => void suppliersQuery.refetch()} isRetrying={suppliersQuery.isFetching} />
    )
  } else {
    const { data: suppliers, pagination } = suppliersQuery.data
    content = (
      <>
        {suppliers.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No matching suppliers' : 'No suppliers found'}
            description={hasFilters ? 'Try another search or change your status filter' : 'There are no suppliers to display on this page'}
          />
        ) : (
          <div role="region" aria-label="Suppliers table" tabIndex={0} className="overflow-x-auto rounded-panel border border-border bg-surface">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs whitespace-nowrap text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Phone</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Contact person</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-surface-muted/40">
                    <th scope="row" className="min-w-48 px-4 py-3 font-semibold wrap-break-word text-heading"><button type="button" aria-label={`View details for ${supplier.name}`} onClick={() => setDetailSupplierId(supplier.id)} className="rounded-control text-left underline-offset-4 hover:text-primary hover:underline">{supplier.name}</button></th>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">{supplier.phone ?? '—'}</td>
                    <td className="px-4 py-3">{supplier.contactPerson ?? '—'}</td>
                    <td className="px-4 py-3"><Badge tone={supplier.isActive ? 'success' : 'neutral'}>{supplier.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        <button type="button" aria-label={`Edit ${supplier.name}`} onClick={() => setEditingSupplierId(supplier.id)} className="min-h-8 rounded-control border border-border px-2.5 py-1.5 text-xs font-medium text-body hover:bg-surface-muted">Edit</button>
                        <button
                          type="button"
                          aria-label={`${supplier.isActive ? 'Deactivate' : 'Activate'} ${supplier.name}`}
                          onClick={() => setStatusSupplier(supplier)}
                          className={`min-h-8 rounded-control px-2.5 py-1.5 text-xs font-medium ${supplier.isActive ? 'text-danger hover:bg-danger-soft' : 'text-primary hover:bg-primary-soft'}`}
                        >
                          {supplier.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} itemLabel="suppliers" />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Suppliers" description="Manage suppliers for your store purchases" />
        <Button onClick={() => setCreateOpen(true)}><Plus size={16} aria-hidden="true" />Add supplier</Button>
      </div>
      <div className="mb-6 grid gap-4 sm:max-w-2xl sm:grid-cols-[minmax(0,1fr)_180px]">
        <div>
          <label htmlFor="suppliers-search" className="mb-1.5 block font-medium text-heading">Search suppliers</label>
          <div className="relative">
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <Input id="suppliers-search" type="search" maxLength={200} className="pl-9" placeholder="Name, phone or contact person" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="suppliers-status" className="mb-1.5 block font-medium text-heading">Status</label>
          <Select id="suppliers-status" value={status} onChange={(event) => { setStatus(event.target.value as SupplierStatus); setPage(1) }}>
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </div>
      {content}
      {(createOpen || editingSupplierId) && (
        <SupplierFormDialog
          key={editingSupplierId ?? 'create'}
          supplierId={editingSupplierId ?? undefined}
          onSaved={() => setPage(1)}
          onClose={() => { setCreateOpen(false); setEditingSupplierId(null) }}
        />
      )}
      {detailSupplierId && <SupplierDetailDialog key={detailSupplierId} supplierId={detailSupplierId} onClose={() => setDetailSupplierId(null)} />}
      {statusSupplier && (
        <SupplierStatusDialog
          key={statusSupplier.id}
          supplier={statusSupplier}
          onSaved={() => {
            // Status filter က row ကိုဖယ်လျှင် invalid page မကျန်စေရန်။
            if (status !== 'ALL') setPage(1)
          }}
          onClose={() => setStatusSupplier(null)}
        />
      )}
    </>
  )
}

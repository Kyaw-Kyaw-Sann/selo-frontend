import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import PageHeader from '../../../components/shared/page-header'
import LoadingState from '../../../components/shared/loading-state'
import ErrorState from '../../../components/shared/error-state'
import EmptyState from '../../../components/shared/empty-state'
import Pagination from '../../../components/shared/pagination'
import Input from '../../../components/ui/input'
import Select from '../../../components/ui/select'
import { usePurchasesQuery, usePurchaseSuppliersQuery } from '../purchases.queries'
import { formatPurchaseAmount, formatPurchaseDate } from '../purchases.format'

const dateSchema = z.iso.date()

export default function PurchasesPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fromError = from && !dateSchema.safeParse(from).success ? 'Enter a valid from date' : ''
  let toError = to && !dateSchema.safeParse(to).success ? 'Enter a valid to date' : ''
  if (!fromError && !toError && from && to && from > to) {
    toError = 'From date must not be after to date'
  }

  // Empty filters ကို ချန်ထားပြီး UTC date range မှန်မှ list request ပို့သည်။
  const purchases = usePurchasesQuery({
    search, supplierId: supplierId || undefined, from: from || undefined, to: to || undefined, page, limit: 10,
  }, !fromError && !toError)
  const suppliers = usePurchaseSuppliersQuery()
  const hasFilters = Boolean(search || supplierId || from || to)

  let content
  if (fromError || toError) {
    content = null
  } else if (purchases.isPending) {
    content = <LoadingState message="Loading purchases…" />
  } else if (purchases.isError) {
    const denied = isAxiosError(purchases.error) && purchases.error.response?.status === 403
    content = denied ? (
      <ErrorState title="Permission denied" message="You do not have permission to view purchases" />
    ) : (
      <ErrorState title="Unable to load purchases" onRetry={() => void purchases.refetch()} isRetrying={purchases.isFetching} />
    )
  } else {
    const { data, pagination } = purchases.data
    content = (
      <>
        {data.length === 0 ? (
          <EmptyState title={hasFilters ? 'No matching purchases' : 'No purchases found'} description={hasFilters ? 'Try another search or change your filters' : 'Received purchases will appear here'} />
        ) : (
          <div role="region" aria-label="Purchase history table" tabIndex={0} className="overflow-x-auto rounded-panel border border-border bg-surface">
            <table className="w-full min-w-[740px] text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs whitespace-nowrap text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Purchase number</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Supplier</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Received at (UTC)</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Received by</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-surface-muted/40">
                    <th scope="row" className="max-w-xs px-4 py-3 font-medium wrap-anywhere text-heading">
                      <Link to={`/purchases/${purchase.id}`} className="rounded-control underline-offset-4 hover:text-primary hover:underline">{purchase.purchaseNo}</Link>
                    </th>
                    <td className="px-4 py-3">{purchase.supplierName ?? 'No supplier'}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><time dateTime={purchase.receivedAt}>{formatPurchaseDate(purchase.receivedAt)}</time></td>
                    <td className="px-4 py-3">{purchase.receivedByName}</td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap tabular-nums">{formatPurchaseAmount(purchase.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} itemLabel="purchases" />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Purchase history" description="View received stock and its purchase costs" />
        <Link to="/purchases/new" className="inline-flex min-h-10 items-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover"><Plus size={16} aria-hidden="true" />New purchase</Link>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <label htmlFor="purchases-search" className="mb-1.5 block font-medium text-heading">Purchase number</label>
          <Input id="purchases-search" type="search" maxLength={50} placeholder="Search by purchase number" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
        </div>
        <div>
          <label htmlFor="purchases-supplier" className="mb-1.5 block font-medium text-heading">Supplier</label>
          <Select id="purchases-supplier" value={supplierId} disabled={suppliers.isPending || !suppliers.data} onChange={(event) => { setSupplierId(event.target.value); setPage(1) }}>
            <option value="">{suppliers.isPending ? 'Loading suppliers…' : 'All suppliers'}</option>
            {suppliers.data?.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}{supplier.isActive ? '' : ' (Inactive)'}</option>)}
          </Select>
          {suppliers.isError && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <p role="status" className="text-danger">Unable to load supplier options</p>
              <button type="button" disabled={suppliers.isFetching} onClick={() => void suppliers.refetch()} className="font-medium text-primary underline disabled:opacity-50">Retry</button>
              {supplierId && <button type="button" onClick={() => { setSupplierId(''); setPage(1) }} className="font-medium text-primary underline">Clear supplier</button>}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="purchases-from" className="mb-1.5 block font-medium text-heading">From (UTC date)</label>
          <Input id="purchases-from" type="date" value={from} aria-invalid={Boolean(fromError)} aria-describedby={fromError ? 'purchases-from-error' : undefined} onChange={(event) => { setFrom(event.target.value); setPage(1) }} />
          {fromError && <p id="purchases-from-error" role="alert" className="mt-1 text-xs text-danger">{fromError}</p>}
        </div>
        <div>
          <label htmlFor="purchases-to" className="mb-1.5 block font-medium text-heading">To (UTC date)</label>
          <Input id="purchases-to" type="date" value={to} aria-invalid={Boolean(toError)} aria-describedby={toError ? 'purchases-to-error' : undefined} onChange={(event) => { setTo(event.target.value); setPage(1) }} />
          {toError && <p id="purchases-to-error" role="alert" className="mt-1 text-xs text-danger">{toError}</p>}
        </div>
      </div>
      {content}
    </>
  )
}

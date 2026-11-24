import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import EmptyState from '../../../components/shared/empty-state'
import ErrorState from '../../../components/shared/error-state'
import LoadingState from '../../../components/shared/loading-state'
import PageHeader from '../../../components/shared/page-header'
import Pagination from '../../../components/shared/pagination'
import Badge from '../../../components/ui/badge'
import Input from '../../../components/ui/input'
import Select from '../../../components/ui/select'
import { formatMmk, formatUtcDateTime } from '../../../utils/format'
import { getSalesFilterErrors } from '../sales.filters'
import { useSalesQuery } from '../sales.queries'
import type { SalesListParams } from '../sales.types'

export default function SalesPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<SalesListParams['paymentMethod']>('ALL')
  const [cashierInput, setCashierInput] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const cashierId = cashierInput.trim()
  const errors = getSalesFilterErrors(cashierId, from, to)
  const validFilters = !errors.cashier && !errors.fromDate && !errors.toDate
  // Empty filters ကို ချန်ထားပြီး valid filters ရှိမှ history request ပို့သည်။
  const sales = useSalesQuery({
    search, paymentMethod, cashierId: cashierId || undefined, from: from || undefined, to: to || undefined, page, limit: 10,
  }, validFilters)
  const hasFilters = Boolean(search || cashierId || from || to || paymentMethod !== 'ALL')

  let content
  if (validFilters) {
    if (sales.isPending) {
      content = <LoadingState message="Loading sales…" />
    } else if (sales.isError) {
      const denied = isAxiosError(sales.error) && sales.error.response?.status === 403
      content = denied ? (
        <ErrorState title="Permission denied" message="You do not have permission to view sales" />
      ) : (
        <ErrorState title="Unable to load sales" onRetry={() => void sales.refetch()} isRetrying={sales.isFetching} />
      )
    } else {
      const { data, pagination } = sales.data
      content = (
        <>
          {data.length === 0 ? (
            <EmptyState title={hasFilters ? 'No matching sales' : 'No sales found'} description={hasFilters ? 'Try another sale number or change your filters.' : 'Completed sales will appear here.'} />
          ) : (
            <div role="region" aria-label="Sales history table" tabIndex={0} className="overflow-x-auto rounded-panel border border-border bg-surface">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-border bg-surface-muted text-xs whitespace-nowrap text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Sale number</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Cashier</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Completed at (UTC)</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Payment</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Total payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((sale) => (
                    <tr key={sale.id} className="hover:bg-surface-muted/40">
                      <th scope="row" className="max-w-xs px-4 py-3 font-medium wrap-anywhere text-heading">
                        <Link to={`/sales/${sale.id}`} className="rounded-control underline-offset-4 hover:text-primary hover:underline">{sale.saleNo}</Link>
                      </th>
                      <td className="px-4 py-3">{sale.cashierName}<p className="text-xs text-muted">ID {sale.cashierId}</p></td>
                      <td className="px-4 py-3 whitespace-nowrap"><time dateTime={sale.completedAt}>{formatUtcDateTime(sale.completedAt)}</time></td>
                      <td className="px-4 py-3"><Badge>{sale.paymentMethod === 'CASH' ? 'Cash' : sale.paymentMethod ?? 'No payment'}</Badge></td>
                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap tabular-nums">{formatMmk(sale.totalPayable)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination pagination={pagination} onPageChange={setPage} itemLabel="sales" />
        </>
      )
    }
  }

  return (
    <>
      <PageHeader title="Sales history" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div>
          <label htmlFor="sales-search" className="mb-1.5 block font-medium text-heading">Sale number</label>
          <Input id="sales-search" type="search" maxLength={50} placeholder="Search by sale number" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
        </div>
        <div>
          <label htmlFor="sales-payment" className="mb-1.5 block font-medium text-heading">Payment method</label>
          <Select id="sales-payment" value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value as SalesListParams['paymentMethod']); setPage(1) }}>
            <option value="ALL">All payment methods</option>
            <option value="CASH">Cash</option>
            <option value="QR">QR</option>
          </Select>
        </div>
        <div>
          <label htmlFor="sales-cashier" className="mb-1.5 block font-medium text-heading">Cashier ID</label>
          <Input id="sales-cashier" inputMode="numeric" maxLength={19} placeholder="All cashiers" value={cashierInput} aria-invalid={Boolean(errors.cashier)} aria-describedby={errors.cashier ? 'sales-cashier-error' : undefined} onChange={(event) => { setCashierInput(event.target.value); setPage(1) }} />
          {errors.cashier && <p id="sales-cashier-error" role="alert" className="mt-1 text-xs text-danger">{errors.cashier}</p>}
        </div>
        <div>
          <label htmlFor="sales-from" className="mb-1.5 block font-medium text-heading">From (UTC date)</label>
          <Input id="sales-from" type="date" value={from} aria-invalid={Boolean(errors.fromDate)} aria-describedby={errors.fromDate ? 'sales-from-error' : undefined} onChange={(event) => { setFrom(event.target.value); setPage(1) }} />
          {errors.fromDate && <p id="sales-from-error" role="alert" className="mt-1 text-xs text-danger">{errors.fromDate}</p>}
        </div>
        <div>
          <label htmlFor="sales-to" className="mb-1.5 block font-medium text-heading">To (UTC date)</label>
          <Input id="sales-to" type="date" value={to} aria-invalid={Boolean(errors.toDate)} aria-describedby={errors.toDate ? 'sales-to-error' : undefined} onChange={(event) => { setTo(event.target.value); setPage(1) }} />
          {errors.toDate && <p id="sales-to-error" role="alert" className="mt-1 text-xs text-danger">{errors.toDate}</p>}
        </div>
      </div>
      {content}
    </>
  )
}

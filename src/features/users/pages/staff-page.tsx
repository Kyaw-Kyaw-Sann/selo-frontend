import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { Plus, Search } from 'lucide-react'
import EmptyState from '../../../components/shared/empty-state'
import ErrorState from '../../../components/shared/error-state'
import LoadingState from '../../../components/shared/loading-state'
import PageHeader from '../../../components/shared/page-header'
import Pagination from '../../../components/shared/pagination'
import Badge from '../../../components/ui/badge'
import Button from '../../../components/ui/button'
import Input from '../../../components/ui/input'
import { useSessionQuery } from '../../auth/auth.queries'
import StaffDetailDialog from '../components/staff-detail-dialog'
import StaffFormDialog from '../components/staff-form-dialog'
import StaffStatusDialog from '../components/staff-status-dialog'
import { useUsersQuery } from '../users.queries'
import type { StaffUser } from '../users.types'

export default function StaffPage() {
  const { data: signedInUser } = useSessionQuery()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<{ staff?: StaffUser } | null>(null)
  const [statusStaff, setStatusStaff] = useState<StaffUser | null>(null)
  const users = useUsersQuery({ search, page, limit: 10 })

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  let content
  if (users.isPending) {
    content = <LoadingState message="Loading staff…" />
  } else if (users.isError) {
    const denied = isAxiosError(users.error) && users.error.response?.status === 403
    content = denied ? (
      <ErrorState title="Permission denied" message="You do not have permission to view staff accounts." />
    ) : (
      <ErrorState title="Unable to load staff" onRetry={() => void users.refetch()} isRetrying={users.isFetching} />
    )
  } else {
    const { data, pagination } = users.data
    content = (
      <>
        {data.length === 0 ? (
          <EmptyState title={search ? 'No matching staff' : 'No staff accounts found'} description={search ? 'Try another name or username.' : undefined} />
        ) : (
          <div role="region" aria-label="Staff accounts table" tabIndex={0} className="overflow-x-auto rounded-panel border border-border bg-surface">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs whitespace-nowrap text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Username</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((staff) => (
                  <tr key={staff.id} className="hover:bg-surface-muted/40">
                    <th scope="row" className="min-w-40 max-w-xs px-4 py-3 font-semibold wrap-anywhere text-heading">
                      <button type="button" onClick={() => setSelectedId(staff.id)} className="rounded-control text-left text-primary underline-offset-4 hover:underline">{staff.name}</button>
                    </th>
                    <td className="max-w-xs px-4 py-3 wrap-anywhere">{staff.username}</td>
                    <td className="px-4 py-3">{staff.role === 'OWNER' ? 'Owner' : 'Cashier'}</td>
                    <td className="px-4 py-3"><Badge tone={staff.isActive ? 'success' : 'neutral'}>{staff.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        <button type="button" aria-label={`Edit ${staff.name}`} onClick={() => setForm({ staff })} className="min-h-8 rounded-control border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-muted">Edit</button>
                        <button type="button" aria-label={`${staff.isActive ? 'Deactivate' : 'Activate'} ${staff.name}`} onClick={() => setStatusStaff(staff)} className={`min-h-8 rounded-control px-2.5 py-1.5 text-xs font-medium ${staff.isActive ? 'text-danger hover:bg-danger-soft' : 'text-primary hover:bg-primary-soft'}`}>{staff.isActive ? 'Deactivate' : 'Activate'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} itemLabel="staff accounts" />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Staff" />
        <Button onClick={() => setForm({})}><Plus size={16} aria-hidden="true" />Add staff</Button>
      </div>
      <div className="mb-6 max-w-sm">
        <label htmlFor="staff-search" className="mb-1.5 block font-medium text-heading">Search staff</label>
        <div className="relative">
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <Input id="staff-search" type="search" maxLength={150} placeholder="Name or username" className="pl-9" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
        </div>
      </div>
      {content}
      {selectedId && <StaffDetailDialog key={selectedId} userId={selectedId} onClose={() => setSelectedId(null)} />}
      {form && <StaffFormDialog key={form.staff?.id ?? 'create'} staff={form.staff} signedInUserId={signedInUser?.id} onClose={() => setForm(null)} />}
      {statusStaff && <StaffStatusDialog key={statusStaff.id} staff={statusStaff} isSelf={statusStaff.id === signedInUser?.id} onClose={() => setStatusStaff(null)} />}
    </>
  )
}

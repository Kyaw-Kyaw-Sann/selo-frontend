import { CornerDownRight, Plus } from 'lucide-react'
import Badge from '../../../components/ui/badge'
import Pagination from '../../../components/shared/pagination'
import { Fragment, useState } from 'react'
import { isAxiosError } from 'axios'
import PageHeader from '../../../components/shared/page-header'
import LoadingState from '../../../components/shared/loading-state'
import ErrorState from '../../../components/shared/error-state'
import EmptyState from '../../../components/shared/empty-state'
import { useCategoriesQuery } from '../categories.queries'
import { useSessionQuery } from '../../auth/auth.queries'
import Button from '../../../components/ui/button'
import CategoryFormDialog from '../components/category-form-dialog'
import CategoryStatusDialog from '../components/category-status-dialog'
import type { Category } from '../categories.types'

export default function CategoriesPage() {
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [statusCategory, setStatusCategory] = useState<Category | null>(null)
  const { data: user } = useSessionQuery()
  const categoriesQuery = useCategoriesQuery({ page, limit: 10 })

  let content
  if (categoriesQuery.isPending) {
    content = <LoadingState message="Loading categories…" />
  } else if (categoriesQuery.isError) {
    const permissionDenied = isAxiosError(categoriesQuery.error)
      && categoriesQuery.error.response?.status === 403

    content = permissionDenied ? (
      <ErrorState title="Permission denied" message="You do not have permission to view categories" />
    ) : (
      <ErrorState
        title="Unable to load categories"
        onRetry={() => void categoriesQuery.refetch()}
        isRetrying={categoriesQuery.isFetching}
      />
    )
  } else {
    // Total/page count က root အရေအတွက်ဖြစ်ပြီး child rows မပါပါ။
    const { data: roots, pagination } = categoriesQuery.data

    content = (
      <>
        {roots.length === 0 ? (
          <EmptyState title="No categories found" description="There are no categories to display on this page" />
        ) : (
          <div role="region" aria-label="Categories table" tabIndex={0} className="overflow-x-auto rounded-panel border border-border bg-surface">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs whitespace-nowrap text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Hierarchy</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  {user?.role === 'OWNER' && <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roots.map((root) => (
                  <Fragment key={root.id}>
                    <tr className="hover:bg-surface-muted/40">
                      <th scope="row" className="min-w-48 px-4 py-2.5 font-semibold text-heading">{root.name}</th>
                      <td className="px-4 py-2.5 text-muted">Root</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={root.isActive ? 'success' : 'neutral'}>
                          {root.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      {user?.role === 'OWNER' && (
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex justify-end gap-2 whitespace-nowrap">
                            <button type="button" aria-label={`Edit ${root.name}`} onClick={() => setEditingCategory(root)} className="min-h-8 rounded-control border border-border px-2.5 py-1.5 text-xs font-medium text-body hover:bg-surface-muted">Edit</button>
                            <button
                              type="button"
                              aria-label={`${root.isActive ? 'Deactivate' : 'Activate'} ${root.name}`}
                              onClick={() => setStatusCategory(root)}
                              className={`min-h-8 rounded-control px-2.5 py-1.5 text-xs font-medium ${root.isActive ? 'text-danger hover:bg-danger-soft' : 'text-primary hover:bg-primary-soft'}`}
                            >
                              {root.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {root.children.map((child) => (
                      <tr key={child.id} className="hover:bg-surface-muted/40">
                        <th scope="row" className="py-2.5 pr-4 pl-6 font-medium text-heading"><span className="flex items-center gap-2"><CornerDownRight size={14} aria-hidden="true" className="shrink-0 text-muted" />{child.name}</span></th>
                        <td className="px-4 py-2.5 text-muted">Child of {root.name}</td>
                        <td className="px-4 py-2.5">
                          <Badge tone={child.isActive ? 'success' : 'neutral'}>
                            {child.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        {user?.role === 'OWNER' && (
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex justify-end gap-2 whitespace-nowrap">
                              <button type="button" aria-label={`Edit ${child.name}`} onClick={() => setEditingCategory(child)} className="min-h-8 rounded-control border border-border px-2.5 py-1.5 text-xs font-medium text-body hover:bg-surface-muted">Edit</button>
                              <button
                                type="button"
                                aria-label={`${child.isActive ? 'Deactivate' : 'Activate'} ${child.name}`}
                                onClick={() => setStatusCategory(child)}
                                className={`min-h-8 rounded-control px-2.5 py-1.5 text-xs font-medium ${child.isActive ? 'text-danger hover:bg-danger-soft' : 'text-primary hover:bg-primary-soft'}`}
                              >
                                {child.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} itemLabel="root categories" />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Categories" description="Organize products into root and child categories" />
        {user?.role === 'OWNER' && <Button onClick={() => setCreateOpen(true)}><Plus size={16} aria-hidden="true" />Add category</Button>}
      </div>
      {content}
      {(createOpen || editingCategory) && user?.role === 'OWNER' && (
        <CategoryFormDialog
          key={editingCategory?.id ?? 'create'}
          category={editingCategory ?? undefined}
          // Root ကို child ပြောင်းပြီး page count လျော့သွားလည်း valid page က ပြန်စသည်။
          onSaved={() => setPage(1)}
          onClose={() => {
            setCreateOpen(false)
            setEditingCategory(null)
          }}
        />
      )}
      {statusCategory && user?.role === 'OWNER' && (
        <CategoryStatusDialog
          key={statusCategory.id}
          category={statusCategory}
          onClose={() => setStatusCategory(null)}
        />
      )}
    </>
  )
}

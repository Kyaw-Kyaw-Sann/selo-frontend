import { Plus, Search } from "lucide-react";
import Badge from "../../../components/ui/badge";
import Pagination from "../../../components/shared/pagination";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import PageHeader from "../../../components/shared/page-header";
import LoadingState from "../../../components/shared/loading-state";
import ErrorState from "../../../components/shared/error-state";
import EmptyState from "../../../components/shared/empty-state";
import Input from "../../../components/ui/input";
import { useUnitsQuery } from "../units.queries";
import { useSessionQuery } from "../../auth/auth.queries";
import Button from "../../../components/ui/button";
import UnitFormDialog from "../components/unit-form-dialog";
import UnitStatusDialog from "../components/unit-status-dialog";
import type { Unit } from "../units.types";

export default function UnitsPage() {
  const [page, setPage] = useState(1);

  // searchInput က ရိုက်နေဆဲစာ၊ search က API ဆီပို့မယ့်စာ ဖြစ်သည်။
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Dialog visibility က local UI state ဖြစ်သည်။
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [statusUnit, setStatusUnit] = useState<Unit | null>(null);
  const { data: user } = useSessionQuery();

  useEffect(() => {
    // စာရိုက်တာ 300ms ရပ်မှ search ပြောင်းပြီး page 1 ပြန်စသည်။
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    // ထပ်ရိုက်ရင် အရင် timer ဖျက်ပြီး အချိန်ပြန်စသည်။
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Query key ပြောင်းရင် Query က သက်ဆိုင်ရာ list ကို ရယူပေးသည်။
  const unitsQuery = useUnitsQuery({
    search,
    page,
    limit: 10,
  });

  let content;

  // Request မပြီးခင် empty state မပြရန် loading ကို အရင်စစ်သည်။
  if (unitsQuery.isPending) {
    content = <LoadingState message="Loading units…" />;
  } else if (unitsQuery.isError) {
    const permissionDenied =
      isAxiosError(unitsQuery.error) &&
      unitsQuery.error.response?.status === 403;

    content = permissionDenied ? (
      <ErrorState
        title="Permission denied"
        message="You do not have permission to view units"
      />
    ) : (
      <ErrorState
        title="Unable to load units"
        onRetry={() => void unitsQuery.refetch()}
        isRetrying={unitsQuery.isFetching}
      />
    );
  } else {
    // API envelope ထဲက list နဲ့ pagination ကို ခွဲယူသည်။
    const { data: units, pagination } = unitsQuery.data;

    content = (
      <>
        {units.length === 0 ? (
          <EmptyState
            title={search ? "No matching units" : "No units found"}
            description={
              search
                ? "Try another name or code, or clear your search"
                : "There are no units to display on this page"
            }
          />
        ) : (
          <div role="region" aria-label="Units table" tabIndex={0} className="overflow-x-auto rounded-panel border border-border bg-surface">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs whitespace-nowrap text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Code
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  {user?.role === "OWNER" && (
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-surface-muted/40">
                    <th scope="row" className="min-w-48 px-4 py-2.5 font-semibold text-heading">
                      {unit.name}
                    </th>
                    <td className="px-4 py-2.5 font-mono text-xs">{unit.code}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={unit.isActive ? 'success' : 'neutral'}>
                        {unit.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    {user?.role === "OWNER" && (
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-2 whitespace-nowrap">
                          <button
                            type="button"
                            aria-label={`Edit ${unit.name}`}
                            onClick={() => setEditingUnit(unit)}
                            className="min-h-8 rounded-control border border-border px-2.5 py-1.5 text-xs font-medium text-body hover:bg-surface-muted"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            aria-label={`${unit.isActive ? 'Deactivate' : 'Activate'} ${unit.name}`}
                            onClick={() => setStatusUnit(unit)}
                            className={`min-h-8 rounded-control px-2.5 py-1.5 text-xs font-medium ${unit.isActive ? 'text-danger hover:bg-danger-soft' : 'text-primary hover:bg-primary-soft'}`}
                          >
                            {unit.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} itemLabel="units" />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Units"
          description="Manage shared units used by your products"
        />

        {user?.role === "OWNER" && (
          <Button onClick={() => setCreateOpen(true)}><Plus size={16} aria-hidden="true" />Add unit</Button>
        )}
      </div>

      <div className="mb-6 w-full sm:max-w-sm">
        <label
          htmlFor="units-search"
          className="mb-1.5 block font-medium text-heading"
        >
          Search units
        </label>

        <div className="relative">
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <Input
            id="units-search"
            type="search"
            placeholder="Search by name or code"
            maxLength={80}
            className="pl-9"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
      </div>

      {content}
      {(createOpen || editingUnit) && user?.role === "OWNER" && (
        <UnitFormDialog
          // ရွေးထားတဲ့ unit ပြောင်းရင် form ကို initial values အသစ်နဲ့ ဖွင့်သည်။
          key={editingUnit?.id ?? 'create'}
          unit={editingUnit ?? undefined}
          onClose={() => {
            setCreateOpen(false);
            setEditingUnit(null);
          }}
        />
      )}
      {statusUnit && user?.role === "OWNER" && (
        <UnitStatusDialog
          key={statusUnit.id}
          unit={statusUnit}
          onClose={() => setStatusUnit(null)}
        />
      )}
    </>
  );
}

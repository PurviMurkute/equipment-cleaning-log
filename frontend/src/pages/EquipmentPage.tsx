import { useEffect, useMemo, useState, type JSX } from 'react'
import AddEquipmentDialog from '../components/equipment/AddEquipmentDialog'
import EquipmentFormDialog from '../components/equipment/EquipmentFormDialog'
import ReusableTable, { type TableColumn } from '../components/reusable-table'
import {
  createEquipment,
  deleteEquipment,
  listEquipment,
  updateEquipment,
  type Equipment,
  type EquipmentStatus,
} from '../services/equipment'

type MetricCard = {
  label: string
  value: string
  suffix: string
  note: string
  icon: () => JSX.Element
}

type EquipmentRow = Equipment

const statusLabels: Record<EquipmentStatus, string> = {
  ACTIVE: 'Active',
  RETIRED: 'Retired',
}

const EquipmentPage = () => {
  const [items, setItems] = useState<EquipmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | EquipmentStatus>('ALL')
  const [editingItem, setEditingItem] = useState<EquipmentRow | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const loadEquipment = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await listEquipment()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load equipment')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEquipment()
  }, [])

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return items.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' ? true : item.status === statusFilter
      const matchesQuery =
        normalizedQuery === ''
          ? true
          : [item.name, item.code, item.status]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [items, query, statusFilter])

  const metrics = useMemo<MetricCard[]>(() => {
    const total = items.length
    const active = items.filter((item) => item.status === 'ACTIVE').length
    const retired = items.filter((item) => item.status === 'RETIRED').length
    const newestItem = [...items].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )[0]

    return [
      {
        label: 'Total Equipment',
        value: String(total),
        suffix: 'registered',
        note: 'Live registry from backend',
        icon: GridIcon,
      },
      {
        label: 'Active Equipment',
        value: String(active),
        suffix: `${total === 0 ? '0' : Math.round((active / total) * 100)}% of fleet`,
        note: 'Currently active units',
        icon: CheckIcon,
      },
      {
        label: 'Retired Equipment',
        value: String(retired),
        suffix: 'decommissioned',
        note: 'No longer in active use',
        icon: AlertIcon,
      },
      {
        label: 'Latest Added',
        value: newestItem ? newestItem.code : '—',
        suffix: newestItem ? newestItem.name : 'No equipment yet',
        note: 'Most recent registry entry',
        icon: ClockIcon,
      },
    ]
  }, [items])

  const columns: TableColumn<EquipmentRow>[] = [
    {
      header: 'Equipment',
      className: 'min-w-[220px]',
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.code}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      className: 'w-[120px]',
      cell: (row) => <StatusPill status={row.status} />,
    },
    {
      header: 'Created',
      className: 'min-w-[170px]',
      cell: (row) => <span className="text-xs text-slate-700">{formatDateTime(row.createdAt)}</span>,
    },
    {
      header: 'Updated',
      className: 'min-w-[170px]',
      cell: (row) => <span className="text-xs text-slate-700">{formatDateTime(row.updatedAt)}</span>,
    },
    {
      header: 'Actions',
      className: 'w-[180px]',
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingItem(row)
              setEditOpen(true)
            }}
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => void handleDelete(row.id)}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  const handleCreate = async (payload: {
    name: string
    code: string
    status: EquipmentStatus
  }) => {
    await createEquipment(payload)
    await loadEquipment()
  }

  const handleUpdate = async (payload: {
    name: string
    code: string
    status: EquipmentStatus
  }) => {
    if (!editingItem) {
      return
    }

    await updateEquipment(editingItem.id, payload)
    await loadEquipment()
    setEditingItem(null)
  }

  const handleDelete = async (id: string) => {
    const target = items.find((item) => item.id === id)
    const confirmed = window.confirm(
      `Delete ${target?.name ?? 'this equipment'}? This action cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    await deleteEquipment(id)
    await loadEquipment()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Asset Registry / Current Site Master
          </p>
          <h2 className="mt-1 text-sm font-semibold tracking-tight text-slate-900">
            Equipment
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Manage equipment records directly from the backend. Create, update, and delete are
            connected to the live API.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadEquipment()}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
          <AddEquipmentDialog onCreate={handleCreate} />
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCardView key={metric.label} metric={metric} />
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={[
                'rounded border px-2 py-0.5 text-xs font-semibold',
                statusFilter === 'ALL'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600',
              ].join(' ')}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={[
                'rounded border px-2 py-0.5 text-xs font-medium',
                statusFilter === 'ACTIVE'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600',
              ].join(' ')}
            >
              Active ({items.filter((item) => item.status === 'ACTIVE').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('RETIRED')}
              className={[
                'rounded border px-2 py-0.5 text-xs font-medium',
                statusFilter === 'RETIRED'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600',
              ].join(' ')}
            >
              Retired ({items.filter((item) => item.status === 'RETIRED').length})
            </button>
          </div>

          <div className="relative">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" />
              <path d="M10.25 10.25 13.25 13.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              aria-label="Search equipment"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search equipment by name or code"
              className="h-9 w-[260px] rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-xs text-slate-500">Loading equipment...</div>
        ) : error ? (
          <div className="px-4 py-6 text-xs text-red-700">{error}</div>
        ) : (
          <ReusableTable
            columns={columns}
            data={visibleItems}
            emptyState="No equipment found."
          />
        )}

        <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-2 text-xs text-slate-500 lg:flex-row lg:items-center lg:justify-between">
          <p>Showing {visibleItems.length} of {items.length} equipment units</p>
          <p>Backend powered equipment CRUD</p>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Registry State</p>
          <p className="mt-1 text-xs text-slate-500">Live data only</p>
          <p className="mt-3 text-xs text-slate-600">
            Create, update, and delete call the backend API immediately.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Status Mix</p>
          <p className="mt-1 text-xs text-slate-500">ACTIVE / RETIRED</p>
          <p className="mt-3 text-xs text-slate-600">
            Backend only exposes these two equipment states.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Last Sync</p>
          <p className="mt-1 text-xs text-slate-500">Refresh to refetch</p>
          <p className="mt-3 text-xs text-slate-600">
            Use the refresh button to reload the equipment list from the server.
          </p>
        </div>
      </div>

      <EquipmentFormDialog
        open={editOpen}
        onOpenChange={(nextOpen) => {
          setEditOpen(nextOpen)
          if (!nextOpen) {
            setEditingItem(null)
          }
        }}
        title={editingItem ? `Edit ${editingItem.name}` : 'Edit Equipment'}
        description="Update equipment details and save the changes back to the backend."
        submitLabel="Save Changes"
        initialValues={
          editingItem
            ? {
                name: editingItem.name,
                code: editingItem.code,
                status: editingItem.status,
              }
            : {
                name: '',
                code: '',
                status: 'ACTIVE',
              }
        }
        onSubmit={handleUpdate}
      />
    </div>
  )
}

function MetricCardView({ metric }: { metric: MetricCard }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            {metric.label}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-sm font-semibold text-slate-900">{metric.value}</span>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              {metric.suffix}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">{metric.note}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500">
          <metric.icon />
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: EquipmentStatus }) {
  const styles =
    status === 'ACTIVE'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-slate-200 bg-slate-50 text-slate-500'

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${styles}`}>
      {statusLabels[status]}
    </span>
  )
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="2" y="2" width="4" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10" y="2" width="4" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="10" width="4" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10" y="10" width="4" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M3 8.25 6.25 11.5 13 4.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="1.5" y="1.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M8 3 14 13H2L8 3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 6.2v3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="8" cy="11.3" r="0.7" fill="currentColor" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4.8v3.4l2.2 1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default EquipmentPage

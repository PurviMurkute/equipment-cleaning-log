import { useEffect, useMemo, useState, type JSX } from 'react'
import AddCleaningRecordDialog from '../components/cleaning-records/AddCleaningRecordDialog'
import ReusableTable, { type TableColumn } from '../components/reusable-table'
import { listEquipment, type Equipment } from '../services/equipment'
import {
  createCleaningRecord,
  listCleaningRecords,
  type CleaningRecord,
  type CleaningRecordStatus,
} from '../services/cleaning-records'
import { getCleaningRecordAuditHistory, type AuditEntry } from '../services/audit'

type MetricCard = {
  label: string
  value: string
  suffix: string
  note: string
  icon: () => JSX.Element
}

type ViewStatus = 'ALL' | CleaningRecordStatus

const statusLabels: Record<CleaningRecordStatus, string> = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
}

const CleaningRecordsPage = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')
  const [records, setRecords] = useState<CleaningRecord[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState('')
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ViewStatus>('ALL')
  const [equipmentLoading, setEquipmentLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [auditLoading, setAuditLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadEquipment = async () => {
      setEquipmentLoading(true)
      setError(null)

      try {
        const data = await listEquipment()
        setEquipmentList(data)
        setSelectedEquipmentId((current) => current || data[0]?.id || '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load equipment')
      } finally {
        setEquipmentLoading(false)
      }
    }

    void loadEquipment()
  }, [])

  useEffect(() => {
    const loadRecords = async () => {
      if (!selectedEquipmentId) {
        setRecords([])
        setSelectedRecordId('')
        setAuditEntries([])
        return
      }

      setRecordsLoading(true)
      setError(null)

      try {
        const data = await listCleaningRecords(selectedEquipmentId, {
          status: statusFilter === 'ALL' ? undefined : statusFilter,
        })
        setRecords(data.data)
        setSelectedRecordId((current) => {
          if (current && data.data.some((record) => record.id === current)) {
            return current
          }
          return data.data[0]?.id || ''
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cleaning records')
      } finally {
        setRecordsLoading(false)
      }
    }

    void loadRecords()
  }, [selectedEquipmentId, statusFilter])

  useEffect(() => {
    const loadAuditHistory = async () => {
      if (!selectedRecordId) {
        setAuditEntries([])
        return
      }

      setAuditLoading(true)
      setError(null)

      try {
        const data = await getCleaningRecordAuditHistory(selectedRecordId)
        setAuditEntries(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit history')
      } finally {
        setAuditLoading(false)
      }
    }

    void loadAuditHistory()
  }, [selectedRecordId])

  const selectedEquipment = equipmentList.find((item) => item.id === selectedEquipmentId)
  const selectedRecord = records.find((record) => record.id === selectedRecordId)

  const metrics = useMemo<MetricCard[]>(() => {
    const total = records.length
    const verified = records.filter((record) => record.status === 'VERIFIED').length
    const pending = records.filter((record) => record.status === 'PENDING').length
    const latestRecord = [...records].sort(
      (left, right) => new Date(right.cleanedAt).getTime() - new Date(left.cleanedAt).getTime(),
    )[0]

    return [
      {
        label: 'Records in View',
        value: String(total),
        suffix: selectedEquipment ? selectedEquipment.code : 'No equipment',
        note: 'Loaded from backend',
        icon: GridIcon,
      },
      {
        label: 'Verified',
        value: String(verified),
        suffix: `${total === 0 ? '0' : Math.round((verified / total) * 100)}%`,
        note: 'Approved logs',
        icon: CheckIcon,
      },
      {
        label: 'Pending Review',
        value: String(pending),
        suffix: 'needs QA',
        note: 'Awaiting verification',
        icon: ClockIcon,
      },
      {
        label: 'Latest Cleaned At',
        value: latestRecord ? formatDateTime(latestRecord.cleanedAt) : '—',
        suffix: latestRecord ? latestRecord.cleanedBy : 'No records',
        note: 'Most recent record',
        icon: ShieldIcon,
      },
    ]
  }, [records, selectedEquipment])

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return records.filter((record) => {
      const matchesQuery =
        normalizedQuery === ''
          ? true
          : [record.cleanedBy, record.method, record.notes ?? '', record.id]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery)

      return matchesQuery
    })
  }, [records, query])

  const equipmentOptions = equipmentList.map((item) => ({
    id: item.id,
    label: `${item.name} (${item.code})`,
  }))

  const columns: TableColumn<CleaningRecord>[] = [
    {
      header: 'Record',
      className: 'min-w-[150px]',
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-slate-900">{shortId(row.id)}</p>
          <p className="text-xs text-slate-500">{selectedEquipment?.code ?? row.equipmentId}</p>
        </div>
      ),
    },
    {
      header: 'Cleaned By',
      className: 'min-w-[160px]',
      cell: (row) => <span className="text-xs text-slate-700">{row.cleanedBy}</span>,
    },
    {
      header: 'Cleaned At',
      className: 'min-w-[170px]',
      cell: (row) => <span className="text-xs text-slate-700">{formatDateTime(row.cleanedAt)}</span>,
    },
    {
      header: 'Method',
      className: 'min-w-[180px]',
      cell: (row) => <span className="text-xs text-slate-700">{row.method}</span>,
    },
    {
      header: 'Status',
      className: 'w-[120px]',
      cell: (row) => <StatusPill status={row.status} />,
    },
    {
      header: 'Notes',
      className: 'min-w-[220px]',
      cell: (row) => <span className="text-xs text-slate-600">{row.notes ?? '—'}</span>,
    },
    {
      header: 'Action',
      className: 'w-[100px]',
      cell: (row) => (
        <button
          type="button"
          onClick={() => setSelectedRecordId(row.id)}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          View
        </button>
      ),
    },
  ]

  const handleCreateRecord = async (payload: {
    equipmentId: string
    cleanedBy: string
    cleanedAt: string
    method: string
    notes?: string
    status?: CleaningRecordStatus
  }) => {
    await createCleaningRecord(payload.equipmentId, payload)
    setSelectedEquipmentId(payload.equipmentId)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Cleaning Records / Equipment Log
          </p>
          <h2 className="mt-1 text-sm font-semibold tracking-tight text-slate-900">
            Cleaning Records
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Real records fetched from the backend for the selected equipment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void window.location.reload()}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
          <AddCleaningRecordDialog
            equipmentOptions={equipmentOptions}
            onCreate={handleCreateRecord}
          />
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCardView key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {equipmentList.map((equipment) => (
                <button
                  key={equipment.id}
                  type="button"
                  onClick={() => setSelectedEquipmentId(equipment.id)}
                  className={[
                    'rounded border px-2 py-0.5 text-xs font-semibold',
                    selectedEquipmentId === equipment.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-600',
                  ].join(' ')}
                >
                  {equipment.code}
                </button>
              ))}
            </div>

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
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('VERIFIED')}
                className={[
                  'rounded border px-2 py-0.5 text-xs font-semibold',
                  statusFilter === 'VERIFIED'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600',
                ].join(' ')}
              >
                Verified
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={[
                  'rounded border px-2 py-0.5 text-xs font-semibold',
                  statusFilter === 'PENDING'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600',
                ].join(' ')}
              >
                Pending
              </button>

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
                  aria-label="Search cleaning records"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search records, names, methods..."
                  className="h-9 w-[250px] rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {equipmentLoading ? (
            <div className="px-4 py-6 text-xs text-slate-500">Loading equipment...</div>
          ) : recordsLoading ? (
            <div className="px-4 py-6 text-xs text-slate-500">Loading records...</div>
          ) : error ? (
            <div className="px-4 py-6 text-xs text-red-700">{error}</div>
          ) : (
            <ReusableTable
              columns={columns}
              data={visibleRecords}
              emptyState="No cleaning records found."
            />
          )}

          <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-2 text-xs text-slate-500 lg:flex-row lg:items-center lg:justify-between">
            <p>
              Showing {visibleRecords.length} of {records.length} records
            </p>
            <p>
              Selected equipment: {selectedEquipment?.name ?? 'None'}
            </p>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Audit History</h3>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {auditLoading ? 'Loading' : 'Live'}
              </span>
            </div>
            <div className="space-y-3 px-4 py-3">
              {selectedRecord ? (
                <p className="text-xs text-slate-500">
                  Record {shortId(selectedRecord.id)} by {selectedRecord.cleanedBy}
                </p>
              ) : null}

              {auditEntries.length > 0 ? (
                auditEntries.map((entry) => (
                  <AuditItem
                    key={entry.id}
                    title={`${entry.field} updated by ${entry.changedBy}`}
                    detail={`${formatDateTime(entry.changedAt)} • ${entry.oldValue ?? '—'} → ${
                      entry.newValue ?? '—'
                    }`}
                  />
                ))
              ) : (
                <p className="text-xs text-slate-500">Select a record to view audit history.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Selected Record
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {selectedRecord ? shortId(selectedRecord.id) : 'No record selected'}
            </p>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <p>Method: {selectedRecord?.method ?? '—'}</p>
              <p>Status: {selectedRecord ? statusLabels[selectedRecord.status] : '—'}</p>
              <p>Notes: {selectedRecord?.notes ?? '—'}</p>
            </div>
          </section>
        </aside>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Latest Batch</p>
          <p className="mt-1 text-xs text-slate-500">
            {selectedEquipment ? `${selectedEquipment.name} / ${selectedEquipment.code}` : '—'}
          </p>
          <p className="mt-3 text-xs text-slate-600">
            Create records from the dialog and they will be saved to the backend.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Pending Queue</p>
          <p className="mt-1 text-xs text-slate-500">
            {records.filter((record) => record.status === 'PENDING').length} records waiting
          </p>
          <p className="mt-3 text-xs text-slate-600">
            The list updates after add and refresh actions.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Audit Retention</p>
          <p className="mt-1 text-xs text-slate-500">Field-level history enabled</p>
          <p className="mt-3 text-xs text-slate-600">
            Audit entries are fetched live for the selected record.
          </p>
        </div>
      </div>
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

function StatusPill({ status }: { status: CleaningRecordStatus }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold',
        status === 'VERIFIED'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700',
      ].join(' ')}
    >
      <span
        className={[
          'mr-1.5 h-1.5 w-1.5 rounded-full',
          status === 'VERIFIED' ? 'bg-emerald-600' : 'bg-amber-600',
        ].join(' ')}
      />
      {statusLabels[status]}
    </span>
  )
}

function AuditItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-900" />
      <div className="min-w-0">
        <p className="text-xs font-semibold leading-5 text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  )
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

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4.8v3.4l2.2 1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M8 2.75 12.75 4.5V8c0 2.35-1.56 4.47-4.75 5.75C4.81 12.47 3.25 10.35 3.25 8V4.5L8 2.75Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6.1 8 7.3 9.2 10 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function shortId(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

export default CleaningRecordsPage

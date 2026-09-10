import { useEffect, useState } from 'react'
import AddCleaningRecordDialog from '../components/cleaning-records/AddCleaningRecordDialog'
import EditCleaningRecordDialog from '../components/cleaning-records/EditCleaningRecordDialog'
import EquipmentSelect from '../components/EquipmentSelect'
import ReusableTable, { type TableColumn } from '../components/reusable-table'
import { listEquipment, type Equipment } from '../services/equipment'
import {
  createCleaningRecord,
  listAllCleaningRecords,
  listCleaningRecords,
  updateCleaningRecord,
  type CleaningRecord,
  type CleaningRecordPagination,
  type CleaningRecordStatus,
} from '../services/cleaning-records'
import { type CleaningRecordFormValues } from '../components/cleaning-records/CleaningRecordFormDialog'

const PAGE_SIZE = 5
const ALL_EQUIPMENT_VALUE = ''

const CleaningRecordsPage = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')
  const [statusFilter, setStatusFilter] = useState<CleaningRecordStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [records, setRecords] = useState<CleaningRecord[]>([])
  const [pagination, setPagination] = useState<CleaningRecordPagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [editingRecord, setEditingRecord] = useState<CleaningRecord | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadEquipment() {
      setLoading(true)
      setError(null)

      try {
        const data = await listEquipment()
        if (!mounted) {
          return
        }

        setEquipmentList(data)
      } catch (err) {
        if (!mounted) {
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to load equipment')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadEquipment()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadRecords() {
      if (equipmentList.length === 0) {
        setRecords([])
        setPagination(null)
        return
      }

      setRecordsLoading(true)
      setError(null)

      try {
        const filterStatus = statusFilter === 'ALL' ? undefined : statusFilter

        if (selectedEquipmentId === ALL_EQUIPMENT_VALUE) {
          const allRecords = await listAllCleaningRecords(
            equipmentList.map((item) => item.id),
            { status: filterStatus, limitPerEquipment: 1000 },
          )

          if (!mounted) {
            return
          }

          const total = allRecords.length
          const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
          const safePage = Math.min(page, totalPages)
          const startIndex = (safePage - 1) * PAGE_SIZE
          const visibleRecords = allRecords.slice(startIndex, startIndex + PAGE_SIZE)

          setRecords(visibleRecords)
          setPagination({
            page: safePage,
            limit: PAGE_SIZE,
            total,
            totalPages,
          })
        } else {
          const response = await listCleaningRecords(selectedEquipmentId, {
            page,
            limit: PAGE_SIZE,
            status: filterStatus,
          })

          if (!mounted) {
            return
          }

          setRecords(response.data)
          setPagination(response.pagination)
        }
      } catch (err) {
        if (!mounted) {
          return
        }

        setError(err instanceof Error ? err.message : 'Failed to load cleaning records')
        setRecords([])
        setPagination(null)
      } finally {
        if (mounted) {
          setRecordsLoading(false)
        }
      }
    }

    void loadRecords()

    return () => {
      mounted = false
    }
  }, [equipmentList, page, refreshTick, selectedEquipmentId, statusFilter])

  const visibleEquipment = selectedEquipmentId
    ? equipmentList.find((item) => item.id === selectedEquipmentId) ?? null
    : null

  const equipmentOptions = equipmentList.map((item) => ({
    id: item.id,
    label: `${item.code} · ${item.name}`,
  }))

  const columns: TableColumn<CleaningRecord>[] = [
    {
      header: 'Cleaned At',
      className: 'min-w-[160px]',
      cell: (row) => <span className="text-xs text-slate-700">{formatDateTime(row.cleanedAt)}</span>,
    },
    {
      header: 'Equipment',
      className: 'min-w-[180px]',
      cell: (row) => {
        const equipment = equipmentList.find((item) => item.id === row.equipmentId)
        return (
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-900">{equipment?.code ?? 'Unknown'}</p>
            <p className="text-xs text-slate-500">{equipment?.name ?? row.equipmentId}</p>
          </div>
        )
      },
    },
    {
      header: 'Cleaned By',
      className: 'min-w-[150px]',
      cell: (row) => <span className="text-xs text-slate-700">{row.cleanedBy}</span>,
    },
    {
      header: 'Method',
      className: 'min-w-[160px]',
      cell: (row) => <span className="text-xs text-slate-700">{row.method}</span>,
    },
    {
      header: 'Status',
      className: 'w-[120px]',
      cell: (row) => <StatusPill status={row.status} />,
    },
    {
      header: 'Action',
      className: 'w-[100px]',
      cell: (row) => (
        <button
          type="button"
          onClick={() => {
            setEditingRecord(row)
            setEditOpen(true)
          }}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Edit
        </button>
      ),
    },
  ]

  const handleCreate = async (payload: CleaningRecordFormValues) => {
    await createCleaningRecord(payload.equipmentId, {
      cleanedBy: payload.cleanedBy,
      cleanedAt: payload.cleanedAt,
      method: payload.method,
      notes: payload.notes.trim() === '' ? undefined : payload.notes.trim(),
      status: payload.status,
      changedBy: payload.changedBy.trim(),
    })

    setSelectedEquipmentId(payload.equipmentId)
    setPage(1)
    setRefreshTick((current) => current + 1)
  }

  const handleUpdate = async (payload: CleaningRecordFormValues) => {
    if (!editingRecord) {
      return
    }

    await updateCleaningRecord(editingRecord.id, {
      cleanedBy: payload.cleanedBy,
      cleanedAt: payload.cleanedAt,
      method: payload.method,
      notes: payload.notes.trim() === '' ? null : payload.notes.trim(),
      status: payload.status,
      changedBy: payload.changedBy.trim(),
    })

    setEditOpen(false)
    setEditingRecord(null)
    setRefreshTick((current) => current + 1)
  }

  const initialEditValues: CleaningRecordFormValues | null = editingRecord
    ? {
        equipmentId: editingRecord.equipmentId,
        cleanedBy: editingRecord.cleanedBy,
        changedBy: '',
        cleanedAt: toDatetimeLocal(editingRecord.cleanedAt),
        method: editingRecord.method,
        notes: editingRecord.notes ?? '',
        status: editingRecord.status,
      }
    : null

  const currentPage = pagination?.page ?? page
  const totalPages = pagination?.totalPages ?? 1

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Cleaning Records
        </p>
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">Record Management</h2>
        <p className="text-xs text-slate-600">
          Use the equipment dropdown, status filter, and pagination controls to navigate live records.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Equipment
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {visibleEquipment ? visibleEquipment.name : 'All equipment'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <EquipmentSelect
            value={selectedEquipmentId}
            options={equipmentOptions}
            onChange={(value) => {
              setSelectedEquipmentId(value)
              setPage(1)
            }}
            className="w-full lg:w-[320px]"
          />
          <AddCleaningRecordDialog equipmentOptions={equipmentOptions} onCreate={handleCreate} />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'PENDING', 'VERIFIED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setStatusFilter(status)
                setPage(1)
              }}
              className={[
                'rounded border px-2 py-0.5 text-xs font-semibold',
                statusFilter === status
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600',
              ].join(' ')}
            >
              {status === 'ALL' ? 'All' : status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <span>•</span>
          <span>{pagination?.total ?? 0} total</span>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Records</h3>
            <p className="mt-1 text-xs text-slate-500">
              {selectedEquipmentId ? 'Filtered by equipment' : 'All equipment'}
            </p>
          </div>
          <p className="text-xs text-slate-400">
            {recordsLoading ? 'Loading...' : `${records.length} shown`}
          </p>
        </div>

        <ReusableTable
          columns={columns}
          data={records}
          emptyState={loading || recordsLoading ? 'Loading records...' : 'No cleaning records found.'}
        />

        <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {pagination
              ? `Showing ${records.length} of ${pagination.total} records`
              : 'No pagination data available'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={recordsLoading || currentPage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={recordsLoading || currentPage >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {initialEditValues ? (
        <EditCleaningRecordDialog
          open={editOpen}
          onOpenChange={(nextOpen) => {
            setEditOpen(nextOpen)
            if (!nextOpen) {
              setEditingRecord(null)
            }
          }}
          equipmentOptions={equipmentOptions}
          initialValues={initialEditValues}
          onUpdate={handleUpdate}
        />
      ) : null}
    </div>
  )
}

function StatusPill({ status }: { status: CleaningRecord['status'] }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold',
        status === 'VERIFIED'
          ? 'border-slate-200 bg-slate-50 text-slate-700'
          : 'border-amber-200 bg-amber-50 text-amber-700',
      ].join(' ')}
    >
      <span
        className={[
          'mr-1.5 h-1.5 w-1.5 rounded-full',
          status === 'VERIFIED' ? 'bg-slate-700' : 'bg-amber-600',
        ].join(' ')}
      />
      {status}
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

function toDatetimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export default CleaningRecordsPage

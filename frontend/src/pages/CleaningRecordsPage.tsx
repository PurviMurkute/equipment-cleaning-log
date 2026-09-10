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
} from '../services/cleaning-records'
import { type CleaningRecordFormValues } from '../components/cleaning-records/CleaningRecordFormDialog'

const CleaningRecordsPage = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')
  const [records, setRecords] = useState<CleaningRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)
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
        if (!mounted) return

        setEquipmentList(data)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load equipment')
      } finally {
        if (mounted) setLoading(false)
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
        return
      }

      setRecordsLoading(true)
      setError(null)

      try {
        const data =
          selectedEquipmentId === ''
            ? await listAllCleaningRecords(equipmentList.map((item) => item.id), {
                limitPerEquipment: 1000,
              })
            : (await listCleaningRecords(selectedEquipmentId, { page: 1, limit: 1000 })).data

        if (!mounted) return
        setRecords(data)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load cleaning records')
        setRecords([])
      } finally {
        if (mounted) setRecordsLoading(false)
      }
    }

    void loadRecords()

    return () => {
      mounted = false
    }
  }, [equipmentList, selectedEquipmentId])

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Cleaning Records
        </p>
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">Record Management</h2>
        <p className="text-xs text-slate-600">
          Use the dropdown to switch equipment. Add and edit records stay connected to the backend.
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
            onChange={setSelectedEquipmentId}
            className="w-full lg:w-[320px]"
          />
          <AddCleaningRecordDialog
            equipmentOptions={equipmentOptions}
            onCreate={handleCreate}
          />
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
          <p className="text-xs text-slate-400">{recordsLoading ? 'Loading...' : `${records.length} total`}</p>
        </div>

        <ReusableTable
          columns={columns}
          data={records}
          emptyState={loading || recordsLoading ? 'Loading records...' : 'No cleaning records found.'}
        />
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

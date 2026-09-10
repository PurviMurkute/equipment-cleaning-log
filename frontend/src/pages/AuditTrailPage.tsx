import { useEffect, useMemo, useState } from 'react'
import EquipmentSelect from '../components/EquipmentSelect'
import ReusableTable, { type TableColumn } from '../components/reusable-table'
import { listEquipment, type Equipment } from '../services/equipment'
import { listAllCleaningRecords, listCleaningRecords, type CleaningRecord } from '../services/cleaning-records'
import { getCleaningRecordAuditHistory, type AuditEntry } from '../services/audit'

const AuditTrailPage = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')
  const [records, setRecords] = useState<CleaningRecord[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState('')
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [auditLoading, setAuditLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        setSelectedRecordId('')
        setAuditEntries([])
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
        setError(err instanceof Error ? err.message : 'Failed to load records')
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

  useEffect(() => {
    if (records.length === 0) {
      setSelectedRecordId('')
      setAuditEntries([])
      return
    }

    setSelectedRecordId((current) => {
      if (current && records.some((record) => record.id === current)) {
        return current
      }

      return records[0]?.id || ''
    })
  }, [records])

  useEffect(() => {
    let mounted = true

    async function loadAuditHistory() {
      if (!selectedRecordId) {
        setAuditEntries([])
        return
      }

      setAuditLoading(true)
      setError(null)

      try {
        const data = await getCleaningRecordAuditHistory(selectedRecordId)
        if (!mounted) return

        setAuditEntries(data.data)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load audit history')
        setAuditEntries([])
      } finally {
        if (mounted) setAuditLoading(false)
      }
    }

    void loadAuditHistory()

    return () => {
      mounted = false
    }
  }, [selectedRecordId])

  const selectedRecord = records.find((item) => item.id === selectedRecordId)
  const selectedEquipment = equipmentList.find((item) => item.id === selectedEquipmentId)

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

  const auditColumns: TableColumn<AuditEntry>[] = [
    {
      header: 'Timestamp',
      className: 'min-w-[180px]',
      cell: (row) => <span className="text-xs text-slate-700">{formatDateTime(row.changedAt)}</span>,
    },
    {
      header: 'Changed By',
      className: 'min-w-[140px]',
      cell: (row) => <span className="text-xs text-slate-700">{row.changedBy}</span>,
    },
    {
      header: 'Field',
      className: 'w-[120px]',
      cell: (row) => <span className="text-xs font-semibold text-slate-900">{row.field}</span>,
    },
    {
      header: 'Old Value',
      className: 'min-w-[180px]',
      cell: (row) => <span className="text-xs text-slate-700">{row.oldValue ?? '—'}</span>,
    },
    {
      header: 'New Value',
      className: 'min-w-[220px]',
      cell: (row) => <span className="text-xs text-slate-700">{row.newValue ?? '—'}</span>,
    },
  ]

  const selectedRecordMeta = useMemo(() => {
    if (!selectedRecord) {
      return null
    }

    return {
      equipment: equipmentList.find((item) => item.id === selectedRecord.equipmentId) ?? null,
      record: selectedRecord,
    }
  }, [equipmentList, selectedRecord])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Audit Trail
        </p>
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">Record History</h2>
        <p className="text-xs text-slate-600">
          Choose equipment, pick a record, and inspect its backend audit history.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Equipment
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {selectedEquipment ? selectedEquipment.name : 'All equipment'}
            </p>
          </div>

          <EquipmentSelect
            value={selectedEquipmentId}
            options={equipmentList.map((equipment) => ({
              id: equipment.id,
              label: `${equipment.code} · ${equipment.name}`,
            }))}
            onChange={setSelectedEquipmentId}
            className="w-full lg:w-[320px]"
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Records</h3>
            <p className="mt-1 text-xs text-slate-500">
              Click View on a record to load its audit history.
            </p>
          </div>
          <p className="text-xs text-slate-400">{recordsLoading ? 'Loading...' : `${records.length} total`}</p>
        </div>

        <ReusableTable
          columns={columns}
          data={records}
          emptyState={loading || recordsLoading ? 'Loading records...' : 'No records found.'}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Audit History</h3>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {auditLoading ? 'Loading' : 'Live'}
            </span>
          </div>

          <ReusableTable
            columns={auditColumns}
            data={auditEntries}
            emptyState={selectedRecordId ? 'No audit entries found.' : 'Select a record to view history.'}
          />
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Selected Record
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {selectedRecordMeta ? shortId(selectedRecordMeta.record.id) : 'No record selected'}
          </p>
          <div className="mt-3 space-y-2 text-xs text-slate-600">
            <p>Equipment: {selectedRecordMeta?.equipment?.name ?? '—'}</p>
            <p>Cleaned by: {selectedRecordMeta?.record.cleanedBy ?? '—'}</p>
            <p>Method: {selectedRecordMeta?.record.method ?? '—'}</p>
            <p>Status: {selectedRecordMeta?.record.status ?? '—'}</p>
          </div>
        </aside>
      </div>
    </div>
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

export default AuditTrailPage

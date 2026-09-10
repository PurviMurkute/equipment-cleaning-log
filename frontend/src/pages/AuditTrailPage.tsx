import { useEffect, useState } from 'react'
import ReusableTable, { type TableColumn } from '../components/reusable-table'
import { listEquipment, type Equipment } from '../services/equipment'
import {
  listAllCleaningRecords,
  listCleaningRecords,
  type CleaningRecord,
} from '../services/cleaning-records'
import { getCleaningRecordAuditHistory, type AuditEntry } from '../services/audit'

const AuditTrailPage = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')
  const [records, setRecords] = useState<CleaningRecord[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState('')
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadEquipment() {
      setError(null)

      try {
        const data = await listEquipment()
        if (!mounted) return

        setEquipmentList(data)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load equipment')
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
      cell: (row) => <span className="text-xs text-slate-700">{row.oldValue ?? '-'}</span>,
    },
    {
      header: 'New Value',
      className: 'min-w-[220px]',
      cell: (row) => <span className="text-xs text-slate-700">{row.newValue ?? '-'}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Audit Trail
        </p>
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">Record History</h2>
        <p className="text-xs text-slate-600">
          Select an equipment item, then choose a cleaning record to view its audit history.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="audit-equipment" className="text-xs font-medium text-slate-700">
              Equipment
            </label>
            <select
              id="audit-equipment"
              value={selectedEquipmentId}
              onChange={(event) => setSelectedEquipmentId(event.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none"
            >
              <option value="">All equipment</option>
              {equipmentList.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.code} - {equipment.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="audit-record" className="text-xs font-medium text-slate-700">
              Record
            </label>
            <select
              id="audit-record"
              value={selectedRecordId}
              onChange={(event) => setSelectedRecordId(event.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none"
              disabled={records.length === 0}
            >
              {records.length === 0 ? (
                <option value="">No records available</option>
              ) : (
                records.map((record) => {
                  const equipment = equipmentList.find((item) => item.id === record.equipmentId)

                  return (
                    <option key={record.id} value={record.id}>
                      {shortId(record.id)} - {equipment?.code ?? 'Unknown'} - {formatDateTime(record.cleanedAt)}
                    </option>
                  )
                })
              )}
            </select>
          </div>
        </div>
      </section>

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

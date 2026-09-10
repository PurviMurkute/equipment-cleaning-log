import { useEffect, useMemo, useState } from 'react'
import ReusableTable, { type TableColumn } from '../components/reusable-table'
import { listEquipment, type Equipment } from '../services/equipment'
import { listCleaningRecords, type CleaningRecord } from '../services/cleaning-records'
import { getCleaningRecordAuditHistory, type AuditEntry } from '../services/audit'

type AuditRow = AuditEntry

const AuditTrailPage = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')
  const [records, setRecords] = useState<CleaningRecord[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState('')
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
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
        const data = await listCleaningRecords(selectedEquipmentId)
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
  }, [selectedEquipmentId])

  useEffect(() => {
    const loadAudit = async () => {
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

    void loadAudit()
  }, [selectedRecordId])

  const selectedEquipment = equipmentList.find((item) => item.id === selectedEquipmentId)
  const selectedRecord = records.find((item) => item.id === selectedRecordId)

  const columns: TableColumn<AuditRow>[] = [
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

  const metrics = useMemo(
    () => [
      {
        label: 'Logged Events',
        value: String(auditEntries.length),
        suffix: 'field changes',
        note: 'For selected cleaning record',
      },
      {
        label: 'Selected Record',
        value: selectedRecord ? shortId(selectedRecord.id) : '—',
        suffix: selectedRecord ? selectedRecord.cleanedBy : 'No record',
        note: 'Linked audit target',
      },
      {
        label: 'Equipment',
        value: selectedEquipment?.code ?? '—',
        suffix: selectedEquipment?.name ?? 'No equipment',
        note: 'Current context',
      },
    ],
    [auditEntries.length, selectedRecord, selectedEquipment],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Audit Trail / Cleaning Record
          </p>
          <h2 className="mt-1 text-sm font-semibold tracking-tight text-slate-900">Audit Trail</h2>
          <p className="mt-1 text-xs text-slate-600">
            Live field-level audit history pulled from the backend.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
            {records.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => setSelectedRecordId(record.id)}
                className={[
                  'rounded border px-2 py-0.5 text-xs font-medium',
                  selectedRecordId === record.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600',
                ].join(' ')}
              >
                {shortId(record.id)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Audit History</h3>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {auditLoading ? 'Loading' : 'Live'}
            </span>
          </div>

          {equipmentLoading || recordsLoading ? (
            <div className="px-4 py-6 text-xs text-slate-500">Loading audit context...</div>
          ) : error ? (
            <div className="px-4 py-6 text-xs text-red-700">{error}</div>
          ) : auditEntries.length > 0 ? (
            <ReusableTable columns={columns} data={auditEntries} emptyState="No audit entries found." />
          ) : (
            <div className="px-4 py-6 text-xs text-slate-500">Select a record to view its audit history.</div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Selected Record
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {selectedRecord ? shortId(selectedRecord.id) : 'No record selected'}
            </p>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <p>Cleaned by: {selectedRecord?.cleanedBy ?? '—'}</p>
              <p>Method: {selectedRecord?.method ?? '—'}</p>
              <p>Status: {selectedRecord ? selectedRecord.status : '—'}</p>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Equipment Context
            </p>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <p>{selectedEquipment?.name ?? 'No equipment selected'}</p>
              <p>{selectedEquipment?.code ?? '—'}</p>
              <p>Audit entries are fetched live from the backend.</p>
            </div>
          </section>
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

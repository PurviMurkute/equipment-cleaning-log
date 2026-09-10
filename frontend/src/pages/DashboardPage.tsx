import { useEffect, useMemo, useState } from 'react'
import EquipmentSelect from '../components/EquipmentSelect'
import ReusableTable, { type TableColumn } from '../components/reusable-table'
import { listEquipment, type Equipment } from '../services/equipment'
import {
  listAllCleaningRecords,
  listCleaningRecords,
  type CleaningRecord,
} from '../services/cleaning-records'

const DashboardPage = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')
  const [records, setRecords] = useState<CleaningRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)
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
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
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
            ? await listAllCleaningRecords(equipmentList.map((equipment) => equipment.id), {
                limitPerEquipment: 1000,
              })
            : (await listCleaningRecords(selectedEquipmentId, { page: 1, limit: 1000 })).data

        if (!mounted) return
        setRecords(data)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
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

  const summary = useMemo(
    () => [
      {
        label: 'Equipment',
        value: equipmentList.length.toString(),
        note: 'From backend',
      },
      {
        label: 'Selected scope',
        value: visibleEquipment ? visibleEquipment.code : 'All',
        note: visibleEquipment ? visibleEquipment.name : 'All equipment',
      },
      {
        label: 'Records',
        value: records.length.toString(),
        note: 'Live cleaning logs',
      },
    ],
    [equipmentList.length, records.length, visibleEquipment],
  )

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
      className: 'min-w-[180px]',
      cell: (row) => <span className="text-xs text-slate-700">{row.method}</span>,
    },
    {
      header: 'Status',
      className: 'w-[120px]',
      cell: (row) => <StatusPill status={row.status} />,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Dashboard</p>
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">Overview</h2>
        <p className="text-xs text-slate-600">
          Pick an equipment from the dropdown to load its records, or keep All equipment selected.
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
            <p className="mt-1 text-xs text-slate-600">Select what you want to view.</p>
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

      <div className="grid gap-3 xl:grid-cols-3">
        {summary.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {item.label}
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">{item.value}</p>
            <p className="mt-2 text-xs text-slate-500">{item.note}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent cleaning records</h3>
            <p className="mt-1 text-xs text-slate-500">
              {visibleEquipment ? visibleEquipment.name : 'All equipment'}
            </p>
          </div>
          <p className="text-xs text-slate-400">{recordsLoading ? 'Loading...' : `${records.length} total`}</p>
        </div>

        <ReusableTable
          columns={columns}
          data={records.slice(0, 5)}
          emptyState={loading || recordsLoading ? 'Loading records...' : 'No cleaning records found.'}
        />
      </section>
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

export default DashboardPage

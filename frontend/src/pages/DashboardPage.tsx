import { useEffect, useMemo, useState } from 'react'
import ReusableTable, { type TableColumn } from '../components/reusable-table'
import { listEquipment, type Equipment } from '../services/equipment'
import {
  listCleaningRecords,
  type CleaningRecord,
  type CleaningRecordPagination,
} from '../services/cleaning-records'

const DASHBOARD_RECORD_LIMIT = 5

const DashboardPage = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')
  const [records, setRecords] = useState<CleaningRecord[]>([])
  const [pagination, setPagination] = useState<CleaningRecordPagination | null>(null)
  const [loadingEquipment, setLoadingEquipment] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadEquipment() {
      setLoadingEquipment(true)
      setError(null)

      try {
        const data = await listEquipment()

        if (!mounted) {
          return
        }

        setEquipmentList(data)
        setSelectedEquipmentId((current) => current || data[0]?.id || '')
      } catch (loadError) {
        if (!mounted) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard data.')
      } finally {
        if (mounted) {
          setLoadingEquipment(false)
        }
      }
    }

    void loadEquipment()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedEquipmentId) {
      setRecords([])
      setPagination(null)
      return
    }

    let mounted = true

    async function loadRecords() {
      setLoadingRecords(true)
      setError(null)

      try {
        const response = await listCleaningRecords(selectedEquipmentId, {
          page: 1,
          limit: DASHBOARD_RECORD_LIMIT,
        })

        if (!mounted) {
          return
        }

        setRecords(response.data)
        setPagination(response.pagination)
      } catch (loadError) {
        if (!mounted) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard data.')
        setRecords([])
        setPagination(null)
      } finally {
        if (mounted) {
          setLoadingRecords(false)
        }
      }
    }

    void loadRecords()

    return () => {
      mounted = false
    }
  }, [selectedEquipmentId])

  const selectedEquipment = useMemo(
    () => equipmentList.find((item) => item.id === selectedEquipmentId) ?? null,
    [equipmentList, selectedEquipmentId],
  )

  const activeEquipmentCount = useMemo(
    () => equipmentList.filter((item) => item.status === 'ACTIVE').length,
    [equipmentList],
  )

  const latestRecord = records[0] ?? null

  const dashboardStats = useMemo(
    () => [
      {
        label: 'Total equipment',
        value: equipmentList.length.toString(),
        note: loadingEquipment ? 'Loading from backend' : 'From /api/equipment',
      },
      {
        label: 'Active equipment',
        value: activeEquipmentCount.toString(),
        note: selectedEquipment ? `${selectedEquipment.code} selected` : 'No equipment selected',
      },
      {
        label: 'Recent records',
        value: pagination?.total?.toString() ?? '0',
        note: `Showing ${records.length} most recent`,
      },
      {
        label: 'Latest cleaned at',
        value: latestRecord ? formatDateTime(latestRecord.cleanedAt) : '—',
        note: latestRecord ? latestRecord.status : 'No record selected',
      },
    ],
    [
      activeEquipmentCount,
      equipmentList.length,
      latestRecord,
      loadingEquipment,
      pagination?.total,
      records.length,
      selectedEquipment,
    ],
  )

  const recordColumns: TableColumn<CleaningRecord>[] = [
    {
      header: 'Cleaned At',
      className: 'min-w-[160px]',
      cell: (row) => <span className="text-xs text-slate-700">{formatDateTime(row.cleanedAt)}</span>,
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
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Dashboard
        </p>
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">Overview</h2>
        <p className="text-xs text-slate-600">
          This view is derived from the existing backend equipment and cleaning-record APIs.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {stat.label}
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">{stat.value}</p>
            <p className="mt-2 text-xs text-slate-500">{stat.note}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Equipment context
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {selectedEquipment ? selectedEquipment.name : 'Select equipment'}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {selectedEquipment
                ? `${selectedEquipment.code} · ${selectedEquipment.status}`
                : 'No equipment available yet.'}
            </p>
          </div>

          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {equipmentList.map((equipment) => {
              const active = equipment.id === selectedEquipmentId

              return (
                <button
                  key={equipment.id}
                  type="button"
                  onClick={() => setSelectedEquipmentId(equipment.id)}
                  className={[
                    'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {equipment.code}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent cleaning records</h3>
            <p className="mt-1 text-xs text-slate-500">
              {selectedEquipment
                ? `Latest ${DASHBOARD_RECORD_LIMIT} records for ${selectedEquipment.code}`
                : 'Choose an equipment item to see records'}
            </p>
          </div>
          <p className="text-xs text-slate-400">
            {loadingRecords ? 'Loading...' : pagination ? `${pagination.total} total` : ''}
          </p>
        </div>

        <ReusableTable
          columns={recordColumns}
          data={records}
          emptyState={
            loadingEquipment || loadingRecords
              ? 'Loading records...'
              : 'No cleaning records found for the selected equipment.'
          }
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

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export default DashboardPage

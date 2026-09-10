import { useMemo, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import type { Equipment } from '../services/equipment'

type EquipmentFilterPopoverProps = {
  equipmentList: Equipment[]
  selectedEquipmentId: string
  onSelect: (equipmentId: string) => void
  className?: string
}

function EquipmentFilterPopover({
  equipmentList,
  selectedEquipmentId,
  onSelect,
  className,
}: EquipmentFilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedEquipment = equipmentList.find((item) => item.id === selectedEquipmentId)

  const filteredEquipment = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return equipmentList
    }

    return equipmentList.filter((equipment) =>
      [equipment.name, equipment.code, equipment.status]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [equipmentList, query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={className ?? 'relative'}>
        <PopoverTrigger
          onClick={() => setOpen((current) => !current)}
          className="flex h-9 min-w-[220px] items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <span className="truncate text-left">
            {selectedEquipment ? `${selectedEquipment.code} · ${selectedEquipment.name}` : 'All equipment'}
          </span>
          <ChevronDownIcon />
        </PopoverTrigger>

        <PopoverContent className="w-[320px] p-2" align="start" sideOffset={8}>
          <div className="space-y-2">
            <div className="relative">
              <SearchIcon />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search equipment"
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
              />
            </div>

            <div className="max-h-64 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => {
                  onSelect('')
                  setOpen(false)
                }}
                className={[
                  'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition',
                  selectedEquipmentId === ''
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-50',
                ].join(' ')}
              >
                <span>All equipment</span>
                <span className="text-[10px] uppercase tracking-[0.14em]">System wide</span>
              </button>

              {filteredEquipment.map((equipment) => {
                const active = equipment.id === selectedEquipmentId

                return (
                  <button
                    key={equipment.id}
                    type="button"
                    onClick={() => {
                      onSelect(equipment.id)
                      setOpen(false)
                    }}
                    className={[
                      'mt-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition',
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <span className="truncate">{equipment.code}</span>
                    <span className="ml-2 truncate text-[10px] uppercase tracking-[0.14em]">
                      {equipment.name}
                    </span>
                  </button>
                )
              })}

              {filteredEquipment.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-500">
                  No equipment found.
                </div>
              ) : null}
            </div>
          </div>
        </PopoverContent>
      </div>
    </Popover>
  )
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
    >
      <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10.25 10.25 13.25 13.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true">
      <path d="M4 6.25 8 10.25 12 6.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default EquipmentFilterPopover

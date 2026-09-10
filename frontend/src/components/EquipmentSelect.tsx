type EquipmentSelectOption = {
  id: string
  label: string
}

type EquipmentSelectProps = {
  value: string
  options: EquipmentSelectOption[]
  onChange: (value: string) => void
  includeAll?: boolean
  className?: string
}

const ALL_VALUE = ''

function EquipmentSelect({
  value,
  options,
  onChange,
  includeAll = true,
  className,
}: EquipmentSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={[
        'h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none',
        className ?? 'w-full min-w-[220px]',
      ].join(' ')}
    >
      {includeAll ? <option value={ALL_VALUE}>All equipment</option> : null}
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export default EquipmentSelect

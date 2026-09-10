import { useEffect, useState, type FormEvent } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import type { EquipmentStatus } from '../../services/equipment'

type EquipmentFormValues = {
  name: string
  code: string
  status: EquipmentStatus
}

type EquipmentFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  initialValues: EquipmentFormValues
  onSubmit: (payload: EquipmentFormValues) => Promise<void> | void
}

const defaultValues: EquipmentFormValues = {
  name: '',
  code: '',
  status: 'ACTIVE',
}

const statusLabels: Record<EquipmentStatus, string> = {
  ACTIVE: 'Active',
  RETIRED: 'Retired',
}

const EquipmentFormDialog = ({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValues,
  onSubmit,
}: EquipmentFormDialogProps) => {
  const [statusOpen, setStatusOpen] = useState(false)
  const [form, setForm] = useState<EquipmentFormValues>(initialValues ?? defaultValues)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initialValues ?? defaultValues)
    } else {
      setStatusOpen(false)
      setIsSubmitting(false)
    }
  }, [initialValues, open])

  const submitDisabled = form.name.trim() === '' || form.code.trim() === '' || isSubmitting

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (submitDisabled) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        code: form.code.trim(),
        status: form.status,
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="equipment-name" className="text-xs font-medium text-slate-700">
              Equipment Name
            </label>
            <input
              id="equipment-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Mixing Tank A"
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="equipment-code" className="text-xs font-medium text-slate-700">
              Equipment Code
            </label>
            <input
              id="equipment-code"
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({ ...current, code: event.target.value }))
              }
              placeholder="MT-001"
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">Status</label>
            <Popover open={statusOpen} onOpenChange={setStatusOpen}>
              <div className="relative">
                <PopoverTrigger
                  onClick={() => setStatusOpen((current) => !current)}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 text-left text-xs text-slate-700 transition hover:bg-slate-100"
                >
                  <span>{statusLabels[form.status]}</span>
                  <span className="text-slate-400">▾</span>
                </PopoverTrigger>

                <PopoverContent className="min-w-[220px] p-1" align="start" sideOffset={6}>
                  {(['ACTIVE', 'RETIRED'] as EquipmentStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setForm((current) => ({ ...current, status }))
                        setStatusOpen(false)
                      }}
                      className={[
                        'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition',
                        form.status === status
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700 hover:bg-slate-100',
                      ].join(' ')}
                    >
                      <span>{statusLabels[status]}</span>
                      {form.status === status ? <span>✓</span> : null}
                    </button>
                  ))}
                </PopoverContent>
              </div>
            </Popover>
          </div>

          <DialogFooter>
            <DialogClose onClick={() => onOpenChange(false)}>Cancel</DialogClose>
            <button
              type="submit"
              disabled={submitDisabled}
              className="rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EquipmentFormDialog

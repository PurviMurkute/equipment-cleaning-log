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
import type { CleaningRecordStatus } from '../../services/cleaning-records'

type EquipmentOption = {
  id: string
  label: string
}

type CleaningRecordFormValues = {
  equipmentId: string
  cleanedBy: string
  cleanedAt: string
  method: string
  notes: string
  status: CleaningRecordStatus
  changedBy: string
}

type CleaningRecordFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  initialValues: CleaningRecordFormValues
  equipmentOptions: EquipmentOption[]
  showEquipmentSelect?: boolean
  onSubmit: (payload: CleaningRecordFormValues) => Promise<void> | void
}

const statusLabels: Record<CleaningRecordStatus, string> = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
}

function CleaningRecordFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialValues,
  equipmentOptions,
  showEquipmentSelect = false,
  onSubmit,
}: CleaningRecordFormDialogProps) {
  const [form, setForm] = useState<CleaningRecordFormValues>(initialValues)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initialValues)
    } else {
      setIsSubmitting(false)
    }
  }, [initialValues, open])

  const submitDisabled =
    form.cleanedBy.trim() === '' ||
    form.cleanedAt.trim() === '' ||
    form.method.trim() === '' ||
    form.changedBy.trim() === '' ||
    (showEquipmentSelect && form.equipmentId.trim() === '') ||
    isSubmitting

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (submitDisabled) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        equipmentId: form.equipmentId,
        cleanedBy: form.cleanedBy.trim(),
        cleanedAt: form.cleanedAt,
        method: form.method.trim(),
        notes: form.notes.trim(),
        status: form.status,
        changedBy: form.changedBy.trim(),
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
          {showEquipmentSelect ? (
            <div className="space-y-2">
              <label htmlFor="cleaning-equipment" className="text-xs font-medium text-slate-700">
                Equipment
              </label>
              <select
                id="cleaning-equipment"
                value={form.equipmentId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, equipmentId: event.target.value }))
                }
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-slate-300 focus:outline-none"
                required
              >
                <option value="">Select equipment</option>
                {equipmentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="cleaned-by" className="text-xs font-medium text-slate-700">
                Cleaned By
              </label>
              <input
                id="cleaned-by"
                value={form.cleanedBy}
                onChange={(event) =>
                  setForm((current) => ({ ...current, cleanedBy: event.target.value }))
                }
                placeholder="John Smith"
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="changed-by" className="text-xs font-medium text-slate-700">
                Changed By
              </label>
              <input
                id="changed-by"
                value={form.changedBy}
                onChange={(event) =>
                  setForm((current) => ({ ...current, changedBy: event.target.value }))
                }
                placeholder="QA Lead"
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="cleaned-at" className="text-xs font-medium text-slate-700">
                Cleaned At
              </label>
              <input
                id="cleaned-at"
                type="datetime-local"
                value={form.cleanedAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, cleanedAt: event.target.value }))
                }
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-slate-300 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="method" className="text-xs font-medium text-slate-700">
              Method
            </label>
            <input
              id="method"
              value={form.method}
              onChange={(event) =>
                setForm((current) => ({ ...current, method: event.target.value }))
              }
              placeholder="CIP / Manual / SIP"
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-xs font-medium text-slate-700">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Optional cleaning notes"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="cleaning-status" className="text-xs font-medium text-slate-700">
              Status
            </label>
            <select
              id="cleaning-status"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as CleaningRecordStatus,
                }))
              }
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus:border-slate-300 focus:outline-none"
            >
              {(['PENDING', 'VERIFIED'] as CleaningRecordStatus[]).map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
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

export type { CleaningRecordFormValues, EquipmentOption }
export default CleaningRecordFormDialog

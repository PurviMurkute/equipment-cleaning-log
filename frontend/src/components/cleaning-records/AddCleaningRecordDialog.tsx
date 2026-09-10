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

type CleaningRecordPayload = {
  equipmentId: string
  cleanedBy: string
  cleanedAt: string
  method: string
  notes?: string
  status?: 'PENDING' | 'VERIFIED'
}

type EquipmentOption = {
  id: string
  label: string
}

type AddCleaningRecordDialogProps = {
  equipmentOptions: EquipmentOption[]
  onCreate?: (payload: CleaningRecordPayload) => Promise<void> | void
}

type CleaningRecordForm = {
  equipmentId: string
  cleanedBy: string
  cleanedAt: string
  method: string
  notes: string
  status: 'PENDING' | 'VERIFIED'
}

const getInitialForm = (equipmentOptions: EquipmentOption[]): CleaningRecordForm => ({
  equipmentId: equipmentOptions[0]?.id ?? '',
  cleanedBy: '',
  cleanedAt: '',
  method: '',
  notes: '',
  status: 'PENDING',
})

const statusLabels: Record<CleaningRecordForm['status'], string> = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
}

const AddCleaningRecordDialog = ({ equipmentOptions, onCreate }: AddCleaningRecordDialogProps) => {
  const [open, setOpen] = useState(false)
  const [equipmentOpen, setEquipmentOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [form, setForm] = useState<CleaningRecordForm>(getInitialForm(equipmentOptions))
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setForm((current) => {
      if (current.equipmentId && equipmentOptions.some((item) => item.id === current.equipmentId)) {
        return current
      }

      return {
        ...current,
        equipmentId: equipmentOptions[0]?.id ?? '',
      }
    })
  }, [equipmentOptions])

  const selectedEquipment =
    equipmentOptions.find((item) => item.id === form.equipmentId) ?? equipmentOptions[0]

  const submitDisabled =
    form.equipmentId.trim() === '' ||
    form.cleanedBy.trim() === '' ||
    form.cleanedAt.trim() === '' ||
    form.method.trim() === '' ||
    isSubmitting

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (submitDisabled) {
      return
    }

    setIsSubmitting(true)

    try {
      await onCreate?.({
        equipmentId: form.equipmentId,
        cleanedBy: form.cleanedBy.trim(),
        cleanedAt: form.cleanedAt,
        method: form.method.trim(),
        notes: form.notes.trim() === '' ? undefined : form.notes.trim(),
        status: form.status,
      })

      setForm(getInitialForm(equipmentOptions))
      setEquipmentOpen(false)
      setStatusOpen(false)
      setOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
      >
        + Log Cleaning
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Cleaning Record</DialogTitle>
            <DialogDescription>
              Backend needs equipment id, cleaned by, cleaned at, method, with optional notes and
              status.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">Equipment</label>
              <Popover open={equipmentOpen} onOpenChange={setEquipmentOpen}>
                <div className="relative">
                  <PopoverTrigger
                    onClick={() => setEquipmentOpen((current) => !current)}
                    className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 text-left text-xs text-slate-700 transition hover:bg-slate-100"
                  >
                    <span>{selectedEquipment?.label ?? 'Select equipment'}</span>
                    <span className="text-slate-400">▾</span>
                  </PopoverTrigger>

                  <PopoverContent className="min-w-[280px] p-1" align="start" sideOffset={6}>
                    <div className="space-y-1">
                      {equipmentOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setForm((current) => ({ ...current, equipmentId: option.id }))
                            setEquipmentOpen(false)
                          }}
                          className={[
                            'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition',
                            form.equipmentId === option.id
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-700 hover:bg-slate-100',
                          ].join(' ')}
                        >
                          <span>{option.label}</span>
                          {form.equipmentId === option.id ? <span>✓</span> : null}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </div>
              </Popover>
            </div>

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
                    {(['PENDING', 'VERIFIED'] as const).map((status) => (
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

            <DialogFooter>
              <DialogClose onClick={() => setOpen(false)}>Cancel</DialogClose>
              <button
                type="submit"
                disabled={submitDisabled}
                className="rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Create Record'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AddCleaningRecordDialog

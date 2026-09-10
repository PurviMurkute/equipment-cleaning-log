import { useState } from 'react'
import CleaningRecordFormDialog, {
  type CleaningRecordFormValues,
  type EquipmentOption,
} from './CleaningRecordFormDialog'

type CleaningRecordPayload = CleaningRecordFormValues

type AddCleaningRecordDialogProps = {
  equipmentOptions: EquipmentOption[]
  onCreate?: (payload: CleaningRecordPayload) => Promise<void> | void
}

const toDatetimeLocalValue = (date = new Date()) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const getInitialForm = () => ({
  equipmentId: '',
  cleanedBy: '',
  changedBy: '',
  cleanedAt: toDatetimeLocalValue(),
  method: '',
  notes: '',
  status: 'PENDING' as const,
})

const AddCleaningRecordDialog = ({
  equipmentOptions,
  onCreate,
}: AddCleaningRecordDialogProps) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
      >
        + Add Record
      </button>

      <CleaningRecordFormDialog
        open={open}
        onOpenChange={setOpen}
        title="Add Cleaning Record"
        description="Create a new cleaning record in the backend."
        submitLabel="Create Record"
        equipmentOptions={equipmentOptions}
        showEquipmentSelect
        initialValues={getInitialForm()}
        onSubmit={async (payload) => {
          await onCreate?.(payload)
        }}
      />
    </>
  )
}

export default AddCleaningRecordDialog

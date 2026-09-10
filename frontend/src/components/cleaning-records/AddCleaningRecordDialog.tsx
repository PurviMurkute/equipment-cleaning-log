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

const getInitialForm = () => ({
  equipmentId: '',
  cleanedBy: '',
  changedBy: '',
  cleanedAt: '',
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

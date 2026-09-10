import { useState } from 'react'
import EquipmentFormDialog from './EquipmentFormDialog'
import type { EquipmentStatus } from '../../services/equipment'

type AddEquipmentDialogProps = {
  onCreate: (payload: {
    name: string
    code: string
    status: EquipmentStatus
  }) => Promise<void> | void
}

const initialValues = {
  name: '',
  code: '',
  status: 'ACTIVE' as EquipmentStatus,
}

const AddEquipmentDialog = ({ onCreate }: AddEquipmentDialogProps) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
      >
        + Add Equipment
      </button>

      <EquipmentFormDialog
        open={open}
        onOpenChange={setOpen}
        title="Add Equipment"
        description="Backend requires name and code. Status is optional and defaults to ACTIVE."
        submitLabel="Create Equipment"
        initialValues={initialValues}
        onSubmit={onCreate}
      />
    </>
  )
}

export default AddEquipmentDialog

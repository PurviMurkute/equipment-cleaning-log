import CleaningRecordFormDialog, {
  type CleaningRecordFormValues,
  type EquipmentOption,
} from './CleaningRecordFormDialog'

type EditCleaningRecordDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipmentOptions: EquipmentOption[]
  initialValues: CleaningRecordFormValues
  onUpdate: (payload: CleaningRecordFormValues) => Promise<void> | void
}

function EditCleaningRecordDialog({
  open,
  onOpenChange,
  equipmentOptions,
  initialValues,
  onUpdate,
}: EditCleaningRecordDialogProps) {
  return (
    <CleaningRecordFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Cleaning Record"
      description="Update the selected cleaning record."
      submitLabel="Save Changes"
      equipmentOptions={equipmentOptions}
      initialValues={initialValues}
      onSubmit={onUpdate}
    />
  )
}

export default EditCleaningRecordDialog

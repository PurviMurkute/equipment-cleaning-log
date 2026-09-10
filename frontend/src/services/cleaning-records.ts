import api from '../lib/api'

export type CleaningRecordStatus = 'PENDING' | 'VERIFIED'

export type CleaningRecord = {
  id: string
  equipmentId: string
  cleanedBy: string
  cleanedAt: string
  method: string
  notes: string | null
  status: CleaningRecordStatus
  createdAt: string
  updatedAt: string
}

export type CleaningRecordPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type CleaningRecordListResponse = {
  data: CleaningRecord[]
  pagination: CleaningRecordPagination
}

export type CreateCleaningRecordPayload = {
  cleanedBy: string
  cleanedAt: string
  method: string
  notes?: string
  status?: CleaningRecordStatus
  changedBy?: string
}

export type UpdateCleaningRecordPayload = {
  cleanedBy?: string
  cleanedAt?: string
  method?: string
  notes?: string | null
  status?: CleaningRecordStatus
  changedBy?: string
}

export const cleaningRecordRoutes = {
  listByEquipment: (equipmentId: string) => `/equipment/${equipmentId}/cleaning-records`,
  createForEquipment: (equipmentId: string) => `/equipment/${equipmentId}/cleaning-records`,
  byId: (id: string) => `/cleaning-records/${id}`,
  auditHistory: (id: string) => `/cleaning-records/${id}/audit-history`,
}

export async function listCleaningRecords(
  equipmentId: string,
  params?: { page?: number; limit?: number; status?: CleaningRecordStatus },
) {
  const response = await api.get<CleaningRecordListResponse>(
    cleaningRecordRoutes.listByEquipment(equipmentId),
    { params },
  )

  return response.data
}

export async function createCleaningRecord(
  equipmentId: string,
  payload: CreateCleaningRecordPayload,
) {
  const response = await api.post<CleaningRecord>(
    cleaningRecordRoutes.createForEquipment(equipmentId),
    payload,
  )

  return response.data
}

export async function updateCleaningRecord(
  id: string,
  payload: UpdateCleaningRecordPayload,
) {
  const response = await api.patch<CleaningRecord>(
    cleaningRecordRoutes.byId(id),
    payload,
  )

  return response.data
}

export async function getCleaningRecordAuditHistory(id: string) {
  const response = await api.get<{ data: AuditEntry[] }>(cleaningRecordRoutes.auditHistory(id))
  return response.data
}

export type AuditEntry = {
  id: string
  cleaningRecordId: string
  changedBy: string
  changedAt: string
  field: string
  oldValue: string | null
  newValue: string | null
}

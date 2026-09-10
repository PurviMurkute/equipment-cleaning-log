import api from '../lib/api'
import type { AuditEntry } from './cleaning-records'

export const auditRoutes = {
  cleaningRecordHistory: (id: string) => `/cleaning-records/${id}/audit-history`,
}

export async function getCleaningRecordAuditHistory(id: string) {
  const response = await api.get<{ data: AuditEntry[] }>(auditRoutes.cleaningRecordHistory(id))
  return response.data
}

export type { AuditEntry }

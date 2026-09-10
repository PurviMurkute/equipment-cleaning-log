import api from '../lib/api'

export type EquipmentStatus = 'ACTIVE' | 'RETIRED'

export type Equipment = {
  id: string
  name: string
  code: string
  status: EquipmentStatus
  createdAt: string
  updatedAt: string
}

export type CreateEquipmentPayload = {
  name: string
  code: string
  status?: EquipmentStatus
}

export type UpdateEquipmentPayload = {
  name?: string
  code?: string
  status?: EquipmentStatus
}

export const equipmentRoutes = {
  list: '/equipment',
  byId: (id: string) => `/equipment/${id}`,
}

export async function listEquipment() {
  const response = await api.get<Equipment[]>(equipmentRoutes.list)
  return response.data
}

export async function getEquipmentById(id: string) {
  const response = await api.get<Equipment>(equipmentRoutes.byId(id))
  return response.data
}

export async function createEquipment(payload: CreateEquipmentPayload) {
  const response = await api.post<Equipment>(equipmentRoutes.list, payload)
  return response.data
}

export async function updateEquipment(id: string, payload: UpdateEquipmentPayload) {
  const response = await api.patch<Equipment>(equipmentRoutes.byId(id), payload)
  return response.data
}

export async function deleteEquipment(id: string) {
  const response = await api.delete<{ message: string }>(equipmentRoutes.byId(id))
  return response.data
}

import type { EquipmentStatus } from "./common.dto.js";

export type EquipmentDto = {
  id: string;
  name: string;
  code: string;
  status: EquipmentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateEquipmentRequestDto = {
  name: string;
  code: string;
  status?: EquipmentStatus;
};

export type UpdateEquipmentRequestDto = {
  name?: string;
  code?: string;
  status?: EquipmentStatus;
};

import type { CleaningRecordStatus } from "./common.dto.js";

export type EquipmentIdParamsDto = {
  id: string;
};

export type CleaningRecordIdParamsDto = {
  id: string;
};

export type EquipmentCleaningRecordsParamsDto = {
  equipmentId: string;
};

export type CleaningRecordListQueryDto = {
  page?: string;
  limit?: string;
  status?: CleaningRecordStatus;
};

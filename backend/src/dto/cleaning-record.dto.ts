import type { CleaningRecordStatus, PaginationDto } from "./common.dto.js";

export type CleaningRecordDto = {
  id: string;
  equipmentId: string;
  cleanedBy: string;
  cleanedAt: Date;
  method: string;
  notes: string | null;
  status: CleaningRecordStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCleaningRecordRequestDto = {
  cleanedBy: string;
  cleanedAt: string;
  method: string;
  notes?: string;
  status?: CleaningRecordStatus;
  changedBy?: string;
};

export type UpdateCleaningRecordRequestDto = {
  cleanedBy?: string;
  cleanedAt?: string;
  method?: string;
  notes?: string | null;
  status?: CleaningRecordStatus;
  changedBy?: string;
};

export type CleaningRecordListResponseDto = {
  data: CleaningRecordDto[];
  pagination: PaginationDto;
};

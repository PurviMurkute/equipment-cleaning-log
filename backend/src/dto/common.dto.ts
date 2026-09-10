export type EquipmentStatus = "ACTIVE" | "RETIRED";

export type CleaningRecordStatus = "PENDING" | "VERIFIED";

export type PaginationDto = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

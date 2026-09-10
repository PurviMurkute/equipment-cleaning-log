export type AuditEntryDto = {
  id: string;
  cleaningRecordId: string;
  changedBy: string;
  changedAt: Date;
  field: string;
  oldValue: string | null;
  newValue: string | null;
};

export type CleaningRecordAuditHistoryResponseDto = {
  data: AuditEntryDto[];
};

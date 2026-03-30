export interface ActivityLog {
  _id: string;
  logId: string;
  schoolId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "OTHER";
  entity: string;
  entityId: string;
  entityLabel?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface LogStatistics {
  totalToday: number;
  mostActiveUser: {
    _id: string;
    name: string;
    count: number;
  } | null;
  lastActivity: {
    createdAt: string;
    actorName: string;
    description: string;
  } | null;
  expiringIn7DaysCount: number;
}

export interface ActivityLogFilters {
  actorRole?: string;
  entity?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

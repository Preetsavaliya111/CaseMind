export interface NotificationPreferences {
  ticketAssigned: boolean
  slaWarning: boolean
  aiAnalysisComplete: boolean
  weeklyDigest: boolean
}

export interface OrganizationSettings {
  name: string
  domain: string
  slaHours: Record<string, number>
  defaultAssigneeId?: string
}

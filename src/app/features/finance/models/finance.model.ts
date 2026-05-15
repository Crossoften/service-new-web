export interface PlatformSettings {
  influencerCommissionRate: number;
  updatedAt: string;
}

export interface UpdatePlatformSettingsPayload {
  influencerCommissionRate?: number;
}

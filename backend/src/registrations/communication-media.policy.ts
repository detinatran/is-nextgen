/** Owner-approved communications amendment; SMTP identity is configured separately. */
export const WITHDRAWAL_CONTACT_EMAIL = 'nextgen@vnuis.edu.vn';
export const COMMUNICATION_MEDIA_POLICY = {
  purpose: 'MEDIA_USAGE',
  retention: { anchor: 'OFFICIAL_COMPETITION_END', period: 'P1Y' },
  normalCompetitionRetention: { anchor: 'OFFICIAL_END_OR_FINAL_PUBLICATION', period: 'P3M' },
  cleanupEnforced: false,
} as const;

/** Calendar retention, clamping a leap-day anniversary to February's last day. */
export function communicationRetentionUntil(officialEnd: Date): Date {
  if (!Number.isFinite(officialEnd.getTime())) throw new Error('Official competition end is required');
  const result = new Date(officialEnd);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCFullYear(result.getUTCFullYear() + 1);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

/** A normal three-month cleanup must defer to active, more-specific retention. */
export function protectedByCommunicationRetention(activeConsent: boolean, officialEnd: Date | null, now: Date): boolean {
  // Unknown official end cannot establish that the communications window expired.
  return activeConsent && (!officialEnd || now < communicationRetentionUntil(officialEnd));
}

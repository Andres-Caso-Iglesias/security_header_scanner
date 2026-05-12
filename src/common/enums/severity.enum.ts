export const SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];

export const SEVERITY_WEIGHTS = {
  critical: 25,
  high: 15,
  medium: 10,
  low: 5,
} as const;

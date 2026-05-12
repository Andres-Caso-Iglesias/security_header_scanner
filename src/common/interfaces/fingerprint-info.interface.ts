export interface DetectedTech {
  name: string;
  version: string | null;
  category: 'cms' | 'framework' | 'server' | 'runtime' | 'cdn';
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
}

export interface CveInfo {
  id: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedVersions: string;
}

export interface TechFingerprintInfo {
  checked: boolean;
  technologies: DetectedTech[];
  cves: CveInfo[];
  grade: number;
  summary: string;
}

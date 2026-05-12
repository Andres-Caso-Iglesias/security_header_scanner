export interface SecurityFileCheck {
  path: string;
  present: boolean;
  statusCode: number | null;
  content: string | null;
  grade: number;
  finding: string;
  recommendation: string;
}

export interface SecurityFileInfo {
  checked: boolean;
  securityTxt: SecurityFileCheck;
  robotsTxt: SecurityFileCheck;
  grade: number;
}

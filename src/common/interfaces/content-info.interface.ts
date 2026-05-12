export interface SriResource {
  tag: string;
  src: string;
  hasIntegrity: boolean;
}

export interface SriInfo {
  checked: boolean;
  totalResources: number;
  secureResources: number;
  insecureResources: SriResource[];
  grade: number;
  finding: string;
  recommendation: string;
}

export interface SensitiveFileResult {
  path: string;
  statusCode: number | null;
  exposed: boolean;
  finding: string;
}

export interface SensitiveFilesInfo {
  checked: boolean;
  files: SensitiveFileResult[];
  exposedCount: number;
  grade: number;
}

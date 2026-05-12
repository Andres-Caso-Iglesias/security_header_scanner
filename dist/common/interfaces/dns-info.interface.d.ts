export interface DnsRecord {
    type: string;
    value: string;
    present: boolean;
    grade: number;
    finding: string;
    recommendation: string;
}
export interface DnsInfo {
    hostname: string;
    checked: boolean;
    error: string | null;
    spf: DnsRecord;
    dkim: DnsRecord;
    dmarc: DnsRecord;
    grade: number;
}

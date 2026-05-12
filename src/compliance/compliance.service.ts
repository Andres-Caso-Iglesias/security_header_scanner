import { Injectable } from '@nestjs/common';
import type { HeaderResult } from '../common/interfaces/header-checker.interface';
import type { TlsInfo } from '../common/interfaces/tls-info.interface';
import type { DnsInfo } from '../common/interfaces/dns-info.interface';
import { OwaspTop10Mapper } from './mappers/owasp-top10.mapper';
import { Nis2Mapper } from './mappers/nis2.mapper';
import type { ComplianceSection } from '../common/interfaces/scan-result.interface';

@Injectable()
export class ComplianceService {
  private readonly owaspMapper = new OwaspTop10Mapper();
  private readonly nis2Mapper = new Nis2Mapper();

  evaluate(headers: HeaderResult[], tls?: TlsInfo, dns?: DnsInfo): ComplianceSection[] {
    return [
      {
        framework: 'OWASP Top 10',
        version: this.owaspMapper['version'],
        findings: this.owaspMapper.map(headers, tls, dns),
      },
      {
        framework: 'NIS2 Directive',
        version: this.nis2Mapper['version'],
        findings: this.nis2Mapper.map(headers, tls, dns),
      },
    ];
  }
}

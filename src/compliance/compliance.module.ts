import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { OwaspTop10Mapper } from './mappers/owasp-top10.mapper';
import { Nis2Mapper } from './mappers/nis2.mapper';
import { EnsMapper } from './mappers/ens.mapper';
import { Iso27001Mapper } from './mappers/iso27001.mapper';

@Module({
  providers: [
    ComplianceService,
    OwaspTop10Mapper,
    Nis2Mapper,
    EnsMapper,
    Iso27001Mapper,
  ],
  exports: [ComplianceService],
})
export class ComplianceModule {}

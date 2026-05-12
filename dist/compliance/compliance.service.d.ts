import { HeaderResult } from '../common/interfaces/header-checker.interface';
import { ComplianceSection } from '../common/interfaces/scan-result.interface';
export declare class ComplianceService {
    private readonly owaspMapper;
    private readonly nis2Mapper;
    evaluate(headers: HeaderResult[]): ComplianceSection[];
}

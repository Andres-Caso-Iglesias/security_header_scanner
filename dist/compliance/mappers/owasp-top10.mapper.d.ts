import { HeaderResult } from '../../common/interfaces/header-checker.interface';
import { ComplianceFinding } from '../interfaces/compliance-finding.interface';
export declare class OwaspTop10Mapper {
    private readonly version;
    map(headers: HeaderResult[]): ComplianceFinding[];
    private mapA01BrokenAccessControl;
    private mapA05SecurityMisconfiguration;
    private mapA06VulnerableComponents;
}

import { HeaderResult } from '../../common/interfaces/header-checker.interface';
import { ComplianceFinding } from '../interfaces/compliance-finding.interface';
export declare class Nis2Mapper {
    private readonly version;
    map(headers: HeaderResult[]): ComplianceFinding[];
    private mapArticle21cAccessControl;
    private mapArticle21dIncidentHandling;
    private mapArticle21gSupplyChain;
    private mapArticle21iCryptography;
}

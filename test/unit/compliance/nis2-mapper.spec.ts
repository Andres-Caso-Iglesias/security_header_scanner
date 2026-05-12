import { Nis2Mapper } from '../../../src/compliance/mappers/nis2.mapper';
import { HeaderResult } from '../../../src/common/interfaces/header-checker.interface';

describe('Nis2Mapper', () => {
  let mapper: Nis2Mapper;

  beforeEach(() => {
    mapper = new Nis2Mapper();
  });

  function makeHeader(name: string, headerName: string, grade: number, present: boolean, value: string | null = null): HeaderResult {
    return {
      header: headerName,
      present,
      value,
      expected: 'test',
      grade,
      severity: 'medium',
      weight: 10,
      finding: 'test',
      recommendation: 'test',
    };
  }

  it('should report compliant for properly configured headers', () => {
    const headers = [
      makeHeader('HSTS', 'Strict-Transport-Security', 1.0, true, 'max-age=31536000; includeSubDomains'),
      makeHeader('CORS', 'Access-Control-Allow-Origin', 1.0, true, 'https://example.com'),
    ];
    const findings = mapper.map(headers);
    const accessControl = findings.find(f => f.control.includes('Access Control'));
    expect(accessControl).toBeDefined();
    expect(accessControl!.status).toBe('compliant');
  });

  it('should report non-compliant for weak access control', () => {
    const headers = [
      makeHeader('CORS', 'Access-Control-Allow-Origin', 0, true, '*'),
    ];
    const findings = mapper.map(headers);
    const accessControl = findings.find(f => f.control.includes('Access Control'));
    expect(accessControl).toBeDefined();
    expect(accessControl!.status).toBe('non_compliant');
  });

  it('should always return exactly 4 findings (Art.21 c, d, g, i)', () => {
    const headers: HeaderResult[] = [];
    const findings = mapper.map(headers);
    expect(findings).toHaveLength(4);
  });
});

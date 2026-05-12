import { OwaspTop10Mapper } from '../../../src/compliance/mappers/owasp-top10.mapper';
import { HeaderResult } from '../../../src/common/interfaces/header-checker.interface';

describe('OwaspTop10Mapper', () => {
  let mapper: OwaspTop10Mapper;

  beforeEach(() => {
    mapper = new OwaspTop10Mapper();
  });

  function makeHeader(name: string, headerName: string, grade: number, present: boolean, severity: string = 'medium'): HeaderResult {
    return {
      header: headerName,
      present,
      value: present ? 'test' : null,
      expected: 'test',
      grade,
      severity: severity as any,
      weight: 10,
      finding: `test finding for ${headerName}`,
      recommendation: `test rec for ${headerName}`,
    };
  }

  it('should report non-compliant for wildcard CORS', () => {
    const headers = [
      makeHeader('CORS', 'Access-Control-Allow-Origin', 0, true, 'high'),
    ];
    const findings = mapper.map(headers);
    const corsFinding = findings.find(f => f.control.includes('CORS'));
    expect(corsFinding).toBeDefined();
    expect(corsFinding!.status).toBe('non_compliant');
  });

  it('should report compliant for perfect security headers', () => {
    const headers = [
      makeHeader('CORS', 'Access-Control-Allow-Origin', 1.0, true, 'high'),
    ];
    const findings = mapper.map(headers);
    const corsFinding = findings.find(f => f.control.includes('CORS'));
    expect(corsFinding).toBeDefined();
    expect(corsFinding!.status).toBe('compliant');
  });
});

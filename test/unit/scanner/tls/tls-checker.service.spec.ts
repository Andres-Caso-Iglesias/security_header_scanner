import { TlsCheckerService } from '../../../../src/scanner/tls/tls-checker.service';

const DAY_MS = 86_400_000;
const NOW = Date.now();

function mockCert(overrides?: Record<string, unknown>) {
  return {
    subject: { CN: 'example.com', O: 'Test Corp' },
    issuer: { CN: 'R3', O: 'Let\'s Encrypt' },
    subjectaltname: 'DNS:example.com, DNS:www.example.com',
    valid_from: new Date(NOW - 30 * DAY_MS).toISOString(),
    valid_to: new Date(NOW + 365 * DAY_MS).toISOString(),
    fingerprint256: 'AA:BB:CC:DD:EE:FF:00:11',
    serialNumber: '1234567890',
    ...overrides,
  };
}

describe('TlsCheckerService', () => {
  let service: TlsCheckerService;

  beforeEach(() => {
    service = new TlsCheckerService();
  });

  describe('calculateTlsGrade', () => {
    const calcGrade = (
      protocol: string | null | undefined,
      cert: Record<string, unknown>,
    ) => (service as unknown as Record<string, (p: string | null | undefined, c: Record<string, unknown>) => number>).calculateTlsGrade(protocol, cert);

    it('TLSv1.3 + valid cert → grade 1.0', () => {
      expect(calcGrade('TLSv1.3', mockCert())).toBe(1.0);
    });

    it('TLSv1.2 + valid cert → grade 0.9', () => {
      expect(calcGrade('TLSv1.2', mockCert())).toBeCloseTo(0.9, 2);
    });

    it('TLSv1.1 + valid cert → grade 0.65', () => {
      expect(calcGrade('TLSv1.1', mockCert())).toBeCloseTo(0.65, 2);
    });

    it('TLSv1 + expired cert → grade 0', () => {
      expect(calcGrade('TLSv1', mockCert({
        valid_to: new Date(NOW - 1 * DAY_MS).toISOString(),
      }))).toBe(0);
    });

    it('null protocol + expired cert → grade 0', () => {
      expect(calcGrade(null, mockCert({
        valid_to: new Date(NOW - 1 * DAY_MS).toISOString(),
      }))).toBe(0);
    });

    it('self-signed cert → grade reduced', () => {
      const subject = { CN: 'self-signed.example.com', O: 'Self' };
      const grade = calcGrade('TLSv1.3', mockCert({ subject, issuer: subject }));
      expect(grade).toBeCloseTo(0.65, 2);
    });

    it('wildcard cert → grade reduced', () => {
      const grade = calcGrade('TLSv1.3', mockCert({
        subject: { CN: '*.example.com', O: 'Test Corp' },
        subjectaltname: 'DNS:*.example.com',
      }));
      expect(grade).toBeCloseTo(0.85, 2);
    });

    it('expiring in < 30 days → grade reduced', () => {
      const grade = calcGrade('TLSv1.3', mockCert({
        valid_to: new Date(NOW + 15 * DAY_MS).toISOString(),
      }));
      expect(grade).toBeCloseTo(0.75, 2);
    });

    it('expiring in 30-90 days → grade moderately reduced', () => {
      const grade = calcGrade('TLSv1.3', mockCert({
        valid_to: new Date(NOW + 60 * DAY_MS).toISOString(),
      }));
      expect(grade).toBeCloseTo(0.9, 2);
    });
  });
});

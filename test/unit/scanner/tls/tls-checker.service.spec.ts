import { TlsCheckerService } from '../../../../src/scanner/tls/tls-checker.service';

jest.mock('tls', () => ({
  connect: jest.fn(),
}));

import * as tls from 'tls';

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

interface MockSocket {
  on: jest.Mock;
  destroy: jest.Mock;
  end: jest.Mock;
  getProtocol: jest.Mock;
  getPeerCertificate: jest.Mock;
}

function setupMockSocket(protocol: string | null, cert: Record<string, unknown>) {
  const handlers: Record<string, (...args: unknown[]) => void> = {};
  const socket: MockSocket = {
    on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers[event] = handler;
      return socket;
    }) as unknown as jest.Mock,
    destroy: jest.fn(),
    end: jest.fn(),
    getProtocol: jest.fn().mockReturnValue(protocol),
    getPeerCertificate: jest.fn().mockReturnValue(cert),
  };
  (tls.connect as jest.Mock).mockReturnValue(socket);
  return { handlers, socket };
}

describe('TlsCheckerService', () => {
  let service: TlsCheckerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TlsCheckerService();
  });

  describe('calculateTlsGrade', () => {
    it('TLSv1.3 + valid cert → grade 1.0', async () => {
      const { handlers } = setupMockSocket('TLSv1.3', mockCert());

      const result = await actAndResolve(service, handlers);

      expect(result.grade).toBe(1.0);
      expect(result.error).toBeNull();
    });

    it('TLSv1.2 + valid cert → grade 0.9', async () => {
      const { handlers } = setupMockSocket('TLSv1.2', mockCert());

      const result = await actAndResolve(service, handlers);

      expect(result.grade).toBeCloseTo(0.9, 2);
    });

    it('TLSv1.1 + valid cert → grade 0.65', async () => {
      const { handlers } = setupMockSocket('TLSv1.1', mockCert());

      const result = await actAndResolve(service, handlers);

      expect(result.grade).toBeCloseTo(0.65, 2);
    });

    it('TLSv1 + expired cert → grade 0', async () => {
      const { handlers } = setupMockSocket('TLSv1', mockCert({
        valid_to: new Date(NOW - 1 * DAY_MS).toISOString(),
      }));

      const result = await actAndResolve(service, handlers);

      expect(result.grade).toBe(0);
    });

    it('null protocol + expired cert → grade 0', async () => {
      const { handlers } = setupMockSocket(null, mockCert({
        valid_to: new Date(NOW - 1 * DAY_MS).toISOString(),
      }));

      const result = await actAndResolve(service, handlers);

      expect(result.grade).toBe(0);
    });

    it('self-signed cert → grade reduced', async () => {
      const subject = { CN: 'self-signed.example.com', O: 'Self' };
      const { handlers } = setupMockSocket('TLSv1.3', mockCert({
        subject,
        issuer: subject,
      }));

      const result = await actAndResolve(service, handlers);

      expect(result.grade).toBeCloseTo(0.65, 2);
      expect(result.certificate?.selfSigned).toBe(true);
    });

    it('wildcard cert → grade reduced', async () => {
      const { handlers } = setupMockSocket('TLSv1.3', mockCert({
        subject: { CN: '*.example.com', O: 'Test Corp' },
        subjectaltname: 'DNS:*.example.com',
      }));

      const result = await actAndResolve(service, handlers);

      expect(result.grade).toBeCloseTo(0.85, 2);
      expect(result.certificate?.wildcard).toBe(true);
    });

    it('expiring in < 30 days → grade reduced', async () => {
      const { handlers } = setupMockSocket('TLSv1.3', mockCert({
        valid_to: new Date(NOW + 15 * DAY_MS).toISOString(),
      }));

      const result = await actAndResolve(service, handlers);

      expect(result.grade).toBeCloseTo(0.75, 2);
      expect(result.certificate?.expiresInDays).toBeLessThan(30);
    });

    it('expiring in 30-90 days → grade moderately reduced', async () => {
      const { handlers } = setupMockSocket('TLSv1.3', mockCert({
        valid_to: new Date(NOW + 60 * DAY_MS).toISOString(),
      }));

      const result = await actAndResolve(service, handlers);

      expect(result.grade).toBeCloseTo(0.9, 2);
      expect(result.certificate?.expiresInDays).toBeGreaterThanOrEqual(30);
      expect(result.certificate?.expiresInDays).toBeLessThan(90);
    });
  });

  describe('error handling', () => {
    it('returns error object when connection fails', async () => {
      const { handlers } = setupMockSocket(null, {});

      const resultPromise = service.check('example.com');
      handlers['error'](new Error('Socket timed out'));

      const result = await resultPromise;
      expect(result.error).toBe('Socket timed out');
      expect(result.grade).toBe(0);
      expect(result.tlsVersion).toBeNull();
      expect(result.certificate).toBeNull();
    });

    it('includes error message and grade 0', async () => {
      const { handlers } = setupMockSocket(null, {});

      const resultPromise = service.check('example.com');
      handlers['error'](new Error('Custom error message'));

      const result = await resultPromise;
      expect(result.error).toBe('Custom error message');
      expect(result.grade).toBe(0);
    });

    it('handles ECONNREFUSED error', async () => {
      const { handlers } = setupMockSocket(null, {});

      const err = new Error('connect ECONNREFUSED') as NodeJS.ErrnoException;
      err.code = 'ECONNREFUSED';

      const resultPromise = service.check('example.com');
      handlers['error'](err);

      const result = await resultPromise;
      expect(result.error).toBe('Connection refused on port 443');
      expect(result.grade).toBe(0);
    });

    it('handles ENOTFOUND error', async () => {
      const { handlers } = setupMockSocket(null, {});

      const err = new Error('getaddrinfo ENOTFOUND') as NodeJS.ErrnoException;
      err.code = 'ENOTFOUND';

      const resultPromise = service.check('example.com');
      handlers['error'](err);

      const result = await resultPromise;
      expect(result.error).toBe('Could not resolve hostname: example.com');
      expect(result.grade).toBe(0);
    });
  });
});

async function actAndResolve(
  service: TlsCheckerService,
  handlers: Record<string, (...args: unknown[]) => void>,
) {
  const resultPromise = service.check('example.com');
  handlers['secureConnect']();
  return resultPromise;
}

import { DnsCheckerService } from '../../../../src/scanner/dns/dns-checker.service';

jest.mock('dns/promises', () => ({
  resolveTxt: jest.fn(),
}));

import { resolveTxt as mockResolveTxt } from 'dns/promises';

describe('DnsCheckerService', () => {
  let service: DnsCheckerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DnsCheckerService();
  });

  describe('SPF', () => {
    it('returns grade 0 when no SPF record found', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === 'example.com') return Promise.resolve([]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.spf.grade).toBe(0);
      expect(result.spf.present).toBe(false);
      expect(result.spf.finding).toContain('not found');
    });

    it('detects hard fail (-all) with include → grade 1.0', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === 'example.com') return Promise.resolve([['v=spf1 include:_spf.google.com -all']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.spf.grade).toBe(1.0);
      expect(result.spf.present).toBe(true);
    });

    it('detects hard fail (-all) without include → grade 0.6', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === 'example.com') return Promise.resolve([['v=spf1 -all']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.spf.grade).toBe(0.6);
    });

    it('detects soft fail (~all) → grade 0.7', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === 'example.com') return Promise.resolve([['v=spf1 include:_spf.google.com ~all']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.spf.grade).toBe(0.7);
    });

    it('detects neutral (?all) → grade 0.2', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === 'example.com') return Promise.resolve([['v=spf1 ?all']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.spf.grade).toBe(0.2);
    });

    it('detects pass (+all) → grade 0.2', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === 'example.com') return Promise.resolve([['v=spf1 +all']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.spf.grade).toBe(0.2);
    });
  });

  describe('DKIM', () => {
    it('returns grade 0 when no DKIM record found (all selectors fail)', async () => {
      (mockResolveTxt as jest.Mock).mockRejectedValue(new Error('NXDOMAIN'));

      const result = await service.check('example.com');
      expect(result.dkim.grade).toBe(0);
      expect(result.dkim.present).toBe(false);
      expect(result.dkim.finding).toContain('not found');
    });

    it('returns grade 1.0 when DKIM record has valid p= key', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === 'default._domainkey.example.com') return Promise.resolve([['v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.dkim.grade).toBe(1.0);
      expect(result.dkim.present).toBe(true);
    });

    it('returns grade 0.5 when DKIM record present but missing p= key', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === 'google._domainkey.example.com') return Promise.resolve([['v=DKIM1; k=rsa;']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.dkim.grade).toBe(0.5);
      expect(result.dkim.present).toBe(true);
      expect(result.dkim.finding).toContain('missing');
    });

    it('truncates value to 200 chars if longer', async () => {
      const longKey = 'v=DKIM1; k=rsa; p=' + 'A'.repeat(300);
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === 'selector1._domainkey.example.com') return Promise.resolve([[longKey]]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.dkim.value.length).toBe(203);
      expect(result.dkim.value.endsWith('...')).toBe(true);
      expect(result.dkim.value).toBe(longKey.substring(0, 200) + '...');
    });
  });

  describe('DMARC', () => {
    it('returns grade 0 when no DMARC record', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === '_dmarc.example.com') return Promise.resolve([]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.dmarc.grade).toBe(0);
      expect(result.dmarc.present).toBe(false);
    });

    it('p=reject with rua → grade 1.0', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === '_dmarc.example.com') return Promise.resolve([['v=DMARC1; p=reject; rua=mailto:dmarc@example.com']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.dmarc.grade).toBe(1.0);
      expect(result.dmarc.present).toBe(true);
    });

    it('p=reject without rua → grade 0.9', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === '_dmarc.example.com') return Promise.resolve([['v=DMARC1; p=reject']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.dmarc.grade).toBe(0.9);
    });

    it('p=quarantine with rua → grade 0.8', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === '_dmarc.example.com') return Promise.resolve([['v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.dmarc.grade).toBe(0.8);
    });

    it('p=quarantine without rua → grade 0.7', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === '_dmarc.example.com') return Promise.resolve([['v=DMARC1; p=quarantine']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.dmarc.grade).toBe(0.7);
    });

    it('p=none → grade 0.3', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === '_dmarc.example.com') return Promise.resolve([['v=DMARC1; p=none']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.dmarc.grade).toBe(0.3);
    });

    it('pct < 100 → grade capped at 0.7', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === '_dmarc.example.com') return Promise.resolve([['v=DMARC1; p=reject; rua=mailto:dmarc@example.com; pct=50']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.dmarc.grade).toBe(0.7);
      expect(result.dmarc.finding).toContain('50%');
    });

    it('missing policy (p=) → grade 0.1', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === '_dmarc.example.com') return Promise.resolve([['v=DMARC1; rua=mailto:dmarc@example.com']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.dmarc.grade).toBe(0.1);
    });
  });

  describe('Overall', () => {
    it('combines 3 records into average grade', async () => {
      (mockResolveTxt as jest.Mock).mockImplementation((domain: string) => {
        if (domain === 'example.com') return Promise.resolve([['v=spf1 include:_spf.google.com -all']]);
        if (domain === 'default._domainkey.example.com') return Promise.resolve([['v=DKIM1; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC']]);
        if (domain === '_dmarc.example.com') return Promise.resolve([['v=DMARC1; p=reject; rua=mailto:dmarc@example.com']]);
        return Promise.reject(new Error('NXDOMAIN'));
      });

      const result = await service.check('example.com');
      expect(result.grade).toBe(1.0);
      expect(result.spf.grade).toBe(1.0);
      expect(result.dkim.grade).toBe(1.0);
      expect(result.dmarc.grade).toBe(1.0);
      expect(result.error).toBeNull();
    });

    it('DNS failure returns grade 0 for all records', async () => {
      (mockResolveTxt as jest.Mock).mockRejectedValue(new Error('DNS resolution failed'));

      const result = await service.check('example.com');
      expect(result.grade).toBe(0);
      expect(result.spf.grade).toBe(0);
      expect(result.dkim.grade).toBe(0);
      expect(result.dmarc.grade).toBe(0);
    });
  });
});

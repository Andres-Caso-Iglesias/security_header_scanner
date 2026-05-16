import { isPrivateIp, isBlockedHostname, resolveAndCheckHostname } from '../../../../src/common/guards/ssrf.guard';

describe('SSRF Guard - isPrivateIp', () => {
  describe('IPv4 private ranges', () => {
    it('blocks 10.0.0.0/8 range', () => {
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('10.255.255.255')).toBe(true);
    });

    it('blocks 172.16.0.0/12 range', () => {
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('172.31.255.255')).toBe(true);
      expect(isPrivateIp('172.15.0.1')).toBe(false);
      expect(isPrivateIp('172.32.0.1')).toBe(false);
    });

    it('blocks 192.168.0.0/16 range', () => {
      expect(isPrivateIp('192.168.0.1')).toBe(true);
      expect(isPrivateIp('192.168.255.255')).toBe(true);
    });

    it('blocks 127.0.0.0/8 loopback range', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('127.0.0.255')).toBe(true);
    });

    it('blocks 169.254.0.0/16 link-local range', () => {
      expect(isPrivateIp('169.254.169.254')).toBe(true);
      expect(isPrivateIp('169.254.0.1')).toBe(true);
    });

    it('blocks 0.0.0.0/8 range', () => {
      expect(isPrivateIp('0.0.0.0')).toBe(true);
      expect(isPrivateIp('0.0.0.1')).toBe(true);
    });
  });

  describe('IPv6 private ranges', () => {
    it('blocks ::1 loopback', () => {
      expect(isPrivateIp('::1')).toBe(true);
      expect(isPrivateIp('0:0:0:0:0:0:0:1')).toBe(true);
    });

    it('blocks :: unspecified', () => {
      expect(isPrivateIp('::')).toBe(true);
    });

    it('blocks fc00::/7 unique local', () => {
      expect(isPrivateIp('fc00::1')).toBe(true);
      expect(isPrivateIp('fd00::1')).toBe(true);
    });

    it('blocks fe80::/10 link-local', () => {
      expect(isPrivateIp('fe80::1')).toBe(true);
    });
  });

  describe('public IPs', () => {
    it('allows public IPv4 addresses', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('1.1.1.1')).toBe(false);
      expect(isPrivateIp('203.0.113.1')).toBe(false);
    });

    it('allows public IPv6 addresses', () => {
      expect(isPrivateIp('2001:db8::1')).toBe(false);
      expect(isPrivateIp('2607:f8b0:4004:800::200e')).toBe(false);
    });
  });

  describe('invalid inputs', () => {
    it('returns false for non-IP strings', () => {
      expect(isPrivateIp('example.com')).toBe(false);
      expect(isPrivateIp('not-an-ip')).toBe(false);
      expect(isPrivateIp('')).toBe(false);
    });
  });
});

describe('SSRF Guard - isBlockedHostname', () => {
  it('blocks localhost variants', () => {
    expect(isBlockedHostname('localhost')).toBe(true);
    expect(isBlockedHostname('LOCALHOST')).toBe(true);
    expect(isBlockedHostname('localhost.localdomain')).toBe(true);
  });

  it('blocks IPv6 loopback variants', () => {
    expect(isBlockedHostname('[::1]')).toBe(true);
    expect(isBlockedHostname('::1')).toBe(true);
    expect(isBlockedHostname('::')).toBe(true);
    expect(isBlockedHostname('0:0:0:0:0:0:0:1')).toBe(true);
  });

  it('blocks 0.0.0.0', () => {
    expect(isBlockedHostname('0.0.0.0')).toBe(true);
  });

  it('allows normal hostnames', () => {
    expect(isBlockedHostname('example.com')).toBe(false);
    expect(isBlockedHostname('google.com')).toBe(false);
    expect(isBlockedHostname('api.github.com')).toBe(false);
  });
});

describe('SSRF Guard - resolveAndCheckHostname', () => {
  describe('with direct IP addresses', () => {
    it('rejects private IPv4 addresses', async () => {
      await expect(resolveAndCheckHostname('192.168.1.1')).rejects.toThrow('private IP');
    });

    it('rejects private IPv6 addresses', async () => {
      await expect(resolveAndCheckHostname('::1')).rejects.toThrow('not allowed');
    });

    it('allows public IPv4 addresses', async () => {
      const result = await resolveAndCheckHostname('8.8.8.8');
      expect(result).toBe('8.8.8.8');
    });
  });

  describe('with blocked hostnames', () => {
    it('rejects localhost', async () => {
      await expect(resolveAndCheckHostname('localhost')).rejects.toThrow('not allowed');
    });

    it('rejects 0.0.0.0', async () => {
      await expect(resolveAndCheckHostname('0.0.0.0')).rejects.toThrow('not allowed');
    });
  });

  describe('with real hostnames', () => {
    it('resolves and allows public hostnames', async () => {
      const result = await resolveAndCheckHostname('google.com');
      expect(result).toBeTruthy();
      expect(isPrivateIp(result)).toBe(false);
    });
  });
});

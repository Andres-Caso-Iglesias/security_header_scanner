import { BadRequestException } from '@nestjs/common';
import { UrlValidationPipe } from '../../../../src/common/pipes/url-validation.pipe';

describe('UrlValidationPipe with SSRF Protection', () => {
  let pipe: UrlValidationPipe;

  beforeEach(() => {
    pipe = new UrlValidationPipe();
  });

  describe('basic validation', () => {
    it('throws on empty value', () => {
      expect(() => pipe.transform('')).toThrow(BadRequestException);
    });

    it('throws on URLs exceeding max length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2048);
      expect(() => pipe.transform(longUrl)).toThrow(BadRequestException);
    });

    it('throws on invalid URL format', () => {
      expect(() => pipe.transform('not-a-url')).toThrow(BadRequestException);
    });

    it('throws on non-HTTP protocols', () => {
      expect(() => pipe.transform('ftp://example.com')).toThrow(BadRequestException);
      expect(() => pipe.transform('file:///etc/passwd')).toThrow(BadRequestException);
      expect(() => pipe.transform('gopher://example.com')).toThrow(BadRequestException);
    });

    it('allows valid HTTP URLs', () => {
      expect(pipe.transform('http://example.com')).toBe('http://example.com');
    });

    it('allows valid HTTPS URLs', () => {
      expect(pipe.transform('https://example.com/path?query=1')).toBe('https://example.com/path?query=1');
    });
  });

  describe('SSRF protection - blocked hostnames', () => {
    it('blocks localhost', () => {
      expect(() => pipe.transform('http://localhost')).toThrow(BadRequestException);
      expect(() => pipe.transform('http://localhost:8080')).toThrow(BadRequestException);
    });

    it('blocks localhost.localdomain', () => {
      expect(() => pipe.transform('http://localhost.localdomain')).toThrow(BadRequestException);
    });

    it('blocks 0.0.0.0', () => {
      expect(() => pipe.transform('http://0.0.0.0')).toThrow(BadRequestException);
      expect(() => pipe.transform('http://0.0.0.0:3000')).toThrow(BadRequestException);
    });

    it('blocks IPv6 loopback', () => {
      expect(() => pipe.transform('http://[::1]')).toThrow(BadRequestException);
      expect(() => pipe.transform('http://[::1]:8080')).toThrow(BadRequestException);
    });
  });

  describe('SSRF protection - private IPv4 ranges', () => {
    it('blocks 10.0.0.0/8 range', () => {
      expect(() => pipe.transform('http://10.0.0.1')).toThrow(BadRequestException);
      expect(() => pipe.transform('http://10.255.255.255/admin')).toThrow(BadRequestException);
    });

    it('blocks 172.16.0.0/12 range', () => {
      expect(() => pipe.transform('http://172.16.0.1')).toThrow(BadRequestException);
      expect(() => pipe.transform('http://172.31.255.255')).toThrow(BadRequestException);
    });

    it('blocks 192.168.0.0/16 range', () => {
      expect(() => pipe.transform('http://192.168.0.1')).toThrow(BadRequestException);
      expect(() => pipe.transform('http://192.168.1.100:8080/api')).toThrow(BadRequestException);
    });

    it('blocks 127.0.0.0/8 loopback range', () => {
      expect(() => pipe.transform('http://127.0.0.1')).toThrow(BadRequestException);
      expect(() => pipe.transform('http://127.0.0.1:3000')).toThrow(BadRequestException);
    });

    it('blocks 169.254.0.0/16 link-local (cloud metadata)', () => {
      expect(() => pipe.transform('http://169.254.169.254/latest/meta-data/')).toThrow(BadRequestException);
    });

    it('allows public IPs', () => {
      expect(pipe.transform('http://8.8.8.8')).toBe('http://8.8.8.8');
      expect(pipe.transform('http://1.1.1.1')).toBe('http://1.1.1.1');
    });
  });

  describe('hostname requirements', () => {
    it('blocks single-label hostnames', () => {
      expect(() => pipe.transform('http://internal')).toThrow(BadRequestException);
    });

    it('allows fully qualified domain names', () => {
      expect(pipe.transform('https://example.com')).toBe('https://example.com');
      expect(pipe.transform('https://api.github.com/v3')).toBe('https://api.github.com/v3');
    });
  });
});

import * as dns from 'dns/promises';
import * as net from 'net';

const PRIVATE_IPV4_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
  /^0\./,
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  '[::1]',
  '::1',
  '::',
  '0:0:0:0:0:0:0:1',
];

export function isPrivateIp(ip: string): boolean {
  if (!net.isIP(ip)) return false;

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return (
      normalized === '::1' ||
      normalized === '0:0:0:0:0:0:0:1' ||
      normalized === '::' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80')
    );
  }

  return PRIVATE_IPV4_RANGES.some((pattern) => pattern.test(ip));
}

export function isBlockedHostname(hostname: string): boolean {
  return BLOCKED_HOSTNAMES.includes(hostname.toLowerCase());
}

export async function resolveAndCheckHostname(hostname: string): Promise<string> {
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error(`Access to private IP address ${hostname} is not allowed`);
    }
    return hostname;
  }

  if (isBlockedHostname(hostname)) {
    throw new Error(`Access to ${hostname} is not allowed`);
  }

  try {
    const addresses = await dns.lookup(hostname, { all: true });
    const ips = addresses.map((a) => a.address);

    for (const ip of ips) {
      if (isPrivateIp(ip)) {
        throw new Error(
          `DNS resolution for ${hostname} returned private IP ${ip}. Access blocked to prevent SSRF.`,
        );
      }
    }

    return ips[0];
  } catch (error) {
    if ((error as Error).message.includes('private IP') || (error as Error).message.includes('not allowed')) {
      throw error;
    }
    throw new Error(`DNS resolution failed for ${hostname}: ${(error as Error).message}`);
  }
}

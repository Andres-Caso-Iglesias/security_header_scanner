import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns/promises';
import type { DnsInfo, DnsRecord } from '../../common/interfaces/dns-info.interface';
import { TIMEOUTS } from '../../common/constants/timeout.config';

@Injectable()
export class DnsCheckerService {
  private readonly logger = new Logger(DnsCheckerService.name);
  private readonly timeoutMs = TIMEOUTS.DNS;

  async check(hostname: string): Promise<DnsInfo> {
    try {
      const [spf, dkim, dmarc] = await Promise.all([
        this.checkSpf(hostname),
        this.checkDkim(hostname),
        this.checkDmarc(hostname),
      ]);

      const records = [spf, dkim, dmarc];
      const totalScore = records.reduce((sum, r) => sum + r.grade, 0);
      const grade = Math.round((totalScore / 3) * 100) / 100;

      return {
        hostname,
        checked: true,
        error: null,
        spf,
        dkim,
        dmarc,
        grade,
      };
    } catch (error) {
      this.logger.warn(`DNS check failed for ${hostname}: ${(error as Error).message}`);
      return {
        hostname,
        checked: true,
        error: (error as Error).message,
        spf: this.emptyRecord('SPF'),
        dkim: this.emptyRecord('DKIM'),
        dmarc: this.emptyRecord('DMARC'),
        grade: 0,
      };
    }
  }

  private async checkSpf(hostname: string): Promise<DnsRecord> {
    try {
      const records = await this.resolveTxtWithTimeout(hostname);
      const spfRecord = records.find((r) => r.startsWith('v=spf1'));

      if (!spfRecord) {
        return {
          type: 'SPF',
          value: '',
          present: false,
          grade: 0,
          finding: 'SPF record not found. Domain is vulnerable to email spoofing.',
          recommendation: 'Add an SPF record: v=spf1 include:_spf.google.com ~all (adjust for your mail provider)',
        };
      }

      const hasHardFail = /\s-all\b/.test(spfRecord);
      const hasSoftFail = /\s~all\b/.test(spfRecord);
      const hasInclude = /\sinclude:/.test(spfRecord);

      let grade = 0.3;
      let finding: string;
      let recommendation: string;

      if (hasHardFail) {
        grade = hasInclude ? 1.0 : 0.6;
        finding = hasInclude
          ? 'SPF record with hard fail (-all) and authorised senders configured'
          : 'SPF record with hard fail (-all) but no authorised senders listed';
        recommendation = hasInclude
          ? 'SPF is properly configured'
          : 'Add include: mechanisms for your authorised mail senders';
      } else if (hasSoftFail) {
        grade = 0.7;
        finding = 'SPF record with soft fail (~all) - monitoring mode, not enforcement';
        recommendation = 'Change ~all to -all for full SPF enforcement once you have validated all mail sources';
      } else if (/\s\?all\b/.test(spfRecord) || /\s\+all\b/.test(spfRecord)) {
        grade = 0.2;
        finding = 'SPF record with neutral (?all) or pass (+all) - no protection against spoofing';
        recommendation = 'Change to -all and add proper include: mechanisms for your mail providers';
      } else {
        grade = 0.4;
        finding = 'SPF record present but with unrecognised or no all mechanism';
        recommendation = 'Ensure SPF record ends with -all (hard fail) for proper enforcement';
      }

      return {
        type: 'SPF',
        value: spfRecord,
        present: true,
        grade,
        finding,
        recommendation,
      };
    } catch (error) {
      return {
        type: 'SPF',
        value: '',
        present: false,
        grade: 0,
        finding: `Could not resolve SPF record: ${(error as Error).message}`,
        recommendation: 'Verify DNS resolution for your domain',
      };
    }
  }

  private async checkDkim(hostname: string): Promise<DnsRecord> {
    const selectors = ['default', 'google', 'selector1', 'selector2', 'dkim', 'mail'];
    const results: Array<{ selector: string; value: string }> = [];

    try {
      for (const selector of selectors) {
        try {
          const dkimDomain = `${selector}._domainkey.${hostname}`;
          const records = await this.resolveTxtWithTimeout(dkimDomain);
          const dkimRecord = records.find((r) => r.startsWith('v=DKIM1') || r.includes('k=rsa') || r.includes('p='));
          if (dkimRecord) {
            results.push({ selector, value: dkimRecord });
            break;
          }
        } catch {
          continue;
        }
      }

      if (results.length === 0) {
        return {
          type: 'DKIM',
          value: '',
          present: false,
          grade: 0,
          finding: 'DKIM record not found for common selectors (default, google, selector1, selector2, dkim, mail). Email may be flagged as spam.',
          recommendation: 'Configure DKIM signing for your domain and publish the public key at {selector}._domainkey.yourdomain.com',
        };
      }

      const record = results[0];
      const hasValidKey = /p=/.test(record.value);
      const grade = hasValidKey ? 1.0 : 0.5;

      return {
        type: 'DKIM',
        value: record.value.length > 200 ? record.value.substring(0, 200) + '...' : record.value,
        present: true,
        grade,
        finding: hasValidKey
          ? `DKIM record found (selector: ${record.selector}) with public key configured`
          : `DKIM record found (selector: ${record.selector}) but public key appears missing`,
        recommendation: hasValidKey
          ? 'DKIM is properly configured'
          : 'Ensure the DKIM record includes a valid public key (p=)',
      };
    } catch (error) {
      return {
        type: 'DKIM',
        value: '',
        present: false,
        grade: 0,
        finding: `Could not resolve DKIM record: ${(error as Error).message}`,
        recommendation: 'Verify DNS resolution and configure DKIM signing',
      };
    }
  }

  private async checkDmarc(hostname: string): Promise<DnsRecord> {
    try {
      const dmarcDomain = `_dmarc.${hostname}`;
      const records = await this.resolveTxtWithTimeout(dmarcDomain);
      const dmarcRecord = records.find((r) => r.startsWith('v=DMARC1'));

      if (!dmarcRecord) {
        return {
          type: 'DMARC',
          value: '',
          present: false,
          grade: 0,
          finding: 'DMARC record not found. Domain is vulnerable to email spoofing and phishing.',
          recommendation: 'Add a DMARC record: v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com. Start with p=quarantine if needed.',
        };
      }

      const policy = dmarcRecord.match(/p=(none|quarantine|reject)/i);
      const hasRua = /\brua=mailto:/.test(dmarcRecord);
      const pct = dmarcRecord.match(/pct=(\d+)/);

      let grade: number;
      let finding: string;
      let recommendation: string;

      if (!policy) {
        grade = 0.1;
        finding = 'DMARC record present but missing policy (p=)';
        recommendation = 'Add a policy: p=quarantine or p=reject';
      } else {
        const policyValue = policy[1].toLowerCase();

        switch (policyValue) {
          case 'reject':
            grade = hasRua ? 1.0 : 0.9;
            finding = hasRua
              ? 'DMARC with p=reject and reporting (rua) - best protection against email spoofing'
              : 'DMARC with p=reject - strong protection, consider adding rua for reporting';
            recommendation = hasRua
              ? 'DMARC is properly configured'
              : 'Add rua=mailto:dmarc@yourdomain.com for aggregate reports';
            break;
          case 'quarantine':
            grade = hasRua ? 0.8 : 0.7;
            finding = hasRua
              ? 'DMARC with p=quarantine and reporting - good protection'
              : 'DMARC with p=quarantine - consider upgrading to p=reject';
            recommendation = hasRua
              ? 'Consider upgrading to p=reject for full protection'
              : 'Add rua for reporting and consider p=reject';
            break;
          case 'none':
            grade = 0.3;
            finding = 'DMARC with p=none - monitoring only, no enforcement';
            recommendation = 'Upgrade to p=quarantine once you have reviewed the reports, then p=reject';
            break;
          default:
            grade = 0.2;
            finding = `DMARC with unrecognised policy: ${policyValue}`;
            recommendation = 'Use p=quarantine or p=reject';
        }

        if (pct && parseInt(pct[1], 10) < 100) {
          grade = Math.min(grade, 0.7);
          finding += ` (applied to ${pct[1]}% of emails)`;
        }
      }

      return {
        type: 'DMARC',
        value: dmarcRecord.length > 200 ? dmarcRecord.substring(0, 200) + '...' : dmarcRecord,
        present: true,
        grade,
        finding,
        recommendation,
      };
    } catch (error) {
      return {
        type: 'DMARC',
        value: '',
        present: false,
        grade: 0,
        finding: `Could not resolve DMARC record: ${(error as Error).message}`,
        recommendation: 'Verify DNS resolution and configure DMARC',
      };
    }
  }

  private async resolveTxtWithTimeout(domain: string): Promise<string[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const records = await dns.resolveTxt(domain);
      return records.map((r) => r.join(''));
    } finally {
      clearTimeout(timeout);
    }
  }

  private emptyRecord(type: string): DnsRecord {
    return {
      type,
      value: '',
      present: false,
      grade: 0,
      finding: 'DNS check failed',
      recommendation: 'Verify DNS configuration',
    };
  }
}

import { Injectable } from '@nestjs/common';
import type { ScanResult } from '../../common/interfaces/scan-result.interface';
import PDFDocument = require('pdfkit');

@Injectable()
export class ExportService {
  generateJson(result: ScanResult): string {
    return JSON.stringify(result, null, 2);
  }

  generatePdf(result: ScanResult): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: `Auditoria de Seguridad Web - ${result.url}`,
            Author: 'Auditoria Web Scanner',
            Subject: 'Reporte de Auditoria de Headers de Seguridad',
            Keywords: 'seguridad, auditoria, headers, OWASP, NIS2, TLS, DNS',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ================================================================
        // Color palette
        // ================================================================
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const black = '#000000';
        const darkGray = '#333333';
        const midGray = '#666666';
        const lightGray = '#999999';
        const borderColor = '#cccccc';
        const white = '#ffffff';
        const accentRed = '#b91c1c';
        const accentOrange = '#c2410c';
        const accentYellow = '#a16207';
        const accentGreen = '#15803d';
        const accentBlue = '#1e40af';
        const gradeColors: Record<string, string> = {
          A: '#15803d', B: '#4d7c0f', C: '#a16207', D: '#c2410c', E: '#b91c1c', F: '#991b1b',
        };
        const severityColors: Record<string, string> = {
          critical: '#b91c1c', high: '#c2410c', medium: '#a16207', low: '#15803d',
        };

        // ================================================================
        // Helpers
        // ================================================================
        function sectionTitle(title: string, y: number): number {
          doc.fontSize(13).fillColor(black).text(title, 50, y, { continued: false });
          doc.moveTo(50, y + 18).lineTo(50 + pageWidth, y + 18).strokeColor(borderColor).lineWidth(1).stroke();
          return y + 28;
        }

        function field(label: string, value: string, y: number, valColor?: string): number {
          doc.fontSize(8.5).fillColor(midGray).text(label, 50, y, { width: 120, continued: false });
          doc.fontSize(8.5).fillColor(valColor || black).text(value, 175, y, { width: pageWidth - 125, continued: false });
          return y + 13;
        }

        function drawCard(y: number, height: number): void {
          doc.roundedRect(50, y, pageWidth, height, 3).fillColor(white).fill().strokeColor(borderColor).lineWidth(0.5).stroke();
        }

        function cardWithLeftBar(y: number, height: number, barColor: string): void {
          doc.roundedRect(50, y, pageWidth, height, 3).fillColor(white).fill().strokeColor(borderColor).lineWidth(0.5).stroke();
          doc.roundedRect(50, y, 3, height, 1).fillColor(barColor).fill();
        }

        function needsPage(y: number, needed: number): boolean {
          return y + needed > doc.page.height - 60;
        }

        function checkPage(y: number, needed: number): number {
          if (needsPage(y, needed)) { doc.addPage(); return 50; }
          return y;
        }

        // ================================================================
        // PAGE 1: SUMMARY
        // ================================================================

        // -- Header --
        doc.fontSize(20).fillColor(black).text('Auditoria de Seguridad Web', 50, 50, { align: 'center' });
        doc.moveTo(50, 78).lineTo(50 + pageWidth, 78).strokeColor(borderColor).lineWidth(2).stroke();
        doc.fontSize(8).fillColor(midGray).text('Reporte Tecnico de Auditoria', 50, 88, { align: 'center' });

        // -- Metadata --
        let y = 110;
        const infoItems = [
          ['URL', result.url],
          ['Fecha', new Date(result.timestamp).toLocaleString('es-ES')],
          ['Duracion', `${result.metadata.responseTime}ms`],
          ['Status HTTP', `${result.metadata.statusCode}`],
        ];
        infoItems.forEach(([label, value], i) => {
          doc.fontSize(8).fillColor(midGray).text(label as string, 50, y + i * 13, { width: 65 });
          doc.fontSize(8).fillColor(black).text(value as string, 115, y + i * 13, { width: pageWidth - 70 });
        });
        y += infoItems.length * 13 + 10;

        // -- Score --
        const scoreColor = gradeColors[result.grade] || black;
        drawCard(y, 55);
        doc.fontSize(28).fillColor(scoreColor).text(result.grade, 62, y + 10, { width: 45, align: 'center' });
        doc.fontSize(18).fillColor(black).text(`${result.score}/100`, 110, y + 12, { width: 70 });
        doc.fontSize(7.5).fillColor(midGray).text('Puntuacion total', 110, y + 34, { width: 70 });

        const gradeDesc: Record<string, string> = {
          A: 'Excelente. La mayoria de headers de seguridad estan presentes y correctamente configurados.',
          B: 'Buena. Algunos headers menores necesitan ajuste.',
          C: 'Aceptable. Varios headers importantes necesitan configuracion.',
          D: 'Deficiente. Faltan headers de seguridad criticos o estan mal configurados.',
          E: 'Mala. La mayoria de headers de seguridad estan ausentes.',
          F: 'Critica. El sitio carece de protecciones esenciales.',
        };
        doc.fontSize(7.5).fillColor(darkGray).text(gradeDesc[result.grade] || '', 195, y + 10, { width: pageWidth - 155 });
        y += 65;

        // -- TLS Summary --
        if (result.tls && result.tls.checked) {
          y = checkPage(y, 190);
          y = sectionTitle('TLS / SSL', y);
          if (result.tls.error) {
            drawCard(y, 16);
            doc.fontSize(7.5).fillColor(accentRed).text(`Error: ${result.tls.error}`, 62, y + 4, { width: pageWidth - 24 });
            y += 24;
          } else {
            drawCard(y, result.tls.certificate ? 170 : 50);
            let ty = y + 8;
            ty = field('Version', result.tls.tlsVersion || 'N/A', ty);
            ty = field('Grade', `${Math.round(result.tls.grade * 100)}%`, ty);
            if (result.tls.certificate) {
              const c = result.tls.certificate;
              doc.moveTo(62, ty + 2).lineTo(50 + pageWidth - 12, ty + 2).strokeColor(borderColor).lineWidth(0.5).stroke();
              ty += 9;
              ty = field('Emisor', c.issuer, ty);
              const expiryCol = c.expired ? accentRed : c.expiresInDays < 30 ? accentOrange : black;
              ty = field('Valido hasta', `${c.validTo}${c.expired ? ' (EXPIRADO)' : ` (${c.expiresInDays} dias)`}`, ty, expiryCol);
              ty = field('Self-signed', c.selfSigned ? 'Si' : 'No', ty);
            }
            y += (result.tls.certificate ? 180 : 55);
          }
        }

        // -- DNS Summary --
        if (result.dns && result.dns.checked) {
          y = checkPage(y, 180);
          y = sectionTitle('DNS / Email Security', y);
          if (result.dns.error) {
            drawCard(y, 16);
            doc.fontSize(7.5).fillColor(accentRed).text(`Error: ${result.dns.error}`, 62, y + 4, { width: pageWidth - 24 });
            y += 24;
          } else {
            const dnsRecords = [result.dns.spf, result.dns.dkim, result.dns.dmarc];
            const cardH = 52;
            const totalH = dnsRecords.length * (cardH + 4) + 5;

            drawCard(y, totalH);
            let dy = y + 6;

            for (const rec of dnsRecords) {
              const recColor = rec.grade >= 1 ? accentGreen : rec.grade >= 0.5 ? accentYellow : accentRed;
              doc.roundedRect(62, dy, 3, cardH - 8, 1).fillColor(recColor).fill();
              doc.fontSize(8.5).fillColor(black).text(rec.type, 74, dy + 2, { width: 40 });
              doc.fontSize(7).fillColor(recColor).text(rec.present ? `Grado ${Math.round(rec.grade * 100)}%` : 'AUSENTE', 115, dy + 3, { width: pageWidth - 130 });
              doc.fontSize(6.5).fillColor(darkGray).text(rec.finding.length > 90 ? rec.finding.substring(0, 90) + '...' : rec.finding, 74, dy + 16, { width: pageWidth - 36 });
              dy += cardH;
            }
            y += totalH + 10;
          }
        }

        // ================================================================
        // PAGE 2+: DETAILED SECTIONS
        // ================================================================

        doc.addPage();
        y = 50;

        // -- Headers --
        y = sectionTitle('Headers de Seguridad', y);
        for (const h of result.headers) {
          const cardH = h.recommendation && h.grade < 1.0 ? 60 : 46;
          y = checkPage(y, cardH + 6);

          const sevColor = severityColors[h.severity] || midGray;
          cardWithLeftBar(y, cardH, sevColor);

          doc.fontSize(8.5).fillColor(black).text(h.header, 62, y + 5, { width: pageWidth - 140 });
          doc.fontSize(7).fillColor(sevColor).text(h.severity.toUpperCase(), 62, y + 18, { width: 40 });
          doc.fontSize(7).fillColor(midGray).text(`Grado: ${Math.round(h.grade * 100)}%  Peso: ${h.weight}`, 110, y + 18, { width: pageWidth - 160 });

          const gradeTxt = h.grade === 1 ? 'OK' : h.grade > 0.5 ? 'Regular' : h.grade > 0 ? 'Bajo' : 'AUSENTE';
          const gColor = h.grade === 1 ? accentGreen : h.grade > 0.5 ? accentYellow : accentRed;
          doc.fontSize(8).fillColor(gColor).text(gradeTxt, 50 + pageWidth - 55, y + 5, { width: 50, align: 'right' });

          doc.fontSize(7).fillColor(darkGray).text(h.finding, 62, y + 28, { width: pageWidth - 24 });
          if (h.recommendation && h.grade < 1.0) {
            doc.fontSize(6.5).fillColor(midGray).text(`Rec: ${h.recommendation}`, 62, y + 42, { width: pageWidth - 24 });
          }
          y += cardH + 4;
        }

        // -- Compliance --
        y = checkPage(y, 60);
        y += 5;
        y = sectionTitle('Cumplimiento Normativo', y);

        for (const comp of result.compliance) {
          y = checkPage(y, 30 + comp.findings.length * 40);
          doc.fontSize(10).fillColor(accentBlue).text(`${comp.framework} v${comp.version}`, 50, y);
          y += 16;

          for (const f of comp.findings) {
            y = checkPage(y, 40);
            const compColor = f.status === 'compliant' ? accentGreen
              : f.status === 'partially_compliant' ? accentYellow
              : f.status === 'non_compliant' ? accentRed : midGray;

            cardWithLeftBar(y, 34, compColor);
            doc.fontSize(8).fillColor(black).text(f.control, 62, y + 4, { width: pageWidth - 130 });
            doc.fontSize(7).fillColor(compColor).text(
              f.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              50 + pageWidth - 70, y + 4, { width: 65, align: 'right' }
            );
            doc.fontSize(7).fillColor(darkGray).text(f.description, 62, y + 17, { width: pageWidth - 24 });
            y += 40;
          }
          y += 4;
        }

        // -- Recommendations --
        if (result.recommendations.length > 0) {
          y = checkPage(y, 40);
          y += 5;
          y = sectionTitle('Recomendaciones', y);

          for (const rec of result.recommendations) {
            y = checkPage(y, 22);
            const recColor = rec.startsWith('[CRITICAL]') ? accentRed
              : rec.startsWith('[HIGH]') ? accentOrange
              : rec.startsWith('[MEDIUM]') ? accentYellow : midGray;

            cardWithLeftBar(y, 18, recColor);
            doc.fontSize(7.5).fillColor(black).text(rec, 62, y + 5, { width: pageWidth - 24 });
            y += 22;
          }
        }

        // -- Footer (justo debajo del ultimo contenido) --
        const footerText = `Generado el ${new Date().toLocaleString('es-ES')} por Auditoria Web Scanner v1.0`;
        const fy = doc.y + 15;
        doc.moveTo(50, fy).lineTo(50 + pageWidth, fy).strokeColor(borderColor).lineWidth(0.5).stroke();
        doc.fontSize(7).fillColor(lightGray).text(footerText, 50, fy + 4, { width: pageWidth, align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

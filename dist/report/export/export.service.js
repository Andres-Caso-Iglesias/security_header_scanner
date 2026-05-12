"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const PDFDocument = require("pdfkit");
let ExportService = class ExportService {
    generateJson(result) {
        return JSON.stringify(result, null, 2);
    }
    generatePdf(result) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: { top: 50, bottom: 50, left: 50, right: 50 },
                    info: {
                        Title: `Auditoria de Seguridad Web - ${result.url}`,
                        Author: 'Auditoria Web Scanner',
                        Subject: 'Reporte de Auditoria de Headers de Seguridad',
                        Keywords: 'seguridad, auditoria, headers, OWASP, NIS2, TLS',
                    },
                });
                const chunks = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
                const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
                const black = '#000000';
                const darkGray = '#333333';
                const midGray = '#666666';
                const lightGray = '#999999';
                const borderColor = '#cccccc';
                const headerBg = '#f2f2f2';
                const white = '#ffffff';
                const accentRed = '#b91c1c';
                const accentOrange = '#c2410c';
                const accentYellow = '#a16207';
                const accentGreen = '#15803d';
                const accentBlue = '#1e40af';
                const gradeColors = {
                    A: '#15803d', B: '#4d7c0f', C: '#a16207', D: '#c2410c', E: '#b91c1c', F: '#991b1b',
                };
                const severityColors = {
                    critical: '#b91c1c', high: '#c2410c', medium: '#a16207', low: '#15803d',
                };
                function sectionTitle(title, y) {
                    doc.fontSize(14).fillColor(black).text(title, 50, y, { continued: false });
                    doc.moveTo(50, y + 20).lineTo(50 + pageWidth, y + 20).strokeColor(borderColor).lineWidth(1).stroke();
                    return y + 30;
                }
                function field(label, value, y, valColor) {
                    doc.fontSize(8.5).fillColor(midGray).text(label, 50, y, { width: 120, continued: false });
                    doc.fontSize(8.5).fillColor(valColor || black).text(value, 175, y, { width: pageWidth - 125, continued: false });
                    return y + 13;
                }
                function horizontalLine(y, width) {
                    doc.moveTo(50, y).lineTo(50 + (width || pageWidth), y).strokeColor(borderColor).lineWidth(0.5).stroke();
                }
                function drawCard(y, height) {
                    doc.roundedRect(50, y, pageWidth, height, 3).fillColor(white).fill().strokeColor(borderColor).lineWidth(0.5).stroke();
                }
                function cardWithLeftBar(y, height, barColor) {
                    doc.roundedRect(50, y, pageWidth, height, 3).fillColor(white).fill().strokeColor(borderColor).lineWidth(0.5).stroke();
                    doc.roundedRect(50, y, 3, height, 1).fillColor(barColor).fill();
                }
                doc.fontSize(18).fillColor(black).text('Auditoria de Seguridad Web', 50, 50, { align: 'center' });
                horizontalLine(75);
                doc.fontSize(8).fillColor(midGray).text('Reporte Tecnico de Auditoria de Headers de Seguridad', 50, 82, { align: 'center' });
                let y = 100;
                drawCard(y, 75);
                doc.fontSize(8.5).fillColor(midGray).text('URL:', 62, y + 8, { width: 55 });
                doc.fontSize(8.5).fillColor(black).text(result.url, 117, y + 8, { width: pageWidth - 80 });
                doc.fontSize(8.5).fillColor(midGray).text('Fecha:', 62, y + 23, { width: 55 });
                doc.fontSize(8.5).fillColor(black).text(new Date(result.timestamp).toLocaleString('es-ES'), 117, y + 23, { width: pageWidth - 80 });
                doc.fontSize(8.5).fillColor(midGray).text('Duracion:', 62, y + 38, { width: 55 });
                doc.fontSize(8.5).fillColor(black).text(`${result.metadata.responseTime}ms`, 117, y + 38, { width: pageWidth - 80 });
                doc.fontSize(8.5).fillColor(midGray).text('Status HTTP:', 62, y + 53, { width: 55 });
                doc.fontSize(8.5).fillColor(black).text(`${result.metadata.statusCode}`, 117, y + 53, { width: pageWidth - 80 });
                y += 85;
                const scoreColor = gradeColors[result.grade] || black;
                drawCard(y, 60);
                doc.fontSize(30).fillColor(scoreColor).text(result.grade, 62, y + 12, { width: 50, align: 'center' });
                doc.fontSize(20).fillColor(black).text(`${result.score}/100`, 115, y + 14, { width: 80 });
                doc.fontSize(8).fillColor(midGray).text('Puntuacion total', 115, y + 38, { width: 80 });
                const gradeDescriptions = {
                    A: 'Excelente. La mayoria de headers de seguridad estan presentes y correctamente configurados.',
                    B: 'Buena. Algunos headers menores necesitan ajuste.',
                    C: 'Aceptable. Varios headers importantes necesitan configuracion.',
                    D: 'Deficiente. Faltan headers de seguridad criticos o estan mal configurados.',
                    E: 'Mala. La mayoria de headers de seguridad estan ausentes.',
                    F: 'Critica. El sitio carece de protecciones esenciales. Vulnerable a multiples ataques.',
                };
                doc.fontSize(8).fillColor(darkGray).text(gradeDescriptions[result.grade] || '', 200, y + 14, { width: pageWidth - 160 });
                y += 70;
                if (result.tls && result.tls.checked) {
                    y = sectionTitle('TLS / SSL', y);
                    if (result.tls.error) {
                        drawCard(y, 18);
                        doc.fontSize(8).fillColor(accentRed).text(`Error: ${result.tls.error}`, 62, y + 4, { width: pageWidth - 24 });
                        y += 28;
                    }
                    else {
                        const certHeight = result.tls.certificate ? 175 : 55;
                        if (y > doc.page.height - certHeight - 50) {
                            doc.addPage();
                            y = 50;
                        }
                        drawCard(y, certHeight);
                        let ty = y + 8;
                        ty = field('Version TLS', result.tls.tlsVersion || 'N/A', ty);
                        ty = field('Grade TLS', `${Math.round(result.tls.grade * 100)}%`, ty);
                        if (result.tls.certificate) {
                            const c = result.tls.certificate;
                            horizontalLine(ty + 3, pageWidth - 24);
                            ty += 10;
                            ty = field('Sujeto', c.subject, ty);
                            ty = field('Emisor', c.issuer, ty);
                            ty = field('Valido desde', c.validFrom, ty);
                            const expiryCol = c.expired ? accentRed : c.expiresInDays < 30 ? accentOrange : black;
                            ty = field('Valido hasta', `${c.validTo}${c.expired ? ' (EXPIRADO)' : ` (${c.expiresInDays} dias)`}`, ty, expiryCol);
                            ty = field('Self-signed', c.selfSigned ? 'Si' : 'No', ty);
                            ty = field('Wildcard', c.wildcard ? 'Si' : 'No', ty);
                            if (c.san.length > 0) {
                                ty = field('SAN', c.san.slice(0, 6).join(', ') + (c.san.length > 6 ? '...' : ''), ty);
                            }
                        }
                        y += certHeight + 10;
                    }
                }
                if (y > doc.page.height - 120) {
                    doc.addPage();
                    y = 50;
                }
                y = sectionTitle('Headers de Seguridad', y);
                for (const h of result.headers) {
                    if (y > doc.page.height - 85) {
                        doc.addPage();
                        y = 50;
                    }
                    const sevColor = severityColors[h.severity] || midGray;
                    const cardH = h.recommendation && h.grade < 1.0 ? 62 : 48;
                    cardWithLeftBar(y, cardH, sevColor);
                    doc.fontSize(9).fillColor(black).text(h.header, 62, y + 5, { width: pageWidth - 140 });
                    doc.fontSize(7).fillColor(sevColor).text(h.severity.toUpperCase(), 62, y + 18, { width: 40 });
                    doc.fontSize(7).fillColor(midGray).text(`Grado: ${Math.round(h.grade * 100)}%  Peso: ${h.weight}`, 110, y + 18, { width: pageWidth - 160 });
                    const gradeTxt = h.grade === 1 ? 'OK' : h.grade > 0.5 ? 'Regular' : h.grade > 0 ? 'Bajo' : 'AUSENTE';
                    const gColor = h.grade === 1 ? accentGreen : h.grade > 0.5 ? accentYellow : accentRed;
                    doc.fontSize(8).fillColor(gColor).text(gradeTxt, 50 + pageWidth - 55, y + 5, { width: 50, align: 'right' });
                    doc.fontSize(7).fillColor(darkGray).text(h.finding, 62, y + 30, { width: pageWidth - 24 });
                    if (h.recommendation && h.grade < 1.0) {
                        doc.fontSize(6.5).fillColor(midGray).text(`Recomendacion: ${h.recommendation}`, 62, y + 44, { width: pageWidth - 24 });
                    }
                    y += cardH + 4;
                }
                if (y > doc.page.height - 150) {
                    doc.addPage();
                    y = 50;
                }
                y += 5;
                y = sectionTitle('Cumplimiento Normativo', y);
                for (const comp of result.compliance) {
                    if (y > doc.page.height - 120) {
                        doc.addPage();
                        y = 50;
                    }
                    doc.fontSize(10).fillColor(accentBlue).text(`${comp.framework} v${comp.version}`, 50, y);
                    y += 16;
                    for (const f of comp.findings) {
                        if (y > doc.page.height - 60) {
                            doc.addPage();
                            y = 50;
                        }
                        const compColor = f.status === 'compliant' ? accentGreen
                            : f.status === 'partially_compliant' ? accentYellow
                                : f.status === 'non_compliant' ? accentRed : midGray;
                        cardWithLeftBar(y, 36, compColor);
                        doc.fontSize(8).fillColor(black).text(f.control, 62, y + 4, { width: pageWidth - 130 });
                        doc.fontSize(7).fillColor(compColor).text(f.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), 50 + pageWidth - 70, y + 4, { width: 65, align: 'right' });
                        doc.fontSize(7).fillColor(darkGray).text(f.description, 62, y + 18, { width: pageWidth - 24 });
                        y += 42;
                    }
                    y += 4;
                }
                if (result.recommendations.length > 0) {
                    if (y > doc.page.height - 120) {
                        doc.addPage();
                        y = 50;
                    }
                    y += 5;
                    y = sectionTitle('Recomendaciones', y);
                    for (const rec of result.recommendations) {
                        if (y > doc.page.height - 40) {
                            doc.addPage();
                            y = 50;
                        }
                        const recColor = rec.startsWith('[CRITICAL]') ? accentRed
                            : rec.startsWith('[HIGH]') ? accentOrange
                                : rec.startsWith('[MEDIUM]') ? accentYellow : midGray;
                        cardWithLeftBar(y, 18, recColor);
                        doc.fontSize(7.5).fillColor(black).text(rec, 62, y + 5, { width: pageWidth - 24 });
                        y += 22;
                    }
                }
                y = doc.page.height - 40;
                horizontalLine(y);
                doc.fontSize(7).fillColor(lightGray).text(`Generado el ${new Date().toLocaleString('es-ES')} por Auditoria Web Scanner v1.0`, 50, y + 5, { width: pageWidth, align: 'center' });
                doc.end();
            }
            catch (err) {
                reject(err);
            }
        });
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)()
], ExportService);
//# sourceMappingURL=export.service.js.map
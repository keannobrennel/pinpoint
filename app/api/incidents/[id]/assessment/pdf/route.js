// app/api/incidents/[id]/assessment/pdf/route.js
// Minimal server-generated PDF summary for the "Export to PDF" action on
// the Assessment Summary page. Uses the same buildReviewSections() as the
// Summary page and the wizard's Review step, so all three stay in sync —
// and correctly reflects Form A vs Form B based on the incident's phase.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getMockIncident, getMockAssessmentForm } from "@/lib/mock-incidents";
import { buildReviewSections } from "@/lib/assessment-review";

// Matches --pp-navy / --pp-muted / --pp-main from tokens.css
const NAVY = rgb(0x01 / 255, 0x27 / 255, 0x7c / 255);
const MUTED = rgb(0x7a / 255, 0x8a / 255, 0xab / 255);
const MAIN = rgb(0x25 / 255, 0x63 / 255, 0xeb / 255);

export async function GET(request, { params }) {
  const routeParams = await params;
  const incidentId = routeParams.id;

  const incident = getMockIncident(incidentId);
  const form = getMockAssessmentForm(incidentId);
  const sections = buildReviewSections(incident.phase, form);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageSize = [595, 842]; // A4
  const margin = 50;
  const contentWidth = pageSize[0] - margin * 2;
  const labelColX = margin + 160;

  let page = pdfDoc.addPage(pageSize);
  let y = pageSize[1] - margin;

  const ensureSpace = (needed) => {
    if (y - needed < margin) {
      page = pdfDoc.addPage(pageSize);
      y = pageSize[1] - margin;
    }
  };

  const drawTitle = (text) => {
    page.drawText(text, { x: margin, y, size: 20, font: fontBold, color: NAVY });
    y -= 22;
    page.drawText(`${incident.name} — Incident #${incident.incidentNumber}`, {
      x: margin,
      y,
      size: 11,
      font,
      color: MUTED,
    });
    y -= 26;
  };

  const drawSectionHeader = (text) => {
    ensureSpace(30);
    y -= 8;
    page.drawText(text.toUpperCase(), { x: margin, y, size: 11, font: fontBold, color: MAIN });
    y -= 6;
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + contentWidth, y },
      thickness: 0.5,
      color: rgb(0.85, 0.88, 0.93),
    });
    y -= 14;
  };

  const wrapText = (text, size) => {
    const words = String(text ?? "—").split(" ");
    let line = "";
    const lines = [];
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > contentWidth - 160) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  };

  const drawRow = (label, value) => {
    const lines = wrapText(value, 10);
    ensureSpace(lines.length * 14 + 4);
    page.drawText(label, { x: margin, y, size: 9.5, font, color: MUTED });
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: labelColX,
        y: y - i * 14,
        size: 10,
        font: fontBold,
        color: NAVY,
      });
    });
    y -= lines.length * 14 + 6;
  };

  drawTitle("Structural Assessment Report");

  sections.forEach((section) => {
    drawSectionHeader(section.title);
    section.rows.forEach((row) => drawRow(row.label, row.value));
  });

  const pdfBytes = await pdfDoc.save();

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="assessment-${incident.incidentNumber}.pdf"`,
    },
  });
}
import jsPDF from 'jspdf';
import type { ComiteRecord } from '../types/comiteSchema';
import { imageUrlToBase64 } from './imageUtils';
import actaBgUrl from '../assets/acta_bg.png';

// Cache del fondo
let cachedBgBase64: string | null = null;

async function getBackgroundBase64(): Promise<string> {
  if (cachedBgBase64) return cachedBgBase64;
  cachedBgBase64 = await imageUrlToBase64(actaBgUrl);
  return cachedBgBase64;
}

// ============================================
// COLORES EXACTOS del WORD original
// ============================================
const TEAL: [number, number, number] = [0, 94, 99];       // #005e63 - celdas label
const GUINDA: [number, number, number] = [106, 27, 82];   // #6a1b52 - secciones header
const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];

interface CellOpts {
  fill?: [number, number, number] | 'transparent';
  textColor?: [number, number, number];
  fontSize?: number;
  align?: 'center' | 'left' | 'right';
  bold?: boolean;
}

function drawCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  opts: CellOpts = {}
) {
  const {
    fill = 'transparent',
    textColor = BLACK,
    fontSize = 7,
    align = 'center',
    bold = false,
  } = opts;

  // Fondo (solo si NO es transparente)
  if (fill !== 'transparent') {
    doc.setFillColor(...fill);
    doc.rect(x, y, w, h, 'F');
  }

  // Borde negro fino (como el Word)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.48);
  doc.rect(x, y, w, h, 'S');

  if (!text) return;

  doc.setTextColor(...textColor);
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');

  const textX =
    align === 'center' ? x + w / 2 : align === 'left' ? x + 3 : x + w - 3;

  const lines = text.split('\n');
  if (lines.length > 1) {
    const lineH = fontSize + 1;
    const startY = y + h / 2 - ((lines.length - 1) * lineH) / 2 + fontSize / 3;
    lines.forEach((line, i) => {
      doc.text(line, textX, startY + i * lineH, { align });
    });
  } else {
    doc.text(text, textX, y + h / 2 + fontSize / 3, { align });
  }
}

function drawMultiline(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  text: string,
  fontSize = 7
) {
  if (!text) return;
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, w - 6);
  doc.text(lines, x + 3, y + 9);
}

async function buildActaPDF(record: ComiteRecord): Promise<jsPDF> {
  const bgBase64 = await getBackgroundBase64();

  const numIntegrantes = record.integrantes.length;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const W = 612;
  const H = 792;

  // === Dibujar fondo institucional ===
  function drawBackground() {
    try {
      doc.addImage(bgBase64, 'PNG', 0, 0, W, H);
    } catch {
      doc.setFillColor(242, 224, 217);
      doc.rect(0, 0, W, H, 'F');
    }
  }

  // ============= CONSTANTES DE LAYOUT (del Word) =============
  const LM = 41;
  const RM = 571;
  const TW = RM - LM;          // 530
  const labelW = 85;
  const midX = LM + TW / 2;

  // ============= PÁGINA 1 =============
  drawBackground();

  // Folio
  let y = 82;
  const folioLabelW = 30;
  const folioX = 360;
  drawCell(doc, folioX, y, folioLabelW, 12, 'Folio:', {
    fill: TEAL, textColor: WHITE, fontSize: 7, bold: true,
  });
  drawCell(doc, folioX + folioLabelW, y, RM - folioX - folioLabelW, 12, record.folio, {
    fontSize: 7,
  });

  // === DATOS DEL COMITÉ ===
  y = 95;
  drawCell(doc, LM, y, TW, 12, 'DATOS DEL COMITÉ', {
    fill: GUINDA, textColor: WHITE, fontSize: 7, bold: true,
  });

  // Fila 1: FECHA | data | RUTA | data
  y = 107;
  const rH = 22;
  drawCell(doc, LM, y, labelW, rH, 'FECHA DE TOMA\nDE PROTESTA', {
    fill: TEAL, textColor: WHITE, fontSize: 6.5,
  });
  drawCell(doc, LM + labelW, y, midX - LM - labelW, rH, record.fechaProtesta, {
    fontSize: 7,
  });
  const labelW2 = 100;
  drawCell(doc, midX, y, labelW2, rH, 'RUTA DE ARTICULACIÓN:', {
    fill: TEAL, textColor: WHITE, fontSize: 6.5,
  });
  drawCell(doc, midX + labelW2, y, RM - midX - labelW2, rH, record.rutaArticulacion, {
    fontSize: 7,
  });

  // Fila 2: ESTADO | data | LUGAR | data
  y += rH;
  drawCell(doc, LM, y, labelW, rH, 'ESTADO', {
    fill: TEAL, textColor: WHITE, fontSize: 6.5,
  });
  drawCell(doc, LM + labelW, y, midX - LM - labelW, rH, record.estado, {
    fontSize: 7,
  });
  drawCell(doc, midX, y, labelW2, rH, 'LUGAR DE INTERVENCIÓN\nDEL COMITÉ:', {
    fill: TEAL, textColor: WHITE, fontSize: 5.5,
  });
  drawCell(doc, midX + labelW2, y, RM - midX - labelW2, rH, record.lugarIntervencion, {
    fontSize: 7,
  });

  // NOMBRE DEL COMITÉ
  y += rH;
  const smallH = 16;
  drawCell(doc, LM, y, labelW, smallH, 'NOMBRE DEL\nCOMITÉ', {
    fill: TEAL, textColor: WHITE, fontSize: 6.5,
  });
  drawCell(doc, LM + labelW, y, TW - labelW, smallH, record.nombreComite, {
    fontSize: 7,
  });

  // TIK TOK
  y += smallH;
  const tinyH = 11;
  drawCell(doc, LM, y, labelW, tinyH, 'TIK TOK', {
    fill: TEAL, textColor: WHITE, fontSize: 6.5,
  });
  drawCell(doc, LM + labelW, y, TW - labelW, tinyH, record.tiktok || '', {
    fontSize: 7, align: 'left',
  });

  // INSTAGRAM
  y += tinyH;
  drawCell(doc, LM, y, labelW, tinyH, 'INSTAGRAM', {
    fill: TEAL, textColor: WHITE, fontSize: 6.5,
  });
  drawCell(doc, LM + labelW, y, TW - labelW, tinyH, record.instagram || '', {
    fontSize: 7, align: 'left',
  });

  // === DATOS DE INTEGRANTES ===
  y += tinyH + 4;
  drawCell(doc, LM, y, TW, 12, 'DATOS DE INTEGRANTES', {
    fill: GUINDA, textColor: WHITE, fontSize: 7, bold: true,
  });

  // Headers columnas
  y += 12;
  const colW = [labelW, 20, 145, 45, 38, 100, 0];
  colW[6] = TW - colW.slice(0, 6).reduce((a, b) => a + b, 0);
  const headers = ['CARGO', '', 'NOMBRE', 'SEXO', 'EDAD', 'MUNICIPIO', 'TELÉFONO'];
  let cx = LM;
  headers.forEach((h, i) => {
    drawCell(doc, cx, y, colW[i], 12, h, {
      fill: TEAL, textColor: WHITE, fontSize: 6.5,
    });
    cx += colW[i];
  });

  // Filas de integrantes
  y += 12;
  const rowH = 17;
  record.integrantes.forEach((integrante, i) => {
    // Check if we need a new page for integrantes
    if (y + rowH > H - 40) {
      doc.addPage('letter', 'portrait');
      drawBackground();
      y = 82;
      // Re-draw header row
      cx = LM;
      headers.forEach((h, hi) => {
        drawCell(doc, cx, y, colW[hi], 12, h, {
          fill: TEAL, textColor: WHITE, fontSize: 6.5,
        });
        cx += colW[hi];
      });
      y += 12;
    }
    cx = LM;
    drawCell(doc, cx, y, colW[0], rowH, integrante.cargo, {
      fill: TEAL, textColor: WHITE, fontSize: 6,
    });
    cx += colW[0];
    drawCell(doc, cx, y, colW[1], rowH, `${i + 1}.`, { fontSize: 7 });
    cx += colW[1];
    drawCell(doc, cx, y, colW[2], rowH, integrante.nombre, { fontSize: 7, align: 'left' });
    cx += colW[2];
    drawCell(doc, cx, y, colW[3], rowH, integrante.sexo, { fontSize: 7 });
    cx += colW[3];
    drawCell(doc, cx, y, colW[4], rowH, String(integrante.edad), { fontSize: 7 });
    cx += colW[4];
    drawCell(doc, cx, y, colW[5], rowH, integrante.municipio, { fontSize: 6.5 });
    cx += colW[5];
    drawCell(doc, cx, y, colW[6], rowH, integrante.telefono, { fontSize: 7 });
    y += rowH;
  });

  // === PROYECTO DE TRABAJO ===
  // Check remaining space - need at least ~140pt for project section
  const needSpace = 140;
  if (y + needSpace > H - 40) {
    doc.addPage('letter', 'portrait');
    drawBackground();
    y = 82;
  }

  y += 3;
  drawCell(doc, LM, y, TW, 12, 'PROYECTO DE TRABAJO', {
    fill: GUINDA, textColor: WHITE, fontSize: 7, bold: true,
  });
  y += 12;

  // Calculate available space for ejes + actividades
  const remainingOnPage = H - y - 60;
  const secH = Math.min(Math.max(remainingOnPage / 2 - 10, 32), 45);

  // EJES TEMÁTICOS
  drawCell(doc, LM, y, labelW, secH, 'EJES TEMÁTICOS\nDE INTERÉS', {
    fill: TEAL, textColor: WHITE, fontSize: 6.5,
  });
  drawCell(doc, LM + labelW, y, TW - labelW, secH, '', {});
  drawMultiline(doc, LM + labelW, y, TW - labelW, record.ejesTematicos);
  y += secH;

  // ACTIVIDADES
  drawCell(doc, LM, y, labelW, secH, 'ACTIVIDADES\nPROPUESTAS', {
    fill: TEAL, textColor: WHITE, fontSize: 6.5,
  });
  drawCell(doc, LM + labelW, y, TW - labelW, secH, '', {});
  drawMultiline(doc, LM + labelW, y, TW - labelW, record.actividades);
  y += secH;

  // === EVIDENCIA + OBSERVACIONES (always on last page) ===
  // If not enough space, go to new page
  if (y + 150 > H - 40) {
    doc.addPage('letter', 'portrait');
    drawBackground();
    y = 82;
  }

  const evH = Math.max(H - y - 65, 120);
  drawCell(doc, LM, y, labelW, evH, 'EVIDENCIA\nFOTOGRÁFICA', {
    fill: TEAL, textColor: WHITE, fontSize: 6.5,
  });
  drawCell(doc, LM + labelW, y, TW - labelW, evH, '', {});

  if (record.evidenciaFotografica) {
    try {
      doc.addImage(record.evidenciaFotografica, 'JPEG',
        LM + labelW + 6, y + 6, TW - labelW - 12, evH - 12);
    } catch { /* skip */ }
  }
  y += evH;

  const obsH = 22;
  drawCell(doc, LM, y, labelW, obsH, 'OBSERVACIONES', {
    fill: TEAL, textColor: WHITE, fontSize: 6.5,
  });
  drawCell(doc, LM + labelW, y, TW - labelW, obsH, '', {});
  drawMultiline(doc, LM + labelW, y, TW - labelW, record.observaciones || '');

  return doc;
}

function sanitizeForFilename(text: string): string {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

export async function generateActaPDF(record: ComiteRecord): Promise<void> {
  const doc = await buildActaPDF(record);
  const namePart = sanitizeForFilename(record.nombreComite);
  const filename = `ACTA_${record.folio}_${namePart}.pdf`;
  doc.save(filename);
}

/** Genera el PDF y devuelve una URL blob para iframe/modal */
export async function buildPdfUrl(record: ComiteRecord): Promise<string> {
  const doc = await buildActaPDF(record);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

/** Vista previa: abre el PDF en una nueva pestaña (fallback para escritorio) */
export async function previewActaPDF(record: ComiteRecord): Promise<void> {
  const url = await buildPdfUrl(record);
  window.open(url, '_blank');
}

/** Genera un PDF y devuelve como blob (para descarga masiva) */
export async function generateActaBlob(record: ComiteRecord): Promise<Blob> {
  const doc = await buildActaPDF(record);
  return doc.output('blob');
}

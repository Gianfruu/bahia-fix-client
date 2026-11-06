function encodePdfText(value) {
  const special = {
    '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86,
    '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c,
    'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95,
    '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b,
    'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f, 'á': 0xe1, 'é': 0xe9, 'í': 0xed,
    'ó': 0xf3, 'ú': 0xfa, 'ñ': 0xf1, 'ü': 0xfc, 'Á': 0xc1, 'É': 0xc9,
    'Í': 0xcd, 'Ó': 0xd3, 'Ú': 0xda, 'Ñ': 0xd1, 'Ü': 0xdc, '¿': 0xbf,
    '¡': 0xa1, '°': 0xb0
  };
  return Array.from(String(value ?? '')).map((character) => {
    const code = character.codePointAt(0);
    const byte = special[character] ?? (code >= 32 && code <= 126 ? code : 63);
    return byte.toString(16).padStart(2, '0');
  }).join('').toUpperCase();
}

function createPdfBlob(title, columns, rows, subtitle) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 32;
  const usableWidth = pageWidth - margin * 2;
  const columnWidth = usableWidth / columns.length;
  const rowHeight = 24;
  const pages = [];
  let rowIndex = 0;

  while (rowIndex < rows.length || pages.length === 0) {
    const commands = [];
    const text = (value, x, y, size, bold = false) => {
      commands.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td <${encodePdfText(value)}> Tj ET`);
    };
    text(title, margin, pageHeight - 42, 18, true);
    text(subtitle, margin, pageHeight - 62, 9);
    const tableTop = pageHeight - 88;
    const headerY = tableTop - 18;
    commands.push(`0.92 g ${margin} ${headerY - 5} ${usableWidth} ${rowHeight} re f 0 g`);
    columns.forEach((column, index) => text(column, margin + index * columnWidth + 5, headerY + 3, 7.5, true));
    commands.push(`0.75 G 0.5 w ${margin} ${headerY - 5} m ${pageWidth - margin} ${headerY - 5} l S`);

    let y = headerY - 20;
    let rowsOnPage = 0;
    while (rowIndex < rows.length && y > 48) {
      const row = rows[rowIndex];
      row.forEach((value, index) => {
        const maxChars = Math.max(8, Math.floor((columnWidth - 10) / 4.2));
        const display = String(value ?? '').length > maxChars
          ? `${String(value).slice(0, maxChars - 1)}…`
          : String(value ?? '');
        text(display, margin + index * columnWidth + 5, y, 7.2);
      });
      commands.push(`0.85 G 0.35 w ${margin} ${y - 6} m ${pageWidth - margin} ${y - 6} l S`);
      y -= rowHeight;
      rowIndex += 1;
      rowsOnPage += 1;
    }
    text(`Bahía Fix · Página ${pages.length + 1} · Registros: ${rows.length}`, margin, 25, 8);
    pages.push(commands.join('\n'));
    if (rowsOnPage === 0) break;
  }

  const objects = [];
  const addObject = (content) => { objects.push(content); return objects.length; };
  const catalogId = addObject('');
  const pagesId = addObject('');
  const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const pageIds = [];
  pages.forEach((content) => {
    const stream = `${content}\n`;
    const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

export function downloadPdfReport(title, columns, rows, filename, subtitle) {
  const blob = createPdfBlob(title, columns, rows, subtitle);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

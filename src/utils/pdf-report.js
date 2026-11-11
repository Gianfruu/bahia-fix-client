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

function wrapText(value, maxChars) {
  const words = String(value ?? '—').split(/\s+/);
  const lines = [];
  let line = '';

  words.forEach((word) => {
    if (word.length > maxChars) {
      if (line) {
        lines.push(line);
        line = '';
      }
      for (let index = 0; index < word.length; index += maxChars) {
        lines.push(word.slice(index, index + maxChars));
      }
      return;
    }

    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });

  if (line) lines.push(line);
  return lines.length ? lines : ['—'];
}

function createPdfBlob(title, columns, rows, subtitle, columnWeights) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 30;
  const usableWidth = pageWidth - margin * 2;
  const rowFontSize = 7.2;
  const lineHeight = 9;
  const defaultWeights = columns.map((column) => {
    const label = column.toLowerCase();
    if (/^(id|orden|hora|total)$/.test(label)) return 0.65;
    if (/fecha|ingreso|garantía|estado$/.test(label)) return 0.9;
    if (/cliente|procedencia/.test(label)) return 1.15;
    if (/equipo|diagnóstico|trabajo/.test(label)) return 1.45;
    if (/motivo|observaciones/.test(label)) return 1.7;
    return 1;
  });
  const weights = columnWeights || defaultWeights;
  const weightTotal = weights.reduce((total, weight) => total + weight, 0);
  const columnWidths = weights.map((weight) => usableWidth * weight / weightTotal);
  const columnStarts = [];
  let currentX = margin;
  columnWidths.forEach((width) => {
    columnStarts.push(currentX);
    currentX += width;
  });

  const pages = [];
  let commands = [];
  let rowIndex = 0;
  let y = 0;

  const addText = (value, x, baseline, size, bold = false) => {
    commands.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(2)} ${baseline.toFixed(2)} Td <${encodePdfText(value)}> Tj ET`);
  };

  const startPage = () => {
    commands = [];
    addText(title, margin, pageHeight - 38, 17, true);
    addText(subtitle, margin, pageHeight - 57, 8.5);

    const headerTop = pageHeight - 78;
    const headerLines = columns.map((column, index) =>
      wrapText(column, Math.max(5, Math.floor((columnWidths[index] - 10) / 4.1)))
    );
    const headerLineCount = headerLines.reduce((count, lines) => Math.max(count, lines.length), 1);
    const headerHeight = headerLineCount * lineHeight + 8;
    commands.push(`0.92 g ${margin} ${headerTop - headerHeight} ${usableWidth} ${headerHeight} re f 0 g`);

    headerLines.forEach((lines, index) => {
      lines.forEach((line, lineIndex) => {
        addText(line, columnStarts[index] + 4, headerTop - 13 - lineIndex * lineHeight, 7, true);
      });
    });

    y = headerTop - headerHeight - 7;
  };

  const finishPage = () => {
    addText(`Bahía Fix · Página ${pages.length + 1} · Registros: ${rows.length}`, margin, 22, 7.5);
    pages.push(commands.join('\n'));
  };

  startPage();
  while (rowIndex < rows.length) {
    const row = rows[rowIndex];
    const wrappedCells = columns.map((column, index) =>
      wrapText(row[index], Math.max(5, Math.floor((columnWidths[index] - 10) / 4.1)))
    );
    const lineCount = wrappedCells.reduce((count, lines) => Math.max(count, lines.length), 1);
    const rowHeight = lineCount * lineHeight + 8;

    if (y - rowHeight < 42) {
      finishPage();
      startPage();
    }

    wrappedCells.forEach((lines, columnIndex) => {
      lines.forEach((line, lineIndex) => {
        addText(line, columnStarts[columnIndex] + 4, y - 10 - lineIndex * lineHeight, rowFontSize);
      });
    });
    commands.push(`0.85 G 0.35 w ${margin} ${y - rowHeight + 2} m ${pageWidth - margin} ${y - rowHeight + 2} l S`);
    y -= rowHeight;
    rowIndex += 1;
  }

  if (rows.length === 0) {
    addText('No hay registros para mostrar.', margin, y - 8, 8);
  }
  finishPage();

  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };
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
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

export function downloadPdfReport(title, columns, rows, filename, subtitle, columnWeights) {
  const blob = createPdfBlob(title, columns, rows, subtitle, columnWeights);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

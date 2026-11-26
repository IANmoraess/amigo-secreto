/**
 * Gera uma imagem PNG limpa do registro do sorteio concluído usando Canvas 2D.
 * Contém apenas nome do evento, data de realização e lista de participantes,
 * sem códigos administrativos, links, status de visualização ou resultados individuais.
 */
function formatDrawDate(isoDate) {
  if (!isoDate) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(
    new Date(isoDate)
  );
}

function slugify(text) {
  return String(text || 'sorteio')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sorteio';
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.closePath();
}

export async function downloadDrawRecordImage(event) {
  const names = event.participants.map((p) => p.name);
  const cols = names.length > 8 ? 2 : 1;
  const rows = Math.ceil(names.length / cols);

  const width = 960;
  const paddingX = 64;
  const cardX = 40;
  const cardWidth = width - cardX * 2;
  const rowHeight = 48;
  const listHeight = rows * rowHeight;
  const height = Math.max(540, 320 + listHeight + 90);

  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Fundo Warm Ivory
  ctx.fillStyle = '#F4F0E8';
  ctx.fillRect(0, 0, width, height);

  // Cartão principal Warm White com borda suave Muted Sage
  drawRoundedRect(ctx, cardX, 36, cardWidth, height - 72, 28);
  ctx.fillStyle = '#FFFCF7';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(169, 183, 160, 0.45)';
  ctx.stroke();

  // Cabeçalho do registro
  ctx.fillStyle = '#244638';
  ctx.font = '700 18px system-ui, -apple-system, sans-serif';
  ctx.fillText('AMIGO SECRETO', cardX + paddingX, 96);

  // Badge "Sorteio realizado"
  const badgeText = 'Sorteio realizado';
  ctx.font = '600 14px system-ui, -apple-system, sans-serif';
  const badgeWidth = ctx.measureText(badgeText).width + 28;
  drawRoundedRect(ctx, width - cardX - paddingX - badgeWidth, 74, badgeWidth, 30, 15);
  ctx.fillStyle = '#E4EAE0';
  ctx.fill();
  ctx.fillStyle = '#244638';
  ctx.fillText(badgeText, width - cardX - paddingX - badgeWidth + 14, 94);

  // Nome do evento
  ctx.fillStyle = '#18372D';
  ctx.font = '700 34px system-ui, -apple-system, sans-serif';
  ctx.fillText(event.name, cardX + paddingX, 150, cardWidth - paddingX * 2);

  // Data do sorteio
  const drawnAt = formatDrawDate(event.drawnAt);
  ctx.fillStyle = '#59635B';
  ctx.font = '400 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    drawnAt
      ? `Realizado em ${drawnAt} · ${names.length} participantes`
      : `${names.length} participantes`,
    cardX + paddingX,
    184
  );

  // Filete Antique Gold
  drawRoundedRect(ctx, cardX + paddingX, 208, 64, 4, 2);
  ctx.fillStyle = '#C5A16B';
  ctx.fill();

  // Título da lista
  ctx.fillStyle = '#244638';
  ctx.font = '700 18px system-ui, -apple-system, sans-serif';
  ctx.fillText('Participantes confirmados', cardX + paddingX, 248);

  // Lista limpa de nomes (sem status de visualização nem pares)
  const colGap = 20;
  const colWidth = (cardWidth - paddingX * 2 - (cols - 1) * colGap) / cols;
  const listStartY = 268;

  names.forEach((name, index) => {
    const col = Math.floor(index / rows);
    const row = index % rows;
    const itemX = cardX + paddingX + col * (colWidth + colGap);
    const itemY = listStartY + row * rowHeight;

    drawRoundedRect(ctx, itemX, itemY, colWidth, 38, 12);
    ctx.fillStyle = 'rgba(244, 240, 232, 0.72)';
    ctx.fill();

    ctx.fillStyle = '#A83D46';
    ctx.beginPath();
    ctx.arc(itemX + 18, itemY + 19, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#303832';
    ctx.font = '600 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(name, itemX + 32, itemY + 25, colWidth - 46);
  });

  // Rodapé discreto
  ctx.fillStyle = '#59635B';
  ctx.font = '400 14px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    'Registro do sorteio · Os resultados individuais permanecem em sigilo.',
    cardX + paddingX,
    height - 68
  );

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Não foi possível gerar a imagem do registro.');

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `registro-${slugify(event.name)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

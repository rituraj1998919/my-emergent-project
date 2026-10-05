const safeFilename = (title) => title.replace(/[^a-z0-9]+/gi, "-").slice(0, 70) || "hikarah-look";

function lines(ctx, text, x, y, width, height, limit) {
  const words = String(text).split(/\s+/);
  const output = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) { output.push(line); line = word; }
    else line = next;
  }
  if (line) output.push(line);
  output.slice(0, limit).forEach((value, i) => {
    if (i === limit - 1 && output.length > limit) value += "…";
    while (ctx.measureText(value).width > width && value.length > 1) value = value.slice(0, -2) + "…";
    ctx.fillText(value, x, y + i * height);
  });
}

export async function makeLookCard(item, signal) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Card generation unavailable");
  await document.fonts.ready;
  ctx.fillStyle = "#FAF7F5"; ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = "#4A1525"; ctx.fillRect(0, 0, 1080, 120);
  ctx.fillStyle = "#FAF7F5"; ctx.font = 'italic 55px "Cormorant Garamond", Georgia';
  ctx.fillText("Hikarah Lntc", 54, 77);
  ctx.fillStyle = "#EEE5E3"; ctx.fillRect(40, 150, 1000, 780);
  if (!item.video) {
    const res = await fetch(item.img, { signal });
    if (!res.ok) throw new Error("Photo unavailable");
    const blob = await res.blob();
    const image = await createImageBitmap(blob);
    const scale = Math.min(1000 / image.width, 780 / image.height);
    const w = image.width * scale, h = image.height * scale;
    ctx.drawImage(image, 40 + (1000 - w) / 2, 150 + (780 - h) / 2, w, h);
    image.close();
  } else {
    ctx.fillStyle = "#4A1525"; ctx.font = 'italic 65px "Cormorant Garamond", Georgia';
    ctx.textAlign = "center"; ctx.fillText("A look in motion", 540, 540); ctx.textAlign = "left";
    ctx.font = '26px "Plus Jakarta Sans", sans-serif'; ctx.fillText("Watch the full video in Hikarah's gallery", 235, 610);
  }
  ctx.fillStyle = "#4A1525"; ctx.font = 'bold 25px "Plus Jakarta Sans", sans-serif';
  lines(ctx, item.cat, 54, 980, 970, 30, 1);
  ctx.font = 'italic 56px "Cormorant Garamond", Georgia';
  lines(ctx, item.title, 54, 1050, 970, 61, 2);
  ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
  lines(ctx, item.price || "Enquire for your date", 54, 1190, 970, 40, 1);
  ctx.fillStyle = "#C5A059"; ctx.fillRect(54, 1240, 972, 2);
  ctx.fillStyle = "#4A1525"; ctx.font = '24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText("Davao City · Makeup artistry", 54, 1300);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(new File([blob], `${safeFilename(item.title)}.png`, { type: "image/png" })) : reject(new Error("Could not create card")), "image/png"));
}

export function downloadCard(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url; a.download = file.name; a.dataset.testid = "look-card-download-link";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
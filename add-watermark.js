const sharp = require('sharp');
const path = require('path');

async function addWatermark(photoPath, logoPath, outputPath, opacityPercent = 70) {
  const photo = sharp(photoPath);
  const photoMeta = await photo.metadata();
  const photoW = photoMeta.width;
  const photoH = photoMeta.height;

  // Logo width: ~28% of photo width
  const logoWidth = Math.round(photoW * 0.28);

  // Resize logo, reduce opacity
  const { data, info } = await sharp(logoPath)
    .resize(logoWidth, null, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const opacity = opacityPercent / 100;

  // Scale alpha channel by desired opacity
  for (let i = 0; i < width * height; i++) {
    data[i * 4 + 3] = Math.round(data[i * 4 + 3] * opacity);
  }

  const overlayBuffer = await sharp(data, {
    raw: { width, height, channels: 4 }
  }).png().toBuffer();

  // Position: top-left with 3% margin
  const margin = Math.round(photoW * 0.03);
  const left = margin;
  const top = margin;

  await photo
    .composite([{
      input: overlayBuffer,
      top: Math.max(0, top),
      left: Math.max(0, left),
      blend: 'over'
    }])
    .toFile(outputPath);

  console.log(`✅ Hotovo: ${outputPath}`);
  console.log(`   Foto: ${photoW}×${photoH}px | Logo: ${width}×${height}px | Pozice: [${left}, ${top}]`);
}

addWatermark(
  path.join(__dirname, 'Oxygen_foto3_original.png'),
  'C:/Users/fery/Downloads/logo transparent white.png',
  path.join(__dirname, 'Oxygen_foto3_watermark.png'),
  70
).catch(console.error);

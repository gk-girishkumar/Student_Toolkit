// Script to generate real test files using our already-installed libraries
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'fs';

// === Create a real 3-page PDF ===
async function createTestPDF() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 1; i <= 3; i++) {
    const page = pdfDoc.addPage([595, 842]); // A4
    page.drawText(`Student Toolkit - Test PDF`, {
      x: 80, y: 780, size: 28, font, color: rgb(0.1, 0.1, 0.5)
    });
    page.drawText(`Page ${i} of 3`, {
      x: 80, y: 740, size: 20, font, color: rgb(0.3, 0.3, 0.3)
    });
    page.drawText(`This is sample content on page ${i}.`, {
      x: 80, y: 700, size: 14, font, color: rgb(0, 0, 0)
    });
    page.drawText(`Created for testing all PDF tools in the Student Toolkit app.`, {
      x: 80, y: 670, size: 12, font, color: rgb(0.4, 0.4, 0.4)
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('sample.pdf', Buffer.from(pdfBytes));
  console.log('✅ Created sample.pdf (3 pages, A4)');
}

// === Create a real 200x200 PNG with colored gradient ===
async function createTestPNG() {
  const width = 200, height = 200;
  const pixels = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      pixels[idx] = Math.round((x / width) * 255);       // R
      pixels[idx + 1] = Math.round((y / height) * 255);  // G
      pixels[idx + 2] = 128;                              // B
    }
  }

  await sharp(pixels, { raw: { width, height, channels: 3 } })
    .png()
    .toFile('sample.png');
  console.log('✅ Created sample.png (200x200 gradient)');
}

// === Create a real JPEG ===
async function createTestJPG() {
  await sharp('sample.png').jpeg({ quality: 85 }).toFile('sample.jpg');
  console.log('✅ Created sample.jpg (from PNG)');
}

(async () => {
  await createTestPDF();
  await createTestPNG();
  await createTestJPG();
  console.log('\nAll test assets ready!');
})();

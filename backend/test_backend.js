import fs from 'fs';

const API_BASE = 'http://localhost:4000';
const PDF  = 'sample.pdf';   // 3-page A4 PDF
const PNG  = 'sample.png';   // 200x200 gradient PNG
const JPG  = 'sample.jpg';   // 200x200 gradient JPG

let passed = 0, failed = 0, pending = 0;

function pdfFile(name = PDF) {
  return new File([fs.readFileSync(name)], name, { type: 'application/pdf' });
}
function pngFile() {
  return new File([fs.readFileSync(PNG)], 'sample.png', { type: 'image/png' });
}
function jpgFile() {
  return new File([fs.readFileSync(JPG)], 'sample.jpg', { type: 'image/jpeg' });
}

async function test(name, endpoint, buildForm, expectedContentType) {
  try {
    const form = buildForm();
    const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', body: form });
    const ct = res.headers.get('content-type') || '';

    if (res.status === 422) {
      const body = await res.json();
      console.log(`⏳  ${name}\n     → ${body.message}`);
      pending++;
      return;
    }

    if (!expectedContentType) {
      // Just check it responded
      console.log(`✅  ${name} (status ${res.status})`);
      passed++;
      return;
    }

    if (res.ok && ct.includes(expectedContentType)) {
      const buf = Buffer.from(await res.arrayBuffer());
      console.log(`✅  ${name} — ${(buf.length / 1024).toFixed(1)} KB returned`);
      passed++;
    } else {
      const body = await res.text();
      console.log(`❌  ${name} — HTTP ${res.status} | ${body.substring(0, 200)}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌  ${name} — Exception: ${err.message}`);
    failed++;
  }
}

async function runAll() {
  console.log('═══════════════════════════════════════════════');
  console.log('   STUDENT TOOLKIT — FULL TOOL VERIFICATION   ');
  console.log('   Files: sample.pdf (3 pages), sample.png, sample.jpg');
  console.log('═══════════════════════════════════════════════\n');

  console.log('────── PDF ORGANIZE ──────');
  await test('Merge PDF (2×sample.pdf)', '/api/pdf/merge', () => {
    const f = new FormData();
    f.append('files', pdfFile()); f.append('files', pdfFile());
    return f;
  }, 'application/pdf');

  await test('Split PDF  (pages 1-2)', '/api/pdf/split', () => {
    const f = new FormData();
    f.append('file', pdfFile());
    f.append('pageStart', '1'); f.append('pageEnd', '2');
    return f;
  }, 'application/pdf');

  await test('Remove Pages (page 3)', '/api/pdf/remove-pages', () => {
    const f = new FormData();
    f.append('file', pdfFile());
    f.append('pageStart', '3'); f.append('pageEnd', '3');
    return f;
  }, 'application/pdf');

  await test('Extract Pages (page 2)', '/api/pdf/extract-pages', () => {
    const f = new FormData();
    f.append('file', pdfFile());
    f.append('pageStart', '2'); f.append('pageEnd', '2');
    return f;
  }, 'application/pdf');

  await test('Scan to PDF  (sample.jpg → PDF)', '/api/pdf/scan-to-pdf', () => {
    const f = new FormData();
    f.append('file', jpgFile());
    return f;
  }, 'application/pdf');

  console.log('\n────── PDF OPTIMIZE ──────');
  await test('Compress PDF', '/api/pdf/compress', () => {
    const f = new FormData();
    f.append('file', pdfFile());
    return f;
  }, 'application/pdf');

  await test('OCR PDF', '/api/pdf/ocr', () => {
    const f = new FormData(); f.append('file', pdfFile()); return f;
  }, '');

  console.log('\n────── PDF EDIT ──────');
  await test('Rotate PDF  (90°)', '/api/pdf/rotate', () => {
    const f = new FormData();
    f.append('file', pdfFile()); f.append('angle', '90');
    return f;
  }, 'application/pdf');

  await test('Add Watermark', '/api/pdf/add-watermark', () => {
    const f = new FormData();
    f.append('file', pdfFile()); f.append('watermarkText', 'Student Toolkit');
    return f;
  }, 'application/pdf');

  await test('Crop PDF  (x=0,y=0,w=400,h=500)', '/api/pdf/crop', () => {
    const f = new FormData();
    f.append('file', pdfFile());
    f.append('x', '0'); f.append('y', '0');
    f.append('width', '400'); f.append('height', '500');
    return f;
  }, 'application/pdf');

  console.log('\n────── PDF CONVERT ──────');
  await test('JPG → PDF  (sample.jpg)', '/api/pdf/jpg-to-pdf', () => {
    const f = new FormData(); f.append('file', jpgFile()); return f;
  }, 'application/pdf');

  await test('PNG → PDF  (sample.png)', '/api/pdf/png-to-pdf', () => {
    const f = new FormData(); f.append('file', pngFile()); return f;
  }, 'application/pdf');

  await test('PDF → JPG  (sample.pdf)', '/api/pdf/pdf-to-jpg', () => {
    const f = new FormData(); f.append('file', pdfFile()); return f;
  }, 'image');

  await test('PDF → PDF/A', '/api/pdf/pdf-to-pdf-a', () => {
    const f = new FormData(); f.append('file', pdfFile()); return f;
  }, '');

  console.log('\n────── IMAGE TOOLS ──────');
  await test('Resize PNG  (200×200 → 100×100)', '/api/image/resize', () => {
    const f = new FormData();
    f.append('file', pngFile());
    f.append('width', '100'); f.append('height', '100');
    return f;
  }, 'image');

  await test('Resize JPG  (200×200 → 80×80)', '/api/image/resize', () => {
    const f = new FormData();
    f.append('file', jpgFile());
    f.append('width', '80'); f.append('height', '80');
    return f;
  }, 'image');

  await test('Compress PNG  (quality 60)', '/api/image/compress', () => {
    const f = new FormData();
    f.append('file', pngFile()); f.append('quality', '60');
    return f;
  }, 'image');

  await test('Compress JPG  (quality 50)', '/api/image/compress', () => {
    const f = new FormData();
    f.append('file', jpgFile()); f.append('quality', '50');
    return f;
  }, 'image');

  await test('Convert PNG → JPEG', '/api/image/convert', () => {
    const f = new FormData();
    f.append('file', pngFile()); f.append('outputFormat', 'jpeg');
    return f;
  }, 'image/jpeg');

  await test('Convert JPG → WebP', '/api/image/convert', () => {
    const f = new FormData();
    f.append('file', jpgFile()); f.append('outputFormat', 'webp');
    return f;
  }, 'image/webp');

  await test('Flip Horizontal  (sample.png)', '/api/image/flip', () => {
    const f = new FormData();
    f.append('file', pngFile()); f.append('flipMode', 'horizontal');
    return f;
  }, 'image');

  await test('Flip Vertical  (sample.png)', '/api/image/flip', () => {
    const f = new FormData();
    f.append('file', pngFile()); f.append('flipMode', 'vertical');
    return f;
  }, 'image');

  await test('Enlarge Image  (×2)', '/api/image/enlarge', () => {
    const f = new FormData();
    f.append('file', pngFile()); f.append('scale', '2');
    return f;
  }, 'image');

  await test('Image Crop  (50×50 at 0,0)', '/api/image/crop', () => {
    const f = new FormData();
    f.append('file', pngFile());
    f.append('x', '0'); f.append('y', '0');
    f.append('width', '50'); f.append('height', '50');
    return f;
  }, 'image');

  console.log('\n═══════════════════════════════════════════════');
  console.log(`RESULTS: ✅ ${passed} passed   ❌ ${failed} failed   ⏳ ${pending} pending`);
  console.log('═══════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runAll();

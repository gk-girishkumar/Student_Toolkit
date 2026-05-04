import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import Stripe from 'stripe';
import multer from 'multer';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import sharp from 'sharp';
import { ClerkExpressRequireAuth, clerkClient } from '@clerk/clerk-sdk-node';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';

const execFileAsync = promisify(execFile);

// Locate Ghostscript binary
const GS_BIN = 'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe';

dotenv.config();
console.log('Clerk Secret Key loaded:', process.env.CLERK_SECRET_KEY ? 'Yes (starts with ' + process.env.CLERK_SECRET_KEY.substring(0, 8) + ')' : 'No');

const app = express();
const port = process.env.PORT || 4000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-11-15' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const upload = multer({ storage: multer.memoryStorage() });

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      clerk_user_id TEXT UNIQUE NOT NULL,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

initDb().then(() => {
  console.log('Database initialized successfully');
}).catch((error) => {
  console.error('Database initialization failed:', error);
  // Do not exit process, so Vercel does not crash on startup if env vars are missing
});

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/health', async (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/test-post', (req, res) => {
  res.json({ message: 'POST works' });
});

app.get('/api/tools', (req, res) => {
  const tools = [
    { category: 'Organize PDF', items: ['Merge PDF', 'Split PDF', 'Remove pages', 'Extract pages', 'Organize PDF', 'Scan to PDF'] },
    { category: 'Optimize PDF', items: ['Compress PDF', 'Repair PDF', 'OCR PDF'] },
    { category: 'Convert to PDF', items: ['JPG to PDF', 'WORD to PDF', 'POWERPOINT to PDF', 'EXCEL to PDF', 'HTML to PDF'] },
    { category: 'Convert from PDF', items: ['PDF to JPG', 'PDF to WORD', 'PDF to POWERPOINT', 'PDF to EXCEL', 'PDF to PDF/A'] },
    { category: 'Edit PDF', items: ['Rotate PDF', 'Add page numbers', 'Add watermark', 'Crop PDF', 'Edit PDF'] },
    { category: 'PDF Security', items: ['Unlock PDF', 'Protect PDF', 'Sign PDF', 'Redact PDF', 'Compare PDF'] },
    { category: 'PDF Intelligence', items: ['AI Summarizer', 'Translate PDF'] },
    { category: 'Image Resize', items: ['Bulk Resize', 'Resize PNG', 'Resize JPG', 'Resize WebP'] },
    { category: 'Image Crop', items: ['Crop PNG', 'Crop JPG', 'Crop WebP'] },
    { category: 'Image Convert', items: ['HEIC to JPG', 'WebP to PNG', 'WebP to JPG', 'PNG to JPG', 'PNG to SVG'] },
    { category: 'Image Optimize', items: ['Compress JPEG', 'PNG Compressor', 'GIF Compressor', 'Image Enlarger'] },
    { category: 'Image Effects', items: ['Rotate Image', 'Flip Image', 'Meme Generator', 'Color Picker'] }
  ];
  res.json({ tools });
});

app.get('/api/user', ClerkExpressRequireAuth({}), async (req, res) => {
  const { userId } = req.auth;
  const user = await clerkClient.users.getUser(userId);

  const email = user.emailAddresses?.[0]?.emailAddress || null;
  const firstName = user.firstName || null;
  const lastName = user.lastName || null;

  await pool.query(
    `INSERT INTO users (clerk_user_id, email, first_name, last_name, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (clerk_user_id)
     DO UPDATE SET email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, updated_at = NOW();`,
    [user.id, email, firstName, lastName]
  );

  res.json({ user: { id: user.id, email: email || '', firstName, lastName } });
});

app.post('/api/subscription/create-checkout', ClerkExpressRequireAuth({}), async (req, res) => {
  try {
    const { priceId } = req.body;
    if (!priceId) {
      return res.status(400).json({ error: 'Missing priceId' });
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.SUCCESS_URL || 'http://localhost:5173'}/subscription?success=true`,
      cancel_url: `${process.env.CANCEL_URL || 'http://localhost:5173'}/subscription?canceled=true`,
      client_reference_id: req.auth.userId,
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create checkout session' });
  }
});

app.post('/api/pdf/merge', upload.array('files', 10), async (req, res) => {
  console.log('Merge PDF request received (Auth Bypassed)');
  try {
    const files = req.files || [];
    if (!Array.isArray(files) || files.length < 2) {
      return res.status(400).json({ error: 'Upload two or more PDF files as files[]' });
    }

    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
      const pdfBytes = file.buffer;
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
    res.send(Buffer.from(mergedBytes));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to merge PDF files' });
  }
});

app.post('/api/pdf/split', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload a PDF file as file' });
    }

    const pageStart = Number(req.body.pageStart ?? 1);
    const pageEnd = Number(req.body.pageEnd ?? 1);
    const sourcePdf = await PDFDocument.load(req.file.buffer);
    const totalPages = sourcePdf.getPageCount();

    if (pageStart < 1 || pageEnd > totalPages || pageStart > pageEnd) {
      return res.status(400).json({ error: 'Invalid page range' });
    }

    const outputPdf = await PDFDocument.create();
    const pages = await outputPdf.copyPages(sourcePdf, Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart - 1 + i));
    pages.forEach((page) => outputPdf.addPage(page));

    const splitBytes = await outputPdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="split.pdf"');
    res.send(Buffer.from(splitBytes));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to split PDF' });
  }
});

app.post('/api/pdf/remove-pages', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload a PDF file as file' });
    }

    const pageStart = Number(req.body.pageStart ?? 1);
    const pageEnd = Number(req.body.pageEnd ?? 1);
    const sourcePdf = await PDFDocument.load(req.file.buffer);
    const totalPages = sourcePdf.getPageCount();

    if (pageStart < 1 || pageEnd > totalPages || pageStart > pageEnd) {
      return res.status(400).json({ error: 'Invalid page range' });
    }

    const outputPdf = await PDFDocument.create();
    const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter((index) => index < pageStart - 1 || index >= pageEnd);
    const pages = await outputPdf.copyPages(sourcePdf, keepIndices);
    pages.forEach((page) => outputPdf.addPage(page));

    const outputBytes = await outputPdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="removed-pages.pdf"');
    res.send(Buffer.from(outputBytes));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to remove pages' });
  }
});

app.post('/api/pdf/extract-pages', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload a PDF file as file' });
    }

    const pageStart = Number(req.body.pageStart ?? 1);
    const pageEnd = Number(req.body.pageEnd ?? 1);
    const sourcePdf = await PDFDocument.load(req.file.buffer);
    const totalPages = sourcePdf.getPageCount();

    if (pageStart < 1 || pageEnd > totalPages || pageStart > pageEnd) {
      return res.status(400).json({ error: 'Invalid page range' });
    }

    const outputPdf = await PDFDocument.create();
    const pages = await outputPdf.copyPages(sourcePdf, Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart - 1 + i));
    pages.forEach((page) => outputPdf.addPage(page));

    const outputBytes = await outputPdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="extracted-pages.pdf"');
    res.send(Buffer.from(outputBytes));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to extract pages' });
  }
});

app.post('/api/pdf/rotate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload a PDF file as file' });
    }

    const angle = Number(req.body.angle) || 90;
    const rotationAngle = [90, 180, 270].includes(angle) ? angle : 90;
    const sourcePdf = await PDFDocument.load(req.file.buffer);
    const outputPdf = await PDFDocument.create();

    const pages = await outputPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    pages.forEach((page) => {
      page.setRotation(degrees(rotationAngle));
      outputPdf.addPage(page);
    });

    const outputBytes = await outputPdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="rotated.pdf"');
    res.send(Buffer.from(outputBytes));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to rotate PDF' });
  }
});

app.post('/api/pdf/jpg-to-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload an image file as file' });
    }

    // Convert any image format to JPEG using sharp first
    const jpegBuffer = await sharp(req.file.buffer).jpeg({ quality: 90 }).toBuffer();
    const metadata = await sharp(jpegBuffer).metadata();

    const pdfDoc = await PDFDocument.create();
    const image = await pdfDoc.embedJpg(jpegBuffer);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to convert image to PDF' });
  }
});

app.post('/api/pdf/png-to-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload a PNG file as file' });
    }

    const pdfDoc = await PDFDocument.create();
    const image = await pdfDoc.embedPng(req.file.buffer);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to convert PNG to PDF' });
  }
});

app.post('/api/pdf/pdf-to-jpg', upload.single('file'), async (req, res) => {
  let tmpDir = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload a PDF file as file' });
    }

    // Write PDF to a temp file
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf2jpg-'));
    const pdfPath = path.join(tmpDir, 'input.pdf');
    fs.writeFileSync(pdfPath, req.file.buffer);

    // Run Ghostscript to rasterize all pages to JPEG
    const outputPattern = path.join(tmpDir, 'page-%03d.jpg');
    await execFileAsync(GS_BIN, [
      '-dBATCH',
      '-dNOPAUSE',
      '-dSAFER',
      '-sDEVICE=jpeg',
      '-r150',
      '-dJPEGQ=90',
      `-sOutputFile=${outputPattern}`,
      pdfPath
    ]);

    // Collect all generated JPEGs
    const jpegFiles = fs.readdirSync(tmpDir)
      .filter(f => f.startsWith('page-') && f.endsWith('.jpg'))
      .sort();

    if (jpegFiles.length === 0) {
      return res.status(500).json({ error: 'Ghostscript produced no output' });
    }

    if (jpegFiles.length === 1) {
      // Single page: return JPG directly
      const jpgBuf = fs.readFileSync(path.join(tmpDir, jpegFiles[0]));
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', 'attachment; filename="converted.jpg"');
      res.send(jpgBuf);
    } else {
      // Multiple pages: zip them
      const archiver = (await import('archiver')).default;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="converted-pages.zip"');
      const archive = archiver('zip', { zlib: { level: 6 } });
      archive.pipe(res);
      for (const f of jpegFiles) {
        archive.file(path.join(tmpDir, f), { name: f });
      }
      await archive.finalize();
    }
  } catch (error) {
    console.error('PDF to JPG error:', error);
    res.status(500).json({ error: 'Unable to convert PDF to JPG' });
  } finally {
    if (tmpDir) {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    }
  }
});

app.post('/api/pdf/scan-to-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload an image file as file' });
    }

    const pdfDoc = await PDFDocument.create();
    // Convert any image format to PNG using sharp for reliable embedding
    const pngBuffer = await sharp(req.file.buffer).png().toBuffer();
    const metadata = await sharp(pngBuffer).metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;
    const embeddedImage = await pdfDoc.embedPng(pngBuffer);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="scan.pdf"');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to convert scan to PDF' });
  }
});

app.post('/api/pdf/add-watermark', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload a PDF file as file' });
    }
    const watermarkText = req.body.watermarkText || 'Student Toolkit';
    const pdfDoc = await PDFDocument.load(req.file.buffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      page.drawText(watermarkText, {
        x: width / 2 - 150,
        y: height / 2,
        size: 50,
        font,
        color: rgb(0.75, 0.75, 0.75),
        rotate: degrees(-45),
        opacity: 0.2
      });
    });

    const outputBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="watermarked.pdf"');
    res.send(Buffer.from(outputBytes));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to add watermark' });
  }
});

app.post('/api/pdf/crop', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload a PDF file as file' });
    }

    const x = Number(req.body.x ?? 0);
    const y = Number(req.body.y ?? 0);
    const cropW = Number(req.body.width ?? 0);
    const cropH = Number(req.body.height ?? 0);
    if (cropW <= 0 || cropH <= 0) {
      return res.status(400).json({ error: 'Provide valid width and height for cropping' });
    }

    const pdfDoc = await PDFDocument.load(req.file.buffer);
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      return res.status(400).json({ error: 'PDF has no pages' });
    }

    // Apply crop to ALL pages by setting their MediaBox to the cropped rect
    for (const page of pages) {
      const { width: pw, height: ph } = page.getSize();
      // Clamp to page bounds
      const safeW = Math.min(cropW, pw - x);
      const safeH = Math.min(cropH, ph - y);
      page.setMediaBox(x, y, safeW, safeH);
    }

    const outputBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="cropped.pdf"');
    res.send(Buffer.from(outputBytes));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to crop PDF' });
  }
});

app.post('/api/pdf/compress', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload a PDF file as file' });
    }
    // Re-save with pdf-lib which applies its own compression (removes unused objects, re-encodes)
    const sourcePdf = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    const compressedBytes = await sourcePdf.save({ useObjectStreams: true, addDefaultPage: false });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="compressed.pdf"');
    res.send(Buffer.from(compressedBytes));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to compress PDF' });
  }
});

app.post('/api/pdf/ocr', upload.single('file'), async (req, res) => {
  res.status(422).json({ message: 'OCR requires a cloud service and is coming soon. Please use an alternative like Adobe Acrobat.' });
});

app.post('/api/pdf/pdf-to-pdf-a', upload.single('file'), async (req, res) => {
  res.status(422).json({ message: 'PDF/A conversion is a specialised archiving feature coming in the next update.' });
});

app.post('/api/image/crop', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload an image file as file' });
    }

    const x = Number(req.body.x ?? 0);
    const y = Number(req.body.y ?? 0);
    const width = Number(req.body.width ?? 0);
    const height = Number(req.body.height ?? 0);
    if (width <= 0 || height <= 0) {
      return res.status(400).json({ error: 'Provide valid width and height for crop' });
    }

    const outputBuffer = await sharp(req.file.buffer)
      .extract({ left: x, top: y, width, height })
      .toBuffer();

    res.setHeader('Content-Type', req.file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="cropped.${req.file.mimetype.split('/')[1]}"`);
    res.send(outputBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to crop image' });
  }
});

app.post('/api/image/flip', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload an image file as file' });
    }

    const flipMode = (req.body.flipMode || '').toString().toLowerCase();
    let transformer = sharp(req.file.buffer);
    if (flipMode === 'horizontal') {
      transformer = transformer.flop();
    } else if (flipMode === 'vertical') {
      transformer = transformer.flip();
    } else {
      return res.status(400).json({ error: 'flipMode must be horizontal or vertical' });
    }

    const outputBuffer = await transformer.toBuffer();
    res.setHeader('Content-Type', req.file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="flipped.${req.file.mimetype.split('/')[1]}"`);
    res.send(outputBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to flip image' });
  }
});

app.post('/api/image/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload an image file as file' });
    }

    const outputFormat = (req.body.outputFormat || 'png').toString().toLowerCase();
    const input = sharp(req.file.buffer);
    let outputBuffer;
    let contentType;

    if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
      outputBuffer = await input.jpeg().toBuffer();
      contentType = 'image/jpeg';
    } else if (outputFormat === 'png') {
      outputBuffer = await input.png().toBuffer();
      contentType = 'image/png';
    } else if (outputFormat === 'webp') {
      outputBuffer = await input.webp().toBuffer();
      contentType = 'image/webp';
    } else {
      return res.status(400).json({ error: 'Unsupported output format' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="converted.${outputFormat}"`);
    res.send(outputBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to convert image' });
  }
});

app.post('/api/image/enlarge', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload an image file as file' });
    }

    const scale = Number(req.body.scale) || 1.5;
    if (scale <= 1) {
      return res.status(400).json({ error: 'Scale must be greater than 1' });
    }

    const metadata = await sharp(req.file.buffer).metadata();
    const width = Math.round((metadata.width || 0) * scale);
    const height = Math.round((metadata.height || 0) * scale);

    const outputBuffer = await sharp(req.file.buffer)
      .resize(width, height)
      .toBuffer();

    res.setHeader('Content-Type', req.file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="enlarged.${req.file.mimetype.split('/')[1]}"`);
    res.send(outputBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to enlarge image' });
  }
});

app.post('/api/image/placeholder', upload.single('file'), async (req, res) => {
  res.status(501).json({ message: 'This tool is available in a future release.' });
});

app.post('/api/image/resize', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload an image file as file' });
    }

    const width = Number(req.body.width);
    const height = Number(req.body.height);
    if (!width || !height) {
      return res.status(400).json({ error: 'Provide width and height' });
    }

    const outputBuffer = await sharp(req.file.buffer)
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="resized.png"');
    res.send(outputBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to resize image' });
  }
});

app.post('/api/image/compress', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Upload an image file as file' });
    }

    const quality = Number(req.body.quality) || 75;
    const metadata = await sharp(req.file.buffer).metadata();
    let output;

    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      output = await sharp(req.file.buffer).jpeg({ quality }).toBuffer();
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', 'attachment; filename="compressed.jpg"');
    } else if (metadata.format === 'png') {
      output = await sharp(req.file.buffer).png({ quality }).toBuffer();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename="compressed.png"');
    } else {
      output = await sharp(req.file.buffer).webp({ quality }).toBuffer();
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Content-Disposition', 'attachment; filename="compressed.webp"');
    }

    res.send(output);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to compress image' });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}

export default app;

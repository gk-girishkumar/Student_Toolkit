import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Use local worker to avoid any CDN/CORS issues
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export default function PdfThumbnail({ file }) {
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState(null);

  useEffect(() => {
    let renderTask = null;
    let pdfDocument = null;
    let isMounted = true;

    const renderPage = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        pdfDocument = await pdfjsLib.getDocument({ 
          data: arrayBuffer,
        }).promise;
        
        const page = await pdfDocument.getPage(1);
        
        const viewport = page.getViewport({ scale: 1 });
        
        // Target width is 120px to match the css class .pdf-card-page
        const scale = 120 / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        
        // Use an offscreen canvas to prevent React StrictMode concurrency errors
        const canvas = document.createElement('canvas');
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        const context = canvas.getContext('2d');
        
        renderTask = page.render({
          canvasContext: context,
          viewport: scaledViewport
        });
        
        await renderTask.promise;
        
        if (isMounted) {
          setThumbnailUrl(canvas.toDataURL());
        }
      } catch (err) {
        if (isMounted && err.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF thumbnail:', err);
          setHasError(true);
          setErrorMsg(err.message || String(err));
        }
      }
    };

    if (file) {
      setHasError(false);
      renderPage();
    }

    return () => {
      isMounted = false;
      if (renderTask && typeof renderTask.cancel === 'function') {
        try {
          renderTask.cancel();
        } catch (e) {
          // ignore
        }
      }
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [file]);

  if (hasError) {
    return (
      <div style={{ textAlign: 'center', padding: '10px' }}>
        <span className="pdf-label" style={{ fontSize: '1rem' }}>PDF</span>
        <div style={{ fontSize: '8px', color: 'red', marginTop: '5px', wordBreak: 'break-all', lineHeight: '1' }}>
          {errorMsg}
        </div>
      </div>
    );
  }

  if (thumbnailUrl) {
    return (
      <img 
        src={thumbnailUrl} 
        alt="PDF Thumbnail" 
        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} 
      />
    );
  }

  return <span className="pdf-label" style={{ opacity: 0.5, fontSize: '1rem' }}>...</span>;
}

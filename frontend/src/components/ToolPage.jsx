import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import PdfThumbnail from "./PdfThumbnail";
import "./ToolPage.css";

const toolConfig = {
  "merge-pdf": {
    title: "Merge PDF",
    description:
      "Combine multiple PDF files into a single downloadable document.",
    endpoint: "/api/pdf/merge",
    accept: "application/pdf",
    multiple: true,
    fields: [],
  },
  "split-pdf": {
    title: "Split PDF",
    description: "Split a PDF into a smaller file using a page range.",
    endpoint: "/api/pdf/split",
    accept: "application/pdf",
    multiple: false,
    fields: [
      { name: "pageStart", label: "Start page", type: "number", min: 1 },
      { name: "pageEnd", label: "End page", type: "number", min: 1 },
    ],
  },
  "remove-pages": {
    title: "Remove Pages",
    description: "Remove a section of pages from a PDF.",
    endpoint: "/api/pdf/remove-pages",
    accept: "application/pdf",
    multiple: false,
    fields: [
      { name: "pageStart", label: "Start page", type: "number", min: 1 },
      { name: "pageEnd", label: "End page", type: "number", min: 1 },
    ],
  },
  "extract-pages": {
    title: "Extract Pages",
    description: "Create a new PDF with only the selected page range.",
    endpoint: "/api/pdf/extract-pages",
    accept: "application/pdf",
    multiple: false,
    fields: [
      { name: "pageStart", label: "Start page", type: "number", min: 1 },
      { name: "pageEnd", label: "End page", type: "number", min: 1 },
    ],
  },
  "add-watermark": {
    title: "Add Watermark",
    description: "Add a text watermark to every page of your PDF.",
    endpoint: "/api/pdf/add-watermark",
    accept: "application/pdf",
    multiple: false,
    fields: [{ name: "watermarkText", label: "Watermark text", type: "text" }],
  },
  "rotate-pdf": {
    title: "Rotate PDF",
    description: "Rotate every page of a PDF by 90, 180, or 270 degrees.",
    endpoint: "/api/pdf/rotate",
    accept: "application/pdf",
    multiple: false,
    fields: [
      {
        name: "angle",
        label: "Rotation angle",
        type: "number",
        min: 90,
        max: 270,
      },
    ],
  },
  "jpg-to-pdf": {
    title: "JPG to PDF",
    description: "Convert a JPG image into PDF.",
    endpoint: "/api/pdf/jpg-to-pdf",
    accept: "image/jpeg",
    multiple: false,
    fields: [],
  },
  "png-to-pdf": {
    title: "PNG to PDF",
    description: "Convert a PNG image into PDF.",
    endpoint: "/api/pdf/png-to-pdf",
    accept: "image/png",
    multiple: false,
    fields: [],
  },
  "pdf-to-jpg": {
    title: "PDF to JPG",
    description: "Convert a PDF page into JPG format.",
    endpoint: "/api/pdf/pdf-to-jpg",
    accept: "application/pdf",
    multiple: false,
    fields: [],
  },
  "scan-to-pdf": {
    title: "Scan to PDF",
    description: "Convert an image scan into PDF.",
    endpoint: "/api/pdf/scan-to-pdf",
    accept: "image/*",
    multiple: false,
    fields: [],
  },
  "crop-pdf": {
    title: "Crop PDF",
    description: "Crop the first page of a PDF document.",
    endpoint: "/api/pdf/crop",
    accept: "application/pdf",
    multiple: false,
    fields: [
      { name: "x", label: "X coordinate", type: "number", min: 0 },
      { name: "y", label: "Y coordinate", type: "number", min: 0 },
      { name: "width", label: "Width", type: "number", min: 1 },
      { name: "height", label: "Height", type: "number", min: 1 },
    ],
  },
  "compress-pdf": {
    title: "Compress PDF",
    description: "Compress a PDF file for smaller size.",
    endpoint: "/api/pdf/compress",
    accept: "application/pdf",
    multiple: false,
    fields: [],
  },
  "ocr-pdf": {
    title: "OCR PDF",
    description: "Extract text from a PDF using OCR (placeholder).",
    endpoint: "/api/pdf/ocr",
    accept: "application/pdf",
    multiple: false,
    fields: [],
  },
  "pdf-to-pdf-a": {
    title: "PDF to PDF/A",
    description: "Convert PDF into PDF/A archival format (placeholder).",
    endpoint: "/api/pdf/pdf-to-pdf-a",
    accept: "application/pdf",
    multiple: false,
    fields: [],
  },
  "resize-png": {
    title: "Resize PNG",
    description: "Resize a PNG image.",
    endpoint: "/api/image/resize",
    accept: "image/png",
    multiple: false,
    fields: [
      { name: "width", label: "Width (px)", type: "number", min: 1 },
      { name: "height", label: "Height (px)", type: "number", min: 1 },
    ],
  },
  "resize-jpg": {
    title: "Resize JPG",
    description: "Resize a JPG image.",
    endpoint: "/api/image/resize",
    accept: "image/jpeg",
    multiple: false,
    fields: [
      { name: "width", label: "Width (px)", type: "number", min: 1 },
      { name: "height", label: "Height (px)", type: "number", min: 1 },
    ],
  },
  "resize-webp": {
    title: "Resize WebP",
    description: "Resize a WebP image.",
    endpoint: "/api/image/resize",
    accept: "image/webp",
    multiple: false,
    fields: [
      { name: "width", label: "Width (px)", type: "number", min: 1 },
      { name: "height", label: "Height (px)", type: "number", min: 1 },
    ],
  },
  "bulk-resize": {
    title: "Bulk Resize",
    description: "Resize multiple images at once.",
    endpoint: "/api/image/bulk-resize",
    accept: "image/*",
    multiple: true,
    fields: [
      { name: "width", label: "Width (px)", type: "number", min: 1 },
      { name: "height", label: "Height (px)", type: "number", min: 1 },
    ],
  },
  "crop-png": {
    title: "Crop PNG",
    description: "Crop a PNG image.",
    endpoint: "/api/image/crop",
    accept: "image/png",
    multiple: false,
    fields: [
      { name: "x", label: "X coordinate", type: "number", min: 0 },
      { name: "y", label: "Y coordinate", type: "number", min: 0 },
      { name: "width", label: "Width", type: "number", min: 1 },
      { name: "height", label: "Height", type: "number", min: 1 },
    ],
  },
  "crop-jpg": {
    title: "Crop JPG",
    description: "Crop a JPG image.",
    endpoint: "/api/image/crop",
    accept: "image/jpeg",
    multiple: false,
    fields: [
      { name: "x", label: "X coordinate", type: "number", min: 0 },
      { name: "y", label: "Y coordinate", type: "number", min: 0 },
      { name: "width", label: "Width", type: "number", min: 1 },
      { name: "height", label: "Height", type: "number", min: 1 },
    ],
  },
  "crop-webp": {
    title: "Crop WebP",
    description: "Crop a WebP image.",
    endpoint: "/api/image/crop",
    accept: "image/webp",
    multiple: false,
    fields: [
      { name: "x", label: "X coordinate", type: "number", min: 0 },
      { name: "y", label: "Y coordinate", type: "number", min: 0 },
      { name: "width", label: "Width", type: "number", min: 1 },
      { name: "height", label: "Height", type: "number", min: 1 },
    ],
  },
  "rotate-image": {
    title: "Rotate Image",
    description: "Rotate an image by 90, 180, or 270 degrees.",
    endpoint: "/api/image/rotate",
    accept: "image/*",
    multiple: false,
    fields: [
      {
        name: "angle",
        label: "Rotation angle",
        type: "number",
        min: 90,
        max: 270,
      },
    ],
  },
  "flip-image": {
    title: "Flip Image",
    description: "Flip an image horizontally or vertically.",
    endpoint: "/api/image/flip",
    accept: "image/*",
    multiple: false,
    fields: [
      {
        name: "flipMode",
        label: "Flip mode (horizontal or vertical)",
        type: "text",
      },
    ],
  },
  "heic-to-jpg": {
    title: "HEIC to JPG",
    description: "Convert HEIC image to JPG.",
    endpoint: "/api/image/convert",
    accept: "image/heic",
    multiple: false,
    fields: [
      { name: "outputFormat", label: "", type: "hidden", value: "jpeg" },
    ],
  },
  "webp-to-png": {
    title: "WebP to PNG",
    description: "Convert WebP image to PNG.",
    endpoint: "/api/image/convert",
    accept: "image/webp",
    multiple: false,
    fields: [{ name: "outputFormat", label: "", type: "hidden", value: "png" }],
  },
  "webp-to-jpg": {
    title: "WebP to JPG",
    description: "Convert WebP image to JPG.",
    endpoint: "/api/image/convert",
    accept: "image/webp",
    multiple: false,
    fields: [
      { name: "outputFormat", label: "", type: "hidden", value: "jpeg" },
    ],
  },
  "png-to-jpg": {
    title: "PNG to JPG",
    description: "Convert PNG image to JPG.",
    endpoint: "/api/image/convert",
    accept: "image/png",
    multiple: false,
    fields: [
      { name: "outputFormat", label: "", type: "hidden", value: "jpeg" },
    ],
  },
  "png-to-svg": {
    title: "PNG to SVG",
    description: "Convert PNG to SVG (placeholder).",
    endpoint: "/api/image/placeholder",
    accept: "image/png",
    multiple: false,
    fields: [],
  },
  "compress-jpeg": {
    title: "Compress JPEG",
    description: "Compress a JPEG image.",
    endpoint: "/api/image/compress",
    accept: "image/jpeg",
    multiple: false,
    fields: [
      {
        name: "quality",
        label: "Quality (1-100)",
        type: "number",
        min: 1,
        max: 100,
      },
    ],
  },
  "png-compressor": {
    title: "PNG Compressor",
    description: "Compress a PNG image.",
    endpoint: "/api/image/compress",
    accept: "image/png",
    multiple: false,
    fields: [
      {
        name: "quality",
        label: "Quality (1-100)",
        type: "number",
        min: 1,
        max: 100,
      },
    ],
  },
  "gif-compressor": {
    title: "GIF Compressor",
    description: "Compress a GIF image (placeholder).",
    endpoint: "/api/image/placeholder",
    accept: "image/gif",
    multiple: false,
    fields: [],
  },
  "image-enlarger": {
    title: "Image Enlarger",
    description: "Upscale an image.",
    endpoint: "/api/image/enlarge",
    accept: "image/*",
    multiple: false,
    fields: [
      {
        name: "scale",
        label: "Scale factor (e.g. 1.5)",
        type: "number",
        min: 1,
      },
    ],
  },
  "meme-generator": {
    title: "Meme Generator",
    description: "Generate a meme from an image (placeholder).",
    endpoint: "/api/image/placeholder",
    accept: "image/*",
    multiple: false,
    fields: [],
  },
  "color-picker": {
    title: "Color Picker",
    description: "Pick a dominant color from an image (placeholder).",
    endpoint: "/api/image/placeholder",
    accept: "image/*",
    multiple: false,
    fields: [],
  },
};

function ToolPage() {
  const { toolId } = useParams();
  const config = toolId ? toolConfig[toolId] : undefined;
  const { getToken } = useAuth();
  const { isLoaded, user } = useUser();
  const [files, setFiles] = useState(null);
  const [formState, setFormState] = useState({
    pageStart: "1",
    pageEnd: "1",
    width: "800",
    height: "600",
    quality: "75",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadName, setDownloadName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = config?.title ?? (toolId ? toolId.replace(/-/g, " ") : "Tool");

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files));
  };

  useEffect(() => {
    const input = document.getElementById("file-upload-input");
    if (input && files && files.length > 0) {
      const dataTransfer = new DataTransfer();
      files.forEach(file => dataTransfer.items.add(file));
      input.files = dataTransfer.files;
    }
  }, [files]);

  const moveFile = (index, direction) => {
    const newFiles = [...files];
    if (direction === "up" && index > 0) {
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    } else if (direction === "down" && index < newFiles.length - 1) {
      [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
    }
    setFiles(newFiles);
  };

  const handleChange = (event) => {
    setFormState((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", downloadName || "merged.pdf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!config) {
      setStatusMessage("This tool is not available yet.");
      return;
    }

    if (!isLoaded || !user) {
      setStatusMessage("Please sign in to use this tool.");
      return;
    }

    if (!files || files.length === 0) {
      setStatusMessage("Please upload at least one file.");
      return;
    }

    setStatusMessage("Processing...");
    setIsSubmitting(true);
    setDownloadUrl("");
    setDownloadName("");

    try {
      const token = await getToken();
      const formData = new FormData();

      if (config.multiple) {
        Array.from(files).forEach((file) => formData.append("files", file));
      } else {
        formData.append("file", files[0]);
      }

      for (const field of config.fields) {
        formData.append(field.name, formState[field.name] ?? "");
      }

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}${config.endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        const error = await response.json();
        setStatusMessage(error.error || "Upload failed");
        return;
      }

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(
          new Blob([blob], { type: "application/pdf" }),
        );
        setDownloadUrl(url);
        setDownloadName("merged-toolkit.pdf");
        setStatusMessage("Success! Your PDF is ready.");
        return;
      }

      const data = await response.json();
      setStatusMessage(data.message || "Done");
    } catch (error) {
      console.error("Tool Submission Error:", error);
      setStatusMessage(
        `Error: ${error.message || "Service unavailable"}. Check if the backend is running on port 4000.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableFields = useMemo(() => config?.fields ?? [], [config]);

  return (
    <div className="tool-page">
      <div className="tool-page-header">
        <div>
          <h1>{title}</h1>
          <p>{config?.description || "This tool is coming soon."}</p>
        </div>
        <Link to="/" className="back-link">
          Back to dashboard
        </Link>
      </div>

      {config ? (
        files && files.length > 0 ? (
          <div className="workspace-layout">
            {/* Left side: workspace */}
            <div className="workspace-main">
              <div className="workspace-actions">
                 <button type="button" className="add-more-btn" onClick={() => document.getElementById('file-upload-input').click()}>
                   Add more files +
                 </button>
              </div>
              
              <div className="pdf-grid">
                {files.map((file, i) => (
                  <div key={i} className="pdf-card">
                    <div className="pdf-card-preview">
                      <div className="pdf-card-page">
                         <PdfThumbnail file={file} />
                      </div>
                    </div>
                    <div className="pdf-card-info" title={file.name}>
                       {file.name}
                    </div>
                    {config.multiple && (
                      <div className="pdf-card-controls">
                        <button type="button" onClick={() => moveFile(i, "up")} disabled={i === 0} title="Move Left">⬅️</button>
                        <button type="button" onClick={() => moveFile(i, "down")} disabled={i === files.length - 1} title="Move Right">➡️</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: sidebar */}
            <div className="workspace-sidebar">
              <h2>{title}</h2>
              <div className="info-box">
                <span>ℹ️</span> To change the order of your PDFs, click the left/right arrows on the files.
              </div>

              <form
                className="tool-form workspace-form"
                onSubmit={handleSubmit}
                method="POST"
                encType="multipart/form-data"
              >
                <input
                  id="file-upload-input"
                  type="file"
                  name={config.multiple ? "files" : "file"}
                  accept={config.accept}
                  onChange={handleFileChange}
                  multiple={config.multiple}
                  style={{ display: 'none' }}
                />

                {availableFields.map((field) =>
                  field.type === "hidden" ? (
                    <input
                      key={field.name}
                      type="hidden"
                      name={field.name}
                      value={field.value ?? formState[field.name] ?? ""}
                    />
                  ) : (
                    <label key={field.name} className="tool-field">
                      <span>{field.label}</span>
                      <input
                        name={field.name}
                        type={field.type}
                        value={formState[field.name] ?? ""}
                        onChange={handleChange}
                        min={field.min}
                        max={field.max}
                      />
                    </label>
                  ),
                )}
                
                <button type="submit" className="merge-btn">
                  {title} ➔
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="tool-content initial-upload-view">
             <label className="upload-dropzone">
                <span className="upload-icon">📄</span>
                <h2>Select PDF files</h2>
                <p>or drop PDFs here</p>
                <input
                  id="initial-upload"
                  type="file"
                  name={config.multiple ? "files" : "file"}
                  accept={config.accept}
                  onChange={handleFileChange}
                  multiple={config.multiple}
                  style={{ display: 'none' }}
                />
             </label>
          </div>
        )
      ) : (
        <div className="tool-placeholder">
          <p>
            Tool support is not available yet. You can still use the dashboard
            tools as placeholders.
          </p>
        </div>
      )}

      {statusMessage && (
        <div
          className={`tool-status ${statusMessage.includes("Error") ? "error" : ""}`}
        >
          {statusMessage}
        </div>
      )}

      {downloadUrl && (
        <div className="download-area">
          <p>Success! Your files have been processed.</p>
          <button className="tool-download-btn" onClick={handleDownload}>
            Download Merged PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default ToolPage;

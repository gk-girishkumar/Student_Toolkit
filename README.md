# 🎓 Student Toolkit

A high-performance, full-stack utility platform designed to empower students with powerful PDF and image manipulation tools. Built with a modern tech stack focusing on speed, security, and ease of use.

![Student Toolkit Banner](https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200&h=400)

## ✨ Features

### 📄 PDF Powerhouse
*   **Merge & Split**: Combine multiple documents into one or extract specific ranges with precision.
*   **Page Management**: Effortlessly remove unnecessary pages or extract specific once for your assignments.
*   **Rotation & Watermarking**: Orient your documents correctly and protect your work with custom text watermarks.
*   **Cropping**: Remove unwanted margins from your PDF pages.
*   **Multi-format Conversion**:
    *   Convert **JPG/PNG to PDF** for easy sharing.
    *   Convert **PDF to JPG** for presentation slides.
    *   **Scan to PDF** utility for digitizing physical notes.

### 🖼️ Advanced Image Processing
*   **Intelligent Cropping**: Precision cropping for PNG, JPG, and WebP formats.
*   **Smart Resizing**: Resize images for various submission requirements.
*   **Optimization**: Compress large image files while maintaining visual quality.
*   **Format Conversion**: Switch between JPEG, PNG, and WebP seamlessly.
*   **Effects**: Flip images horizontally or vertically and enlarge them with high-quality scaling.

### 🔒 Secure & Personal
*   **Authentication**: Secure login and signup powered by **Clerk**.
*   **Personal Dashboard**: Track your tool usage and manage your profile.
*   **Subscription Model**: Premium features unlocked via **Stripe** integration.

## 🛠️ Tech Stack

-   **Frontend**: React 18, Vite, TypeScript, React Router.
-   **Backend**: Node.js, Express, Multer (File Handling).
-   **Database**: PostgreSQL.
-   **Media Engines**: `pdf-lib` for document manipulation and `sharp` for high-speed image processing.
-   **Authentication**: Clerk SDK.
-   **Payments**: Stripe API.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Clerk & Stripe Accounts

### 2. Installation
```bash
# Install all dependencies (Backend & Frontend)
npm install
```

### 3. Environment Configuration
Create `.env` files in both `frontend/` and `backend/` directories using the provided templates.

### 4. Running the Development Server
**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for students, by Girish Kumar.*

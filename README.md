# Chalapathi Institute of Technology - Student ID Card Generator 🎓

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A web application built to generate, customize, preview in real time, and print official Student ID cards for **Chalapathi Institute of Technology (Autonomous)** with sub-pixel alignment, dynamic Code 128 barcode generation, photo manipulation, and bulk CSV batch processing.

---

## ✨ Features

- **Exact Official Template Alignment**:
  - Matched 1:1 with official CIT Autonomous ID cards.
  - Continuous, unbroken accreditation dashed divider line across the entire width.
  - Zero unwanted underlines or text layering artifacts.
- **Live Real-Time Studio Preview**:
  - Student Name, Roll No / Registration No., Branch, Mobile Number, Blood Group, and Academic Batch update instantly on the canvas.
- **Interactive Passport Photo Positioning**:
  - Drag-and-drop or file upload (PNG, JPG, WEBP).
  - Zoom scaling (`50%` to `250%`) and X/Y Pan sliders.
  - **Direct Canvas Drag**: Click and drag directly on the photo inside the card preview to position it naturally!
- **Dynamic Barcode Generator (Code 128)**:
  - Generates standard high-density vertical Code 128 barcodes matching the student's Roll Number.
  - Optional toggle to retain the authentic template barcode.
- **Export & Print Ready**:
  - 🖨️ **Print Card**: Standard CR80 PVC card dimensions (`72mm × 96mm` / 300 DPI equivalent) with `@media print` layout (no page clutter, headers, or buttons).
  - 💾 **Download PNG**: Full 768 × 1024 px high-resolution image export.
  - 📄 **Download PDF**: Standard formatted print PDF generated via `jsPDF`.
- **Bulk CSV Batch Processing**:
  - Download standard CSV template (`Name, RegNo, Branch, Mobile, BloodGroup, Batch`).
  - Upload filled CSV to flip through student records or export all cards in a single `.zip` bundle.
- **Zero-CORS Offline Support**:
  - Base assets are bundled as base64 in `assets_data.js`, enabling the app to run completely offline or by double-clicking `index.html` without CORS restrictions.
- **Mobile Responsive Design**:
  - Native-app style mobile interface with a sticky tab switcher (`Edit Form` vs `Live Preview`), floating preview pill, and touch-optimized photo drag.

---

## 🚀 Deployment Options

### 1. Deploy to GitHub Pages (Free)
1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit - Ready for deployment"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select `Deploy from a branch`.
   - Under **Branch**, choose `main` / `/ (root)` and click **Save**.
3. Your site will be live at: `https://<your-username>.github.io/<your-repo-name>/`

---

### 2. Deploy to Vercel (Free)
1. Import your GitHub repository on [Vercel](https://vercel.com/new).
2. Framework Preset: **Other** (Static).
3. Root Directory: `./` (leave default).
4. Click **Deploy**. The included `vercel.json` automatically configures headers, caching, and clean routing.

---

### 3. Deploy to Netlify (Free)
1. Import your repository on [Netlify](https://app.netlify.com/start).
2. Publish Directory: `.`
3. Build Command: *(Leave blank)*
4. Click **Deploy site**. The included `netlify.toml` handles security and asset caching.

---

### 4. Deploy with Docker / Render / Railway
This project includes an ultra-lightweight `Dockerfile` powered by Alpine Nginx:
```bash
# Build the Docker image
docker build -t cit-idcard-generator .

# Run the container
docker run -p 80:80 cit-idcard-generator
```
Visit `http://localhost` to view the app.

---

## 💻 Running Locally

### Option 1: Python Server (Recommended)
```bash
python server.py
```
Automatically binds to port `5500` (or `$PORT` in cloud environments) and opens your default browser at `http://localhost:5500`.

### Option 2: Node.js / NPX
```bash
npx serve . -p 5500
```

### Option 3: Direct Browser Launch
Simply double-click `index.html` to open it in Chrome, Edge, Safari, or Firefox without any local server needed.

---

## 📁 Project Structure

```
idcardproject/
├── index.html              # Modern responsive UI with Tailwind & FontAwesome
├── styles.css              # Custom styling, mobile optimizations, & print rules
├── app.js                  # Canvas render engine, photo panning, & export logic
├── assets_data.js          # Zero-CORS embedded base64 image bundle
├── server.py               # Multi-threaded Python dev server with CORS & $PORT
├── manifest.json           # Web App Manifest for mobile PWA install
├── favicon.svg             # CIT branding vector favicon
├── vercel.json             # Vercel deployment configuration
├── netlify.toml            # Netlify deployment configuration
├── Dockerfile              # Production Alpine Nginx container setup
├── nginx.conf              # High-performance Nginx configuration with gzip & headers
├── .nojekyll               # Disables Jekyll processing for GitHub Pages
├── .gitignore              # Git ignore rules for clean repository
├── package.json            # Node.js project definition & scripts
├── assets/
│   ├── perfect_base_template.png  # Calibrated master template
│   ├── sample_photo.jpg           # Reference passport photo
│   └── target_reference.jpg       # Authentic ground truth reference
└── README.md               # Documentation & deployment guide
```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

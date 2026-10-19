# SFCode Studio
> **by SFCode - Shadat Fatih Code**  
> *Create. Customize. Connect.*

An industrial-grade, Apple-inspired, privacy-first QR Code & Barcode Generator, Design Lab, Smart Scanner, and Batch Production Studio built with React 19, TypeScript, Vite, Tailwind CSS, `bwip-js`, `qrcode`, `@zxing/browser`, and `jsPDF`.

---

## 🌟 Key Features

### 1. Universal QR Code Generator
- **Supported Payloads**:
  - Plain Text & Raw Structured Data
  - Website URLs (`https://...`)
  - Email Addresses with pre-filled subject and body (`mailto:`)
  - Telephone Numbers (`tel:`)
  - SMS Messages with pre-filled text (`sms:`)
  - Wi-Fi Network Credentials (`WIFI:S:ssid;T:type;P:password;H:hidden;;`)
  - Full vCard 3.0 Contact Cards (Name, Org, Title, Tel, Email, URL, Address)
  - Social Profiles (X/Twitter, Instagram, LinkedIn, GitHub, YouTube, Facebook, Telegram)
  - Geographic Coordinates (`geo:lat,lng?q=query`)
  - Calendar Events (iCalendar `BEGIN:VEVENT`)
  - Payments (UPI `upi://pay`, PayPal.me, Custom Crypto/Web3)
  - Hosted Image / File URLs (with architectural note clarifying binary QR payload limits)
- **Live Preview & Validation**: Real-time error messages, character counter, and ISO/IEC 18004 compliance.
- **Error Correction Levels**: Low (7%), Medium (15%), Quartile (25%), High (30%).

### 2. Barcode Generator (`bwip-js`)
- **Supported Formats**:
  - `Code 128`: Universal high-density ASCII & logistics
  - `EAN-13`: International retail GTIN-13 with automatic Modulo-10 checksum validation
  - `EAN-8`: Compact retail packaging GTIN-8
  - `UPC-A`: North American retail GTIN-12
  - `UPC-E`: Zero-suppressed 8-digit compact UPC
  - `Code 39`: Alphanumeric industrial standard
  - `ITF-14`: Interleaved 2 of 5 for corrugated shipping cartons
  - `Codabar`: Libraries, blood banks, and air freight
  - `GS1-128`: Structured enterprise logistics with Application Identifiers
  - `Data Matrix`: High-density 2D matrix for healthcare and micro-electronics
  - `PDF417`: Stacked 2D barcode for boarding passes and ID badges
- **Controls**: Human-readable text toggle, barcode height, module scale, custom colors, product caption, SKU, and price tag.
- **GS1 Reference**: Explicit guidelines on commercial GTIN registration.

### 3. Design Lab with Live Scan Reliability Decoder Test
- **Module Patterns**: Classic Squares, Rounded Squircles, Circular Dots, Classy Diamonds, Fluid Blobs.
- **Finder Eye Patterns**: Classic Square, Rounded Ring, Circle Ring, Leaf Asymmetric.
- **Colors & Gradients**: Solid HEX inputs, Curated Apple Palettes, Linear Gradients (with angle control), Radial Gradients, and Transparent Backgrounds.
- **Center Logo Upload**: Custom PNG/SVG/JPEG logo upload with scale ratio, margin padding, and circular mask. Automatically elevates error correction to High (H: 30%) to guarantee readability.
- **Outer Frames & Banners**: Top Banner, Bottom Banner ("SCAN ME", "VISIT WEBSITE", "CONNECT TO WI-FI", "SAVE CONTACT", custom text) with independent frame colors.
- **Real-Time In-Browser Decoder Verification**: Feeds the styled canvas into the `@zxing/browser` engine in real time, calculating an exact Scan Reliability Score (e.g. 98/100) and warning if contrast is too low for physical camera sensors.

### 4. Smart Scanner
- **Dual Input Modes**: Device camera video feed or instant image file drag-and-drop.
- **Camera Controls**: Rear/Front camera switching, start/stop/retry, and flashlight/torch toggle (on supported devices).
- **Safety First**: External web URLs are never automatically opened without explicit user confirmation.
- **Smart Actions**: One-click copy, Web Share API, vCard downloader, Wi-Fi credential view, dialer, and maps integration.
- **Web Audio Feedback**: Pleasing iOS-style affirmative chirp upon successful decode.

### 5. Batch Production Studio
- **Input Methods**: Multi-line paste or CSV file upload (`payload, title, sku, price`).
- **Row-by-Row Validation**: Live table detailing row number, input, status, and error message.
- **Export Options**: Individual PNG downloads or a single ZIP archive containing all rendered PNG images and a `manifest.csv` index.

### 6. Local History & Favorites (IndexedDB via `idb`)
- **Zero Cloud Uploads**: Payloads, passwords, and scanned results remain strictly in browser storage.
- **Full Control**: Live search, type filtering, duplicate, rename, favorite, delete, and clear all.
- **Data Portability**: Full JSON database backup export and restore.

### 7. Dual Localization: English & বাংলা (Bengali)
- Instant toggle between English and Bengali with Noto Sans Bengali font support.
- Complete translations across navigation, forms, error messages, and dialogs.

### 8. Progressive Web App (PWA) & Android Capacitor
- Service worker caching for full offline generation capability.
- In-app install banner with Chromium `beforeinstallprompt` handling and guided iOS Safari instructions.
- Pre-configured `capacitor.config.ts` for export to Android Studio.

---

## 🛠️ Development & Build

### Prerequisites
- Node.js 18+ (tested on v22)
- npm or bun

### Setup & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
# Build production bundle
npm run build
```

---

## 📱 Capacitor Android Packaging Guide

To package SFCode Studio as a native Android APK or Google Play App Bundle:

```bash
# 1. Build the production web bundle
npm run build

# 2. Install Capacitor core and Android platform
npm install @capacitor/core @capacitor/cli @capacitor/android

# 3. Add Android platform
npx cap add android

# 4. Copy and synchronize the web dist files into Android project
npx cap copy
npx cap sync

# 5. Open in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle build to finish.
2. Ensure Camera permission is declared in `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-feature android:name="android.hardware.camera" android:required="false" />
   ```
3. Run on a connected physical Android device or emulator, or select **Build > Generate Signed Bundle / APK**.

---

## 📋 Feature Checklist & QA Verification

| Feature Area | Status | Verification Details |
|---|---|---|
| **QR Plain Text, URL, Email, Phone, SMS** | ✅ Complete | RFC compliant payloads generated and rendered cleanly |
| **QR Wi-Fi with Encryption & Hidden Flag** | ✅ Complete | Standard `WIFI:S:..;T:..;P:..;;` format verified |
| **QR vCard 3.0** | ✅ Complete | Generates multi-field vCards with Name, Org, Tel, Email |
| **QR Social, Geo, Event, Payment** | ✅ Complete | Validated coordinate links, iCal VEVENT, and UPI URIs |
| **QR Hosted Image Explanation** | ✅ Complete | Educational banner explaining binary storage limits |
| **QR Custom Dots & Finder Eyes** | ✅ Complete | Squares, dots, rounded, classy diamonds, fluid blobs |
| **Center Logo Upload & Masking** | ✅ Complete | Circular mask, margin padding, auto-elevation to High EC |
| **Live Scan Reliability Tester** | ✅ Complete | In-browser ZXing decoding loop testing real-time readability |
| **Barcode 1D (Code 128, Code 39, ITF-14, Codabar)** | ✅ Complete | Powered by bwip-js with alphanumeric validation |
| **Barcode Retail (EAN-13, EAN-8, UPC-A, UPC-E)** | ✅ Complete | Automatic Modulo-10 checksum validation & calculation |
| **Barcode 2D (Data Matrix, PDF417, GS1-128)** | ✅ Complete | High-density 2D formats rendered on canvas |
| **GS1 Registration Advisory** | ✅ Complete | Clear notice that commercial GTINs require GS1 licensing |
| **Smart Camera Scanner** | ✅ Complete | Camera stream, rear-camera preference, device switcher |
| **Torch / Flashlight Toggle** | ✅ Complete | Checks `torch` constraint capability before toggling |
| **Image File Drag-and-Drop Scanner** | ✅ Complete | Uploads & decodes PNG, JPG, WebP images instantly |
| **Safe Link Confirmation Dialog** | ✅ Complete | Warns before opening untrusted external URLs |
| **High-Res PNG & Vector PDF Export** | ✅ Complete | 1x, 2x, 4x scaling and jsPDF print document output |
| **Batch Studio (Paste & CSV)** | ✅ Complete | Row-by-row status, sample CSV, and ZIP + manifest |
| **IndexedDB Local Storage** | ✅ Complete | Powered by `idb` with backup JSON export & import |
| **English & বাংলা Localization** | ✅ Complete | Full dictionary switch with Noto Sans Bengali typography |
| **PWA Install & Offline Mode** | ✅ Complete | Service worker, manifest, and in-app install buttons |
| **Capacitor Android Config** | ✅ Complete | Configured in `capacitor.config.ts` |

### Note on Physical Device Testing
- **Torch / Flashlight**: Requires a physical mobile phone camera with hardware LED flash (desktop webcams do not have hardware torches).
- **Camera Permissions**: Browsers require HTTPS or `localhost` to allow camera permissions.

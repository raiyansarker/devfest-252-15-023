# TenderPack 📑

A completely **client-side** web application built for seamless management, organization, and packaging of tender document submissions. This app lets users drag and drop a `requirements.json` file, upload multiple PDF files, map them against tender requirements, validate constraints (like expiry dates), and instantly generate a compiled, indexed, and formatted final PDF package.

Designed for speed, privacy, and zero server costs—everything runs directly in your browser.

## ✨ Features

### Core Requirements
- **JSON & PDF Uploads:** Native support for dragging and dropping the `requirements.json` schema and bulk uploading PDF files (including entire folders).
- **Validation Engine:** Validates mandatory vs. optional requirements, checks document expiry dates against the submission deadline, and provides visual status badges (Missing, OK, Expired, Expiry Needed).
- **Duplicate Detection:** Generates SHA-256 hashes of uploaded files in the browser to detect and prevent duplicate document uploads.
- **Bilingual Interface:** Fully localized in English and Bengali (বাংলা), seamlessly switching titles and UI elements.
- **Client-Side PDF Generation:** Merges all mapped PDFs sequentially, injecting a formal Cover Page (English) and a dynamic Index Page (Bilingual) using `pdf-lib`.
- **Global Footers:** Automatically injects the Tender ID and "Page X of Y" on every generated page.

### 🌟 Bonus Features Implemented
1. **Seal & Signature Overlay:** Upload a transparent PNG signature or company seal. The generator automatically scales and stamps it onto the bottom-right corner of every generated page in the final PDF!
2. **Dual Auto-Match Algorithms:** 
   - **Local Heuristics:** Employs a robust Levenshtein distance matrix scoring system and bilingual keyword matching (with stop-words filter) to guess assignments.
   - **AI Auto-Match (Gemini):** Plug in your Google Gemini API key to let an advanced LLM instantly map complex or vaguely named files to the exact tender requirements!
3. **Export Checklist as CSV:** Instantly export the current requirement list, matched file names, page counts, and live statuses to a clean `.csv` file for offline sharing and review.
4. **State Persistence & "Start Over":** Your progress is automatically saved to the browser's `IndexedDB`. If you refresh or close the tab, everything—including your mapped PDFs—is restored. Want a clean slate? Hit the "Start Over" button.
5. **Perfect Bengali Text Rendering in PDFs:** Standard PDF engines break Indic scripts. This app uses an advanced HTML5 Canvas text-to-image engine under the hood to ensure Bengali text on the PDF Index Page is shaped and rendered *flawlessly*.

## 🚀 Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Routing:** TanStack Router (File-based routing)
- **Styling:** Tailwind CSS (v4)
- **State Management:** React Context API + `useReducer`
- **PDF Manipulation:** `pdf-lib` (generation) & `pdfjs-dist` (parsing/page counts)
- **Storage:** `idb-keyval` (IndexedDB for storing files offline)
- **Other:** `file-saver` (CSV/PDF downloads)

## 🛠️ Getting Started

Because this application relies on no external backends, running it is incredibly simple.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd devfest-252-15-023
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open in Browser:**
   Navigate to `http://localhost:3000` to start building your tender packages!

## 📦 Building for Production

To build a highly optimized static bundle:

```bash
npm run build
```

You can preview the built static assets using:

```bash
npm run preview
```

## 🏗️ Architecture & Technical Decisions
* **SSR Conflicts:** Originally configured with TanStack Start SSR, `pdfjs-dist` interacts poorly with Node's environment. The architecture was strategically shifted to lazy-load PDF parsing in the browser to guarantee stability.
* **Canvas Bengali Shaping:** `pdf-lib` does not natively contain Complex Text Layout (CTL) engines required for South Asian scripts. We bypass this limitation by drawing text on a hidden DOM Canvas utilizing the browser's native HarfBuzz shaping engine, extracting the image buffer, and embedding it directly into the PDF.

---
*Built for the DevFest '25 Hackathon Challenge.*

# StudyGenius AI - Setup & Installation Guide

This document provides complete, step-by-step instructions to set up and run the StudyGenius AI project on any new device (Windows, macOS, Linux).

---

## 📋 System Prerequisites

Before starting, ensure the following are installed on your device:

1. **Python 3.10 to 3.13** (Recommended): [python.org/downloads](https://www.python.org/downloads/)
   - *Windows tip:* Check the box **"Add python.exe to PATH"** during installation.
2. **Node.js 18+ (LTS)**: [nodejs.org](https://nodejs.org/)
   - Includes `npm` package manager.
3. **Git**: [git-scm.com](https://git-scm.com/)
4. **Google Gemini API Key**:
   - Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## ⚡ Quick Setup (Automated)

### Windows
Run the setup script in the project root:
```bat
setup.bat
```
Then add your API key to `backend\.env`, and launch the project:
```bat
start.bat
```

### macOS / Linux
Make scripts executable and run:
```bash
chmod +x setup.sh start.sh
./setup.sh
```
Then add your API key to `backend/.env`, and launch:
```bash
./start.sh
```

---

## 🛠️ Manual Step-by-Step Setup

If you prefer to configure manually or encounter any issues with scripts, follow these steps:

### 1. Clone Repository
```bash
git clone <repository-url>
cd minor
```

---

### 2. Backend Setup (FastAPI & Vector DB)

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment**:
   ```bash
   # Windows
   python -m venv venv

   # macOS / Linux
   python3 -m venv venv
   ```

3. **Activate the virtual environment**:
   ```bash
   # Windows (PowerShell)
   .\venv\Scripts\Activate.ps1

   # Windows (Command Prompt)
   venv\Scripts\activate.bat

   # macOS / Linux
   source venv/bin/activate
   ```

4. **Upgrade pip and install dependencies**:
   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

5. **Configure environment variables**:
   Create a `.env` file from the example:
   ```bash
   # Windows
   copy .env.example .env

   # macOS / Linux
   cp .env.example .env
   ```
   Open `backend/.env` in your text editor and insert your Gemini API key:
   ```env
   GEMINI_API_KEY=AIzaSy...your_actual_gemini_key_here
   ```

6. **Ingest course syllabus & notes into ChromaDB vector store**:
   *(Requires your `GEMINI_API_KEY` to be set in `.env`)*
   ```bash
   python ingest.py
   ```
   > You should see `[SUCCESS] Successfully ingested new data into ChromaDB at './chroma_db'!`.

7. **Start the FastAPI backend server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   - API is live at: `http://127.0.0.1:8000`
   - Interactive Swagger docs: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup (Next.js & Tailwind CSS)

Open a **new terminal window** in the project root:

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Configure frontend environment**:
   ```bash
   # Windows
   copy .env.example .env.local

   # macOS / Linux
   cp .env.example .env.local
   ```
   *(By default, `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000`)*

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```
   - Web application is live at: `http://localhost:3000`

---

## 🔍 Verification & Health Check

1. Open your browser and go to `http://localhost:3000`.
2. Look at the top navigation bar:
   - Green indicator: **Backend Connected**
   - Red indicator: Backend offline or not reachable. Ensure `uvicorn` is running on port 8000.
3. Try asking a question in the **Chat** tab or generating a quiz from the syllabus to confirm Gemini API and ChromaDB are responding.

---

## 🐛 Troubleshooting

### Issue 1: "Vector database not found. Please run ingest.py first."
- **Reason**: The Chroma database is not checked into git (by design) and must be generated locally.
- **Fix**:
  1. Activate backend virtual environment: `cd backend && .\venv\Scripts\activate`
  2. Make sure `.env` has a valid `GEMINI_API_KEY`.
  3. Run: `python ingest.py --reset`

### Issue 2: PowerShell script execution error (`Activate.ps1 cannot be loaded`)
- **Reason**: Windows PowerShell script execution policy restricts scripts.
- **Fix**: Run this in PowerShell before activating:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
  Or activate using CMD: `venv\Scripts\activate.bat`.

### Issue 3: Port 8000 or 3000 already in use
- **Fix for Backend**:
  ```bash
  uvicorn main:app --reload --port 8001
  ```
  *(Update `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8001` in `frontend/.env.local`)*
- **Fix for Frontend**:
  ```bash
  npm run dev -- -p 3001
  ```

### Issue 4: Python package build error on Windows (MSVC / C++ required)
- **Fix**: Ensure you are using Python 3.10 - 3.12 where prebuilt binary wheels for `chromadb` and `pydantic-core` are readily available. If using Python 3.14+, install the Microsoft C++ Build Tools or use Python 3.11/3.12.

---

## 📁 Project Architecture

```
minor/
├── backend/
│   ├── docs/             # Syllabus, question papers, and study markdown files
│   ├── chroma_db/        # Local Chroma vector database (created by ingest.py)
│   ├── main.py           # FastAPI server with RAG, Quiz, Viva, Podcast, Flashcards
│   ├── ingest.py         # Chunker & embedding ingestion pipeline
│   ├── requirements.txt  # Python package dependencies
│   ├── .env.example      # Sample backend environment file
│   └── .env              # Private backend environment file (gitignored)
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js App Router pages and styling
│   │   ├── components/   # UI tabs, Viva exam scene, character avatars, header
│   │   ├── lib/          # API client helpers (talks to backend :8000)
│   │   └── types/        # TypeScript interfaces and data contracts
│   ├── package.json      # Frontend npm dependencies
│   ├── .env.example      # Sample frontend environment file
│   └── .env.local        # Private frontend environment file (gitignored)
├── setup.bat / .sh       # One-click automated setup scripts
├── start.bat / .sh       # One-click dual-server launch scripts
└── SETUP.md              # Setup and onboarding documentation
```

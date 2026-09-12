# 🎓 StudyGenius AI - Academic RAG & Smart Study Platform

An intelligent, full-stack academic assistant powered by Retrieval-Augmented Generation (RAG) and Google Gemini AI. StudyGenius AI helps students analyze university syllabi, solve previous year question papers (PYQs), generate interactive mind maps, create formula cheatsheets, take mock tests, and summarize lecture notes with cited sources.

---

## 🚀 Key Features

- **📚 AI Chat with RAG**: Ask questions based strictly on your university curriculum and curated course markdown documents with source citation.
- **📄 Previous Year Question Paper (PYQ) Solver**: Step-by-step solutions, unit-wise breakdown, and mark distributions for university exam papers.
- **🧠 Interactive Mind Maps & Cheatsheets**: Generate structured visual concepts and quick formula reference cards for exam revisions.
- **📝 Smart Mock Tests**: Generate customized quizzes and mock exams with instant AI grading and explanations.
- **🎙️ Lecture Summarizer**: Distill complex lecture notes into key takeaways, bullet points, and exam focus areas.
- **⚡ LaTeX & Markdown Rendering**: Complete support for KaTeX math formulas, code syntax highlighting, and responsive dark/light UI.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Math & Markdown**: `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `katex`, `highlight.js`
- **Effects**: `canvas-confetti`

### Backend
- **Framework**: FastAPI (Python 3.10+) + Uvicorn
- **AI & RAG Framework**: LangChain, LangChain Google GenAI (`gemini-2.5-flash`, `gemini-1.5-pro`)
- **Vector Database**: ChromaDB (`chromadb`, `langchain-chroma`)
- **Embeddings**: Google Generative AI Embeddings (`models/embedding-001` or `text-embedding-004`)

---

## 📁 Project Structure

```text
minor/
├── backend/
│   ├── docs/                  # Markdown syllabus and question papers
│   │   ├── sem1/              # Semester 1 syllabus files
│   │   ├── sem2/              # Semester 2 syllabus files
│   │   └── question_papers/   # University past exam papers
│   ├── static/                # Static assets (images, charts, etc.)
│   ├── chroma_db/             # Local Chroma vector store (git-ignored)
│   ├── ingest.py              # Script to vectorize & index markdown docs
│   ├── main.py                # FastAPI endpoints & RAG pipeline
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Backend environment template
│
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router pages & layout
│   │   └── components/        # React components (Chat, PYQ, Mindmap, etc.)
│   ├── public/                # Public frontend assets
│   ├── package.json           # Node.js dependencies
│   ├── tsconfig.json          # TypeScript config
│   └── .env.example           # Frontend environment template
│
├── .gitignore                 # Unified gitignore for backend & frontend
└── README.md                  # Project documentation
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher (npm / pnpm / yarn)
- **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

---

### 2. Backend Setup

1. Open terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   - Create a `.env` file in `backend/` based on `.env.example`:
     ```env
     GEMINI_API_KEY=your_google_gemini_api_key_here
     ```

5. Ingest syllabus and question paper documents into ChromaDB:
   ```bash
   python ingest.py
   ```

6. Start the FastAPI backend server:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   API Docs will be available at: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create `.env.local` based on `.env.example`:
     ```env
     NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and visit: `http://localhost:3000`

---

## 🔒 Security & Best Practices

- Do **not** commit `.env` or `.env.local` files containing sensitive API keys.
- Vector database caches (`backend/chroma_db`) and virtual environments (`venv/`) are excluded via `.gitignore`.

---

## 📄 License

This project is licensed under the MIT License.

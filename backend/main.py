import os
import glob
import json
import re
import time
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from fastapi.concurrency import run_in_threadpool
load_dotenv()

# Set GOOGLE_API_KEY if GEMINI_API_KEY is present
if os.environ.get("GEMINI_API_KEY") and not os.environ.get("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = os.environ["GEMINI_API_KEY"]

app = FastAPI(title="StudyGenius AI - RAG Study Platform")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

persist_directory = "./chroma_db"
docs_directory = "docs"

FALLBACK_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-1.5-flash"
]

def get_api_key() -> str:
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY not configured. Please add your key to backend/.env"
        )
    return key

def get_vectorstore():
    if not os.path.exists(persist_directory):
        return None
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return None
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=api_key)
    print("done getting vector")
    return Chroma(persist_directory=persist_directory, embedding_function=embeddings)

FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]

def invoke_llm_with_fallback(prompt_text: str) -> str:
    """Invoke Gemini with automatic model fallback when free tier rate limits or quota are encountered."""
    key = get_api_key()
    last_err = None

    for model_name in FALLBACK_MODELS:
        try:
            # Explicitly set temperature and pass api key
            llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=key,
                temperature=0.3,
                max_retries=1  # Let fallback loop handle model switches quickly
            )
            
            # Disable automatic tool/function calling binding if LangChain tries to infer tools
            res = llm.invoke(prompt_text)
            
            if res and res.content:
                return res.content
                
        except Exception as e:
            err_str = str(e)
            last_err = e
            print(f"[Model Fallback] {model_name} failed: {err_str[:120]}... Trying next model.")
            
            # Pause briefly to prevent rapid quota burn across fallbacks
            time.sleep(1)
            continue

    # All models failed in the fallback list
    raise HTTPException(
        status_code=429,
        detail=f"All Gemini fallback models exhausted or rate-limited. Details: {str(last_err)}"
    )
def clean_json_response(raw_text: str) -> Any:
    """Extract and parse JSON from LLM output, handling markdown fences and formatting."""
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Search for first { and last } or [ and ]
        json_match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except Exception:
                pass
        raise HTTPException(status_code=500, detail="Failed to parse structured response from AI model.")

def get_document_context(document_filter: str = "all", max_chars_per_doc: int = 3500) -> str:
    """Gather context from documents and question papers."""
    if not os.path.exists(docs_directory):
        return ""

    all_files = glob.glob(os.path.join(docs_directory, "**", "*.md"), recursive=True) + glob.glob(os.path.join(docs_directory, "*.md"))
    # Remove duplicates preserving order
    seen = set()
    unique_files = []
    for f in all_files:
        norm = os.path.normpath(f)
        if norm not in seen:
            seen.add(norm)
            unique_files.append(norm)

    if document_filter and document_filter != "all":
        filename = os.path.basename(document_filter)
        for fpath in unique_files:
            if os.path.basename(fpath) == filename or document_filter in fpath.replace("\\", "/"):
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()
                    return f"=== Document: {filename} ===\n{content[:max_chars_per_doc * 3]}\n"

    # All documents
    combined_texts = []
    for fpath in unique_files:
        fname = os.path.basename(fpath)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
            combined_texts.append(f"=== Document: {fname} ===\n{content[:max_chars_per_doc]}\n")
    
    return "\n\n".join(combined_texts)

# ----------------- Models -----------------

class ChatRequest(BaseModel):
    query: str
    student_context: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]

class SolveQuestionRequest(BaseModel):
    question_text: str
    marks: Optional[str] = "8"
    course_context: Optional[str] = None
    student_context: Optional[str] = None

class SolveQuestionResponse(BaseModel):
    solution: str
    key_formulae: List[str] = []
    marking_tips: str = ""

class QuizRequest(BaseModel):
    document: str = "all"
    count: int = 5
    difficulty: str = "mixed"
    student_context: Optional[str] = None

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_index: int
    explanation: str
    source: str

class QuizResponse(BaseModel):
    title: str
    document: str
    questions: List[QuizQuestion]

class FlashcardRequest(BaseModel):
    document: str = "all"
    count: int = 8
    student_context: Optional[str] = None

class FlashcardItem(BaseModel):
    id: int
    front: str
    back: str
    category: str
    source: str

class FlashcardResponse(BaseModel):
    deck_title: str
    document: str
    cards: List[FlashcardItem]

class MindMapRequest(BaseModel):
    document: str = "all"
    student_context: Optional[str] = None

class MindMapResponse(BaseModel):
    title: str
    document: str
    mermaid_code: str
    hierarchy: Dict[str, Any]

# ----------------- Endpoints -----------------

@app.get("/api/documents")
async def list_documents():
    """List all available documents and question papers with metadata."""
    if not os.path.exists(docs_directory):
        return {"documents": []}
    
    docs = []
    all_files = glob.glob(os.path.join(docs_directory, "**", "*.md"), recursive=True) + glob.glob(os.path.join(docs_directory, "*.md"))
    seen = set()

    for fpath in all_files:
        norm = os.path.normpath(fpath)
        if norm in seen:
            continue
        seen.add(norm)

        fname = os.path.basename(fpath)
        rel_path = os.path.relpath(fpath, ".").replace("\\", "/")
        title = fname.replace(".md", "").replace("_", " ").title()
        preview = ""
        size_bytes = os.path.getsize(fpath)
        
        is_qp = "question_papers" in rel_path or "exam" in fname.lower() or "may_" in fname.lower() or "dec_" in fname.lower()
        course_code = None
        exam_name = None
        max_marks = None

        try:
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read(1500)
                first_lines = content.split("\n")[:10]
                for line in first_lines:
                    if line.startswith("# "):
                        title = line.lstrip("# ").strip()
                    if "**Code:**" in line:
                        course_code = line.split("**Code:**")[-1].strip()
                        is_qp = True
                    if "**Exam:**" in line:
                        exam_name = line.split("**Exam:**")[-1].strip()
                        is_qp = True
                    if "**Maximum Marks:**" in line:
                        max_marks = line.split("**Maximum Marks:**")[-1].strip()

                preview = content[:220].replace("\n", " ").strip() + "..."
        except Exception:
            pass

        docs.append({
            "id": rel_path,
            "filename": fname,
            "title": title,
            "category": "question_paper" if is_qp else "study_notes",
            "course_code": course_code,
            "exam_name": exam_name,
            "max_marks": max_marks,
            "size_kb": round(size_bytes / 1024, 1),
            "preview": preview
        })
    return {"documents": docs}

@app.get("/api/structure")
async def get_curriculum_structure():
    """Return the multi-semester curriculum structure (Semesters 1-8, Subjects, Units, Syllabus, Question Papers)."""
    semesters_data = []
    
    for sem_num in range(1, 9):
        sem_folder = f"sem{sem_num}"
        sem_path = os.path.join(docs_directory, sem_folder)
        
        subjects = []
        syllabus_doc = None
        question_papers = []
        
        if os.path.exists(sem_path):
            # Check syllabus
            syl_files = glob.glob(os.path.join(sem_path, "syllabus_*.md")) + glob.glob(os.path.join(sem_path, "*syllabus*.md"))
            if syl_files:
                syl_path = syl_files[0]
                syllabus_doc = {
                    "id": os.path.relpath(syl_path, ".").replace("\\", "/"),
                    "filename": os.path.basename(syl_path),
                    "title": f"Semester {sem_num} Syllabus",
                    "size_kb": round(os.path.getsize(syl_path) / 1024, 1)
                }
            
            # Check subjects
            subj_dir = os.path.join(sem_path, "subjects")
            if os.path.exists(subj_dir):
                for subj_folder in sorted(os.listdir(subj_dir)):
                    subj_folder_path = os.path.join(subj_dir, subj_folder)
                    if os.path.isdir(subj_folder_path):
                        units = []
                        unit_files = sorted(glob.glob(os.path.join(subj_folder_path, "*.md")))
                        for u_idx, uf in enumerate(unit_files, 1):
                            ufname = os.path.basename(uf)
                            utitle = ufname.replace(".md", "").replace("_", " ").title()
                            try:
                                with open(uf, "r", encoding="utf-8") as f:
                                    for line in f.read(500).split("\n")[:5]:
                                        if line.startswith("# "):
                                            utitle = line.lstrip("# ").strip()
                                            break
                            except Exception:
                                pass
                            units.append({
                                "id": os.path.relpath(uf, ".").replace("\\", "/"),
                                "number": u_idx,
                                "filename": ufname,
                                "title": utitle,
                                "size_kb": round(os.path.getsize(uf) / 1024, 1)
                            })
                        
                        subj_name = subj_folder.replace("_", " ").title()
                        subjects.append({
                            "id": subj_folder,
                            "name": subj_name,
                            "units": units
                        })
            
            # Check question papers
            qp_dir = os.path.join(sem_path, "question_papers")
            if os.path.exists(qp_dir):
                qp_files = sorted(glob.glob(os.path.join(qp_dir, "*.md")))
                for qf in qp_files:
                    qfname = os.path.basename(qf)
                    qtitle = qfname.replace(".md", "").replace("_", " ").title()
                    code = None
                    try:
                        with open(qf, "r", encoding="utf-8") as f:
                            content = f.read(1000)
                            for line in content.split("\n")[:10]:
                                if line.startswith("# "):
                                    qtitle = line.lstrip("# ").strip()
                                if "**Code:**" in line:
                                    code = line.split("**Code:**")[-1].strip()
                    except Exception:
                        pass
                    
                    question_papers.append({
                        "id": os.path.relpath(qf, ".").replace("\\", "/"),
                        "filename": qfname,
                        "title": qtitle,
                        "course_code": code,
                        "size_kb": round(os.path.getsize(qf) / 1024, 1)
                    })

        semesters_data.append({
            "number": sem_num,
            "name": f"Semester {sem_num}",
            "syllabus_doc": syllabus_doc,
            "subjects": subjects,
            "question_papers": question_papers,
            "has_content": bool(subjects or syllabus_doc or question_papers)
        })
        
    return {"semesters": semesters_data}

@app.post("/api/solve-question", response_model=SolveQuestionResponse)
async def solve_question(request: SolveQuestionRequest):
    """Generate a step-by-step model exam answer for a question paper problem."""
    student_info = f"\nStudent Academic Profile: {request.student_context}\n" if request.student_context else ""
    prompt = f"""
You are an expert university professor and exam evaluator.
Provide a complete, top-scoring step-by-step solution for the following university exam question worth {request.marks} marks.
{student_info}{f"Course context: {request.course_context}" if request.course_context else ""}

Question:
{request.question_text}

Requirements:
1. Provide a rigorous, step-by-step solution with mathematical derivations, diagrams / structure descriptions, and bullet points where applicable.
2. Structure the answer clearly with headings: Concept/Definition, Detailed Derivation/Explanation, and Final Answer.
3. Use LaTeX formatting for formulas ($...$ or $$...$$).

Output strictly valid JSON with this exact schema:
{{
  "solution": "Full markdown formatted solution with step-by-step derivations and formulas",
  "key_formulae": ["Formula 1", "Formula 2"],
  "marking_tips": "Key points that examiners award full marks for"
}}
"""
    raw_content = invoke_llm_with_fallback(prompt)
    data = clean_json_response(raw_content)
    
    return SolveQuestionResponse(
        solution=data.get("solution", "Solution generated by AI."),
        key_formulae=data.get("key_formulae", []),
        marking_tips=data.get("marking_tips", "Follow step-by-step presentation for full marks.")
    )

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    print("requesting")
    
    # Get vectorstore instance
    vectorstore = get_vectorstore()
    if not vectorstore:
        raise HTTPException(status_code=500, detail="Vector database not found. Please run ingest.py first.")

    # 1. Offload synchronous vector search to threadpool
    docs = await run_in_threadpool(vectorstore.similarity_search, request.query, k=4)
    print("done getting vector")

    context_text = "\n\n---\n\n".join([doc.page_content for doc in docs])
    student_info = f"\nStudent Profile & Syllabus:\n{request.student_context}\n" if request.student_context else ""
    
    prompt = f"""
You are an expert, encouraging AI study tutor. Use the following retrieved context and student academic profile to answer the user's question clearly, thoroughly, and accurately in accordance with their curriculum.
Include examples, step-by-step mathematical derivations, code snippets, or definitions when helpful.
If the retrieved context does not contain the answer, say what is known and clarify.
{student_info}
Retrieved Context:
{context_text}

Question:
{request.query}

Answer:
"""
    # 2. Offload blocking LLM invocation to threadpool
    answer_text = await run_in_threadpool(invoke_llm_with_fallback, prompt)
    
    # 3. Process metadata sources
    sources = []
    seen_sources = set()
    for doc in docs:
        source_path = doc.metadata.get("source", "Unknown")
        if source_path not in seen_sources:
            sources.append({
                "source": source_path, 
                "content_preview": doc.page_content[:140] + "..."
            })
            seen_sources.add(source_path)

    return ChatResponse(answer=answer_text, sources=sources)


@app.post("/api/quiz", response_model=QuizResponse)
async def generate_quiz(request: QuizRequest):
    context = get_document_context(request.document)
    if not context.strip():
        raise HTTPException(status_code=400, detail="No document content available. Please verify docs exist.")

    student_info = f"\nStudent Curriculum Context: {request.student_context}\n" if request.student_context else ""
    prompt = f"""
You are an educational assessment expert. Generate a high-quality, engaging {request.count}-question multiple choice quiz based strictly on the following study materials and student curriculum level.
{student_info}
Study Material:
{context}

Requirements:
1. Generate exactly {request.count} questions.
2. Difficulty level: {request.difficulty}.
3. Each question must have exactly 4 plausible options.
4. Set correct_index as the 0-based integer index of the correct answer (0, 1, 2, or 3).
5. Provide a clear, educational explanation for why that answer is correct.
6. Tag the source document name (e.g. unit_3_string.md).

Output strictly valid JSON with NO additional commentary or markdown wrappers, matching this exact schema:
{{
  "title": "Topic Quiz Title",
  "questions": [
    {{
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Detailed explanation here.",
      "source": "document_name.md"
    }}
  ]
}}
"""
    raw_content = invoke_llm_with_fallback(prompt)
    data = clean_json_response(raw_content)
    
    questions = []
    for i, q in enumerate(data.get("questions", []), start=1):
        questions.append(QuizQuestion(
            id=i,
            question=q.get("question", f"Question {i}"),
            options=q.get("options", ["A", "B", "C", "D"])[:4],
            correct_index=int(q.get("correct_index", 0)),
            explanation=q.get("explanation", ""),
            source=q.get("source", request.document)
        ))
    
    title = data.get("title", f"Quiz on {request.document if request.document != 'all' else 'All Topics'}")
    return QuizResponse(title=title, document=request.document, questions=questions)

@app.post("/api/flashcards", response_model=FlashcardResponse)
async def generate_flashcards(request: FlashcardRequest):
    context = get_document_context(request.document)
    if not context.strip():
        raise HTTPException(status_code=400, detail="No document content available. Please verify docs exist.")

    student_info = f"\nStudent Curriculum Context: {request.student_context}\n" if request.student_context else ""
    prompt = f"""
You are an expert learning specialist. Generate {request.count} high-yield, conceptual flashcards based strictly on the provided study materials.
{student_info}
Study Material:
{context}

Requirements:
1. Create exactly {request.count} flashcards.
2. Front: A concise question, key term, core principle, or problem prompt.
3. Back: Clear, high-impact explanation, definition, code example, or formula summary.
4. Category: A relevant subtopic tag (e.g. "String Basics", "Fourier Series", "Language Theory", "Derivations").
5. Source: Name of the relevant document.

Output strictly valid JSON with NO extra text or markdown codeblocks, following this exact schema:
{{
  "deck_title": "Study Deck Title",
  "cards": [
    {{
      "id": 1,
      "front": "Term or Question on Front",
      "back": "Clear concise answer or concept on Back",
      "category": "Subtopic Category",
      "source": "document_name.md"
    }}
  ]
}}
"""
    raw_content = invoke_llm_with_fallback(prompt)
    data = clean_json_response(raw_content)
    
    cards = []
    for i, c in enumerate(data.get("cards", []), start=1):
        cards.append(FlashcardItem(
            id=i,
            front=c.get("front", ""),
            back=c.get("back", ""),
            category=c.get("category", "General"),
            source=c.get("source", request.document)
        ))
    
    deck_title = data.get("deck_title", f"Flashcards for {request.document if request.document != 'all' else 'All Topics'}")
    return FlashcardResponse(deck_title=deck_title, document=request.document, cards=cards)

@app.post("/api/mindmap", response_model=MindMapResponse)
async def generate_mindmap(request: MindMapRequest):
    context = get_document_context(request.document)
    if not context.strip():
        raise HTTPException(status_code=400, detail="No document content available. Please verify docs exist.")

    student_info = f"\nStudent Curriculum Context: {request.student_context}\n" if request.student_context else ""
    prompt = f"""
You are an expert in visual knowledge synthesis. Create a structured concept Mind Map representing key concepts, subtopics, rules, and formulas from the study material.
{student_info}
Study Material:
{context}

Requirements:
1. Construct a valid Mermaid.js mindmap diagram string (starts with 'mindmap' and uses 2-space indentation).
   Note: Mermaid node labels should avoid special characters like parentheses or quotes that break Mermaid syntax. Keep labels concise.
2. Construct a corresponding hierarchical JSON tree object with 'name' and 'children' for interactive exploration.

Output strictly valid JSON matching this schema:
{{
  "title": "Concept Mind Map Title",
  "mermaid_code": "mindmap\\n  root((Study Concepts))\\n    Topic1\\n      SubtopicA\\n      SubtopicB\\n    Topic2\\n      SubtopicC",
  "hierarchy": {{
    "name": "Central Topic",
    "children": [
      {{
        "name": "Subtopic A",
        "description": "Brief summary",
        "children": [
          {{ "name": "Key Detail 1", "description": "Formula or rule" }}
        ]
      }}
    ]
  }}
}}
"""
    raw_content = invoke_llm_with_fallback(prompt)
    data = clean_json_response(raw_content)
    
    title = data.get("title", f"Mind Map: {request.document if request.document != 'all' else 'All Topics'}")
    mermaid_code = data.get("mermaid_code", "mindmap\n  root((Study Concepts))\n    Topic A\n    Topic B")
    hierarchy = data.get("hierarchy", {"name": title, "children": []})
    
    return MindMapResponse(
        title=title,
        document=request.document,
        mermaid_code=mermaid_code,
        hierarchy=hierarchy
    )

# Mount docs directory so they can be viewed
app.mount("/docs", StaticFiles(directory="docs"), name="docs")

# Mount static directory for frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

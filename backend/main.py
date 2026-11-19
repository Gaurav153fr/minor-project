import os
import glob
import json
import re
import time
import uuid
from datetime import datetime, timedelta
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
    "gemini-3.8-flash",
    "gemini-flash-latest",
]

def _extract_text_content(content: Any) -> str:
    """Normalize LangChain/Gemini content to plain string (handles both str and list of parts)."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                parts.append(item.get("text", ""))
            elif hasattr(item, "text"):
                parts.append(str(item.text))
            else:
                parts.append(str(item))
        return "".join(parts)
    return str(content)

def invoke_llm_with_fallback(prompt_text: str) -> str:
    """Invoke Gemini with automatic model fallback and retry for transient network/rate limits."""
    key = get_api_key()
    last_err = None

    for model_name in FALLBACK_MODELS:
        # Try up to 2 attempts per model for transient socket drops
        for attempt in range(2):
            try:
                llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    google_api_key=key,
                    temperature=0.3,
                    max_retries=1
                )
                res = llm.invoke(prompt_text)
                if res and res.content:
                    extracted = _extract_text_content(res.content)
                    if extracted.strip():
                        return extracted
            except Exception as e:
                err_str = str(e)
                last_err = e
                print(f"[Model Fallback] {model_name} (attempt {attempt+1}) error: {err_str[:120]}...")
                time.sleep(1.5)
                continue

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

# ───────────────────────────────────────────────────────────────
# PODCAST AI — Two-Host Conversational Episode Generator
# ───────────────────────────────────────────────────────────────

class PodcastRequest(BaseModel):
    topic: str = "all"
    language: str = "english"       # "english" | "hindi"
    duration: str = "medium"        # "short" | "medium" | "long"
    student_context: Optional[str] = None

class PodcastDialogueLine(BaseModel):
    turn: int
    speaker: str                    # "Arjun" | "Priya"
    text: str
    emotion: Optional[str] = "neutral"

class PodcastHostInfo(BaseModel):
    name: str
    gender: str
    lang_code: str

class PodcastScript(BaseModel):
    episode_title: str
    topic_tag: str
    language: str
    duration_minutes: int
    host1: PodcastHostInfo
    host2: PodcastHostInfo
    script: List[PodcastDialogueLine]

@app.post("/api/podcast/generate", response_model=PodcastScript)
async def generate_podcast(request: PodcastRequest):
    """Generate a two-host podcast script from syllabus content using RAG."""
    context = get_document_context(request.topic, max_chars_per_doc=4500)
    if not context.strip():
        raise HTTPException(status_code=400, detail="No document content found. Please verify docs directory.")

    duration_map = {"short": (8, 3), "medium": (14, 6), "long": (22, 10)}
    turns, minutes = duration_map.get(request.duration, (14, 6))

    student_info = f"\nStudent context: {request.student_context}" if request.student_context else ""
    lang = request.language.lower()

    if lang == "hindi":
        lang_code = "hi-IN"
        lang_instructions = """
Language rules (VERY IMPORTANT):
- Write in casual everyday Hindi + Hinglish. NOT formal/suddh Hindi.
- Mix English technical terms naturally (e.g. "database", "query", "pointer" stay in English).
- Arjun's style: "Yaar", "bhai", "matlab", "wait wait", "accha accha", "ek second", "seriously?", "ohhhh"
- Priya's style: "Arre simple hai", "dekh aise samajh", "basically", "toh hua kya", "haan exactly", "sun sun"
- Use relatable Indian college examples: canteen, exams, hostel, WhatsApp group, phone battery dying
- Natural interruptions: "Haan haan—", "Ruk ruk—", "arey bata na!"
- NEVER use: "समझिए", "इस प्रकार", "आपको बताते हैं" (too formal)
- Keep it fun, light, like two friends in a college cafe chatting
"""
        host1_name, host2_name = "Arjun", "Priya"
        intro_instruction = f"Start with Arjun casually saying 'Welcome to StudyGenius Podcast yaar!' in Hinglish and introducing the topic."
    else:
        lang = "english"
        lang_code = "en-IN"
        lang_instructions = """
Language rules (VERY IMPORTANT):
- Casual conversational English — NO textbook tone, NO formal language
- Use analogies comparing CS/tech concepts to everyday life
- Arjun's style: "Wait so basically...", "Hold on—", "Okay but why though?", "That's actually wild"
- Priya's style: "Right! Think of it like...", "Exactly, and here's the cool part—", "No no, listen—"
- Light Gen-Z energy: "lowkey", "literally", "okay but—", "no cap"
- Include "aha moments" where Arjun suddenly gets a concept
- Make jokes, use comparisons: databases like organized fridges, etc.
- Keep it fun, like a study podcast two friends made in their dorm
"""
        host1_name, host2_name = "Arjun", "Priya"
        intro_instruction = f"Start with Arjun saying 'Welcome back to StudyGenius Podcast!' and excitedly introducing today's topic."

    prompt = f"""You are a podcast scriptwriter. Write a fun, engaging two-host podcast episode about the study topic below.

Hosts:
- {host1_name}: The curious one — slightly confused, asks questions on behalf of the listener, reacts with surprise
- {host2_name}: The knowledgeable one — explains concepts simply, uses analogies, occasionally teases {host1_name}

{lang_instructions}

Study Material (use this as the source of truth for content):
{context}
{student_info}

Instructions:
1. Write exactly {turns} dialogue turns total (alternating between {host1_name} and {host2_name}).
2. Cover the key concepts from the study material but explain them conversationally.
3. {intro_instruction}
4. End with {host2_name} summarizing the key points in a fun way, then {host1_name} signing off.
5. Each line should be 1-4 natural spoken sentences. No bullet points inside the text.
6. Assign an emotion per line: "curious", "explaining", "surprised", "laughing", "excited", "thoughtful"

Return ONLY valid JSON (no markdown, no extra text) matching this exact schema:
{{
  "episode_title": "Catchy episode title with emoji",
  "topic_tag": "Subject - Topic",
  "duration_minutes": {minutes},
  "script": [
    {{
      "turn": 1,
      "speaker": "{host1_name}",
      "text": "Dialogue line here.",
      "emotion": "curious"
    }}
  ]
}}"""

    raw = await run_in_threadpool(invoke_llm_with_fallback, prompt)
    data = clean_json_response(raw)

    script_lines = []
    for item in data.get("script", []):
        script_lines.append(PodcastDialogueLine(
            turn=item.get("turn", len(script_lines) + 1),
            speaker=item.get("speaker", host1_name),
            text=item.get("text", ""),
            emotion=item.get("emotion", "neutral"),
        ))

    return PodcastScript(
        episode_title=data.get("episode_title", f"Episode: {request.topic}"),
        topic_tag=data.get("topic_tag", request.topic),
        language=lang,
        duration_minutes=data.get("duration_minutes", minutes),
        host1=PodcastHostInfo(name=host1_name, gender="male", lang_code=lang_code),
        host2=PodcastHostInfo(name=host2_name, gender="female", lang_code=lang_code),
        script=script_lines,
    )

# ───────────────────────────────────────────────────────────────
# VIVA AI — Oral Exam Simulator
# ───────────────────────────────────────────────────────────────

# In-memory session store  { session_id: {...} }
viva_sessions: Dict[str, Any] = {}

SESSION_TTL_HOURS = 2  # auto-expire stale sessions

def _purge_old_sessions():
    cutoff = datetime.utcnow() - timedelta(hours=SESSION_TTL_HOURS)
    stale = [sid for sid, s in viva_sessions.items() if s.get("created_at", datetime.utcnow()) < cutoff]
    for sid in stale:
        del viva_sessions[sid]

# ── Pydantic models ──

class VivaStartRequest(BaseModel):
    topic: str = "all"          # 'all' or a specific doc path
    difficulty: str = "mixed"  # easy | medium | hard | mixed
    question_count: int = 8
    student_context: Optional[str] = None

class VivaNextQuestion(BaseModel):
    question_number: int
    question: str
    topic_tag: str

class VivaStartResponse(BaseModel):
    session_id: str
    total_questions: int
    question_number: int
    question: str
    topic_tag: str

class VivaAnswerRequest(BaseModel):
    session_id: str
    question_number: int          # 1-based
    student_answer: str

class VivaAnswerResponse(BaseModel):
    score: int
    max_score: int
    feedback: str
    correct_answer_summary: str
    is_last_question: bool
    next_question: Optional[VivaNextQuestion] = None

class VivaSummaryRequest(BaseModel):
    session_id: str

class VivaQuestionBreakdown(BaseModel):
    question_number: int
    question: str
    student_answer: str
    score: int
    max_score: int
    feedback: str
    correct_answer_summary: str
    topic_tag: str

class VivaSummaryResponse(BaseModel):
    total_score: int
    max_score: int
    percentage: float
    grade: str
    weak_topics: List[str]
    strong_topics: List[str]
    recommendations: str
    question_breakdown: List[VivaQuestionBreakdown]

# ── Helpers ──

def _grade(pct: float) -> str:
    if pct >= 85: return "A+"
    if pct >= 75: return "A"
    if pct >= 65: return "B"
    if pct >= 55: return "C"
    if pct >= 45: return "D"
    return "F"

# ── Endpoints ──

@app.post("/api/viva/start", response_model=VivaStartResponse)
async def viva_start(request: VivaStartRequest):
    """Generate a viva session: RAG-powered question bank from syllabus + return first question."""
    _purge_old_sessions()

    context = get_document_context(request.topic, max_chars_per_doc=4000)
    if not context.strip():
        raise HTTPException(status_code=400, detail="No document content found. Please verify docs directory.")

    count = max(3, min(request.question_count, 15))
    student_info = f"\nStudent profile: {request.student_context}" if request.student_context else ""

    prompt = f"""You are a strict but fair university viva examiner.
Generate exactly {count} oral viva questions from the study material below.
Difficulty: {request.difficulty}.{student_info}

Study Material:
{context}

Rules:
1. Questions must be open-ended (not MCQ). They should test deep understanding.
2. Provide an ideal expected answer for each question (2-5 sentences, exam-ready).
3. Include a short topic_tag (e.g. "DBMS - Normalization", "OS - Scheduling").
4. Vary difficulty if "mixed"; otherwise target {request.difficulty} questions only.

Return ONLY valid JSON (no markdown fences) matching this exact schema:
{{
  "questions": [
    {{
      "q_num": 1,
      "question": "Question text here?",
      "expected_answer": "Concise model answer here.",
      "topic_tag": "Subject - Topic"
    }}
  ]
}}"""

    raw = await run_in_threadpool(invoke_llm_with_fallback, prompt)
    data = clean_json_response(raw)

    questions = data.get("questions", [])
    if not questions:
        raise HTTPException(status_code=500, detail="AI failed to generate viva questions. Please try again.")

    session_id = str(uuid.uuid4())
    viva_sessions[session_id] = {
        "questions": questions,
        "answers": {},       # q_num -> student_answer
        "scores": {},        # q_num -> int score
        "feedback": {},      # q_num -> str feedback
        "correct_answers": {},  # q_num -> str
        "total": len(questions),
        "config": {
            "topic": request.topic,
            "difficulty": request.difficulty,
        },
        "created_at": datetime.utcnow(),
    }

    first = questions[0]
    return VivaStartResponse(
        session_id=session_id,
        total_questions=len(questions),
        question_number=first.get("q_num", 1),
        question=first.get("question", ""),
        topic_tag=first.get("topic_tag", "General"),
    )


@app.post("/api/viva/answer", response_model=VivaAnswerResponse)
async def viva_answer(request: VivaAnswerRequest):
    """Evaluate student's answer for a viva question and return score + feedback."""
    session = viva_sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Viva session not found or expired. Please start a new session.")

    # Find the question being answered
    q_entry = next((q for q in session["questions"] if q.get("q_num") == request.question_number), None)
    if not q_entry:
        raise HTTPException(status_code=400, detail=f"Question number {request.question_number} not found in session.")

    expected = q_entry.get("expected_answer", "")
    question_text = q_entry.get("question", "")
    topic_tag = q_entry.get("topic_tag", "General")

    prompt = f"""You are a strict university viva examiner evaluating a student's oral answer.

Question: {question_text}
Topic: {topic_tag}
Expected Answer (model): {expected}
Student's Answer: {request.student_answer}

Evaluate on three criteria (each out of 5 marks):
1. Accuracy — Is the answer factually correct?
2. Completeness — Does it cover all key points?
3. Clarity — Is it well-explained and structured?

Return ONLY valid JSON (no markdown fences):
{{
  "accuracy": <0-5>,
  "completeness": <0-5>,
  "clarity": <0-5>,
  "feedback": "2-3 sentence constructive feedback mentioning what was good and what was missed.",
  "correct_answer_summary": "Concise 2-3 sentence model answer the student should know."
}}"""

    raw = await run_in_threadpool(invoke_llm_with_fallback, prompt)
    eval_data = clean_json_response(raw)

    acc = int(eval_data.get("accuracy", 3))
    comp = int(eval_data.get("completeness", 3))
    clar = int(eval_data.get("clarity", 3))
    score = acc + comp + clar

    # Store results
    session["answers"][request.question_number] = request.student_answer
    session["scores"][request.question_number] = score
    session["feedback"][request.question_number] = eval_data.get("feedback", "")
    session["correct_answers"][request.question_number] = eval_data.get("correct_answer_summary", expected)

    # Find next question
    all_q_nums = [q.get("q_num") for q in session["questions"]]
    current_idx = all_q_nums.index(request.question_number)
    is_last = current_idx + 1 >= len(all_q_nums)
    next_q: Optional[VivaNextQuestion] = None

    if not is_last:
        nq = session["questions"][current_idx + 1]
        next_q = VivaNextQuestion(
            question_number=nq.get("q_num"),
            question=nq.get("question", ""),
            topic_tag=nq.get("topic_tag", "General"),
        )

    return VivaAnswerResponse(
        score=score,
        max_score=15,
        feedback=eval_data.get("feedback", ""),
        correct_answer_summary=eval_data.get("correct_answer_summary", expected),
        is_last_question=is_last,
        next_question=next_q,
    )


@app.post("/api/viva/summary", response_model=VivaSummaryResponse)
async def viva_summary(request: VivaSummaryRequest):
    """Generate final scorecard and recommendations for a completed viva session."""
    session = viva_sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Viva session not found or expired.")

    total_score = sum(session["scores"].values())
    total_possible = len(session["questions"]) * 15
    pct = round((total_score / total_possible * 100) if total_possible > 0 else 0, 1)
    grade = _grade(pct)

    # Build per-question breakdown
    breakdown: List[VivaQuestionBreakdown] = []
    weak_topics: List[str] = []
    strong_topics: List[str] = []

    for q in session["questions"]:
        q_num = q.get("q_num")
        score = session["scores"].get(q_num, 0)
        topic_tag = q.get("topic_tag", "General")
        breakdown.append(VivaQuestionBreakdown(
            question_number=q_num,
            question=q.get("question", ""),
            student_answer=session["answers"].get(q_num, "(not answered)"),
            score=score,
            max_score=15,
            feedback=session["feedback"].get(q_num, ""),
            correct_answer_summary=session["correct_answers"].get(q_num, ""),
            topic_tag=topic_tag,
        ))
        if score < 8:
            if topic_tag not in weak_topics:
                weak_topics.append(topic_tag)
        elif score >= 12:
            if topic_tag not in strong_topics:
                strong_topics.append(topic_tag)

    # Generate AI recommendations
    weak_str = ", ".join(weak_topics) if weak_topics else "None identified"
    prompt = f"""A student just completed a viva exam with {pct}% score (Grade: {grade}).
Weak topics: {weak_str}
Strong topics: {", ".join(strong_topics) if strong_topics else "None"}

Write 2-3 sentences of specific, actionable study recommendations to improve weak areas.
Keep it encouraging and practical. Return only the recommendation text, no JSON."""

    recommendations = await run_in_threadpool(invoke_llm_with_fallback, prompt)

    # Clean session
    del viva_sessions[request.session_id]

    return VivaSummaryResponse(
        total_score=total_score,
        max_score=total_possible,
        percentage=pct,
        grade=grade,
        weak_topics=weak_topics,
        strong_topics=strong_topics,
        recommendations=recommendations.strip(),
        question_breakdown=breakdown,
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


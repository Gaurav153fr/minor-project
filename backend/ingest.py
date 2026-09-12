import os
import glob
import sys
import shutil
import argparse
from dotenv import load_dotenv
from langchain_text_splitters import MarkdownTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

# Check for API key
if not api_key:
    print("Error: GEMINI_API_KEY not found in environment variables.")
    print("Please create a .env file based on .env.example and add your key.")
    sys.exit(1)

if not os.environ.get("GOOGLE_API_KEY") and api_key:
    os.environ["GOOGLE_API_KEY"] = api_key

def ingest_documents(reset: bool = False):
    docs_dir = "docs"
    persist_directory = "./chroma_db"
    
    if not os.path.exists(docs_dir):
        print(f"Error: Directory '{docs_dir}' not found.")
        return

    md_files = glob.glob(os.path.join(docs_dir, "**", "*.md"), recursive=True)
    # Remove duplicates while preserving order
    seen = set()
    unique_md_files = []
    for f in md_files:
        norm = os.path.normpath(f)
        if norm not in seen:
            seen.add(norm)
            unique_md_files.append(f)
    md_files = unique_md_files

    if not md_files:
        print(f"No markdown files found in {docs_dir}/")
        return

    # Handle database reset if requested
    if reset and os.path.exists(persist_directory):
        print(f"Reset flag detected. Removing existing database at '{persist_directory}'...")
        shutil.rmtree(persist_directory, ignore_errors=True)

    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=api_key
    )

    vectorstore = Chroma(
        persist_directory=persist_directory,
        embedding_function=embeddings
    )

    # Check which documents are already indexed in Chroma
    existing_sources = set()
    try:
        existing_data = vectorstore.get()
        if existing_data and existing_data.get("metadatas"):
            for meta in existing_data["metadatas"]:
                if meta and "source" in meta:
                    existing_sources.add(meta["source"])
    except Exception as e:
        print(f"Note: Initializing new Chroma collection ({e})")

    # Filter out files that are already indexed
    files_to_process = []
    for file_path in md_files:
        normalized_path = os.path.normpath(file_path).replace("\\", "/")
        if not reset and normalized_path in existing_sources:
            print(f"[SKIP] '{normalized_path}' is already ingested.")
        else:
            files_to_process.append((file_path, normalized_path))

    if not files_to_process:
        print("\nAll documents are already indexed in ChromaDB! No new files to ingest.")
        print("(Tip: Run 'python ingest.py --reset' if you want to rebuild the database from scratch.)")
        return

    print(f"\nFound {len(files_to_process)} new document(s) to ingest.")

    # Load new documents with semester & category metadata
    documents = []
    for file_path, normalized_path in files_to_process:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            sem_match = "sem" in normalized_path
            doc_type = "notes"
            if "syllabus" in normalized_path:
                doc_type = "syllabus"
            elif "question_paper" in normalized_path or "may_" in normalized_path:
                doc_type = "question_paper"

            documents.append(Document(
                page_content=content,
                metadata={
                    "source": normalized_path,
                    "doc_type": doc_type,
                }
            ))
        print(f"[LOAD] Loaded '{normalized_path}' (Type: {doc_type})")

    # Split documents into chunks
    markdown_splitter = MarkdownTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = markdown_splitter.split_documents(documents)
    print(f"\n[SPLIT] Split {len(documents)} document(s) into {len(chunks)} chunk(s).")

    # Assign deterministic IDs to each chunk
    chunk_ids = []
    source_counts = {}
    for doc in chunks:
        src = doc.metadata.get("source", "doc")
        source_counts[src] = source_counts.get(src, 0) + 1
        chunk_ids.append(f"{src}#chunk_{source_counts[src]}")

    print(f"[EMBED] Generating embeddings and storing {len(chunks)} chunk(s) in ChromaDB...")
    vectorstore.add_documents(documents=chunks, ids=chunk_ids)

    print(f"\n[SUCCESS] Successfully ingested new data into ChromaDB at '{persist_directory}'!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest markdown documents into ChromaDB with deduplication.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Wipe existing ChromaDB and re-ingest all documents from scratch."
    )
    args = parser.parse_args()
    ingest_documents(reset=args.reset)

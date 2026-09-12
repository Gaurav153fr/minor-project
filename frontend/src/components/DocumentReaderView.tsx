'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  List,
  Search,
  BookOpen,
  Clock,
  Type,
  Maximize2,
  Minimize2,
  ChevronRight,
  Loader2,
  Share2,
  Check,
} from 'lucide-react';
import { fetchDocumentContent, fetchDocuments } from '@/lib/api';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FloatingSelectionToolbar } from './FloatingSelectionToolbar';
import { AiSidebar } from './AiSidebar';
import GithubSlugger from 'github-slugger';

interface DocumentReaderViewProps {
  slug: string;
}

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export const DocumentReaderView: React.FC<DocumentReaderViewProps> = ({ slug }) => {
  const docFilename = slug.endsWith('.md') ? slug : `${slug}.md`;
  const docId = `docs/${docFilename}`;

  const [content, setContent] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>(
    slug.replace(/_/g, ' ').replace('.md', '').toUpperCase()
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showOutline, setShowOutline] = useState<boolean>(true);
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'larger'>('normal');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Text Selection & AI Sidebar
  const [selectedText, setSelectedText] = useState<string>('');
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState<boolean>(false);
  const [aiSidebarInitialPrompt, setAiSidebarInitialPrompt] = useState<string | undefined>(undefined);

  // Reading Progress
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Load document content & metadata
  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetchDocumentContent(docId),
      fetchDocuments().catch(() => []),
    ])
      .then(([text, docList]) => {
        setContent(text);

        // Find clean title from document metadata
        const matched = docList.find((d) => d.id === docId || d.filename === docFilename);
        if (matched) {
          setDocTitle(matched.title);
        }

        // Extract Headings with GithubSlugger to guarantee 100% match with rehype-slug
        const slugger = new GithubSlugger();
        const lines = text.split('\n');
        const extracted: HeadingItem[] = [];

        lines.forEach((line) => {
          const match = /^(#{1,3})\s+(.+)$/.exec(line);
          if (match) {
            const level = match[1].length;
            const headingText = match[2].trim().replace(/[*_~`]/g, '');
            const id = slugger.slug(headingText);
            extracted.push({ id, text: headingText, level });
          }
        });

        setHeadings(extracted);
        if (extracted.length > 0) {
          setActiveHeadingId(extracted[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load document content');
        setLoading(false);
      });
  }, [docId, docFilename]);

  // Scroll spy & reading progress
  const handleScroll = () => {
    if (!contentContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentContainerRef.current;
    const progress = Math.min(100, Math.max(0, (scrollTop / (scrollHeight - clientHeight)) * 100));
    setReadingProgress(progress);

    // Find visible heading
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= 200) {
          setActiveHeadingId(h.id);
          break;
        }
      }
    }
  };

  // Smooth scroll to heading when outline item clicked
  const scrollToHeading = (id: string) => {
    setActiveHeadingId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Text selection handler
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setToolbarPosition(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 2) {
      setSelectedText(text);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPosition({
        top: Math.max(10, rect.top - 8),
        left: rect.left + rect.width / 2,
      });
    } else {
      setToolbarPosition(null);
    }
  }, []);

  const handleSelectionAction = (
    actionType: 'ask' | 'explain' | 'summarize',
    text: string
  ) => {
    setToolbarPosition(null);
    setSelectedText(text);
    setIsAiSidebarOpen(true);

    if (actionType === 'explain') {
      setAiSidebarInitialPrompt('Please explain this highlighted concept in simple, clear terms:');
    } else if (actionType === 'summarize') {
      setAiSidebarInitialPrompt('Please summarize the key takeaways of this highlighted excerpt:');
    } else {
      setAiSidebarInitialPrompt(undefined);
    }
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const wordCount = content ? content.trim().split(/\s+/).length : 0;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 truncate">
            <Link
              href="/"
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors border border-white/10 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <h1 className="text-sm sm:text-base font-bold text-white truncate">{docTitle}</h1>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {readTimeMinutes} min read ({wordCount} words)
                  </span>
                  <span>•</span>
                  <span className="text-indigo-400 font-mono">{docFilename}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Outline Toggle */}
            <button
              onClick={() => setShowOutline(!showOutline)}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                showOutline
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Toggle Table of Contents Outline"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Outline</span>
            </button>

            {/* AI Assistant Toggle */}
            <button
              onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAiSidebarOpen
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30'
              }`}
              title="Open AI Assistant"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Chat</span>
            </button>

            {/* Font Size Adjust */}
            <button
              onClick={() =>
                setFontSize((prev) =>
                  prev === 'normal' ? 'large' : prev === 'large' ? 'larger' : 'normal'
                )
              }
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer hidden sm:flex"
              title="Change Text Size"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Copy Link */}
            <button
              onClick={handleShareLink}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Copy Page Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio 3-Pane Layout */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto relative">
        {/* 1. Left Table of Contents Outline (Interactive Jump Links) */}
        {showOutline && (
          <aside className="w-72 bg-slate-950/70 border-r border-white/10 p-5 overflow-y-auto hidden lg:block shrink-0 sticky top-[61px] h-[calc(100vh-61px)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <List className="w-3.5 h-3.5 text-indigo-400" />
                <span>Document Outline</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {headings.length} Sections
              </span>
            </div>

            {headings.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No headings in document</p>
            ) : (
              <nav className="space-y-1">
                {headings.map((h, idx) => {
                  const isActive = activeHeadingId === h.id;
                  return (
                    <button
                      key={idx}
                      onClick={() => scrollToHeading(h.id)}
                      style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                      className={`w-full text-left py-1.5 pr-2 rounded-lg text-xs transition-all duration-150 truncate cursor-pointer block ${
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-300 font-bold border-l-2 border-indigo-400'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                      title={h.text}
                    >
                      {h.text}
                    </button>
                  );
                })}
              </nav>
            )}
          </aside>
        )}

        {/* 2. Center Document Content Viewer */}
        <main
          ref={contentContainerRef}
          onScroll={handleScroll}
          onMouseUp={handleMouseUp}
          className={`flex-1 overflow-y-auto p-6 sm:p-12 select-text ${
            fontSize === 'large'
              ? 'text-base'
              : fontSize === 'larger'
              ? 'text-lg'
              : 'text-sm'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm">Rendering Markdown course notes with KaTeX math & syntax highlighting...</p>
            </div>
          ) : error ? (
            <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center max-w-xl mx-auto space-y-3">
              <p className="font-semibold">Unable to load document notes</p>
              <p className="text-xs text-slate-400">{error}</p>
              <Link
                href="/"
                className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Return to Dashboard
              </Link>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto pb-24">
              <MarkdownRenderer content={content} />
            </div>
          )}
        </main>

        {/* 3. Right Slide-Over AI Assistant Sidebar */}
        <AiSidebar
          isOpen={isAiSidebarOpen}
          onClose={() => setIsAiSidebarOpen(false)}
          documentTitle={docTitle}
          highlightedText={selectedText || null}
          onClearHighlight={() => setSelectedText('')}
          initialPrompt={aiSidebarInitialPrompt}
        />
      </div>

      {/* Floating Selection Tooltip ("Ask AI", "Explain", "Summarize") */}
      <FloatingSelectionToolbar
        position={toolbarPosition}
        selectedText={selectedText}
        onAction={handleSelectionAction}
        onClose={() => setToolbarPosition(null)}
      />
    </div>
  );
};

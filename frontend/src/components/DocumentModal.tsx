'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  X,
  FileText,
  Sparkles,
  Maximize2,
  Minimize2,
  List,
  Search,
  BookOpen,
  Loader2,
  Clock,
  Type,
  ExternalLink,
} from 'lucide-react';
import { fetchDocumentContent } from '@/lib/api';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FloatingSelectionToolbar } from './FloatingSelectionToolbar';
import { AiSidebar } from './AiSidebar';
import GithubSlugger from 'github-slugger';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | null;
  documentTitle?: string;
}

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showOutline, setShowOutline] = useState<boolean>(true);
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'larger'>('normal');

  // Text Selection & AI Sidebar State
  const [selectedText, setSelectedText] = useState<string>('');
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState<boolean>(false);
  const [aiSidebarInitialPrompt, setAiSidebarInitialPrompt] = useState<string | undefined>(undefined);

  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Slug derivation for direct route link
  const slug = documentId ? documentId.replace('docs/', '').replace('.md', '') : '';

  // Load document content
  useEffect(() => {
    if (isOpen && documentId) {
      setLoading(true);
      setError(null);
      fetchDocumentContent(documentId)
        .then((text) => {
          setContent(text);
          setLoading(false);

          // Extract Headings with GithubSlugger matching rehype-slug exactly
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
        })
        .catch((err) => {
          setError(err.message || 'Failed to load document content');
          setLoading(false);
        });
    } else {
      setContent('');
      setSelectedText('');
      setToolbarPosition(null);
      setIsAiSidebarOpen(false);
    }
  }, [isOpen, documentId]);

  // Outline scroll to heading handler
  const scrollToHeading = (id: string) => {
    setActiveHeadingId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle Text Highlighting & Floating Toolbar
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

  const wordCount = content ? content.trim().split(/\s+/).length : 0;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  if (!isOpen || !documentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 border border-white/15 rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullScreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-6xl h-[92vh]'
        }`}
      >
        {/* Top Control Navigation Bar (Shadcn style) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-slate-950/70 shrink-0">
          {/* Document Title & Badge */}
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {documentTitle || documentId}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {readTimeMinutes} min read ({wordCount} words)
                </span>
                <span>•</span>
                <span className="text-indigo-400 font-mono text-[11px]">{documentId}</span>
              </div>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Open dedicated route */}
            {slug && (
              <Link
                href={`/documents/${slug}`}
                onClick={onClose}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 flex items-center gap-1 border border-white/10 transition-colors"
                title="Open in dedicated full-page studio"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dedicated Page</span>
              </Link>
            )}

            {/* Table of Contents Toggle */}
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

            {/* AI Assistant Sidebar Toggle */}
            <button
              onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isAiSidebarOpen
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30'
              }`}
              title="Open AI Sidebar"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Chat</span>
            </button>

            {/* Font Size Toggle */}
            <button
              onClick={() =>
                setFontSize((prev) =>
                  prev === 'normal' ? 'large' : prev === 'large' ? 'larger' : 'normal'
                )
              }
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer hidden sm:flex"
              title="Adjust Font Size"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer hidden sm:flex"
              title="Toggle Fullscreen"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer ml-1"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body with 3-Pane Layout (Outline | Reader | AI Sidebar) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* 1. Left Outline Sidebar (Table of Contents) */}
          {showOutline && headings.length > 0 && (
            <aside className="w-64 bg-slate-950/60 border-r border-white/10 p-4 overflow-y-auto hidden md:block shrink-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <List className="w-3.5 h-3.5 text-indigo-400" />
                <span>Table of Contents</span>
              </h4>
              <nav className="space-y-1">
                {headings.map((h, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToHeading(h.id)}
                    style={{ paddingLeft: `${(h.level - 1) * 12 + 6}px` }}
                    className={`w-full text-left py-1 text-xs transition-colors truncate block cursor-pointer ${
                      activeHeadingId === h.id
                        ? 'text-indigo-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {h.text}
                  </button>
                ))}
              </nav>
            </aside>
          )}

          {/* 2. Center Scrollable Document Reader */}
          <main
            ref={contentContainerRef}
            onMouseUp={handleMouseUp}
            className={`flex-1 overflow-y-auto p-6 sm:p-10 select-text ${
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
                <p className="text-sm">Rendering Markdown course notes with KaTeX & syntax highlighting...</p>
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center">
                {error}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <MarkdownRenderer content={content} />
              </div>
            )}
          </main>

          {/* 3. Right Slide-Over AI Assistant Sidebar */}
          <AiSidebar
            isOpen={isAiSidebarOpen}
            onClose={() => setIsAiSidebarOpen(false)}
            documentTitle={documentTitle || documentId}
            highlightedText={selectedText || null}
            onClearHighlight={() => setSelectedText('')}
            initialPrompt={aiSidebarInitialPrompt}
          />
        </div>

        {/* Floating Selection Tooltip */}
        <FloatingSelectionToolbar
          position={toolbarPosition}
          selectedText={selectedText}
          onAction={handleSelectionAction}
          onClose={() => setToolbarPosition(null)}
        />
      </div>
    </div>
  );
};

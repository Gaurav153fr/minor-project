'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Clock,
  Printer,
  Moon,
  Sun,
  Share2,
  Check,
  Loader2,
  Layers,
  Award,
  BookOpen,
} from 'lucide-react';
import { fetchDocumentContent, fetchDocuments, solveQuestionApi } from '@/lib/api';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AiSidebar } from './AiSidebar';
import { FloatingSelectionToolbar } from './FloatingSelectionToolbar';

interface QuestionPaperViewProps {
  slug: string;
}

interface ParsedQuestion {
  id: string;
  unit: string;
  questionNumber: string;
  text: string;
  marks: string;
  answer?: string;
  isOr?: boolean;
}

interface ParsedPaper {
  title: string;
  code: string;
  exam: string;
  scheme: string;
  branches: string;
  subject: string;
  timeAllowed: string;
  maxMarks: string;
  minPassMarks: string;
  note: string;
  units: { name: string; questions: ParsedQuestion[] }[];
}

export const QuestionPaperView: React.FC<QuestionPaperViewProps> = ({ slug }) => {
  const docFilename = slug.endsWith('.md') ? slug : `${slug}.md`;
  const docId = `docs/question_papers/${docFilename}`;

  const [rawContent, setRawContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Appearance & Toggles
  const [paperTheme, setPaperTheme] = useState<'dark' | 'paper'>('dark');
  const [visibleAnswers, setVisibleAnswers] = useState<Record<string, boolean>>({});
  const [allAnswersVisible, setAllAnswersVisible] = useState<boolean>(false);
  const [activeUnit, setActiveUnit] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // AI Solving State per question
  const [aiSolutions, setAiSolutions] = useState<Record<string, { solution: string; key_formulae: string[]; marking_tips: string }>>({});
  const [solvingId, setSolvingId] = useState<string | null>(null);

  // AI Sidebar & Selection State
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState<boolean>(false);
  const [sidebarHighlightedText, setSidebarHighlightedText] = useState<string | null>(null);
  const [sidebarInitialPrompt, setSidebarInitialPrompt] = useState<string | undefined>(undefined);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);

  // Load question paper markdown
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Try loading from docs/question_papers or fallback to docs
    fetchDocumentContent(docId)
      .then((text) => {
        setRawContent(text);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to docs root
        fetchDocumentContent(`docs/${docFilename}`)
          .then((text) => {
            setRawContent(text);
            setLoading(false);
          })
          .catch((err) => {
            setError(err.message || 'Failed to load question paper');
            setLoading(false);
          });
      });
  }, [docId, docFilename]);

  // Parse structured exam paper from markdown
  const parsedPaper: ParsedPaper = useMemo(() => {
    if (!rawContent) {
      return {
        title: slug.replace(/_/g, ' ').toUpperCase(),
        code: 'EXAM-CODE',
        exam: 'University Examination',
        scheme: '(AICTE Scheme)',
        branches: 'All Engineering Branches',
        subject: slug.replace(/_/g, ' ').toUpperCase(),
        timeAllowed: 'Three hours',
        maxMarks: '100',
        minPassMarks: '35',
        note: 'Attempt questions as instructed in each section.',
        units: [],
      };
    }

    const lines = rawContent.split('\n');
    let title = slug.replace(/_/g, ' ').toUpperCase();
    let code = 'A000211(011)';
    let exam = 'B. Tech. Examination';
    let scheme = '(AICTE Scheme)';
    let branches = 'All Engineering Branches';
    let subject = title;
    let timeAllowed = 'Three hours';
    let maxMarks = '100';
    let minPassMarks = '35';
    let note = 'Part (a) of each question is compulsory. Attempt any two parts from (b), (c) and (d).';

    const units: { name: string; questions: ParsedQuestion[] }[] = [];
    let currentUnit = 'General';
    let currentQuestions: ParsedQuestion[] = [];
    let currentQ: ParsedQuestion | null = null;
    let inAnswer = false;
    let answerBuffer: string[] = [];

    const flushCurrentQ = () => {
      if (currentQ) {
        if (answerBuffer.length > 0) {
          currentQ.answer = answerBuffer.join('\n').trim();
        }
        currentQuestions.push({ ...currentQ });
        currentQ = null;
        answerBuffer = [];
        inAnswer = false;
      }
    };

    const flushUnit = () => {
      flushCurrentQ();
      if (currentQuestions.length > 0) {
        units.push({ name: currentUnit, questions: [...currentQuestions] });
        currentQuestions = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('# ')) {
        title = line.replace('# ', '').trim();
        subject = title;
      } else if (line.includes('**Code:**')) {
        code = line.split('**Code:**')[1].trim();
      } else if (line.includes('**Exam:**')) {
        exam = line.split('**Exam:**')[1].trim();
      } else if (line.includes('**Scheme:**')) {
        scheme = line.split('**Scheme:**')[1].trim();
      } else if (line.includes('**Branches:**') || line.includes('**Branch:**')) {
        branches = line.split(/(\*\*Branches:\*\*|\*\*Branch:\*\*)/)[2]?.trim() || branches;
      } else if (line.includes('**Subject:**')) {
        subject = line.split('**Subject:**')[1].trim();
      } else if (line.includes('**Time Allowed:**')) {
        timeAllowed = line.split('**Time Allowed:**')[1].trim();
      } else if (line.includes('**Maximum Marks:**')) {
        maxMarks = line.split('**Maximum Marks:**')[1].trim();
      } else if (line.includes('**Minimum Pass Marks:**')) {
        minPassMarks = line.split('**Minimum Pass Marks:**')[1].trim();
      } else if (line.includes('**Note:**')) {
        note = line.split('**Note:**')[1].trim();
      } else if (line.startsWith('## Unit') || line.startsWith('## Section')) {
        flushUnit();
        currentUnit = line.replace(/^##\s+/, '').trim();
      } else if (line.startsWith('### ') || line.match(/^\d+\.\s+\([a-z]\)/i) || line.startsWith('#### Question')) {
        flushCurrentQ();
        const headerText = line.replace(/^###\s+/, '').replace(/^####\s+/, '').trim();
        const isOr = headerText.toLowerCase().includes('**or**') || headerText.toLowerCase() === 'or';

        // Extract marks like [4 Marks] or [8] or [4+4 Marks]
        const marksMatch = headerText.match(/\[([0-9+]+(?:\s*Marks)?)\]/i);
        const marks = marksMatch ? marksMatch[1] : '8';
        const cleanText = headerText.replace(/\[.*?\]/, '').trim();

        currentQ = {
          id: `q-${units.length}-${currentQuestions.length + 1}`,
          unit: currentUnit,
          questionNumber: cleanText.split(/[:.)]/)[0]?.trim() || `Q${currentQuestions.length + 1}`,
          text: cleanText,
          marks,
          isOr,
        };
      } else if (line.includes('**Answer:**') || line.includes('- **Answer:**') || line.startsWith('- **Answer:')) {
        inAnswer = true;
        const ansPart = line.split('**Answer:**')[1]?.trim() || '';
        if (ansPart) answerBuffer.push(ansPart);
      } else if (inAnswer) {
        // Collect answer text
        answerBuffer.push(line);
      }
    }

    flushUnit();

    return {
      title,
      code,
      exam,
      scheme,
      branches,
      subject,
      timeAllowed,
      maxMarks,
      minPassMarks,
      note,
      units,
    };
  }, [rawContent, slug]);

  // Toggle individual answer
  const toggleAnswer = (qId: string) => {
    setVisibleAnswers((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // Toggle all answers
  const toggleAllAnswers = () => {
    const newState = !allAnswersVisible;
    setAllAnswersVisible(newState);
    const updated: Record<string, boolean> = {};
    parsedPaper.units.forEach((u) => {
      u.questions.forEach((q) => {
        updated[q.id] = newState;
      });
    });
    setVisibleAnswers(updated);
  };

  // AI Solve Question handler
  const handleSolveWithAi = async (q: ParsedQuestion) => {
    setSolvingId(q.id);
    try {
      const res = await solveQuestionApi(q.text, q.marks, parsedPaper.subject);
      setAiSolutions((prev) => ({
        ...prev,
        [q.id]: res,
      }));
      // Automatically reveal answer
      setVisibleAnswers((prev) => ({ ...prev, [q.id]: true }));
    } catch (err: any) {
      alert(`AI Solve failed: ${err.message}`);
    } finally {
      setSolvingId(null);
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
      setSidebarHighlightedText(text);
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
    setSidebarHighlightedText(text);
    setIsAiSidebarOpen(true);

    if (actionType === 'explain') {
      setSidebarInitialPrompt(`Explain this question / concept from ${parsedPaper.subject} step by step:`);
    } else if (actionType === 'summarize') {
      setSidebarInitialPrompt(`Summarize key formulas and solving technique for:`);
    } else {
      setSidebarInitialPrompt(undefined);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isPaperMode = paperTheme === 'paper';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isPaperMode
          ? 'bg-[#f4efe6] text-slate-900 selection:bg-amber-400 selection:text-slate-950'
          : 'bg-[#0b0f19] text-slate-100 selection:bg-indigo-500 selection:text-white'
      }`}
    >
      {/* Top Navbar */}
      <header
        className={`sticky top-0 z-40 px-4 md:px-8 py-3 border-b backdrop-blur-xl transition-colors ${
          isPaperMode
            ? 'bg-[#f4efe6]/90 border-slate-300 shadow-sm'
            : 'bg-[#0b0f19]/90 border-white/10'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                isPaperMode
                  ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-slate-800'
                  : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Studio</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Official Exam Paper
              </span>
              <span className="text-xs text-slate-400 font-mono">{parsedPaper.code}</span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Global Answer Visibility Toggle */}
            <button
              onClick={toggleAllAnswers}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                allAnswersVisible
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : isPaperMode
                  ? 'bg-white hover:bg-amber-50 border-amber-300 text-slate-800'
                  : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-300'
              }`}
            >
              {allAnswersVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{allAnswersVisible ? 'Hide All Solutions' : 'Reveal All Solutions'}</span>
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAiSidebarOpen
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Exam Tutor</span>
            </button>

            {/* Theme Toggle (Paper vs Cyber Dark) */}
            <button
              onClick={() => setPaperTheme(isPaperMode ? 'dark' : 'paper')}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isPaperMode
                  ? 'bg-white hover:bg-amber-50 border-amber-300 text-slate-800'
                  : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-300'
              }`}
              title={`Switch to ${isPaperMode ? 'Dark Theme' : 'Classic Exam Sheet'}`}
            >
              {isPaperMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Print / Export */}
            <button
              onClick={handlePrint}
              className={`p-2 rounded-xl border transition-colors cursor-pointer hidden sm:flex ${
                isPaperMode
                  ? 'bg-white hover:bg-amber-50 border-amber-300 text-slate-800'
                  : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-300'
              }`}
              title="Print Examination Paper"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Share Link */}
            <button
              onClick={handleCopyLink}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isPaperMode
                  ? 'bg-white hover:bg-amber-50 border-amber-300 text-slate-800'
                  : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-300'
              }`}
              title="Copy link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination Sheet Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex gap-6 relative">
        <main
          onMouseUp={handleMouseUp}
          className={`flex-1 rounded-3xl p-6 sm:p-12 shadow-2xl transition-all duration-300 ${
            isPaperMode
              ? 'bg-white text-slate-900 border-2 border-slate-300 font-serif'
              : 'bg-slate-900/90 text-slate-100 border border-white/15 backdrop-blur-2xl'
          }`}
        >
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm font-sans">Formatting university examination paper...</p>
            </div>
          ) : error ? (
            <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center space-y-3 font-sans">
              <p className="font-semibold">Unable to load Question Paper</p>
              <p className="text-xs">{error}</p>
              <Link
                href="/"
                className="inline-block px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Return to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-8 select-text">
              {/* ================= HEADER SECTION (Matching University Paper Picture) ================= */}
              <div
                className={`border-b-2 pb-6 space-y-4 ${
                  isPaperMode ? 'border-slate-900' : 'border-white/20'
                }`}
              >
                {/* Top Metabar with Roll No & Barcode */}
                <div className="flex items-start justify-between gap-4 font-mono text-xs">
                  <div>
                    <span className="font-bold">Printed Pages — 4</span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Roll No. :</span>
                      <div
                        className={`w-36 sm:w-48 h-6 border rounded px-2 flex items-center text-[10px] ${
                          isPaperMode ? 'border-slate-700 bg-amber-50/50' : 'border-white/20 bg-slate-950/50'
                        }`}
                      >
                        ...............................
                      </div>
                    </div>

                    {/* Barcode Graphic */}
                    <div className="flex items-center gap-0.5 tracking-tighter text-slate-400 font-mono text-lg select-none">
                      ||||||| | ||||| |||| ||| ||||||| | |||
                    </div>
                  </div>
                </div>

                {/* Exam Course Code in Center */}
                <div className="text-center pt-2">
                  <div
                    className={`inline-block font-extrabold text-xl sm:text-2xl tracking-tight px-4 py-1 rounded-lg border-2 ${
                      isPaperMode
                        ? 'border-slate-900 text-slate-950 bg-amber-50'
                        : 'border-indigo-500/50 text-indigo-200 bg-indigo-500/10'
                    }`}
                  >
                    {parsedPaper.code}
                  </div>
                </div>

                {/* Exam Title & Scheme */}
                <div className="text-center space-y-1">
                  <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight">
                    {parsedPaper.exam}
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold">{parsedPaper.scheme}</p>
                  <p className="text-[11px] max-w-2xl mx-auto opacity-80 leading-relaxed font-sans px-2">
                    {parsedPaper.branches}
                  </p>
                  <h1 className="text-xl sm:text-2xl font-black tracking-wide pt-2 uppercase underline decoration-2 underline-offset-4">
                    {parsedPaper.subject}
                  </h1>
                </div>

                {/* Time & Marks Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs font-semibold pt-3 border-t border-dashed border-current/30 font-sans">
                  <div>
                    <span className="opacity-70">Time Allowed : </span>
                    <span className="font-bold">{parsedPaper.timeAllowed}</span>
                  </div>
                  <div>
                    <span className="opacity-70">Maximum Marks : </span>
                    <span className="font-bold">{parsedPaper.maxMarks}</span>
                  </div>
                  <div>
                    <span className="opacity-70">Minimum Pass Marks : </span>
                    <span className="font-bold">{parsedPaper.minPassMarks}</span>
                  </div>
                </div>

                {/* Instructions Note Banner */}
                <div
                  className={`p-3.5 rounded-xl text-xs leading-relaxed font-sans italic border ${
                    isPaperMode
                      ? 'bg-amber-100/70 border-amber-300 text-slate-900'
                      : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'
                  }`}
                >
                  <span className="font-bold not-italic">Note : </span>
                  {parsedPaper.note}
                </div>
              </div>

              {/* ================= UNIT & QUESTION SECTIONS ================= */}
              <div className="space-y-10">
                {parsedPaper.units.map((unit, uIdx) => (
                  <section key={uIdx} className="space-y-6">
                    {/* Unit Divider */}
                    <div className="flex items-center gap-4 my-6">
                      <div
                        className={`h-0.5 flex-1 ${
                          isPaperMode ? 'bg-slate-300' : 'bg-white/15'
                        }`}
                      />
                      <h3 className="text-base sm:text-lg font-black uppercase tracking-widest text-center px-3">
                        {unit.name}
                      </h3>
                      <div
                        className={`h-0.5 flex-1 ${
                          isPaperMode ? 'bg-slate-300' : 'bg-white/15'
                        }`}
                      />
                    </div>

                    {/* Questions in Unit */}
                    <div className="space-y-6">
                      {unit.questions.map((q) => {
                        const isAnswerShown = visibleAnswers[q.id];
                        const aiSol = aiSolutions[q.id];
                        const isSolving = solvingId === q.id;

                        if (q.isOr) {
                          return (
                            <div key={q.id} className="text-center py-2">
                              <span className="px-4 py-1 font-black text-sm uppercase tracking-widest border-2 rounded-full border-current/40">
                                OR
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={q.id}
                            className={`p-5 rounded-2xl border transition-all duration-200 ${
                              isPaperMode
                                ? 'bg-amber-50/40 border-slate-300 hover:border-slate-500'
                                : 'bg-slate-950/60 border-white/10 hover:border-indigo-500/40'
                            }`}
                          >
                            {/* Question Header & Marks */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="text-sm sm:text-base font-semibold leading-relaxed font-sans">
                                  <MarkdownRenderer content={q.text} />
                                </div>
                              </div>

                              {/* Marks Column on Right */}
                              <div className="shrink-0 flex items-center gap-2">
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${
                                    isPaperMode
                                      ? 'bg-white border-slate-400 text-slate-900'
                                      : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                  }`}
                                >
                                  [{q.marks}]
                                </span>
                              </div>
                            </div>

                            {/* Question Interactive Action Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-dashed border-current/20 font-sans">
                              {/* Left actions: Toggle Solution & Solve with AI */}
                              <div className="flex items-center gap-2">
                                {(q.answer || aiSol) && (
                                  <button
                                    onClick={() => toggleAnswer(q.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                                      isAnswerShown
                                        ? 'bg-emerald-600 text-white border-emerald-500'
                                        : isPaperMode
                                        ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                                        : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-300'
                                    }`}
                                  >
                                    {isAnswerShown ? (
                                      <>
                                        <EyeOff className="w-3.5 h-3.5" />
                                        <span>Hide Solution</span>
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>View Solution</span>
                                      </>
                                    )}
                                  </button>
                                )}

                                <button
                                  onClick={() => handleSolveWithAi(q)}
                                  disabled={isSolving}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {isSolving ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Solving...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>{aiSol ? 'Regenerate AI Solution' : 'Solve with AI'}</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Right actions: Chat with AI about this question */}
                              <button
                                onClick={() => {
                                  setSidebarHighlightedText(q.text);
                                  setSidebarInitialPrompt(`Please explain the core concepts and exam scoring strategy for: ${q.text}`);
                                  setIsAiSidebarOpen(true);
                                }}
                                className={`text-xs flex items-center gap-1 hover:underline cursor-pointer ${
                                  isPaperMode ? 'text-indigo-700' : 'text-indigo-400'
                                }`}
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Discuss with AI</span>
                              </button>
                            </div>

                            {/* ================= HIDDEN / TOGGLEABLE SOLUTION BOX ================= */}
                            {isAnswerShown && (
                              <div
                                className={`mt-4 p-5 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-200 font-sans ${
                                  isPaperMode
                                    ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                                    : 'bg-emerald-950/30 border-emerald-500/30 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Step-by-Step Model Exam Solution</span>
                                </div>

                                <div className="text-sm leading-relaxed doc-prose">
                                  <MarkdownRenderer
                                    content={aiSol?.solution || q.answer || 'Solution available upon AI request.'}
                                  />
                                </div>

                                {aiSol?.key_formulae && aiSol.key_formulae.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-emerald-500/20 flex flex-wrap items-center gap-2">
                                    <span className="text-[11px] font-bold text-emerald-400">
                                      Key Formulae:
                                    </span>
                                    {aiSol.key_formulae.map((f, fIdx) => (
                                      <span
                                        key={fIdx}
                                        className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[11px] font-mono"
                                      >
                                        {f}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Right Slide-Over AI Assistant Sidebar */}
        <AiSidebar
          isOpen={isAiSidebarOpen}
          onClose={() => setIsAiSidebarOpen(false)}
          documentTitle={parsedPaper.subject}
          highlightedText={sidebarHighlightedText}
          onClearHighlight={() => setSidebarHighlightedText(null)}
          initialPrompt={sidebarInitialPrompt}
        />
      </div>

      {/* Floating Selection Tooltip */}
      <FloatingSelectionToolbar
        position={toolbarPosition}
        selectedText={sidebarHighlightedText || ''}
        onAction={handleSelectionAction}
        onClose={() => setToolbarPosition(null)}
      />
    </div>
  );
};

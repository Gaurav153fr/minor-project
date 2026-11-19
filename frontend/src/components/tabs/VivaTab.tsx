'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, ChevronRight, RotateCcw,
  BookOpen, AlertCircle, CheckCircle2, XCircle, Loader2,
  FileText, Award, User, Clock, ArrowRight, CornerDownLeft,
} from 'lucide-react';
import { StudentProfile } from '@/types/profile';
import {
  VivaStartResponse, VivaAnswerResponse, VivaSummaryResponse,
} from '@/types';
import { vivaStart, vivaAnswer, vivaSummary } from '@/lib/api';
import confetti from 'canvas-confetti';
import { VivaDeskScene, TeacherMood } from '@/components/viva/VivaDeskScene';

// ── Types ──────────────────────────────────────────────────────

type Phase = 'setup' | 'question' | 'feedback' | 'scorecard';

interface VivaTabProps {
  selectedDocument: string;
  profile?: StudentProfile | null;
  studentContext?: string;
}

interface SessionState {
  session_id: string;
  total_questions: number;
  current_question_number: number;
  current_question: string;
  current_topic_tag: string;
}

// ── Main Viva Component ────────────────────────────────────────

export const VivaTab: React.FC<VivaTabProps> = ({ selectedDocument, profile, studentContext }) => {
  // Setup state
  const [topic, setTopic] = useState<string>(selectedDocument !== 'all' ? selectedDocument : 'all');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Phase state
  const [phase, setPhase] = useState<Phase>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live session state
  const [session, setSession] = useState<SessionState | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [lastFeedback, setLastFeedback] = useState<VivaAnswerResponse | null>(null);
  const [summary, setSummary] = useState<VivaSummaryResponse | null>(null);

  // Voice & Interaction state
  const [isRecording, setIsRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeakingTts, setIsSpeakingTts] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Set<number>>(new Set());

  const recognitionRef = useRef<any>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  // ── Speech Support Check ──
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSttSupported(!!SpeechRec);
  }, []);

  // ── TTS: Read Question Aloud ──
  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.92;
    utt.pitch = 1;
    utt.lang = 'en-IN';
    utt.onstart = () => setIsSpeakingTts(true);
    utt.onend = () => setIsSpeakingTts(false);
    utt.onerror = () => setIsSpeakingTts(false);
    window.speechSynthesis.speak(utt);
  }, [ttsEnabled]);

  // ── Determine Teacher's Real-time Mood ──
  const getTeacherMood = (): TeacherMood => {
    if (isLoading) return 'evaluating';
    if (isRecording) return 'listening';
    if (isSpeakingTts) return 'speaking';
    if (phase === 'feedback' && lastFeedback) {
      const pct = (lastFeedback.score / lastFeedback.max_score) * 100;
      return pct >= 75 ? 'impressed' : pct < 45 ? 'strict' : 'idle';
    }
    return 'idle';
  };

  // ── STT: Voice Recording ──
  const toggleRecording = useCallback(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const rec: any = new SpeechRec();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setAnswerText((prev) => prev ? prev + ' ' + transcript : transcript);
    };
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  }, [isRecording]);

  // ── Handlers ──
  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: VivaStartResponse = await vivaStart(topic, difficulty, questionCount, studentContext);
      setSession({
        session_id: data.session_id,
        total_questions: data.total_questions,
        current_question_number: data.question_number,
        current_question: data.question,
        current_topic_tag: data.topic_tag,
      });
      setAnswerText('');
      setPhase('question');
      if (ttsEnabled) setTimeout(() => speak(data.question), 400);
    } catch (err: any) {
      setError(err.message || 'Could not start examination session. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!session || !answerText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data: VivaAnswerResponse = await vivaAnswer(
        session.session_id,
        session.current_question_number,
        answerText.trim()
      );
      setLastFeedback(data);
      setPhase('feedback');
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer for evaluation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (!session || !lastFeedback) return;

    if (lastFeedback.is_last_question) {
      setIsLoading(true);
      setError(null);
      try {
        const data: VivaSummaryResponse = await vivaSummary(session.session_id);
        setSummary(data);
        setPhase('scorecard');
        if (data.percentage >= 75) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to generate official scorecard.');
      } finally {
        setIsLoading(false);
      }
    } else if (lastFeedback.next_question) {
      const nq = lastFeedback.next_question;
      setSession((prev) => prev ? {
        ...prev,
        current_question_number: nq.question_number,
        current_question: nq.question,
        current_topic_tag: nq.topic_tag,
      } : prev);
      setAnswerText('');
      setLastFeedback(null);
      setPhase('question');
      if (ttsEnabled) setTimeout(() => speak(nq.question), 300);
    }
  };

  const handleReset = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    setSession(null);
    setAnswerText('');
    setLastFeedback(null);
    setSummary(null);
    setError(null);
    setPhase('setup');
  };

  const toggleBreakdown = (n: number) => {
    setExpandedBreakdowns((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  };

  // ══════════════════════════════════════════════════════════════
  // VIEW 1: SETUP (EXAMINATION ENTRY DOCKET)
  // ══════════════════════════════════════════════════════════════
  if (phase === 'setup') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Examination Door Sign / Header */}
        <div className="border border-slate-700 bg-[#0f172a] rounded-xl p-6 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
            <div>
              <div className="text-[11px] font-mono font-bold tracking-widest uppercase text-slate-400">
                Department of Computer Science & Engineering
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mt-1">
                Oral Viva Voce Examination
              </h1>
            </div>
            <div className="px-3 py-1 rounded bg-[#1e293b] border border-slate-600 text-xs font-mono text-amber-300">
              Room 402 · External Board
            </div>
          </div>

          <p className="text-slate-300 text-sm mt-3 leading-relaxed">
            Sit across from <strong>Dr. A. Sharma</strong> (External Examiner). Questions will be asked one at a time.
            You can answer verbally using your microphone or by typing on your candidate desk pad.
          </p>
        </div>

        {/* Examination Docket / Configuration */}
        <div className="border border-slate-700 bg-[#141d2e] rounded-xl p-6 space-y-6 shadow-md">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" /> Candidate Examination Docket
          </h2>

          {/* Topic */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Syllabus / Paper for Examination
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-[#0b101b] border border-slate-600 rounded-lg px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-amber-400"
            >
              <option value="all">Entire Course Syllabus (Comprehensive)</option>
              {selectedDocument && selectedDocument !== 'all' && (
                <option value={selectedDocument}>
                  Selected Paper: {selectedDocument.split('/').pop()?.replace('.md', '')}
                </option>
              )}
            </select>
          </div>

          {/* Rigor / Difficulty */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Examination Rigor
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'easy', label: 'Basic' },
                { id: 'medium', label: 'Standard' },
                { id: 'hard', label: 'Rigorous' },
                { id: 'mixed', label: 'Mixed Board' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id as any)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition ${
                    difficulty === d.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-[#0b101b] text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                Number of Oral Questions
              </label>
              <span className="font-mono text-sm font-bold text-amber-400">{questionCount} Questions</span>
            </div>
            <input
              type="range"
              min={3}
              max={10}
              step={1}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-amber-500 bg-slate-700 h-2 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
              <span>3 (Brief)</span>
              <span>5 (Standard Board)</span>
              <span>10 (Full Exam)</span>
            </div>
          </div>

          {/* Audio & Mic Settings */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-700/80">
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                ttsEnabled
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              Examiner Audio Voice {ttsEnabled ? 'Active' : 'Muted'}
            </button>

            {sttSupported && (
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-emerald-400" /> Tabletop mic supported
              </span>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded bg-red-950/60 border border-red-800 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" /> {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-semibold text-sm transition flex items-center justify-center gap-2 border border-emerald-500/40 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Preparing Examination Cabin…
              </>
            ) : (
              <>
                Enter Examination Cabin &amp; Take Seat <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW 2: QUESTION (ACROSS THE DESK SCENE)
  // ══════════════════════════════════════════════════════════════
  if (phase === 'question' && session) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {/* TOP: Dr. Sharma behind the examination desk */}
        <VivaDeskScene
          mood={getTeacherMood()}
          questionNumber={session.current_question_number}
          totalQuestions={session.total_questions}
          topicTag={session.current_topic_tag}
          questionText={session.current_question}
          onReadAloud={() => speak(session.current_question)}
          isAudioPlaying={isSpeakingTts}
        />

        {/* BOTTOM: Candidate's side of the desk (Answer Pad & Mic) */}
        <div className="border border-slate-700 bg-[#131b2a] rounded-xl p-5 shadow-lg">
          {/* Header of Student Pad */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/80 mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Candidate Desk · Answer Sheet</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              {profile?.name ? `Candidate: ${profile.name}` : 'Candidate Answer Pad'}
            </div>
          </div>

          {/* Answer Text Area */}
          <textarea
            ref={answerRef}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Dictate your response using the microphone or write your answer here..."
            rows={4}
            className="w-full bg-[#0b101b] border border-slate-700 rounded-lg p-3 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none font-sans leading-relaxed"
          />

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-3">
            {/* Mic Button */}
            {sttSupported ? (
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition ${
                  isRecording
                    ? 'bg-red-700 text-white border-red-500 animate-pulse'
                    : 'bg-[#1b2537] text-slate-200 border-slate-600 hover:bg-[#233047]'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" /> Stop Speaking
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-emerald-400" /> Speak into Desk Mic
                  </>
                )}
              </button>
            ) : (
              <div />
            )}

            {/* Submit & Reset */}
            <div className="flex items-center gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 transition"
              >
                Leave Room
              </button>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={isLoading || !answerText.trim()}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white text-xs font-bold transition border border-emerald-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Dr. Sharma is Grading…
                  </>
                ) : (
                  <>
                    Present Answer to Examiner <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 p-2.5 rounded bg-red-950/60 border border-red-800 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" /> {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW 3: FEEDBACK (TEACHER EVALUATION CARD ACROSS DESK)
  // ══════════════════════════════════════════════════════════════
  if (phase === 'feedback' && session && lastFeedback) {
    const pct = Math.round((lastFeedback.score / lastFeedback.max_score) * 100);
    const isPassing = pct >= 50;

    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Top: Dr. Sharma's scene with reaction */}
        <VivaDeskScene
          mood={getTeacherMood()}
          questionNumber={session.current_question_number}
          totalQuestions={session.total_questions}
          topicTag={session.current_topic_tag}
          questionText={session.current_question}
        />

        {/* The Evaluated Marks Card on the Table */}
        <div className="border border-slate-700 bg-[#131b2a] rounded-xl p-5 shadow-lg space-y-4">
          {/* Header & Score */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-700 gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Official Marks Awarded · Question {session.current_question_number}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono text-slate-100">
                  {lastFeedback.score} <span className="text-slate-400 text-base font-normal">/ {lastFeedback.max_score} Marks</span>
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    isPassing
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-red-950 text-red-300 border-red-800'
                  }`}
                >
                  {pct}%
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Evaluator: Dr. A. Sharma
            </div>
          </div>

          {/* Examiner Verbal Feedback */}
          <div className="bg-[#0b101b] border border-slate-700 rounded-lg p-3.5">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-1">
              Examiner Assessment:
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {lastFeedback.feedback}
            </p>
          </div>

          {/* Model Answer Summary */}
          <div className="bg-[#0b101b] border border-slate-700 rounded-lg p-3.5">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              Expected Model Answer Key:
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-sans italic">
              {lastFeedback.correct_answer_summary}
            </p>
          </div>

          {/* Continue Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-sm transition flex items-center justify-center gap-2 border border-emerald-500/40 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Preparing Next Question…
              </>
            ) : lastFeedback.is_last_question ? (
              <>
                Conclude Viva &amp; View Official Grade Sheet <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Proceed to Question {session.current_question_number + 1} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW 4: SCORECARD (OFFICIAL GRADE SHEET)
  // ══════════════════════════════════════════════════════════════
  if (phase === 'scorecard' && summary) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Official Grade Sheet Container */}
        <div className="border border-slate-700 bg-[#0f172a] rounded-xl p-6 sm:p-8 shadow-xl">
          {/* Institution Header */}
          <div className="text-center border-b border-slate-700 pb-5">
            <div className="text-xs font-mono font-bold tracking-widest uppercase text-slate-400">
              Department of Computer Science &amp; Engineering
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
              Oral Viva Voce Examination Dossier
            </h1>
            <div className="text-xs text-slate-400 font-mono mt-1">
              Certified Examination Report · Board Examiner: Dr. A. Sharma
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
            <div className="bg-[#162032] border border-slate-700 rounded-lg p-4 text-center">
              <div className="text-xs font-mono uppercase text-slate-400">Final Grade</div>
              <div className="text-3xl font-black font-mono text-amber-400 mt-1">{summary.grade}</div>
            </div>

            <div className="bg-[#162032] border border-slate-700 rounded-lg p-4 text-center">
              <div className="text-xs font-mono uppercase text-slate-400">Total Marks</div>
              <div className="text-3xl font-black font-mono text-slate-100 mt-1">
                {summary.total_score} <span className="text-base text-slate-400 font-normal">/ {summary.max_score}</span>
              </div>
            </div>

            <div className="bg-[#162032] border border-slate-700 rounded-lg p-4 text-center">
              <div className="text-xs font-mono uppercase text-slate-400">Percentage</div>
              <div className="text-3xl font-black font-mono text-emerald-400 mt-1">{summary.percentage}%</div>
            </div>
          </div>

          {/* Strong / Weak Topic Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="border border-slate-700 bg-[#162032] rounded-lg p-3">
              <div className="text-[11px] font-mono font-bold uppercase text-emerald-400 mb-1.5">
                Demonstrated Mastery:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {summary.strong_topics.length > 0 ? (
                  summary.strong_topics.map((t, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Basic syllabus concepts</span>
                )}
              </div>
            </div>

            <div className="border border-slate-700 bg-[#162032] rounded-lg p-3">
              <div className="text-[11px] font-mono font-bold uppercase text-amber-400 mb-1.5">
                Recommended For Revision:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {summary.weak_topics.length > 0 ? (
                  summary.weak_topics.map((t, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">All topics met examination threshold</span>
                )}
              </div>
            </div>
          </div>

          {/* Examiner's Written Review */}
          <div className="border border-slate-700 bg-[#162032] rounded-lg p-4 mb-6">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-1">
              Examiner's Concluding Recommendations:
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              "{summary.recommendations}"
            </p>
          </div>

          {/* Question by Question Table */}
          <div className="border border-slate-700 rounded-lg overflow-hidden mb-6">
            <div className="bg-[#1b2537] px-4 py-2.5 border-b border-slate-700 text-xs font-mono font-bold text-slate-300 uppercase">
              Oral Question Performance Breakdown
            </div>
            <div className="divide-y divide-slate-800 bg-[#0b101b]">
              {summary.question_breakdown.map((q) => (
                <div key={q.question_number} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-xs font-mono text-slate-400 mb-1">
                        Q{q.question_number} · {q.topic_tag}
                      </div>
                      <div className="text-sm font-medium text-slate-200">
                        {q.question}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-bold text-amber-400">
                        {q.score} / {q.max_score}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-400 bg-[#162032] p-2.5 rounded border border-slate-800">
                    <span className="font-semibold text-slate-300">Remark: </span>
                    {q.feedback}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-sm transition"
            >
              Take Another Examination
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

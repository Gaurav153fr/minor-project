'use client';

import React from 'react';

export type TeacherMood = 'idle' | 'speaking' | 'listening' | 'evaluating' | 'impressed' | 'strict';

interface VivaDeskSceneProps {
  mood: TeacherMood;
  questionNumber?: number;
  totalQuestions?: number;
  topicTag?: string;
  questionText?: string;
  onReadAloud?: () => void;
  isAudioPlaying?: boolean;
}

export const VivaDeskScene: React.FC<VivaDeskSceneProps> = ({
  mood,
  questionNumber,
  totalQuestions,
  topicTag,
  questionText,
  onReadAloud,
  isAudioPlaying,
}) => {
  const isSpeaking = mood === 'speaking' || isAudioPlaying;
  const isListening = mood === 'listening';
  const isEvaluating = mood === 'evaluating';
  const isImpressed = mood === 'impressed';
  const isStrict = mood === 'strict';

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700 bg-[#0e141f] select-none shadow-xl">
      {/* ── ROOM BACKGROUND WALL ── */}
      <div className="relative h-64 sm:h-72 w-full bg-[#111724] overflow-hidden flex flex-col justify-between">
        {/* Subtle academic wall texture & vertical wall panels */}
        <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(90deg,#000_0px,#000_1px,transparent_1px,transparent_60px)]" />

        {/* Ceiling soft downlight cone */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-100/5 blur-3xl pointer-events-none rounded-full" />

        {/* Chalkboard on wall behind teacher */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[90%] sm:w-[540px] h-20 bg-[#162032] border-2 border-[#2b3952] rounded-md p-2.5 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div>
              <div className="text-[10px] tracking-widest uppercase font-mono text-slate-400">Oral Examination · Cabin 402</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-[260px] sm:max-w-[340px]">
                {topicTag || 'General Engineering Syllabus'}
              </div>
            </div>
          </div>
          {questionNumber && totalQuestions && (
            <div className="bg-[#0f172a] px-3 py-1 rounded border border-slate-700 font-mono text-xs text-amber-300 font-bold">
              Q{questionNumber} / {totalQuestions}
            </div>
          )}
        </div>

        {/* Hanging lamp over table */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-0.5 h-6 bg-slate-600" />
          <div className="w-10 h-3 bg-slate-800 rounded-t-sm border border-slate-600" />
        </div>

        {/* ── PROFESSOR (DR. SHARMA) SEATED BEHIND DESK ── */}
        <div className="relative z-10 mx-auto mt-auto flex flex-col items-center">
          {/* Executive Office Chair Top */}
          <div className="relative -mb-16 w-36 h-28 bg-[#1e232e] border-2 border-[#2f3747] rounded-t-3xl shadow-lg" />

          {/* Professor Upper Body SVG */}
          <div className="relative z-10 w-44 sm:w-52 h-44 sm:h-52">
            <svg viewBox="0 0 160 160" className="w-full h-full">
              <defs>
                <linearGradient id="suitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#242c3d" />
                  <stop offset="100%" stopColor="#151b26" />
                </linearGradient>
                <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f7d0a6" />
                  <stop offset="100%" stopColor="#e2ad7a" />
                </linearGradient>
              </defs>

              {/* Shoulders & Suit Coat */}
              <path d="M 20 160 Q 40 105 80 105 Q 120 105 140 160 Z" fill="url(#suitGrad)" stroke="#1a202c" strokeWidth="1" />

              {/* White Collared Shirt */}
              <polygon points="68,105 80,125 92,105 86,105 80,114 74,105" fill="#f1f5f9" />
              {/* Maroon / Crimson Tie */}
              <polygon points="77,114 83,114 85,155 80,160 75,155" fill="#991b1b" />

              {/* Neck */}
              <rect x="71" y="85" width="18" height="24" rx="4" fill="#e2ad7a" />

              {/* Head */}
              <circle cx="80" cy="62" r="30" fill="url(#skinGrad)" />

              {/* Hair (Classic Academic Cut with Silver Streaks) */}
              <path
                d="M 50 60 C 48 36, 62 26, 80 26 C 98 26, 112 36, 110 60 C 104 40, 94 34, 80 34 C 66 34, 56 40, 50 60 Z"
                fill="#374151"
              />
              <path d="M 50 56 Q 47 70 52 76" stroke="#4b5563" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 110 56 Q 113 70 108 76" stroke="#4b5563" strokeWidth="4" strokeLinecap="round" fill="none" />

              {/* Eyebrows based on mood */}
              {isStrict ? (
                <>
                  <line x1="62" y1="51" x2="74" y2="55" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="86" y1="55" x2="98" y2="51" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
                </>
              ) : isEvaluating ? (
                <>
                  <line x1="62" y1="51" x2="74" y2="51" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="86" y1="53" x2="98" y2="48" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <line x1="62" y1="52" x2="74" y2="52" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="86" y1="52" x2="98" y2="52" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
                </>
              )}

              {/* Eyes */}
              <circle cx="67" cy="59" r="3.5" fill="#0f172a" />
              <circle cx="93" cy="59" r="3.5" fill="#0f172a" />
              <circle cx="68" cy="58" r="1" fill="#ffffff" />
              <circle cx="94" cy="58" r="1" fill="#ffffff" />

              {/* Spectacles (Academic Glasses) */}
              <rect x="58" y="52" width="18" height="15" rx="3" fill="none" stroke="#60a5fa" strokeWidth="2" />
              <rect x="84" y="52" width="18" height="15" rx="3" fill="none" stroke="#60a5fa" strokeWidth="2" />
              <line x1="76" y1="59" x2="84" y2="59" stroke="#60a5fa" strokeWidth="2" />
              <line x1="52" y1="57" x2="58" y2="57" stroke="#60a5fa" strokeWidth="1.5" />
              <line x1="102" y1="57" x2="108" y2="57" stroke="#60a5fa" strokeWidth="1.5" />

              {/* Nose */}
              <path d="M 79 63 L 82 69 L 77 70" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

              {/* Mustache */}
              <path d="M 71 73 Q 76 75 80 74 Q 84 75 89 73" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" fill="none" />

              {/* Mouth */}
              {isSpeaking ? (
                <ellipse cx="80" cy="79" rx="5" ry="3.5" fill="#881337">
                  <animate attributeName="ry" values="1.5;4;1;4.5;1.5" dur="0.55s" repeatCount="indefinite" />
                </ellipse>
              ) : isImpressed ? (
                <path d="M 71 78 Q 80 84 89 78" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              ) : isStrict ? (
                <line x1="73" y1="80" x2="87" y2="79" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M 72 79 Q 80 82 88 79" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              )}

              {/* Thinking gesture (hand touching chin) when evaluating */}
              {isEvaluating && (
                <g>
                  <circle cx="95" cy="88" r="8" fill="#e2ad7a" stroke="#b45309" strokeWidth="1" />
                  <path d="M 90 92 L 102 110" stroke="#242c3d" strokeWidth="6" strokeLinecap="round" />
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* ── THE EXAMINATION WOODEN DESK (Spans the middle) ── */}
      <div className="relative w-full bg-[#2a1d15] border-t-4 border-[#422d20] shadow-2xl py-3 px-4 sm:px-8 flex items-center justify-between z-20">
        {/* Left side of desk: Syllabus docket & Ceramic Tea cup */}
        <div className="flex items-center gap-3">
          {/* Academic folder */}
          <div className="hidden sm:flex flex-col justify-center px-2.5 py-1.5 bg-[#451a03] border border-[#78350f] rounded shadow text-[10px] text-amber-200 font-mono">
            <span className="font-bold">CONFIDENTIAL</span>
            <span className="text-[9px] text-amber-400/80">Viva Dossier</span>
          </div>
          {/* Tea Mug */}
          <div className="flex items-center gap-1">
            <div className="w-5 h-6 bg-slate-200 rounded-b border border-slate-400 shadow-sm relative">
              <div className="absolute top-1 right-[-4px] w-1.5 h-3 border border-slate-400 rounded-r-full" />
              <div className="w-full h-1 bg-amber-900/60 rounded-t-sm" />
            </div>
          </div>
        </div>

        {/* Center of desk: Brass Nameplate */}
        <div className="flex flex-col items-center">
          <div className="px-4 py-1 bg-[#1a120c] border-2 border-[#b45309] rounded shadow-md text-center">
            <div className="text-[11px] font-bold text-amber-200 tracking-wider">DR. A. SHARMA</div>
            <div className="text-[9px] text-amber-400/70 uppercase tracking-widest font-mono">External Examiner</div>
          </div>
        </div>

        {/* Right side of desk: Gooseneck Viva Table Microphone pointed at student */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#17120e] px-2.5 py-1 rounded border border-[#3e2b1f]">
            <span
              className={`w-2 h-2 rounded-full ${
                isListening
                  ? 'bg-emerald-500 animate-ping'
                  : isSpeaking
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-[10px] font-mono text-slate-300">
              {isListening ? 'MIC ACTIVE' : isSpeaking ? 'EXAMINER SPEAKING' : isEvaluating ? 'EVALUATING' : 'READY'}
            </span>
          </div>
        </div>
      </div>

      {/* ── QUESTION DISPLAY FROM TEACHER ── */}
      {questionText && (
        <div className="relative z-20 bg-[#161d2b] border-t border-slate-700 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  Question from Dr. Sharma:
                </span>
                {mood === 'speaking' && (
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                    Spoken
                  </span>
                )}
              </div>
              <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed font-sans">
                "{questionText}"
              </p>
            </div>
            {onReadAloud && (
              <button
                onClick={onReadAloud}
                title="Listen to question again"
                className="shrink-0 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition"
              >
                🔊
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

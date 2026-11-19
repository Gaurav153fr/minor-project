'use client';

import React from 'react';

export type TeacherState = 'idle' | 'speaking' | 'listening' | 'evaluating' | 'impressed' | 'strict';

interface TeacherAvatarProps {
  state?: TeacherState;
  size?: 'sm' | 'md' | 'lg';
  caption?: string;
  name?: string;
}

export const TeacherAvatar: React.FC<TeacherAvatarProps> = ({
  state = 'idle',
  size = 'md',
  caption,
  name = 'Prof. Sharma',
}) => {
  const isSpeaking = state === 'speaking';
  const isEvaluating = state === 'evaluating';
  const isListening = state === 'listening';
  const isImpressed = state === 'impressed';
  const isStrict = state === 'strict';

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }[size];

  // Status badge config
  const statusConfig = {
    idle: { label: 'Ready for Viva', bg: 'bg-slate-700/80 text-slate-300 border-slate-600' },
    speaking: { label: 'Asking Question…', bg: 'bg-violet-500/20 text-violet-300 border-violet-500/40' },
    listening: { label: 'Listening to you…', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    evaluating: { label: 'Evaluating Answer…', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    impressed: { label: 'Very Impressed! 👏', bg: 'bg-green-500/20 text-green-300 border-green-500/40' },
    strict: { label: 'Needs More Detail 🧐', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  }[state];

  return (
    <div className="flex flex-col items-center select-none">
      {/* Avatar Container with Glow */}
      <div className="relative group">
        {/* Glow halo */}
        <div
          className={`absolute -inset-2 rounded-full blur-md opacity-60 transition-all duration-500 ${
            isSpeaking
              ? 'bg-violet-500 animate-pulse'
              : isListening
              ? 'bg-emerald-500 animate-pulse'
              : isEvaluating
              ? 'bg-amber-500 animate-pulse'
              : isImpressed
              ? 'bg-green-400'
              : isStrict
              ? 'bg-rose-500'
              : 'bg-indigo-600/30'
          }`}
        />

        {/* SVG Illustration Container */}
        <div
          className={`relative ${sizeClasses} rounded-full bg-gradient-to-b from-slate-800 to-slate-950 border-2 ${
            isSpeaking
              ? 'border-violet-400'
              : isListening
              ? 'border-emerald-400'
              : isEvaluating
              ? 'border-amber-400'
              : 'border-slate-700'
          } shadow-2xl overflow-hidden flex items-center justify-center`}
        >
          {/* Subtle background blackboard pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:8px_8px] opacity-40" />

          {/* Teacher Vector Character */}
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full transform transition-transform duration-300 hover:scale-105"
          >
            <defs>
              <linearGradient id="teacherSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="teacherSuit" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#312e81" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
              <linearGradient id="teacherHair" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>

            {/* Suit & Collar */}
            <path d="M 25 120 Q 35 88 60 88 Q 85 88 95 120 Z" fill="url(#teacherSuit)" />
            {/* White Shirt Collar */}
            <polygon points="50,88 60,102 70,88 65,88 60,94 55,88" fill="#f8fafc" />
            {/* Red Tie */}
            <polygon points="58,95 62,95 64,115 60,120 56,115" fill="#ef4444" />

            {/* Neck */}
            <rect x="52" y="72" width="16" height="18" rx="4" fill="#fbbf24" />

            {/* Head */}
            <circle cx="60" cy="52" r="24" fill="url(#teacherSkin)" />

            {/* Hair with grey streaks (Academic style) */}
            <path
              d="M 36 50 C 35 32, 45 22, 60 22 C 75 22, 85 32, 84 50 C 80 34, 72 28, 60 28 C 48 28, 40 34, 36 50 Z"
              fill="url(#teacherHair)"
            />
            {/* Side hair */}
            <path d="M 36 46 Q 34 56 38 62" stroke="#475569" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 84 46 Q 86 56 82 62" stroke="#475569" strokeWidth="4" strokeLinecap="round" fill="none" />

            {/* Eyebrows */}
            {isStrict ? (
              <>
                <line x1="45" y1="41" x2="54" y2="44" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="66" y1="44" x2="75" y2="41" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : isEvaluating ? (
              <>
                <line x1="45" y1="41" x2="54" y2="41" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="66" y1="43" x2="75" y2="39" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <line x1="45" y1="42" x2="54" y2="42" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="66" y1="42" x2="75" y2="42" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              </>
            )}

            {/* Eyes */}
            <circle cx="49" cy="48" r="3" fill="#0f172a" />
            <circle cx="71" cy="48" r="3" fill="#0f172a" />
            <circle cx="50" cy="47" r="1" fill="#ffffff" />
            <circle cx="72" cy="47" r="1" fill="#ffffff" />

            {/* Teacher Glasses (Signature look!) */}
            <rect x="42" y="43" width="15" height="12" rx="3" fill="none" stroke="#0ea5e9" strokeWidth="2" />
            <rect x="63" y="43" width="15" height="12" rx="3" fill="none" stroke="#0ea5e9" strokeWidth="2" />
            <line x1="57" y1="48" x2="63" y2="48" stroke="#0ea5e9" strokeWidth="2" />
            <line x1="37" y1="46" x2="42" y2="46" stroke="#0ea5e9" strokeWidth="1.5" />
            <line x1="78" y1="46" x2="83" y2="46" stroke="#0ea5e9" strokeWidth="1.5" />

            {/* Nose */}
            <path d="M 59 51 L 62 55 L 58 56" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

            {/* Mouth */}
            {isSpeaking ? (
              // Open animated talking mouth
              <ellipse cx="60" cy="62" rx="5" ry="4" fill="#991b1b">
                <animate attributeName="ry" values="2;4;1;4;2" dur="0.6s" repeatCount="indefinite" />
              </ellipse>
            ) : isImpressed ? (
              // Happy wide smile
              <path d="M 52 61 Q 60 68 68 61" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
            ) : isStrict ? (
              // Stern straight line
              <line x1="54" y1="63" x2="66" y2="62" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            ) : (
              // Polite pleasant smile
              <path d="M 53 62 Q 60 65 67 62" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            )}

            {/* Mustaches (Classic Indian Professor touch) */}
            <path d="M 53 58 Q 57 59 60 58 Q 63 59 67 58" stroke="#475569" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>

          {/* Sound waves icon when speaking */}
          {isSpeaking && (
            <div className="absolute top-2 right-2 flex gap-0.5 items-end h-3">
              <span className="w-0.5 bg-violet-400 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
              <span className="w-0.5 bg-violet-400 rounded-full animate-bounce h-3" style={{ animationDelay: '150ms' }} />
              <span className="w-0.5 bg-violet-400 rounded-full animate-bounce h-1.5" style={{ animationDelay: '300ms' }} />
            </div>
          )}

          {/* Thinking gear or sparkle when evaluating */}
          {isEvaluating && (
            <div className="absolute top-1.5 right-1.5 text-xs animate-spin">
              ⚙️
            </div>
          )}
        </div>
      </div>

      {/* Name & Title */}
      <div className="mt-2 text-center">
        <div className="text-xs font-bold text-white tracking-wide">{name}</div>
        <div className="text-[10px] text-slate-400 font-medium">External Viva Examiner</div>
      </div>

      {/* Animated Status Pill */}
      <div
        className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all duration-300 shadow-sm ${statusConfig.bg}`}
      >
        {caption || statusConfig.label}
      </div>
    </div>
  );
};

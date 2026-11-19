'use client';

import React from 'react';

interface HostCharacterProps {
  name: 'Arjun' | 'Priya' | string;
  isSpeaking?: boolean;
  size?: 'sm' | 'md' | 'lg';
  emotion?: string;
}

// ── Individual Host SVG Character ──────────────────────────────

export const HostCharacter: React.FC<HostCharacterProps> = ({
  name,
  isSpeaking = false,
  size = 'md',
  emotion = 'neutral',
}) => {
  const isArjun = name.toLowerCase().includes('arjun');

  const dim = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }[size];

  const ringColor = isArjun
    ? isSpeaking ? 'ring-cyan-400 shadow-cyan-500/40' : 'ring-cyan-500/30'
    : isSpeaking ? 'ring-pink-400 shadow-pink-500/40' : 'ring-pink-500/30';

  const glowColor = isArjun
    ? isSpeaking ? 'bg-cyan-500/30' : 'bg-transparent'
    : isSpeaking ? 'bg-pink-500/30' : 'bg-transparent';

  return (
    <div className="relative inline-flex flex-col items-center select-none">
      {/* Speaking glow */}
      {isSpeaking && (
        <div className={`absolute -inset-1 rounded-full blur-md ${glowColor} animate-pulse`} />
      )}

      {/* Avatar Container */}
      <div
        className={`relative ${dim} rounded-full bg-slate-900 border-2 ${
          isArjun
            ? isSpeaking ? 'border-cyan-400' : 'border-cyan-700/50'
            : isSpeaking ? 'border-pink-400' : 'border-pink-700/50'
        } ring-2 ${ringColor} shadow-lg overflow-hidden flex items-center justify-center transition-all duration-300`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fed7aa" />
              <stop offset="100%" stopColor="#fba667" />
            </linearGradient>
            <linearGradient id="headphoneBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="headphonePink" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#be185d" />
            </linearGradient>
            <linearGradient id="arjunHair" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="priyaHair" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
          </defs>

          {isArjun ? (
            // ── ARJUN ──────────────────────────────────────────
            <>
              {/* Hoodie / T-shirt */}
              <path d="M 20 100 Q 28 75 50 75 Q 72 75 80 100 Z" fill="#0284c7" />
              <polygon points="42,75 50,86 58,75" fill="#f8fafc" />

              {/* Neck */}
              <rect x="44" y="62" width="12" height="15" rx="3" fill="#fba667" />

              {/* Head */}
              <circle cx="50" cy="48" r="20" fill="url(#skin)" />

              {/* Cool modern haircut (short fade + top volume) */}
              <path
                d="M 30 46 C 30 30, 40 24, 52 24 C 64 24, 72 30, 70 46 C 66 33, 56 31, 50 31 C 42 31, 34 35, 30 46 Z"
                fill="url(#arjunHair)"
              />

              {/* Eyes */}
              <circle cx="43" cy="46" r="2.5" fill="#0f172a" />
              <circle cx="57" cy="46" r="2.5" fill="#0f172a" />
              <circle cx="44" cy="45" r="0.8" fill="#ffffff" />
              <circle cx="58" cy="45" r="0.8" fill="#ffffff" />

              {/* Eyebrows */}
              <path d="M 39 40 Q 43 38 47 40" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M 53 40 Q 57 38 61 40" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" fill="none" />

              {/* Smile / Talking mouth */}
              {isSpeaking ? (
                <ellipse cx="50" cy="57" rx="4" ry="3.5" fill="#b91c1c">
                  <animate attributeName="ry" values="1.5;3.5;1.5;4;1.5" dur="0.5s" repeatCount="indefinite" />
                </ellipse>
              ) : (
                <path d="M 44 56 Q 50 60 56 56" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              )}

              {/* DJ Headphones Band */}
              <path d="M 28 48 A 22 22 0 0 1 72 48" stroke="url(#headphoneBlue)" strokeWidth="3" fill="none" />
              {/* Ear cushions */}
              <rect x="25" y="42" width="6" height="14" rx="3" fill="url(#headphoneBlue)" />
              <rect x="69" y="42" width="6" height="14" rx="3" fill="url(#headphoneBlue)" />
            </>
          ) : (
            // ── PRIYA ──────────────────────────────────────────
            <>
              {/* Top / Blazer */}
              <path d="M 20 100 Q 28 75 50 75 Q 72 75 80 100 Z" fill="#db2777" />
              <polygon points="43,75 50,85 57,75" fill="#fbcfe8" />

              {/* Neck */}
              <rect x="45" y="63" width="10" height="14" rx="3" fill="#fba667" />

              {/* Long Hair (behind head) */}
              <path d="M 26 48 C 24 68, 28 85, 34 95 L 66 95 C 72 85, 76 68, 74 48 Z" fill="url(#priyaHair)" />

              {/* Head */}
              <circle cx="50" cy="48" r="19" fill="url(#skin)" />

              {/* Front Hair Bangs */}
              <path
                d="M 31 46 C 33 30, 42 25, 50 25 C 60 25, 68 30, 69 46 C 65 35, 58 32, 50 32 C 40 32, 34 37, 31 46 Z"
                fill="url(#priyaHair)"
              />

              {/* Bindi (classic touch) */}
              <circle cx="50" cy="40" r="1" fill="#be123c" />

              {/* Eyes with eyelashes */}
              <circle cx="43" cy="46" r="2.5" fill="#0f172a" />
              <circle cx="57" cy="46" r="2.5" fill="#0f172a" />
              <circle cx="44" cy="45" r="0.8" fill="#ffffff" />
              <circle cx="58" cy="45" r="0.8" fill="#ffffff" />
              <path d="M 40 43 Q 43 41 46 43" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M 54 43 Q 57 41 60 43" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />

              {/* Small Earrings */}
              <circle cx="31" cy="52" r="1.5" fill="#fbbf24" />
              <circle cx="69" cy="52" r="1.5" fill="#fbbf24" />

              {/* Smile / Talking mouth */}
              {isSpeaking ? (
                <ellipse cx="50" cy="57" rx="4" ry="3.5" fill="#e11d48">
                  <animate attributeName="ry" values="1.5;3.5;1.5;4;1.5" dur="0.5s" repeatCount="indefinite" />
                </ellipse>
              ) : (
                <path d="M 45 56 Q 50 60 55 56" stroke="#be123c" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              )}

              {/* Pink Studio Headphones */}
              <path d="M 28 47 A 22 22 0 0 1 72 47" stroke="url(#headphonePink)" strokeWidth="3" fill="none" />
              <rect x="25" y="42" width="6" height="13" rx="3" fill="url(#headphonePink)" />
              <rect x="69" y="42" width="6" height="13" rx="3" fill="url(#headphonePink)" />
            </>
          )}

          {/* Mini Podcast Mic in foreground */}
          <rect x="47" y="70" width="6" height="10" rx="3" fill={isSpeaking ? '#ef4444' : '#64748b'} />
          <line x1="50" y1="80" x2="50" y2="88" stroke="#64748b" strokeWidth="2" />
          <circle cx="50" cy="74" r="1" fill="#ffffff" />
        </svg>

        {/* Live Audio Waves Badge when speaking */}
        {isSpeaking && (
          <span className="absolute -bottom-1 -right-1 flex gap-0.5 bg-slate-900/90 px-1 py-0.5 rounded-full border border-white/20">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={`w-0.5 rounded-full animate-bounce ${isArjun ? 'bg-cyan-400' : 'bg-pink-400'}`}
                style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </span>
        )}
      </div>

      {size !== 'sm' && (
        <span
          className={`mt-1.5 text-xs font-bold tracking-wide ${
            isArjun
              ? isSpeaking ? 'text-cyan-300' : 'text-slate-400'
              : isSpeaking ? 'text-pink-300' : 'text-slate-400'
          }`}
        >
          {name}
        </span>
      )}
    </div>
  );
};

// ── Podcast Studio On-Air Booth Component ──────────────────────

interface PodcastStudioBoothProps {
  activeSpeaker?: string | null;
  isPlaying?: boolean;
  topicTitle?: string;
  language?: string;
}

export const PodcastStudioBooth: React.FC<PodcastStudioBoothProps> = ({
  activeSpeaker,
  isPlaying = false,
  topicTitle,
  language,
}) => {
  const arjunSpeaking = isPlaying && activeSpeaker === 'Arjun';
  const priyaSpeaking = isPlaying && activeSpeaker === 'Priya';

  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-white/10 p-5 overflow-hidden shadow-2xl">
      {/* Studio Background lights effect */}
      <div className="absolute top-0 left-1/4 w-32 h-20 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-32 h-20 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Bar: "ON AIR" Sign */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase border transition-all ${
              isPlaying
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse shadow-sm shadow-red-500/50'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
            {isPlaying ? 'ON AIR' : 'STUDIO READY'}
          </div>
          <span className="text-xs text-slate-400 font-medium">StudyGenius Podcast</span>
        </div>

        <div className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 font-semibold border border-white/5">
          {language === 'hindi' ? '🇮🇳 Hinglish' : '🇬🇧 English'}
        </div>
      </div>

      {/* Main Studio View: Arjun & Priya across the table */}
      <div className="flex items-center justify-around py-2">
        {/* Arjun */}
        <div className={`flex flex-col items-center transition-all duration-300 ${arjunSpeaking ? 'scale-105' : 'opacity-85'}`}>
          <HostCharacter name="Arjun" isSpeaking={arjunSpeaking} size="lg" />
          <div className="mt-1 flex items-center gap-1 text-[11px] text-cyan-300 font-semibold">
            {arjunSpeaking ? '🎙️ Talking…' : '🎧 Listening'}
          </div>
        </div>

        {/* Studio Center Table / Equalizer */}
        <div className="flex flex-col items-center gap-2 px-4">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-lg shadow-inner">
            🎙️
          </div>
          <div className="flex items-end gap-1 h-6">
            {[4, 12, 18, 10, 22, 14, 8].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-200 ${
                  isPlaying
                    ? arjunSpeaking
                      ? 'bg-cyan-400 animate-pulse'
                      : priyaSpeaking
                      ? 'bg-pink-400 animate-pulse'
                      : 'bg-slate-600'
                    : 'bg-slate-700'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(4, (h * (i % 2 === 0 ? 1.2 : 0.8)))}px` : '4px',
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">BROADCAST</span>
        </div>

        {/* Priya */}
        <div className={`flex flex-col items-center transition-all duration-300 ${priyaSpeaking ? 'scale-105' : 'opacity-85'}`}>
          <HostCharacter name="Priya" isSpeaking={priyaSpeaking} size="lg" />
          <div className="mt-1 flex items-center gap-1 text-[11px] text-pink-300 font-semibold">
            {priyaSpeaking ? '🎙️ Talking…' : '🎧 Listening'}
          </div>
        </div>
      </div>
    </div>
  );
};

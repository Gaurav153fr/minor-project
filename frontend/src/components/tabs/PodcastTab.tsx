'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Radio, Play, Pause, Square, SkipBack, Volume2, VolumeX,
  Loader2, AlertCircle, RefreshCw, Copy, Check, ChevronDown,
  Zap, Clock, Globe, Mic2, Sparkles,
} from 'lucide-react';
import { PodcastScript, PodcastDialogueLine } from '@/types';
import { StudentProfile } from '@/types/profile';
import { generatePodcast } from '@/lib/api';
import { HostCharacter, PodcastStudioBooth } from '@/components/characters/PodcastHosts';

// ── Types ──────────────────────────────────────────────────────

type Phase = 'setup' | 'generating' | 'player';
type PlayState = 'idle' | 'playing' | 'paused' | 'done';

interface PodcastTabProps {
  selectedDocument: string;
  profile?: StudentProfile | null;
  studentContext?: string;
}

// ── Emotion → emoji map ────────────────────────────────────────

const EMOTION_EMOJI: Record<string, string> = {
  curious: '🤔', explaining: '💡', surprised: '😲', laughing: '😄',
  excited: '🤩', thoughtful: '🧠', neutral: '💬',
};

// ── Host avatar colours ────────────────────────────────────────

const HOST_STYLE: Record<string, { bg: string; ring: string; label: string }> = {
  Arjun: { bg: 'from-blue-500 to-indigo-600', ring: 'ring-blue-500/40', label: 'text-blue-300' },
  Priya: { bg: 'from-rose-500 to-pink-600', ring: 'ring-rose-500/40', label: 'text-rose-300' },
};

function HostAvatar({ name, size = 'md', speaking = false }: { name: string; size?: 'sm' | 'md'; speaking?: boolean }) {
  const s = HOST_STYLE[name] ?? { bg: 'from-slate-500 to-slate-600', ring: 'ring-slate-500/40', label: 'text-slate-300' };
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`relative shrink-0 ${dim} rounded-full bg-gradient-to-br ${s.bg} flex items-center justify-center font-bold text-white ring-2 ${s.ring} ${speaking ? 'animate-pulse' : ''}`}>
      {name[0]}
      {speaking && (
        <span className="absolute -bottom-1 -right-1 flex gap-0.5">
          {[1, 2, 3].map((i) => (
            <span key={i} className="w-0.5 bg-white rounded-full animate-bounce"
              style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />
          ))}
        </span>
      )}
    </div>
  );
}

// ── Playback hook ──────────────────────────────────────────────

function usePodcastPlayer(script: PodcastDialogueLine[], langCode: string) {
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [activeTurn, setActiveTurn] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [muted, setMuted] = useState(false);
  const stopRef = useRef(false);
  const pauseRef = useRef(false);
  const pauseResolveRef = useRef<(() => void) | null>(null);

  const getVoices = useCallback((gender: 'male' | 'female'): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices();
    const lang = langCode;
    // Prefer lang-specific voices
    const langVoices = voices.filter(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]));
    // Try gender match by name hints
    const genderHints = gender === 'male'
      ? ['male', 'man', 'guy', 'arjun', 'google hindi male', 'ravi', 'hemant', 'google us english']
      : ['female', 'woman', 'girl', 'priya', 'google hindi female', 'lekha', 'zira', 'google uk english'];
    for (const hint of genderHints) {
      const match = langVoices.find(v => v.name.toLowerCase().includes(hint));
      if (match) return match;
    }
    // Fallback: pick different voices for male vs female by index
    if (langVoices.length >= 2) return gender === 'male' ? langVoices[0] : langVoices[1];
    if (langVoices.length === 1) return langVoices[0];
    // Last resort: any voice
    return voices[gender === 'male' ? 0 : 1] ?? voices[0] ?? null;
  }, [langCode]);

  const speakLine = useCallback((text: string, speaker: string): Promise<void> => {
    return new Promise((resolve) => {
      if (muted || stopRef.current) { resolve(); return; }
      speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = speed;
      utt.pitch = speaker === 'Arjun' ? 0.9 : 1.1;
      const voice = getVoices(speaker === 'Arjun' ? 'male' : 'female');
      if (voice) utt.voice = voice;
      utt.lang = langCode;
      utt.onend = () => resolve();
      utt.onerror = () => resolve();
      speechSynthesis.speak(utt);
    });
  }, [muted, speed, getVoices, langCode]);

  const waitForResume = (): Promise<void> => new Promise((resolve) => { pauseResolveRef.current = resolve; });

  const play = useCallback(async (fromTurn = 0) => {
    stopRef.current = false;
    pauseRef.current = false;
    setPlayState('playing');
    const lines = fromTurn > 0 ? script.slice(fromTurn) : script;
    for (const line of lines) {
      if (stopRef.current) break;
      if (pauseRef.current) { setPlayState('paused'); await waitForResume(); setPlayState('playing'); }
      setActiveTurn(line.turn);
      // auto-scroll
      document.getElementById(`podcast-line-${line.turn}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await speakLine(line.text, line.speaker);
    }
    if (!stopRef.current) { setPlayState('done'); setActiveTurn(null); }
  }, [script, speakLine]);

  const pause = useCallback(() => {
    pauseRef.current = true;
    speechSynthesis.cancel();
    setPlayState('paused');
  }, []);

  const resume = useCallback(() => {
    pauseRef.current = false;
    pauseResolveRef.current?.();
    setPlayState('playing');
  }, []);

  const stop = useCallback(() => {
    stopRef.current = true;
    pauseRef.current = false;
    pauseResolveRef.current?.();
    speechSynthesis.cancel();
    setPlayState('idle');
    setActiveTurn(null);
  }, []);

  const restart = useCallback(() => { stop(); setTimeout(() => play(), 100); }, [stop, play]);

  // cleanup
  useEffect(() => () => { stopRef.current = true; speechSynthesis.cancel(); }, []);

  return { playState, activeTurn, speed, setSpeed, muted, setMuted, play, pause, resume, stop, restart };
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const PodcastTab: React.FC<PodcastTabProps> = ({ selectedDocument, profile, studentContext }) => {
  const [phase, setPhase] = useState<Phase>('setup');
  const [topic, setTopic] = useState<string>(selectedDocument !== 'all' ? selectedDocument : 'all');
  const [language, setLanguage] = useState<'english' | 'hindi'>('english');
  const [duration, setDuration] = useState<'short' | 'medium' | 'long'>('medium');
  const [episode, setEpisode] = useState<PodcastScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const langCode = episode ? episode.host1.lang_code : (language === 'hindi' ? 'hi-IN' : 'en-IN');
  const player = usePodcastPlayer(episode?.script ?? [], langCode);

  // ── Generate ──
  const handleGenerate = async () => {
    setPhase('generating');
    setError(null);
    player.stop();
    try {
      const data = await generatePodcast(topic, language, duration, studentContext);
      setEpisode(data);
      setPhase('player');
    } catch (err: any) {
      setError(err.message || 'Failed to generate podcast. Try again.');
      setPhase('setup');
    }
  };

  // ── Copy transcript ──
  const copyTranscript = () => {
    if (!episode) return;
    const text = episode.script.map(l => `${l.speaker}: ${l.text}`).join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ══════════════════════════════════════════════════════════════
  // SETUP SCREEN
  // ══════════════════════════════════════════════════════════════
  if (phase === 'setup' || phase === 'generating') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Studio Banner */}
        <div className="rounded-xl border border-slate-700 bg-[#0f172a] p-6 text-center shadow-md">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#1e293b] border border-slate-600 flex items-center justify-center text-amber-400">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-slate-400">
                StudyGenius Broadcast Studio
              </div>
              <h1 className="text-xl font-bold text-slate-100 mt-0.5">Two-Host Dialogue Podcast</h1>
            </div>
            <p className="text-slate-300 text-sm max-w-md">
              Arjun and Priya review your syllabus topics in a natural, engaging conversation — available in English and conversational Hinglish.
            </p>
            {/* Host avatars preview */}
            <div className="flex items-center gap-8 mt-2">
              <div className="flex flex-col items-center">
                <HostCharacter name="Arjun" size="md" />
                <span className="text-[10px] font-mono text-slate-400 mt-1">Arjun · The Inquisitive Host</span>
              </div>
              <div className="flex gap-1 items-end mb-4">
                {[4, 10, 16, 8, 14, 6].map((h, i) => (
                  <div key={i} className="w-1 rounded-full bg-amber-400/80" style={{ height: `${h * 2}px` }} />
                ))}
              </div>
              <div className="flex flex-col items-center">
                <HostCharacter name="Priya" size="md" />
                <span className="text-[10px] font-mono text-slate-400 mt-1">Priya · The Concept Lead</span>
              </div>
            </div>
          </div>
        </div>

        {/* Config */}
        <div className="rounded-xl border border-slate-700 bg-[#141d2e] p-6 space-y-6 shadow-md">
          {/* Language */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-amber-400" /> Broadcast Language
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['english', 'hindi'] as const).map((l) => (
                <button key={l} onClick={() => setLanguage(l)}
                  className={`py-3 px-4 rounded-lg text-xs font-semibold border transition ${
                    language === l
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                      : 'bg-[#0b101b] text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}>
                  {l === 'english' ? '🇬🇧 English' : '🇮🇳 Conversational Hinglish'}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <Mic2 className="w-3.5 h-3.5 text-amber-400" /> Syllabus Topic
            </label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-[#0b101b] border border-slate-700 rounded-lg px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-amber-400">
              <option value="all">Entire Course Syllabus (Comprehensive)</option>
              {selectedDocument && selectedDocument !== 'all' && (
                <option value={selectedDocument}>Selected Paper: {selectedDocument.split('/').pop()?.replace('.md', '')}</option>
              )}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Episode Length
            </label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { id: 'short', label: 'Brief', sub: '~3 min · 8 turns' },
                { id: 'medium', label: 'Standard', sub: '~6 min · 14 turns' },
                { id: 'long', label: 'In-Depth', sub: '~10 min · 22 turns' },
              ] as const).map((d) => (
                <button key={d.id} onClick={() => setDuration(d.id)}
                  className={`py-2.5 px-2 rounded-lg text-center border transition ${
                    duration === d.id
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                      : 'bg-[#0b101b] text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}>
                  <div className="font-bold text-xs">{d.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-80 font-mono">{d.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded bg-red-950/60 border border-red-800 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" /> {error}
            </div>
          )}

          <button onClick={handleGenerate} disabled={phase === 'generating'}
            className="w-full py-3.5 px-6 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-semibold text-sm transition flex items-center justify-center gap-2 border border-emerald-500/40 disabled:opacity-50">
            {phase === 'generating'
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Recording episode script…</>
              : <><Sparkles className="w-4 h-4" /> Synthesize Episode</>}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // PLAYER SCREEN
  // ══════════════════════════════════════════════════════════════
  if (phase === 'player' && episode) {
    const { playState, activeTurn, speed, setSpeed, muted, setMuted, play, pause, resume, stop, restart } = player;
    const currentLine = episode.script.find((l) => l.turn === activeTurn);
    const activeSpeaker = playState === 'playing' ? currentLine?.speaker : null;

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* On-Air Studio Booth */}
        <PodcastStudioBooth
          activeSpeaker={activeSpeaker}
          isPlaying={playState === 'playing'}
          topicTitle={episode.episode_title}
          language={episode.language}
        />

        {/* Episode header */}
        <div className="rounded-xl border border-slate-700 bg-[#0f172a] p-4 shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1e293b] border border-slate-600 flex items-center justify-center shrink-0 text-amber-400">
              <Radio className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-slate-100 leading-tight">{episode.episode_title}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1e293b] text-amber-300 border border-slate-700">
                  {episode.topic_tag}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {episode.language === 'hindi' ? '🇮🇳 Hinglish' : '🇬🇧 English'} · ~{episode.duration_minutes} min · {episode.script.length} turns
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-700/80">
            {/* Restart */}
            <button onClick={restart} title="Restart"
              className="p-2 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-300 border border-slate-700 transition">
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause / Stop */}
            {playState === 'idle' || playState === 'done' ? (
              <button onClick={() => play()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition border border-emerald-500/40">
                <Play className="w-3.5 h-3.5 fill-white" /> {playState === 'done' ? 'Play Again' : 'Play Broadcast'}
              </button>
            ) : playState === 'playing' ? (
              <button onClick={pause}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition border border-amber-400">
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
            ) : (
              <button onClick={resume}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition border border-emerald-500/40">
                <Play className="w-3.5 h-3.5 fill-white" /> Resume
              </button>
            )}

            {(playState === 'playing' || playState === 'paused') && (
              <button onClick={stop} title="Stop"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition">
                <Square className="w-4 h-4" />
              </button>
            )}

            {/* Speed */}
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
              className="ml-auto bg-[#1e293b] border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-400">
              {[0.75, 1, 1.25, 1.5, 2].map(s => (
                <option key={s} value={s}>{s}x</option>
              ))}
            </select>

            {/* Mute */}
            <button onClick={() => setMuted(!muted)} title={muted ? 'Unmute' : 'Mute'}
              className="p-2 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-300 border border-slate-700 transition">
              {muted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Status bar */}
          {playState !== 'idle' && activeTurn !== null && (
            <div className="mt-3 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${(activeTurn / episode.script.length) * 100}%` }}
              />
            </div>
          )}
          {playState === 'done' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <Zap className="w-3.5 h-3.5" /> Broadcast concluded.
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button onClick={copyTranscript}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition">
            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Script</>}
          </button>
          <button onClick={() => { player.stop(); setPhase('setup'); setEpisode(null); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition ml-auto">
            <RefreshCw className="w-3.5 h-3.5" /> New Episode
          </button>
        </div>

        {/* Transcript */}
        <div className="rounded-xl bg-[#0f172a] border border-slate-700 overflow-hidden shadow-md">
          <div className="px-4 py-3 border-b border-slate-700/80 flex items-center gap-2 bg-[#141d2e]">
            <Mic2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Dialogue Transcript</span>
            <span className="text-xs text-slate-400 font-mono ml-auto">{episode.script.length} turns</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 podcast-scroll">
            {episode.script.map((line: PodcastDialogueLine) => {
              const isActive = activeTurn === line.turn;
              const isArjun = line.speaker === 'Arjun';
              const hs = HOST_STYLE[line.speaker] ?? HOST_STYLE['Arjun'];
              const emoji = EMOTION_EMOJI[line.emotion ?? 'neutral'] ?? '💬';

              return (
                <div
                  key={line.turn}
                  id={`podcast-line-${line.turn}`}
                  className={`flex gap-3 p-3 rounded-lg border transition-all duration-300 ${
                    isActive
                      ? 'bg-[#1a2538] border-amber-500/50 shadow-sm'
                      : 'border-transparent hover:bg-white/5'
                  } ${isArjun ? '' : 'flex-row-reverse'}`}
                >
                  <HostCharacter name={line.speaker} size="sm" isSpeaking={isActive} emotion={line.emotion} />
                  <div className={`flex-1 ${isArjun ? '' : 'text-right'}`}>
                    <div className={`flex items-center gap-1.5 mb-1 ${isArjun ? '' : 'justify-end'}`}>
                      <span className={`text-xs font-bold ${hs.label}`}>{line.speaker}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-400">{emoji}</span>
                    </div>
                    <p className={`text-sm text-slate-200 leading-relaxed font-sans ${
                      isActive ? 'text-white font-medium' : ''
                    }`}>
                      {line.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

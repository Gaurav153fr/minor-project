'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  Activity,
  Settings,
  GraduationCap,
  User,
} from 'lucide-react';
import { DocumentItem } from '@/types';
import { StudentProfile } from '@/types/profile';

interface HeaderProps {
  documents: DocumentItem[];
  selectedDocument: string;
  onSelectDocument: (docId: string) => void;
  isBackendConnected: boolean;
  isLoadingDocs: boolean;
  profile: StudentProfile | null;
  onOpenOnboarding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  documents,
  selectedDocument,
  onSelectDocument,
  isBackendConnected,
  isLoadingDocs,
  profile,
  onOpenOnboarding,
}) => {
  const activeSemester = profile?.semesters.find(
    (s) => s.number === profile.currentSemester
  );

  return (
    <header className="sticky top-0 z-50 bg-[#0d1320] border-b border-slate-800 px-4 md:px-8 py-2.5 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-indigo-700 border border-indigo-500/40 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-100 group-hover:text-white transition-colors">
                  StudyGenius
                </h1>
                <span className="px-2 py-0.2 text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded">
                  Curriculum AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Academic &amp; University Exam Companion
              </p>
            </div>
          </Link>

          {/* Mobile Profile & Backend Status */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/settings"
              aria-label="Settings"
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  isBackendConnected ? 'bg-emerald-400' : 'bg-rose-500'
                }`}
              />
              <span className="text-[11px] text-slate-300 font-mono">
                {isBackendConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Student Profile Chip */}
          {profile ? (
            <Link
              href="/settings"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141d2e] hover:bg-[#1a263c] border border-slate-700 text-xs transition-all group"
              title="Click to manage profile & syllabus settings"
            >
              <div className="w-5 h-5 rounded bg-indigo-900/60 flex items-center justify-center text-indigo-300 border border-indigo-700">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-[12px] flex items-center gap-1.5">
                  <span>{profile.name}</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700">
                    Sem {profile.currentSemester}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  {profile.degree} · {profile.university.split(',')[0]}
                </div>
              </div>
            </Link>
          ) : (
            <button
              onClick={onOpenOnboarding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-semibold border border-indigo-500/40 transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Set Up Profile</span>
            </button>
          )}

          {/* Desktop Backend Status */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#111827] border border-slate-700 text-xs text-slate-300">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendConnected ? 'bg-emerald-400' : 'bg-rose-500'
                }`}
              />
              <span className={isBackendConnected ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {isBackendConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Topic / Document Selector */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-white/15 rounded-xl px-3 py-1.5 w-full sm:w-auto shadow-sm focus-within:border-indigo-500 transition-colors">
            <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
            <label
              htmlFor="topic-selector"
              className="text-xs font-semibold text-slate-400 shrink-0"
            >
              Topic:
            </label>
            <select
              id="topic-selector"
              value={selectedDocument}
              onChange={(e) => onSelectDocument(e.target.value)}
              disabled={isLoadingDocs}
              className="bg-transparent text-xs sm:text-sm font-medium text-slate-100 outline-none cursor-pointer w-full sm:max-w-[200px] truncate"
            >
              <option value="all" className="bg-slate-900 text-slate-100">
                🌐 All Study Materials ({documents.length} Docs)
              </option>
              {activeSemester && activeSemester.subjects.length > 0 && (
                <optgroup
                  label={`Semester ${activeSemester.number} Subjects`}
                  className="bg-slate-900 text-indigo-300 font-bold"
                >
                  {activeSemester.subjects.map((sub) => (
                    <option
                      key={sub.id}
                      value={sub.id}
                      className="bg-slate-900 text-slate-100 font-normal"
                    >
                      📘 {sub.name} {sub.code ? `(${sub.code})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup
                label="All Course Notes & Papers"
                className="bg-slate-900 text-slate-400 font-bold"
              >
                {documents.map((doc) => (
                  <option
                    key={doc.id}
                    value={doc.id}
                    className="bg-slate-900 text-slate-100 font-normal"
                  >
                    {doc.category === 'question_paper' ? '🎓' : '📄'} {doc.title}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Settings Nav Button */}
          <Link
            href="/settings"
            title="Syllabus & Profile Settings"
            className="hidden md:flex items-center justify-center p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all shadow-sm group cursor-pointer"
          >
            <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300 text-slate-300 group-hover:text-indigo-300" />
          </Link>
        </div>
      </div>
    </header>
  );
};


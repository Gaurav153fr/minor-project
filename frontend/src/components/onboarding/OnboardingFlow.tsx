'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  User,
  GraduationCap,
  Calendar,
  BookOpen,
  BookMarked,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Check,
  School,
  Layers,
  Award,
} from 'lucide-react';
import { StudentProfile, SubjectProfile, UnitProfile, CSVTU_CSE_SEMESTERS } from '@/types/profile';
import { createDefaultProfile, saveProfile } from '@/store/profile';
import confetti from 'canvas-confetti';

interface OnboardingFlowProps {
  onComplete: (profile: StudentProfile) => void;
}

const STEPS = [
  'welcome',
  'personal',
  'semester',
  'subjects',
  'syllabus',
  'done',
] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('CSVTU, Bhilai');
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [currentSemester, setCurrentSemester] = useState(1);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [syllabusText, setSyllabusText] = useState('');
  const [animating, setAnimating] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex) / (STEPS.length - 1)) * 100;

  function goNext(nextStep: Step) {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 150);
  }

  function handlePersonalNext() {
    if (!name.trim()) return;
    const p = createDefaultProfile(name.trim(), university, degree, branch, currentSemester);
    setProfile(p);
    goNext('semester');
  }

  function handleSemesterNext() {
    if (!profile) return;
    goNext('subjects');
  }

  function handleSubjectsNext() {
    goNext('syllabus');
  }

  function handleSyllabusNext() {
    if (!profile) return;
    const updated: StudentProfile = {
      ...profile,
      semesters: profile.semesters.map((s) =>
        s.number === currentSemester ? { ...s, syllabusText } : s
      ),
    };
    setProfile(updated);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    goNext('done');
  }

  function handleComplete() {
    if (!profile) return;
    const final: StudentProfile = {
      ...profile,
      onboardingComplete: true,
      updatedAt: new Date().toISOString(),
    };
    saveProfile(final);
    onComplete(final);
  }

  function handleSemesterChange(sem: number) {
    setCurrentSemester(sem);
    if (profile) {
      const updated = {
        ...profile,
        currentSemester: sem,
        semesters: profile.semesters.map((s) => ({
          ...s,
          status: (s.number < sem
            ? 'completed'
            : s.number === sem
            ? 'active'
            : 'upcoming') as 'completed' | 'active' | 'upcoming',
        })),
      };
      setProfile(updated);
    }
  }

  const activeSem = profile?.semesters.find((s) => s.number === currentSemester);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-2xl overflow-y-auto">
      <div
        className={`relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-[#0c1220] border border-white/15 rounded-3xl p-6 sm:p-10 shadow-[0_0_60px_rgba(99,102,241,0.2)] transition-all duration-300 ${
          animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* Progress Bar (Visible after welcome) */}
        {step !== 'welcome' && step !== 'done' && (
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 mb-8 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* STEP 1: WELCOME */}
        {step === 'welcome' && (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30 text-white animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
                StudyGenius AI • Onboarding
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Your Intelligent <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Academic Companion</span>
              </h1>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Personalized RAG-powered study platform tailored for university students. Let's set up your profile in under 2 minutes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
              {[
                { icon: <GraduationCap className="w-4 h-4 text-indigo-400" />, title: 'Semester-Aware AI' },
                { icon: <BookOpen className="w-4 h-4 text-purple-400" />, title: 'Curriculum RAG' },
                { icon: <Award className="w-4 h-4 text-amber-400" />, title: 'Exam Problem Solver' },
                { icon: <Layers className="w-4 h-4 text-emerald-400" />, title: 'Quizzes & Flashcards' },
              ].map((f, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-2.5 text-xs font-semibold text-slate-200"
                >
                  {f.icon}
                  <span>{f.title}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => goNext('personal')}
              className="w-full max-w-md mx-auto py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: PERSONAL & UNIVERSITY INFO */}
        {step === 'personal' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Tell us about yourself</h2>
                <p className="text-xs text-slate-400">We'll personalize study materials and AI prompts to your curriculum.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Your Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ansh Pratap Yadav"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">University / College</label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Degree Program</label>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="B.Tech">B.Tech (Bachelor of Technology)</option>
                    <option value="B.E.">B.E. (Bachelor of Engineering)</option>
                    <option value="MCA">MCA (Master of Computer Applications)</option>
                    <option value="BCA">BCA (Bachelor of Computer Applications)</option>
                    <option value="M.Tech">M.Tech (Master of Technology)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Branch / Specialization</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
                  <option value="Information Technology">Information Technology (IT)</option>
                  <option value="Artificial Intelligence & Data Science">AI & Data Science (AIDS)</option>
                  <option value="Electronics & Communication">Electronics & Communication (ECE)</option>
                  <option value="Electrical Engineering">Electrical Engineering (EE)</option>
                  <option value="Mechanical Engineering">Mechanical Engineering (ME)</option>
                  <option value="Civil Engineering">Civil Engineering (CE)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => goNext('welcome')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handlePersonalNext}
                disabled={!name.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SEMESTER SELECTION */}
        {step === 'semester' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Which semester are you currently in?</h2>
                <p className="text-xs text-slate-400">This prioritizes your active syllabus, notes, and exam papers.</p>
              </div>
            </div>

            {/* 8 Semester Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const isSelected = currentSemester === sem;
                return (
                  <button
                    key={sem}
                    onClick={() => handleSemesterChange(sem)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30 font-bold scale-105 ring-2 ring-indigo-400/50'
                        : 'bg-slate-950/60 hover:bg-slate-900 border-white/10 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-extrabold uppercase">Sem</div>
                    <div className="text-lg font-black">{sem}</div>
                    <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                      Yr {Math.ceil(sem / 2)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Preview of Subjects for Selected Semester */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Default Subjects for Semester {currentSemester}</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(CSVTU_CSE_SEMESTERS.find((s) => s.number === currentSemester)?.subjects || []).map(
                  (sub) => (
                    <span
                      key={sub.id}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950/50 border border-indigo-500/20 text-indigo-200 text-xs font-medium"
                    >
                      {sub.name}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => goNext('personal')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSemesterNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Confirm Semester {currentSemester}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUBJECTS REVIEW */}
        {step === 'subjects' && activeSem && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Semester {currentSemester} Subjects & Modules
                </h2>
                <p className="text-xs text-slate-400">
                  Pre-configured with standard CSVTU CSE curriculum. You can edit anytime in Settings.
                </p>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
              {activeSem.subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{sub.name}</span>
                      {sub.code && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {sub.code}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {sub.units.length} Unit Modules pre-loaded
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px] font-bold">
                    Ready
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => goNext('semester')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubjectsNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Looks Great!</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SYLLABUS HIGHLIGHTS (OPTIONAL) */}
        {step === 'syllabus' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-300">
                <BookMarked className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Add Semester Syllabus</h2>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Paste official syllabus text or outline to ground AI answers strictly in your course syllabus.
                </p>
              </div>
            </div>

            <textarea
              rows={6}
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder={`Paste your Semester ${currentSemester} syllabus or key topics here (e.g. Unit 1: Fourier Series, Euler's formula...)\n\n(You can also skip and add this later in Settings)`}
              className="w-full bg-slate-950/90 border border-white/15 rounded-2xl p-4 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => goNext('subjects')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyllabusNext}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleSyllabusNext}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Complete Setup</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: DONE & CONFIRMATION */}
        {step === 'done' && profile && (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 text-white">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">
                You're all set, <span className="text-indigo-300">{profile.name.split(' ')[0]}!</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                StudyGenius AI is now primed with your curriculum for{' '}
                <strong className="text-white">
                  {profile.degree} in {profile.branch} (Semester {profile.currentSemester})
                </strong>{' '}
                at <strong className="text-white">{profile.university}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 text-center">
                <div className="text-lg font-black text-indigo-400">{activeSem?.subjects.length || 0}</div>
                <div className="text-[10px] text-slate-400 font-medium">Subjects</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 text-center">
                <div className="text-lg font-black text-purple-400">
                  {activeSem?.subjects.reduce((a, s) => a + s.units.length, 0) || 0}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Units</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 text-center">
                <div className="text-lg font-black text-pink-400">Sem {profile.currentSemester}</div>
                <div className="text-[10px] text-slate-400 font-medium">Active</div>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="w-full max-w-md mx-auto py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Start Studying</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


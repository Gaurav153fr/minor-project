'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  BookOpen,
  BookMarked,
  ShieldAlert,
  ArrowLeft,
  Save,
  Check,
  Plus,
  Trash2,
  GraduationCap,
  AlertTriangle,
} from 'lucide-react';
import { StudentProfile, SubjectProfile } from '@/types/profile';
import { getProfile, saveProfile, deleteProfile } from '@/store/profile';

type SettingsTab = 'profile' | 'subjects' | 'syllabus' | 'data';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [activeSemesterNum, setActiveSemesterNum] = useState(1);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (p) {
      setProfile(p);
      setActiveSemesterNum(p.currentSemester);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!profile) return;
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [profile]);

  const handleDeleteProfile = () => {
    deleteProfile();
    router.push('/');
  };

  const activeSem = profile?.semesters.find((s) => s.number === activeSemesterNum);

  function updateField<K extends keyof StudentProfile>(field: K, value: StudentProfile[K]) {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  }

  function updateSemesterSyllabus(semNum: number, text: string) {
    if (!profile) return;
    setProfile({
      ...profile,
      semesters: profile.semesters.map((s) =>
        s.number === semNum ? { ...s, syllabusText: text } : s
      ),
    });
  }

  function addSubject(semNum: number) {
    if (!profile) return;
    const newSubject: SubjectProfile = {
      id: `subject_${Date.now()}`,
      name: 'New Subject',
      code: '',
      units: [{ number: 1, title: 'Unit 1 Module' }],
    };
    setProfile({
      ...profile,
      semesters: profile.semesters.map((s) =>
        s.number === semNum ? { ...s, subjects: [...s.subjects, newSubject] } : s
      ),
    });
  }

  function updateSubject(
    semNum: number,
    subId: string,
    field: keyof SubjectProfile,
    value: string
  ) {
    if (!profile) return;
    setProfile({
      ...profile,
      semesters: profile.semesters.map((s) =>
        s.number === semNum
          ? {
              ...s,
              subjects: s.subjects.map((sub) =>
                sub.id === subId ? { ...sub, [field]: value } : sub
              ),
            }
          : s
      ),
    });
  }

  function removeSubject(semNum: number, subId: string) {
    if (!profile) return;
    setProfile({
      ...profile,
      semesters: profile.semesters.map((s) =>
        s.number === semNum
          ? { ...s, subjects: s.subjects.filter((sub) => sub.id !== subId) }
          : s
      ),
    });
  }

  function addUnit(semNum: number, subId: string) {
    if (!profile) return;
    setProfile({
      ...profile,
      semesters: profile.semesters.map((s) =>
        s.number === semNum
          ? {
              ...s,
              subjects: s.subjects.map((sub) => {
                if (sub.id !== subId) return sub;
                const nextNum = sub.units.length + 1;
                return {
                  ...sub,
                  units: [...sub.units, { number: nextNum, title: `Unit ${nextNum}` }],
                };
              }),
            }
          : s
      ),
    });
  }

  function updateUnit(
    semNum: number,
    subId: string,
    unitNum: number,
    title: string
  ) {
    if (!profile) return;
    setProfile({
      ...profile,
      semesters: profile.semesters.map((s) =>
        s.number === semNum
          ? {
              ...s,
              subjects: s.subjects.map((sub) =>
                sub.id === subId
                  ? {
                      ...sub,
                      units: sub.units.map((u) =>
                        u.number === unitNum ? { ...u, title } : u
                      ),
                    }
                  : sub
              ),
            }
          : s
      ),
    });
  }

  function removeUnit(semNum: number, subId: string, unitNum: number) {
    if (!profile) return;
    setProfile({
      ...profile,
      semesters: profile.semesters.map((s) =>
        s.number === semNum
          ? {
              ...s,
              subjects: s.subjects.map((sub) =>
                sub.id === subId
                  ? {
                      ...sub,
                      units: sub.units.filter((u) => u.number !== unitNum),
                    }
                  : sub
              ),
            }
          : s
      ),
    });
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-white p-4">
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
          <GraduationCap className="w-12 h-12 text-indigo-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">No Student Profile Found</h2>
          <p className="text-sm text-slate-400">
            Set up your academic profile to enable curriculum-tailored AI assistance.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20"
          >
            Go to Onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 selection:bg-indigo-500 selection:text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#0b0f19]/85 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">Academic Profile Settings</h1>
            </div>
          </div>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
              saved
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20'
            }`}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Saved Successfully!' : 'Save Changes'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 flex-1 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-left shrink-0 ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Personal Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-left shrink-0 ${
              activeTab === 'subjects'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Subjects & Modules</span>
          </button>
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-left shrink-0 ${
              activeTab === 'syllabus'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <BookMarked className="w-4 h-4 shrink-0" />
            <span>Syllabus Content</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-left shrink-0 ${
              activeTab === 'data'
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-500/20'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-rose-300 border border-white/5'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Data & Reset</span>
          </button>
        </aside>

        <div className="flex-1 bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" />
                  <span>Personal Academic Information</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Customize AI responses to your specific academic environment.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">University / Institution</label>
                  <input
                    type="text"
                    value={profile.university}
                    onChange={(e) => updateField('university', e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Degree Program</label>
                  <select
                    value={profile.degree}
                    onChange={(e) => updateField('degree', e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="B.E.">B.E.</option>
                    <option value="MCA">MCA</option>
                    <option value="BCA">BCA</option>
                    <option value="M.Tech">M.Tech</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 space-y-3">
                <label className="text-xs font-semibold text-slate-300">Current Semester</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <button
                      key={sem}
                      onClick={() => {
                        updateField('currentSemester', sem);
                        setActiveSemesterNum(sem);
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        profile.currentSemester === sem
                          ? 'bg-indigo-600 border-indigo-400 text-white font-black shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-950/60 hover:bg-slate-800 border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="text-sm font-bold">Sem {sem}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <span>Subjects & Module Structure</span>
                </h2>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mt-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <button
                      key={sem}
                      onClick={() => setActiveSemesterNum(sem)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeSemesterNum === sem
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-950/60 text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      Sem {sem}
                    </button>
                  ))}
                </div>
              </div>

              {activeSem && (
                <div className="space-y-4">
                  {activeSem.subjects.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 shadow-md"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            type="text"
                            value={sub.name}
                            onChange={(e) => updateSubject(activeSemesterNum, sub.id, 'name', e.target.value)}
                            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-white"
                          />
                          <button onClick={() => removeSubject(activeSemesterNum, sub.id)} className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 pl-2 border-l-2 border-indigo-500/30">
                        {sub.units.map((u) => (
                          <div key={u.number} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={u.title}
                              onChange={(e) => updateUnit(activeSemesterNum, sub.id, u.number, e.target.value)}
                              className="flex-1 bg-slate-900/60 border border-white/5 rounded-lg px-3 py-1 text-xs text-slate-200"
                            />
                            <button onClick={() => removeUnit(activeSemesterNum, sub.id, u.number)} className="p-1 text-slate-500 hover:text-rose-400">✕</button>
                          </div>
                        ))}
                        <button onClick={() => addUnit(activeSemesterNum, sub.id)} className="text-xs text-indigo-400 flex items-center gap-1 mt-1">
                          <Plus className="w-3.5 h-3.5" /> <span>Add Unit</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addSubject(activeSemesterNum)} className="w-full py-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> <span>Add New Subject</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'syllabus' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-indigo-400" />
                  <span>Syllabus Content Management</span>
                </h2>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setActiveSemesterNum(sem)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${activeSemesterNum === sem ? 'bg-indigo-600 text-white' : 'bg-slate-950/60 text-slate-400'}`}
                  >
                    Sem {sem}
                  </button>
                ))}
              </div>
              <textarea
                rows={14}
                value={profile.semesters.find((s) => s.number === activeSemesterNum)?.syllabusText || ''}
                onChange={(e) => updateSemesterSyllabus(activeSemesterNum, e.target.value)}
                className="w-full bg-slate-950/90 border border-white/10 rounded-2xl p-4 text-xs font-mono text-slate-200"
              />
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span>Data & Privacy Control</span>
              </h2>
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Danger Zone</span>
                </div>
                {!showDeleteConfirm ? (
                  <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs">
                    Delete Profile & Restart
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs">Cancel</button>
                    <button onClick={handleDeleteProfile} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold">Yes, Delete</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

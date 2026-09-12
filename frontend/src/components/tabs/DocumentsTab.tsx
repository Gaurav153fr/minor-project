'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  RotateCw,
  ExternalLink,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  FolderTree,
  List,
  ChevronRight,
  BookMarked,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { DocumentItem, SemesterStructure } from '@/types';
import { StudentProfile } from '@/types/profile';
import { fetchCurriculumStructure } from '@/lib/api';

interface DocumentsTabProps {
  documents: DocumentItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenDocumentModal: (docId: string, docTitle: string) => void;
  profile?: StudentProfile | null;
}

type ViewMode = 'curriculum' | 'all_materials';

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  isLoading,
  onRefresh,
  onOpenDocumentModal,
  profile,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('curriculum');
  const [selectedSemesterNum, setSelectedSemesterNum] = useState<number>(
    profile?.currentSemester || 1
  );
  const [structure, setStructure] = useState<SemesterStructure[]>([]);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'study_notes' | 'question_paper'>('all');

  // Load semester structure
  const loadStructure = useCallback(async () => {
    setLoadingStructure(true);
    try {
      const data = await fetchCurriculumStructure();
      setStructure(data);
    } catch {
      // Fallback
    } finally {
      setLoadingStructure(false);
    }
  }, []);

  useEffect(() => {
    loadStructure();
  }, [loadStructure]);

  // Sync selected semester when profile changes
  useEffect(() => {
    if (profile?.currentSemester) {
      setSelectedSemesterNum(profile.currentSemester);
    }
  }, [profile?.currentSemester]);

  const questionPapersCount = documents.filter((d) => d.category === 'question_paper').length;
  const studyNotesCount = documents.filter((d) => d.category !== 'question_paper').length;

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.course_code && doc.course_code.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (categoryFilter === 'question_paper') {
      return doc.category === 'question_paper';
    }
    if (categoryFilter === 'study_notes') {
      return doc.category !== 'question_paper';
    }
    return true;
  });

  const getSlug = (doc: DocumentItem | { filename: string }) => {
    return doc.filename.replace('.md', '');
  };

  const selectedSemData = structure.find((s) => s.number === selectedSemesterNum);
  const profileSemData = profile?.semesters.find((s) => s.number === selectedSemesterNum);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 p-1 bg-slate-950/70 rounded-xl border border-white/5">
          <button
            onClick={() => setViewMode('curriculum')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'curriculum'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Curriculum Explorer (Semesters)</span>
          </button>

          <button
            onClick={() => setViewMode('all_materials')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'all_materials'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>All Materials & Search ({documents.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {profile && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Current: <strong>Sem {profile.currentSemester}</strong> ({profile.degree})</span>
            </div>
          )}

          <button
            onClick={() => {
              onRefresh();
              loadStructure();
            }}
            disabled={isLoading || loadingStructure}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading || loadingStructure ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* CURRICULUM EXPLORER VIEW */}
      {viewMode === 'curriculum' && (
        <div className="flex flex-col gap-6">
          {/* Semester Selector Tabs (Sem 1 to Sem 8) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
              const isSelected = selectedSemesterNum === semNum;
              const isCurrent = profile?.currentSemester === semNum;
              const hasNotes = structure.find((s) => s.number === semNum)?.has_content;

              return (
                <button
                  key={semNum}
                  onClick={() => setSelectedSemesterNum(semNum)}
                  className={`flex-1 min-w-[120px] px-3.5 py-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/60 hover:bg-slate-850 border-white/10 hover:border-white/20 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-xs font-black tracking-wider uppercase ${
                        isSelected ? 'text-indigo-200' : 'text-slate-300'
                      }`}
                    >
                      Sem {semNum}
                    </span>
                    {isCurrent ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500 text-white shadow-sm">
                        Active
                      </span>
                    ) : semNum < (profile?.currentSemester || 1) ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        hasNotes ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                    />
                    <span>{hasNotes ? 'Notes available' : 'Curriculum plan'}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Semester Overview Banner */}
          <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-purple-950/50 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                    Semester {selectedSemesterNum} Curriculum
                  </span>
                  {selectedSemesterNum === profile?.currentSemester && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      Your Current Semester
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {profile?.branch || 'Computer Science & Engineering'} • Semester {selectedSemesterNum}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Browse verified subject modules, unit-wise reference notes, university syllabus, and exam question papers.
                </p>
              </div>

              {/* Syllabus Action Card */}
              {selectedSemData?.syllabus_doc ? (
                <Link
                  href={`/documents/${getSlug(selectedSemData.syllabus_doc)}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-white transition-all group shrink-0"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-200">Official Syllabus</div>
                    <div className="text-[11px] text-slate-300">View complete outline & topics</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform ml-1" />
                </Link>
              ) : profileSemData?.syllabusText ? (
                <div className="px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-white/10 text-xs text-slate-300 shrink-0">
                  <div className="font-bold text-indigo-300 flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Custom Syllabus Configured</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Available in AI Context</div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Subjects & Units Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Course Subjects & Unit Notes</span>
              </h4>
              <span className="text-xs text-slate-400">
                {(selectedSemData?.subjects.length || 0) > 0
                  ? `${selectedSemData?.subjects.length} Subjects Available`
                  : `${profileSemData?.subjects.length || 0} Planned Subjects`}
              </span>
            </div>

            {/* Display Organized Subjects */}
            {selectedSemData && selectedSemData.subjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {selectedSemData.subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xl hover:border-indigo-500/40 transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 font-bold">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                              {subject.name}
                            </h5>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {subject.units.length} Unit Note{subject.units.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Units List */}
                      <div className="space-y-2 mt-3">
                        {subject.units.map((unit) => {
                          const unitSlug = getSlug(unit);
                          return (
                            <Link
                              key={unit.id}
                              href={`/documents/${unitSlug}`}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-indigo-950/40 border border-white/5 hover:border-indigo-500/30 text-xs transition-all group/unit"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  U{unit.number}
                                </span>
                                <span className="text-slate-200 font-medium truncate group-hover/unit:text-indigo-200">
                                  {unit.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {unit.size_kb} KB
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover/unit:text-indigo-400 group-hover/unit:translate-x-0.5 transition-transform" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : profileSemData && profileSemData.subjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profileSemData.subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h5 className="font-bold text-sm text-white">{sub.name}</h5>
                        {sub.code && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {sub.code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {sub.units.length} Unit Modules Configured
                      </p>
                    </div>
                    <div className="text-[11px] text-indigo-400/90 font-medium">
                      AI is primed with curriculum syllabus for this subject.
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 text-center text-slate-400">
                <p className="text-sm">No notes or subjects configured yet for Semester {selectedSemesterNum}.</p>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-2"
                >
                  <span>Configure Semester {selectedSemesterNum} in Settings</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Semester Question Papers Section */}
          {selectedSemData && selectedSemData.question_papers.length > 0 && (
            <div className="flex flex-col gap-4 mt-2">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>Semester {selectedSemesterNum} University Exam Question Papers</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSemData.question_papers.map((qp) => {
                  const qpSlug = getSlug(qp);
                  return (
                    <div
                      key={qp.id}
                      className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/30 hover:border-amber-400/60 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xl group transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/25">
                            Exam Paper
                          </span>
                          {qp.course_code && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              {qp.course_code}
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                          {qp.title}
                        </h5>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-slate-500">{qp.size_kb} KB</span>
                        <Link
                          href={`/papers/${qpSlug}`}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>Solve Questions</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ALL MATERIALS & FLAT SEARCH VIEW */}
      {viewMode === 'all_materials' && (
        <div className="flex flex-col gap-6">
          {/* Category Filter Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-white/5">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                All Materials ({documents.length})
              </button>

              <button
                onClick={() => setCategoryFilter('question_paper')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  categoryFilter === 'question_paper'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md'
                    : 'text-amber-400/90 hover:text-amber-300 hover:bg-white/5'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Question Papers ({questionPapersCount})</span>
              </button>

              <button
                onClick={() => setCategoryFilter('study_notes')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  categoryFilter === 'study_notes'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Course Notes ({studyNotesCount})</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject, question topic, code (e.g. A000211, CS-322554, Fourier)..."
              className="w-full bg-slate-900/80 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xl"
            />
          </div>

          {/* Documents Grid */}
          {isLoading ? (
            <div className="p-20 text-center text-slate-400 flex flex-col items-center gap-3">
              <RotateCw className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm">Scanning course materials and question papers...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-12 text-center text-slate-400 space-y-2 shadow-xl">
              <FileText className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-base font-semibold text-white">No materials found</h4>
              <p className="text-xs">Try adjusting your filter or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDocs.map((doc) => {
                const slug = getSlug(doc);
                const isQP = doc.category === 'question_paper';
                const destinationHref = isQP ? `/papers/${slug}` : `/documents/${slug}`;

                return (
                  <div
                    key={doc.id}
                    className={`group rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 shadow-xl hover:-translate-y-1 ${
                      isQP
                        ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 hover:border-amber-400/60 hover:shadow-amber-500/10'
                        : 'bg-slate-900/80 hover:bg-slate-850 border border-white/10 hover:border-indigo-500/40 hover:shadow-indigo-500/10'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                            isQP
                              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-black'
                              : 'bg-indigo-500/15 border border-indigo-500/25 text-indigo-400'
                          }`}
                        >
                          {isQP ? <GraduationCap className="w-5 h-5" /> : <FileText className="w-4 h-4" />}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {isQP && doc.course_code && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {doc.course_code}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              isQP
                                ? 'bg-amber-400/10 text-amber-300 border-amber-400/25'
                                : 'bg-slate-800 text-slate-400 border-white/5'
                            }`}
                          >
                            {isQP ? 'Exam Paper' : `${doc.size_kb} KB`}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <Link href={destinationHref}>
                        <h4
                          className={`text-sm sm:text-base font-bold transition-colors line-clamp-2 cursor-pointer ${
                            isQP
                              ? 'text-amber-100 group-hover:text-amber-300'
                              : 'text-white group-hover:text-indigo-300'
                          }`}
                        >
                          {doc.title}
                        </h4>
                      </Link>

                      {/* Exam metadata or preview */}
                      {isQP && doc.exam_name ? (
                        <p className="text-xs text-amber-200/80 mt-1.5 line-clamp-1 font-medium">
                          🎓 {doc.exam_name}
                        </p>
                      ) : null}

                      <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                        {doc.preview || 'Study material and reference questions.'}
                      </p>
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-500 truncate max-w-[120px]">
                        {doc.filename}
                      </span>

                      <Link
                        href={destinationHref}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
                          isQP
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-amber-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                        }`}
                      >
                        {isQP ? <GraduationCap className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                        <span>{isQP ? 'Open Exam Paper' : 'Read Notes'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


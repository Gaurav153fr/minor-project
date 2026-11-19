'use client';

import React, { useState } from 'react';
import { HelpCircle, Sparkles, CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, BookOpen, Layers } from 'lucide-react';
import { QuizResponse, QuizQuestion, StudyTab } from '@/types';
import { StudentProfile } from '@/types/profile';
import { generateQuiz } from '@/lib/api';
import confetti from 'canvas-confetti';

interface QuizTabProps {
  selectedDocument: string;
  onSwitchTab: (tab: StudyTab) => void;
  profile?: StudentProfile | null;
  studentContext?: string;
}

export const QuizTab: React.FC<QuizTabProps> = ({
  selectedDocument,
  onSwitchTab,
  profile,
  studentContext,
}) => {
  const [quizCount, setQuizCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('mixed');
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartQuiz = async () => {
    setIsLoading(true);
    setError(null);
    setSelectedOption(null);
    setCurrentIndex(0);
    setScore(0);

    try {
      const data = await generateQuiz(
        selectedDocument,
        quizCount,
        difficulty,
        studentContext
      );
      setQuizData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz questions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null || !quizData) return;
    setSelectedOption(idx);

    const currentQ = quizData.questions[currentIndex];
    if (idx === currentQ.correct_index) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!quizData) return;
    if (currentIndex + 1 >= quizData.questions.length) {
      // Quiz complete - trigger confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
  };

  const isCompleted = quizData && currentIndex >= quizData.questions.length;
  const currentQuestion: QuizQuestion | undefined = quizData?.questions[currentIndex];
  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Control Toolbar Card */}
      <div className="p-4 sm:p-5 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400">Questions:</label>
            <select
              value={quizCount}
              onChange={(e) => setQuizCount(Number(e.target.value))}
              disabled={isLoading}
              className="bg-slate-800 border border-white/15 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-100 outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400">Difficulty:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={isLoading}
              className="bg-slate-800 border border-white/15 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-100 outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="mixed">Mixed</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleStartQuiz}
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-500/40 transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{quizData ? 'Regenerate Quiz' : 'Generate Quiz'}</span>
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-[#111927] border border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center gap-3 text-center shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-indigo-900/50 border border-indigo-700 flex items-center justify-center text-indigo-400 animate-spin">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-100">Synthesizing Assessment Questions…</h3>
          <p className="text-xs text-slate-400 max-w-md font-mono">
            Extracting curriculum concepts from {selectedDocument === 'all' ? 'all courses' : selectedDocument}.
          </p>
        </div>
      ) : error ? (
        <div className="bg-[#111927] border border-red-800 rounded-xl p-8 text-center space-y-3 shadow-sm">
          <p className="text-red-400 text-sm font-mono">{error}</p>
          <button
            onClick={handleStartQuiz}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700"
          >
            Retry Generation
          </button>
        </div>
      ) : !quizData ? (
        <div className="bg-[#111927] border border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-[#1a2538] border border-slate-700 flex items-center justify-center text-amber-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">Curriculum Knowledge Assessment</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
            Generate multiple-choice conceptual questions with immediate evaluation and textbook explanations.
          </p>
          <button
            onClick={handleStartQuiz}
            className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition border border-emerald-500/40 cursor-pointer"
          >
            Start Quiz Now
          </button>
        </div>
      ) : isCompleted ? (
        /* Quiz Finished View */
        <div className="bg-[#111927] border border-slate-800 rounded-xl p-8 sm:p-10 text-center space-y-5 shadow-md">
          <div className="w-16 h-16 mx-auto rounded-xl bg-[#1e293b] border border-slate-700 flex items-center justify-center text-amber-400">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-100">Assessment Completed</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{quizData.title}</p>
          </div>

          <div className="py-2">
            <div className="text-4xl font-mono font-black text-amber-400">
              {score} <span className="text-slate-400 text-xl font-normal">/ {quizData.questions.length}</span>
            </div>
            <p className="text-xs font-mono font-bold text-emerald-400 mt-2">
              {Math.round((score / quizData.questions.length) * 100)}% Mastery Level
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handleStartQuiz}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Take Another Quiz</span>
            </button>
            <button
              onClick={() => onSwitchTab('flashcards')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer border border-white/10"
            >
              <Layers className="w-4 h-4" />
              <span>Review Flashcards</span>
            </button>
          </div>
        </div>
      ) : currentQuestion ? (
        /* Active Question Card */
        <div className="bg-[#111927] border border-slate-800 rounded-xl p-6 sm:p-8 space-y-5 shadow-md">
          {/* Header & Progress */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>
                Question {currentIndex + 1} of {quizData.questions.length} · {currentQuestion.source}
              </span>
            </div>
            <div className="px-2.5 py-0.5 rounded bg-[#1e293b] border border-slate-700 text-xs font-mono text-slate-300 font-bold">
              Score: {score} / {currentIndex}
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / quizData.questions.length) * 100}%` }}
            />
          </div>

          {/* Question Prompt */}
          <h3 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
            {currentQuestion.question}
          </h3>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuestion.correct_index;
              const hasAnswered = selectedOption !== null;

              let btnStyle = 'bg-slate-800/80 border-white/10 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-200';

              if (hasAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-100 shadow-md shadow-emerald-500/10';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-100 shadow-md shadow-rose-500/10';
                } else {
                  btnStyle = 'bg-slate-900/50 border-white/5 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={hasAnswered}
                  className={`flex items-center gap-3.5 p-4 rounded-xl border text-left text-sm font-medium transition-all duration-200 cursor-pointer ${btnStyle}`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      hasAnswered && isCorrect
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : hasAnswered && isSelected
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-700/80 text-slate-300'
                    }`}
                  >
                    {optionLabels[idx]}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {hasAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  {hasAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation & Next Button */}
          {selectedOption !== null && (
            <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Explanation:</span>
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">{currentQuestion.explanation}</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  <span>{currentIndex + 1 === quizData.questions.length ? 'Finish Quiz' : 'Next Question'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

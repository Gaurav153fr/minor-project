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
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{quizData ? 'Regenerate Quiz' : 'Generate Quiz'}</span>
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-spin">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Synthesizing Smart Quiz...</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            Analyzing notes from {selectedDocument === 'all' ? 'all courses' : selectedDocument} to craft balanced conceptual questions and explanations.
          </p>
        </div>
      ) : error ? (
        <div className="bg-slate-900/70 border border-rose-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <p className="text-rose-400 text-sm">{error}</p>
          <button
            onClick={handleStartQuiz}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
          >
            Retry Generation
          </button>
        </div>
      ) : !quizData ? (
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <HelpCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Ready to test your mastery?</h3>
          <p className="text-sm text-slate-400 max-w-md">
            Generate an AI-powered assessment with custom difficulty, immediate feedback, and step-by-step explanations.
          </p>
          <button
            onClick={handleStartQuiz}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 transition-all cursor-pointer"
          >
            Start Quiz Now
          </button>
        </div>
      ) : isCompleted ? (
        /* Quiz Finished View */
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">Quiz Completed!</h2>
            <p className="text-sm text-slate-400 mt-1">{quizData.title}</p>
          </div>

          <div className="py-4">
            <div className="text-5xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {score} / {quizData.questions.length}
            </div>
            <p className="text-sm font-semibold text-emerald-400 mt-2">
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
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Header & Progress */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>
                Question {currentIndex + 1} of {quizData.questions.length} • {currentQuestion.source}
              </span>
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-xs font-bold text-slate-300">
              Score: {score} / {currentIndex}
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
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

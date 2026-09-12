'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Sparkles, ChevronLeft, ChevronRight, RotateCw, BookOpen } from 'lucide-react';
import { FlashcardResponse, FlashcardItem } from '@/types';
import { StudentProfile } from '@/types/profile';
import { generateFlashcards } from '@/lib/api';

interface FlashcardsTabProps {
  selectedDocument: string;
  profile?: StudentProfile | null;
  studentContext?: string;
}

export const FlashcardsTab: React.FC<FlashcardsTabProps> = ({
  selectedDocument,
  profile,
  studentContext,
}) => {
  const [deck, setDeck] = useState<FlashcardItem[]>([]);
  const [deckTitle, setDeckTitle] = useState<string>('Study Deck');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadDeck = async () => {
    setIsLoading(true);
    setError(null);
    setIsFlipped(false);
    setCurrentIndex(0);

    try {
      const data: FlashcardResponse = await generateFlashcards(
        selectedDocument,
        8,
        studentContext
      );
      setDeck(data.cards || []);
      setDeckTitle(data.deck_title);
    } catch (err: any) {
      setError(err.message || 'Failed to generate flashcards deck.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const toggleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, deck.length]);

  const activeCard: FlashcardItem | undefined = deck[currentIndex];

  return (
    <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto w-full">
      {/* Control Toolbar */}
      <div className="w-full p-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2 truncate">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-100 truncate">{deckTitle}</span>
        </div>

        <button
          onClick={handleLoadDeck}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 shrink-0"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{deck.length > 0 ? 'Regenerate Deck' : 'Load Deck'}</span>
        </button>
      </div>

      {/* Main Flashcard Card Area */}
      {isLoading ? (
        <div className="w-full h-[360px] bg-slate-900/70 border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 text-center p-8 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-spin">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Synthesizing 3D Flashcards...</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Extracting core definitions, formulas, and high-yield concepts for rapid active recall.
          </p>
        </div>
      ) : error ? (
        <div className="w-full p-8 bg-slate-900/70 border border-rose-500/30 rounded-3xl text-center space-y-4 shadow-xl">
          <p className="text-rose-400 text-sm">{error}</p>
          <button
            onClick={handleLoadDeck}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : deck.length === 0 ? (
        <div className="w-full h-[360px] bg-slate-900/70 border border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-8 space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Active Recall Flashcards</h3>
          <p className="text-sm text-slate-400 max-w-md">
            Generate an interactive 3D study deck for {selectedDocument === 'all' ? 'all courses' : selectedDocument}.
          </p>
          <button
            onClick={handleLoadDeck}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 transition-all cursor-pointer"
          >
            Generate 8 Flashcards
          </button>
        </div>
      ) : activeCard ? (
        <div className="w-full flex flex-col items-center gap-5">
          {/* 3D Perspective Card Wrapper */}
          <div className="perspective-1200 w-full h-[360px]">
            <div
              onClick={toggleFlip}
              className={`w-full h-full relative preserve-3d transition-transform duration-500 ease-out cursor-pointer select-none ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front Face */}
              <div className="absolute inset-0 backface-hidden rounded-3xl p-7 sm:p-9 flex flex-col justify-between bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-950/95 border-2 border-indigo-500/40 shadow-2xl shadow-indigo-500/10">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeCard.category || 'Concept'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {activeCard.source}
                  </span>
                </div>

                <div className="text-center font-bold text-lg sm:text-xl text-white leading-relaxed overflow-y-auto max-h-[190px] py-2">
                  {activeCard.front}
                </div>

                <div className="text-center text-xs text-slate-500 font-medium">
                  Click card or press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300 font-mono text-[10px]">Space</kbd> to flip ↺
                </div>
              </div>

              {/* Back Face */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl p-7 sm:p-9 flex flex-col justify-between bg-gradient-to-br from-indigo-950/95 via-purple-950/95 to-slate-950/95 border-2 border-purple-500/40 shadow-2xl shadow-purple-500/10">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Explanation / Answer
                  </span>
                  <span className="text-xs text-purple-300 font-semibold">{activeCard.source}</span>
                </div>

                <div className="text-left font-normal text-sm sm:text-base text-slate-100 leading-relaxed overflow-y-auto max-h-[190px] py-2">
                  {activeCard.back}
                </div>

                <div className="text-center text-xs text-slate-400 font-medium">
                  Click card to flip back ↻
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between w-full px-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-xs font-bold text-indigo-400">
                {currentIndex + 1} / {deck.length}
              </span>
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === deck.length - 1}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

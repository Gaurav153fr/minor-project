'use client';

import React from 'react';
import { StudyTab } from '@/types';
import { MessageSquareText, HelpCircle, Layers, GitFork, FileText, Mic2, Radio } from 'lucide-react';

interface TabsNavigationProps {
  activeTab: StudyTab;
  onTabChange: (tab: StudyTab) => void;
}

const TABS: { id: StudyTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'chat', label: 'Tutor Chat', icon: MessageSquareText },
  { id: 'quiz', label: 'Smart Quiz', icon: HelpCircle },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'mindmap', label: 'Mind Map', icon: GitFork },
  { id: 'viva', label: 'Viva Oral Exam', icon: Mic2 },
  { id: 'podcast', label: 'Audio Podcast', icon: Radio },
  { id: 'documents', label: 'Course Library', icon: FileText },
];

export const TabsNavigation: React.FC<TabsNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav
      aria-label="Study modes"
      className="flex items-center gap-1 p-1 bg-[#0d1422] rounded-xl border border-slate-800 overflow-x-auto shadow-sm"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 min-w-[125px] flex items-center justify-center gap-2 py-2 px-3.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer border ${
              isActive
                ? 'bg-[#1b2537] text-white border-slate-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#121a2a] border-transparent'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

'use client';

import React from 'react';
import { StudyTab } from '@/types';
import { MessageSquareText, HelpCircle, Layers, GitFork, FileText } from 'lucide-react';

interface TabsNavigationProps {
  activeTab: StudyTab;
  onTabChange: (tab: StudyTab) => void;
}

const TABS: { id: StudyTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'chat', label: 'Ask Tutor', icon: MessageSquareText },
  { id: 'quiz', label: 'Smart Quiz', icon: HelpCircle },
  { id: 'flashcards', label: '3D Flashcards', icon: Layers },
  { id: 'mindmap', label: 'Concept Mind Map', icon: GitFork },
  { id: 'documents', label: 'Study Documents', icon: FileText },
];

export const TabsNavigation: React.FC<TabsNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-x-auto shadow-lg">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 ring-1 ring-white/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

'use client';

import React from 'react';
import { Sparkles, HelpCircle, FileText, Copy, Check } from 'lucide-react';

interface FloatingSelectionToolbarProps {
  position: { top: number; left: number } | null;
  selectedText: string;
  onAction: (actionType: 'ask' | 'explain' | 'summarize', text: string) => void;
  onClose: () => void;
}

export const FloatingSelectionToolbar: React.FC<FloatingSelectionToolbarProps> = ({
  position,
  selectedText,
  onAction,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!position || !selectedText.trim()) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="fixed z-50 -translate-x-1/2 -translate-y-full mb-3 flex items-center gap-1 p-1 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-xl shadow-2xl shadow-indigo-500/20 animate-in fade-in zoom-in-95 duration-150"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => onAction('ask', selectedText)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
        title="Open AI chat with this context"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Ask AI</span>
      </button>

      <button
        onClick={() => onAction('explain', selectedText)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition-colors cursor-pointer"
        title="Explain this highlighted passage"
      >
        <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
        <span>Explain</span>
      </button>

      <button
        onClick={() => onAction('summarize', selectedText)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition-colors cursor-pointer"
        title="Summarize key takeaway"
      >
        <FileText className="w-3.5 h-3.5 text-purple-400" />
        <span>Summarize</span>
      </button>

      <button
        onClick={handleCopy}
        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        title="Copy selected text"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};

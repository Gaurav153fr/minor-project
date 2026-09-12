'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, Quote, Loader2, RefreshCw } from 'lucide-react';
import { sendChatMessage } from '@/lib/api';
import { getProfile, buildStudentContext } from '@/store/profile';
import { marked } from 'marked';

interface AiSidebarMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  quote?: string;
}

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  highlightedText: string | null;
  onClearHighlight: () => void;
  initialPrompt?: string;
}

export const AiSidebar: React.FC<AiSidebarProps> = ({
  isOpen,
  onClose,
  documentTitle,
  highlightedText,
  onClearHighlight,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<AiSidebarMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `I'm your **AI Reading Assistant** for *${documentTitle}*. Highlight any text in the notes to ask questions, explain formulas, or get code examples!`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // If an initial prompt was triggered by a selection action, trigger it
  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendWithContext(initialPrompt, highlightedText || undefined);
    }
  }, [initialPrompt]);

  const handleSendWithContext = async (queryText: string, quoteContext?: string) => {
    if (!queryText.trim() || isLoading) return;

    let fullPrompt = queryText;
    if (quoteContext) {
      fullPrompt = `Regarding this excerpt from "${documentTitle}":\n"${quoteContext}"\n\nQuestion/Instruction:\n${queryText}`;
    }

    const userMsg: AiSidebarMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryText,
      quote: quoteContext,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const p = getProfile();
      const studentCtx = p ? buildStudentContext(p) : undefined;
      const res = await sendChatMessage(fullPrompt, studentCtx);
      const assistantMsg: AiSidebarMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Failed to get AI response: ${err.message || 'Error communicating with backend.'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full sm:w-[380px] md:w-[420px] bg-slate-950/95 border-l border-white/10 flex flex-col h-full shadow-2xl transition-all duration-300 z-40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">AI Study Assistant</h4>
            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{documentTitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close AI Assistant"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m) => {
          const isAssistant = m.role === 'assistant';
          return (
            <div key={m.id} className="space-y-1.5">
              {/* Highlight Quote if user sent one */}
              {m.quote && (
                <div className="p-2 rounded-lg bg-indigo-950/50 border border-indigo-500/20 text-slate-300 italic text-[11px] flex gap-1.5">
                  <Quote className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="line-clamp-3">"{m.quote}"</p>
                </div>
              )}

              <div className={`flex gap-2.5 ${isAssistant ? 'items-start' : 'items-start flex-row-reverse'}`}>
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-white text-[11px] ${
                    isAssistant ? 'bg-purple-600' : 'bg-indigo-600'
                  }`}
                >
                  {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                    isAssistant
                      ? 'bg-slate-900 border border-white/10 text-slate-200 markdown-content'
                      : 'bg-indigo-600 text-white'
                  }`}
                  dangerouslySetInnerHTML={
                    isAssistant ? { __html: marked.parse(m.content) } : undefined
                  }
                >
                  {!isAssistant ? m.content : undefined}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-slate-900/60 border border-white/5 rounded-xl text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span className="text-[11px]">Analyzing excerpt with Gemini...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Active Highlight Context Badge */}
      {highlightedText && (
        <div className="px-3 py-2 bg-indigo-950/60 border-t border-indigo-500/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-200 truncate">
            <Quote className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">Attached selection: "{highlightedText}"</span>
          </div>
          <button
            onClick={onClearHighlight}
            className="text-[10px] text-slate-400 hover:text-white underline shrink-0"
          >
            Clear
          </button>
        </div>
      )}

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-slate-950 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleSendWithContext('Explain this simply with an intuitive analogy', highlightedText || undefined)}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-full text-[10px] bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 whitespace-nowrap"
        >
          💡 Simple Explanation
        </button>
        <button
          onClick={() => handleSendWithContext('Give a real-world coding/practical example of this', highlightedText || undefined)}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-full text-[10px] bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 whitespace-nowrap"
        >
          💻 Code Example
        </button>
        <button
          onClick={() => handleSendWithContext('Create a quick practice quiz question on this topic', highlightedText || undefined)}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-full text-[10px] bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 whitespace-nowrap"
        >
          🎯 Quiz Question
        </button>
      </div>

      {/* Input */}
      <div className="p-3 bg-slate-900/90 border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendWithContext(inputValue, highlightedText || undefined);
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              highlightedText ? 'Ask about highlighted text...' : 'Ask about this document...'
            }
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

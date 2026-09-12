'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, Copy, Check, AlertCircle, GraduationCap } from 'lucide-react';
import { ChatMessage, ChatSource } from '@/types';
import { StudentProfile } from '@/types/profile';
import { sendChatMessage } from '@/lib/api';
import { marked } from 'marked';

interface ChatTabProps {
  onOpenSourceModal: (sourcePath: string) => void;
  profile?: StudentProfile | null;
  studentContext?: string;
}

const DEFAULT_PROMPTS = [
  "Explain Euler's formulae in Fourier series",
  "Why is the null character important in C strings?",
  "How to solve first-order linear differential equations?",
  "What is the difference between DPDA and NPDA?",
  "State Cauchy's Root Test for series convergence",
];

export const ChatTab: React.FC<ChatTabProps> = ({
  onOpenSourceModal,
  profile,
  studentContext,
}) => {
  const activeSemester = profile?.semesters.find(
    (s) => s.number === profile.currentSemester
  );

  // Generate dynamic prompts based on student's active subjects
  const subjectPrompts = activeSemester?.subjects
    ? activeSemester.subjects.slice(0, 3).map(
        (sub) => `Summarize key exam formulas & theorems for ${sub.name}`
      )
    : [];

  const displayPrompts = [...subjectPrompts, ...DEFAULT_PROMPTS].slice(0, 5);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: profile
        ? `Hello **${profile.name}**! 👋 I am your dedicated AI study tutor for **${profile.degree} in ${profile.branch} (Semester ${profile.currentSemester})** at **${profile.university}**.\n\nI have indexed your university curriculum notes, unit modules, and past exam question papers. Ask me anything about derivations, definitions, exam strategies, or code!`
        : 'Hello! I am your **StudyGenius AI** tutor. I have ingested your study notes on Strings, Fourier Series, Differential Equations, and Automata Theory. Ask me any conceptual question, derivation, or problem!',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const text = (queryText || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(text, studentContext);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Unable to query knowledge base**: ${err.message || 'Please verify the FastAPI backend is running with Gemini API key.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-210px)] min-h-[580px] bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      {/* Chat Messages Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Student Curriculum Context Banner */}
        {profile && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200 shadow-inner mb-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Personalized for <strong>{profile.name}</strong> • {profile.degree} Sem {profile.currentSemester} ({profile.branch})
              </span>
            </div>
            <span className="text-[10px] font-mono text-indigo-300/70 hidden sm:inline">
              CSVTU Curriculum Synced
            </span>
          </div>
        )}

        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-4xl ${
                isAssistant ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isAssistant
                    ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white'
                    : 'bg-gradient-to-tr from-indigo-500 to-sky-400 text-white'
                }`}
              >
                {isAssistant ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              {/* Message Bubble Container */}
              <div
                className={`group relative rounded-2xl px-4 sm:px-5 py-3.5 text-sm leading-relaxed shadow-md ${
                  isAssistant
                    ? 'bg-slate-800/90 border border-white/10 text-slate-100 rounded-tl-sm'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-sm'
                }`}
              >
                {/* Assistant Copy Action */}
                {isAssistant && (
                  <button
                    onClick={() => copyToClipboard(msg.id, msg.content)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-slate-700/60 transition-all"
                    title="Copy Answer"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {/* Content */}
                {isAssistant ? (
                  <div
                    className="markdown-content prose prose-invert max-w-none text-slate-200"
                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}

                {/* Sources Cited Section */}
                {isAssistant && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Retrieved Sources Cited</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, idx) => (
                        <button
                          key={idx}
                          onClick={() => onOpenSourceModal(src.source)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/30 hover:border-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Click to view full notes"
                        >
                          <span>📄 {src.source.replace('docs/', '')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator Bubble */}
        {isLoading && (
          <div className="flex gap-3 max-w-2xl mr-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-slate-800/90 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-2 text-slate-300 text-sm">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
              </div>
              <span className="text-xs text-slate-400">Consulting study material & generating answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel / Chips */}
      <div className="px-4 py-2 bg-slate-950/40 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 ml-1" />
        {displayPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-400/50 border border-white/10 text-slate-300 hover:text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 sm:p-4 bg-slate-950/70 border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question from your study notes (e.g., 'Derive Fourier coefficients for f(x)...')"
            disabled={isLoading}
            className="flex-1 bg-slate-800/90 border border-white/15 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

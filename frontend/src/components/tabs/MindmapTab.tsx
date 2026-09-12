'use client';

import React, { useState } from 'react';
import { GitFork, Sparkles, ChevronDown, ChevronRight, BookOpen, Layers, Code } from 'lucide-react';
import { MindMapResponse, TreeNode } from '@/types';
import { StudentProfile } from '@/types/profile';
import { generateMindMap } from '@/lib/api';

interface MindmapTabProps {
  selectedDocument: string;
  profile?: StudentProfile | null;
  studentContext?: string;
}

export const MindmapTab: React.FC<MindmapTabProps> = ({
  selectedDocument,
  profile,
  studentContext,
}) => {
  const [mindMapData, setMindMapData] = useState<MindMapResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawMermaid, setShowRawMermaid] = useState<boolean>(false);

  const handleGenerateMindMap = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await generateMindMap(selectedDocument, studentContext);
      setMindMapData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate concept mind map.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Control Toolbar */}
      <div className="p-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {mindMapData ? mindMapData.title : 'Concept Mind Map & Knowledge Tree'}
            </h3>
            <p className="text-xs text-slate-400">
              Scope: {selectedDocument === 'all' ? 'All Course Modules' : selectedDocument}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {mindMapData && (
            <button
              onClick={() => setShowRawMermaid((prev) => !prev)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              <span>{showRawMermaid ? 'Tree View' : 'Mermaid Syntax'}</span>
            </button>
          )}

          <button
            onClick={handleGenerateMindMap}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{mindMapData ? 'Re-Synthesize' : 'Synthesize Mind Map'}</span>
          </button>
        </div>
      </div>

      {/* Main Area */}
      {isLoading ? (
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-spin">
            <GitFork className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Synthesizing Concept Hierarchy...</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            Analyzing relationship graphs, theorem dependencies, and subtopics across the course materials.
          </p>
        </div>
      ) : error ? (
        <div className="bg-slate-900/70 border border-rose-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <p className="text-rose-400 text-sm">{error}</p>
          <button
            onClick={handleGenerateMindMap}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : !mindMapData ? (
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Visual Concept Mind Mapping</h3>
          <p className="text-sm text-slate-400 max-w-md">
            Convert linear lecture notes into structured, hierarchical trees linking topics, formulas, definitions, and rules.
          </p>
          <button
            onClick={handleGenerateMindMap}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 transition-all cursor-pointer"
          >
            Generate Mind Map
          </button>
        </div>
      ) : showRawMermaid ? (
        /* Raw Mermaid Syntax Box */
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Mermaid.js Mindmap Diagram Code
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(mindMapData.mermaid_code)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg"
            >
              Copy Code
            </button>
          </div>
          <pre className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-white/10">
            {mindMapData.mermaid_code}
          </pre>
        </div>
      ) : (
        /* Interactive Tree Node View */
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-4 border-b border-white/10">
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
            <h4 className="text-base font-bold text-white">
              {mindMapData.hierarchy?.name || mindMapData.title}
            </h4>
          </div>

          <div className="space-y-3 pt-2">
            {mindMapData.hierarchy?.children?.map((child, idx) => (
              <TreeNodeItem key={idx} node={child} depth={1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({ node, depth }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const hasChildren = node.children && node.children.length > 0;

  const depthColors = [
    'border-indigo-500/40 bg-indigo-500/5',
    'border-purple-500/40 bg-purple-500/5',
    'border-pink-500/40 bg-pink-500/5',
    'border-sky-500/40 bg-sky-500/5',
  ];

  const colorClass = depthColors[depth % depthColors.length];

  return (
    <div className="flex flex-col space-y-2">
      <div
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={`p-3.5 rounded-xl border ${colorClass} hover:border-indigo-400/60 transition-all flex items-start justify-between gap-3 ${
          hasChildren ? 'cursor-pointer' : ''
        }`}
      >
        <div className="flex items-start gap-2.5">
          {hasChildren ? (
            <button className="mt-0.5 text-indigo-400">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
          )}

          <div>
            <div className="text-sm font-semibold text-white">{node.name}</div>
            {node.description && (
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{node.description}</p>
            )}
          </div>
        </div>

        {hasChildren && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 shrink-0">
            {node.children?.length} Subtopics
          </span>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="pl-6 border-l-2 border-dashed border-white/10 space-y-2 ml-3">
          {node.children?.map((child, idx) => (
            <TreeNodeItem key={idx} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

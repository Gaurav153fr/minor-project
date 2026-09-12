'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="doc-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeSlug]}
        components={{
          h1({ node, children, id, ...props }: any) {
            return (
              <h1 id={id} className="group scroll-mt-24 flex items-center gap-2" {...props}>
                <span>{children}</span>
                {id && (
                  <a
                    href={`#${id}`}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-indigo-400 text-sm transition-opacity"
                    title="Direct link to heading"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </a>
                )}
              </h1>
            );
          },
          h2({ node, children, id, ...props }: any) {
            return (
              <h2 id={id} className="group scroll-mt-24 flex items-center gap-2" {...props}>
                <span>{children}</span>
                {id && (
                  <a
                    href={`#${id}`}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-indigo-400 text-sm transition-opacity"
                    title="Direct link to heading"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </h2>
            );
          },
          h3({ node, children, id, ...props }: any) {
            return (
              <h3 id={id} className="group scroll-mt-24 flex items-center gap-2" {...props}>
                <span>{children}</span>
                {id && (
                  <a
                    href={`#${id}`}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-indigo-400 text-xs transition-opacity"
                    title="Direct link to heading"
                  >
                    <LinkIcon className="w-3 h-3" />
                  </a>
                )}
              </h3>
            );
          },
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            const codeString = String(children).replace(/\n$/, '');

            if (isInline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }

            return <CodeBlock language={match ? match[1] : ''} code={codeString} />;
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-white/10 shadow-lg">
                <table className="min-w-full divide-y divide-white/10">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="px-4 py-2.5 text-left text-xs font-bold text-indigo-200 uppercase tracking-wider bg-slate-800/80">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="px-4 py-2.5 text-xs text-slate-300 border-t border-white/5">{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-white/15 bg-[#0d1117] shadow-xl">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900/90 border-b border-white/10 text-xs text-slate-400">
        <span className="font-mono uppercase font-semibold text-[11px] text-indigo-400">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};

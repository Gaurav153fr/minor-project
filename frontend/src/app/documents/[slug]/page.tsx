import React from 'react';
import { DocumentReaderView } from '@/components/DocumentReaderView';
import { QuestionPaperView } from '@/components/QuestionPaperView';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/_/g, ' ').replace('.md', '').toUpperCase();
  return {
    title: `${title} - StudyGenius Notes & Papers`,
    description: `Study notes, official question papers, and interactive AI study companion for ${title}`,
  };
}

export default async function DocumentPage({ params }: PageProps) {
  const { slug } = await params;
  const isQuestionPaper =
    slug.includes('question') ||
    slug.includes('exam') ||
    slug.includes('cs_322554') ||
    slug.includes('chemistry_1');

  if (isQuestionPaper) {
    return <QuestionPaperView slug={slug} />;
  }

  return <DocumentReaderView slug={slug} />;
}

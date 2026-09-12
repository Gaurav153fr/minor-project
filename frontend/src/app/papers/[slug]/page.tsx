import React from 'react';
import { QuestionPaperView } from '@/components/QuestionPaperView';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/_/g, ' ').replace('.md', '').toUpperCase();
  return {
    title: `${title} - University Question Paper & Solutions`,
    description: `Official question paper, step-by-step solutions, and AI study companion for ${title}`,
  };
}

export default async function PaperPage({ params }: PageProps) {
  const { slug } = await params;
  return <QuestionPaperView slug={slug} />;
}

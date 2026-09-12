export interface DocumentItem {
  id: string;
  filename: string;
  title: string;
  size_kb: number;
  preview: string;
  category?: 'question_paper' | 'study_notes';
  course_code?: string;
  exam_name?: string;
  max_marks?: string;
}

export interface ChatSource {
  source: string;
  content_preview: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  timestamp?: string;
}

export interface SolveQuestionResponse {
  solution: string;
  key_formulae: string[];
  marking_tips: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  source: string;
}

export interface QuizResponse {
  title: string;
  document: string;
  questions: QuizQuestion[];
}

export interface FlashcardItem {
  id: number;
  front: string;
  back: string;
  category: string;
  source: string;
}

export interface FlashcardResponse {
  deck_title: string;
  document: string;
  cards: FlashcardItem[];
}

export interface TreeNode {
  name: string;
  description?: string;
  children?: TreeNode[];
}

export interface MindMapResponse {
  title: string;
  document: string;
  mermaid_code: string;
  hierarchy: TreeNode;
}

export interface UnitStructure {
  id: string;
  number: number;
  filename: string;
  title: string;
  size_kb: number;
}

export interface SubjectStructure {
  id: string;
  name: string;
  units: UnitStructure[];
}

export interface QuestionPaperStructure {
  id: string;
  filename: string;
  title: string;
  course_code?: string;
  size_kb: number;
}

export interface SyllabusDocStructure {
  id: string;
  filename: string;
  title: string;
  size_kb: number;
}

export interface SemesterStructure {
  number: number;
  name: string;
  syllabus_doc?: SyllabusDocStructure | null;
  subjects: SubjectStructure[];
  question_papers: QuestionPaperStructure[];
  has_content: boolean;
}

export interface CurriculumStructureResponse {
  semesters: SemesterStructure[];
}

export type StudyTab = 'chat' | 'quiz' | 'flashcards' | 'mindmap' | 'documents';


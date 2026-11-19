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

export type StudyTab = 'chat' | 'quiz' | 'flashcards' | 'mindmap' | 'documents' | 'viva' | 'podcast';

// ── Viva AI Types ──────────────────────────────────────────────

export interface VivaStartRequest {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  question_count: number;
  student_context?: string;
}

export interface VivaStartResponse {
  session_id: string;
  total_questions: number;
  question_number: number;
  question: string;
  topic_tag: string;
}

export interface VivaAnswerRequest {
  session_id: string;
  question_number: number;
  student_answer: string;
}

export interface VivaNextQuestion {
  question_number: number;
  question: string;
  topic_tag: string;
}

export interface VivaAnswerResponse {
  score: number;
  max_score: number;
  feedback: string;
  correct_answer_summary: string;
  is_last_question: boolean;
  next_question?: VivaNextQuestion | null;
}

export interface VivaSummaryRequest {
  session_id: string;
}

export interface VivaQuestionBreakdown {
  question_number: number;
  question: string;
  student_answer: string;
  score: number;
  max_score: number;
  feedback: string;
  correct_answer_summary: string;
  topic_tag: string;
}

export interface VivaSummaryResponse {
  total_score: number;
  max_score: number;
  percentage: number;
  grade: string;
  weak_topics: string[];
  strong_topics: string[];
  recommendations: string;
  question_breakdown: VivaQuestionBreakdown[];
}

// ── Podcast AI Types ──────────────────────────────────────────

export interface PodcastHostInfo {
  name: string;
  gender: string;
  lang_code: string;
}

export interface PodcastDialogueLine {
  turn: number;
  speaker: string;
  text: string;
  emotion?: string;
}

export interface PodcastScript {
  episode_title: string;
  topic_tag: string;
  language: string;
  duration_minutes: number;
  host1: PodcastHostInfo;
  host2: PodcastHostInfo;
  script: PodcastDialogueLine[];
}

export type InterviewStatus = 'in_progress' | 'completed' | 'abandoned';

export type ExperienceLevel = 'beginner' | 'junior' | 'mid-level' | 'senior';

export type Difficulty = 'easy' | 'adaptive' | 'hard';

export type InterviewMode = 'technical' | 'behavioral' | 'mixed';

export type InterviewStyle = 'professional' | 'friendly' | 'technical' | 'challenging';

export interface AnswerEvaluation {
  score: number;
  correctness: number;
  technicalDepth: number;
  relevance: number;
  communication: number;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  improvementSuggestion: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          full_name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      interviews: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          category: string;
          experience_level: ExperienceLevel;
          topics: string[];
          duration: number;
          difficulty: Difficulty;
          mode: InterviewMode;
          style: InterviewStyle;
          overall_score: number | null;
          status: InterviewStatus;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          role: string;
          category?: string;
          experience_level?: ExperienceLevel;
          topics?: string[];
          duration?: number;
          difficulty?: Difficulty;
          mode?: InterviewMode;
          style?: InterviewStyle;
          overall_score?: number | null;
          status?: InterviewStatus;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          category?: string;
          experience_level?: ExperienceLevel;
          topics?: string[];
          duration?: number;
          difficulty?: Difficulty;
          mode?: InterviewMode;
          style?: InterviewStyle;
          overall_score?: number | null;
          status?: InterviewStatus;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      interview_questions: {
        Row: {
          id: string;
          interview_id: string;
          question: string;
          topic: string;
          difficulty: Difficulty;
          question_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          question: string;
          topic?: string;
          difficulty?: Difficulty;
          question_number?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          interview_id?: string;
          question?: string;
          topic?: string;
          difficulty?: Difficulty;
          question_number?: number;
          created_at?: string;
        };
      };
      interview_answers: {
        Row: {
          id: string;
          interview_id: string;
          question_id: string;
          answer: string;
          score: number | null;
          evaluation: AnswerEvaluation | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          question_id: string;
          answer: string;
          score?: number | null;
          evaluation?: AnswerEvaluation | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          interview_id?: string;
          question_id?: string;
          answer?: string;
          score?: number | null;
          evaluation?: AnswerEvaluation | null;
          created_at?: string;
        };
      };
      study_plans: {
        Row: {
          id: string;
          user_id: string;
          interview_id: string | null;
          title: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          interview_id?: string | null;
          title: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          interview_id?: string | null;
          title?: string;
          description?: string;
          created_at?: string;
        };
      };
      study_plan_items: {
        Row: {
          id: string;
          study_plan_id: string;
          title: string;
          description: string;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          study_plan_id: string;
          title: string;
          description?: string;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          study_plan_id?: string;
          title?: string;
          description?: string;
          completed?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

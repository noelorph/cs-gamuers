export const topics = [
  'Programming fundamentals',
  'Data structures and algorithms',
  'Web development',
  'Mobile development',
  'Databases',
  'Computer systems and networking',
  'Software engineering',
  'Cybersecurity',
  'Data science',
  'Artificial intelligence and machine learning',
] as const;
export type Topic = (typeof topics)[number];
export type DraftDetails = {
  title: string;
  description: string;
  primaryTopic: Topic | null;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  outcomes: string[];
  priorKnowledge: string;
  estimatedHours: number | null;
};
export type CourseDraft = {
  id: string;
  revisionId: string;
  ownerId: string;
  version: number;
  details: DraftDetails;
  updatedAt: string;
};
export type DraftResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: 'validation' | 'conflict' | 'unavailable' | 'unauthenticated' | 'forbidden';
      fields?: Record<string, string>;
    };

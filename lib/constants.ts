export const ROLE_OPTIONS = [
  { value: 'Web Developer', category: 'web' },
  { value: 'App Developer', category: 'app' },
  { value: 'AI Developer', category: 'ai' },
  { value: 'Custom Role', category: 'custom' },
] as const;

export const EXPERIENCE_OPTIONS: { value: 'beginner' | 'junior' | 'mid-level' | 'senior'; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid-level', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
];

export const TOPIC_OPTIONS: Record<string, string[]> = {
  web: ['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'TypeScript', 'Git'],
  app: ['React Native', 'Flutter', 'Dart', 'APIs', 'State Management'],
  ai: ['Python', 'Machine Learning', 'LLMs', 'RAG', 'AI Agents', 'Prompt Engineering', 'AI APIs'],
  custom: ['General', 'System Design', 'Algorithms', 'Data Structures', 'Best Practices'],
};

export const DURATION_OPTIONS = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 20, label: '20 minutes' },
];

export const DIFFICULTY_OPTIONS: { value: 'easy' | 'adaptive' | 'hard'; label: string; description: string }[] = [
  { value: 'easy', label: 'Easy', description: 'Foundational questions throughout' },
  { value: 'adaptive', label: 'Adaptive', description: 'Adjusts to your performance' },
  { value: 'hard', label: 'Hard', description: 'Challenging questions throughout' },
];

export const MODE_OPTIONS: { value: 'technical' | 'behavioral' | 'mixed'; label: string; description: string }[] = [
  { value: 'technical', label: 'Technical', description: 'Coding and concepts' },
  { value: 'behavioral', label: 'Behavioral', description: 'Soft skills and scenarios' },
  { value: 'mixed', label: 'Mixed', description: 'Both technical and behavioral' },
];

export const STYLE_OPTIONS: { value: 'professional' | 'friendly' | 'technical' | 'challenging'; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'technical', label: 'Technical' },
  { value: 'challenging', label: 'Challenging' },
];

export function getRoleCategory(role: string): string {
  const found = ROLE_OPTIONS.find((r) => r.value === role);
  return found ? found.category : 'custom';
}

import type { z } from 'zod';
import type { flashcardSchema, interviewQuestionSchema, moduleSchema, problemSchema, questionSchema } from './types';

/**
 * Everything one curriculum module contributes. Authored per module using the schemas'
 * input types (defaults may be omitted); `content/index.ts` parses and validates it.
 */
export interface ModuleBundle {
  module: z.input<typeof moduleSchema>;
  questions: z.input<typeof questionSchema>[];
  problems: z.input<typeof problemSchema>[];
  interviews: z.input<typeof interviewQuestionSchema>[];
  flashcards: z.input<typeof flashcardSchema>[];
}

/** Options a, b, c… from plain strings. */
export const opts = (...texts: string[]) => texts.map((text, i) => ({ id: String.fromCharCode(97 + i), text }));

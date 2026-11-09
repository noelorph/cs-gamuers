import { topics, type DraftDetails } from './types';
export function validateDraftDetails(
  input: unknown
): { ok: true; value: DraftDetails } | { ok: false; fields: Record<string, string> } {
  const value =
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const fields: Record<string, string> = {};
  for (const [field, limit] of [
    ['title', 200],
    ['description', 2000],
    ['priorKnowledge', 2000],
  ] as const) {
    if (typeof value[field] !== 'string' || [...value[field]].length > limit)
      fields[field] = `Use text of at most ${limit} characters.`;
  }
  if (
    value.primaryTopic !== null &&
    !topics.includes(value.primaryTopic as (typeof topics)[number])
  )
    fields.primaryTopic = 'Choose a listed topic.';
  if (
    value.difficulty !== null &&
    !['Beginner', 'Intermediate', 'Advanced'].includes(value.difficulty as string)
  )
    fields.difficulty = 'Choose a listed difficulty.';
  if (
    !Array.isArray(value.outcomes) ||
    [...value.outcomes].some((outcome) => typeof outcome !== 'string' || [...outcome].length > 500)
  )
    fields.outcomes = 'Use outcomes of at most 500 characters each.';
  const hours =
    typeof value.estimatedHours === 'string' && value.estimatedHours.trim() === ''
      ? null
      : value.estimatedHours;
  if (hours !== null && (typeof hours !== 'number' || !Number.isFinite(hours) || hours <= 0))
    fields.estimatedHours = 'Enter a positive number or leave blank.';
  if (Object.keys(fields).length) return { ok: false, fields };
  const details = {
    title: value.title,
    description: value.description,
    primaryTopic: value.primaryTopic,
    difficulty: value.difficulty,
    outcomes: value.outcomes,
    priorKnowledge: value.priorKnowledge,
    estimatedHours: hours,
  } as DraftDetails;
  if (new TextEncoder().encode(JSON.stringify(details)).length > 1048576)
    return { ok: false, fields: { outcomes: 'Keep the draft request within 1 MiB.' } };
  return { ok: true, value: details };
}

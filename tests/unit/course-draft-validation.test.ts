import { expect, test } from 'vitest';
import { validateDraftDetails } from '@/features/content/validation';
const blank = {
  title: '',
  description: '',
  primaryTopic: null,
  difficulty: null,
  outcomes: [],
  priorKnowledge: '',
  estimatedHours: null,
};
test('incomplete drafts preserve blank fields and optional hours', () => {
  for (const estimatedHours of [null, '', '  '])
    expect(validateDraftDetails({ ...blank, estimatedHours })).toEqual({ ok: true, value: blank });
  expect(validateDraftDetails({ ...blank, outcomes: ['', '  '], title: '  title ' })).toEqual({
    ok: true,
    value: { ...blank, outcomes: ['', '  '], title: '  title ' },
  });
});
test.each([
  ['title', 200],
  ['description', 2000],
  ['priorKnowledge', 2000],
] as const)('%s counts code points without truncation', (field, limit) => {
  expect(validateDraftDetails({ ...blank, [field]: '😀'.repeat(limit) }).ok).toBe(true);
  expect(validateDraftDetails({ ...blank, [field]: '😀'.repeat(limit + 1) }).ok).toBe(false);
});
test('ordered outcomes have individual 500 code point bounds', () => {
  expect(validateDraftDetails({ ...blank, outcomes: ['😀'.repeat(500), ''] }).ok).toBe(true);
  for (const outcomes of [['x'.repeat(501)], [null], 'text'])
    expect(validateDraftDetails({ ...blank, outcomes }).ok).toBe(false);
});
test.each([0, -1, NaN, Infinity, -Infinity, '0', '2', true])(
  'invalid hours %s never coerce',
  (estimatedHours) => {
    expect(validateDraftDetails({ ...blank, estimatedHours }).ok).toBe(false);
  }
);
test('types, unsupported values and malformed input fail with field errors', () => {
  for (const input of [
    null,
    [],
    {},
    { ...blank, title: 4 },
    { ...blank, primaryTopic: 'Other' },
    { ...blank, difficulty: 'Expert' },
  ])
    expect(validateDraftDetails(input).ok).toBe(false);
  expect(
    validateDraftDetails({
      ...blank,
      primaryTopic: 'Databases',
      difficulty: 'Advanced',
      estimatedHours: 1.5,
    }).ok
  ).toBe(true);
});

test('sparse outcomes and oversized ordinary requests reject at the boundary', () => {
  expect(validateDraftDetails({ ...blank, outcomes: Array(1) }).ok).toBe(false);
  expect(validateDraftDetails({ ...blank, outcomes: Array(2200).fill('x'.repeat(500)) }).ok).toBe(
    false
  );
});

'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { topics, type CourseDraft, type DraftDetails } from '@/features/content/types';
import { paths } from '@/config/paths';
import { saveDraft, readDraft } from './actions';
import { draftError } from './draft-feedback';
import { DeleteDraftDialog } from './delete-draft-dialog';
import { draftRecovery, clearDraftRecovery, type DraftRecovery } from './draft-recovery';
const empty: DraftDetails = {
  title: '',
  description: '',
  primaryTopic: null,
  difficulty: null,
  outcomes: [],
  priorKnowledge: '',
  estimatedHours: null,
};
function sameDetails(left: DraftDetails, right: DraftDetails) {
  return (
    left.title === right.title &&
    left.description === right.description &&
    left.primaryTopic === right.primaryTopic &&
    left.difficulty === right.difficulty &&
    left.priorKnowledge === right.priorKnowledge &&
    left.estimatedHours === right.estimatedHours &&
    left.outcomes.length === right.outcomes.length &&
    left.outcomes.every((outcome, index) => outcome === right.outcomes[index])
  );
}
type DraftFormProps = { draft?: CourseDraft; createId?: string; ownerId?: string };
const subscribeHydration = () => () => {};
export function DraftForm(props: DraftFormProps) {
  const browserReady = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false
  );
  if (!browserReady) return <p role="status">Loading draft editor…</p>;
  const ownerId = props.ownerId ?? props.draft?.ownerId;
  const recoveryKey = ownerId ? `${ownerId}/${props.draft?.id ?? 'new'}` : null;
  return (
    <DraftEditor
      {...props}
      ownerId={ownerId}
      recoveryKey={recoveryKey}
      recovery={recoveryKey ? draftRecovery.get(recoveryKey) : undefined}
    />
  );
}
function DraftEditor({
  draft,
  createId,
  ownerId,
  recoveryKey,
  recovery,
}: DraftFormProps & { recoveryKey: string | null; recovery?: DraftRecovery }) {
  const router = useRouter();
  const [saved, setSaved] = useState(draft);
  const [id] = useState(recovery?.id ?? draft?.id ?? createId!);
  const [version, setVersion] = useState(recovery?.version ?? draft?.version ?? null);
  const [details, setDetails] = useState<DraftDetails>(
    recovery?.details ?? draft?.details ?? empty
  );
  const [hours, setHours] = useState(
    recovery?.hours ?? draft?.details.estimatedHours?.toString() ?? ''
  );
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(!!recovery);
  const alert = useRef<HTMLParagraphElement>(null);
  const lock = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [message, setMessage] = useState(recovery ? 'Recovered unsaved changes' : '');
  const [error, setError] = useState(recovery?.error ?? '');
  const [fields, setFields] = useState<Record<string, string>>(recovery?.fields ?? {});
  useEffect(() => {
    if (dirty && recoveryKey)
      draftRecovery.set(recoveryKey, { id, version, details, hours, error, fields });
  }, [recoveryKey, dirty, id, version, details, hours, error, fields]);
  useEffect(() => {
    if (error) alert.current?.focus();
  }, [error, pending]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const navigate = (event: MouseEvent) => {
      const link = (event.target as Element).closest('a[href]');
      if (!link || link.getAttribute('href')?.startsWith('#')) return;
      if (!window.confirm('Discard your unsaved draft changes and leave this page?')) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        if (ownerId) clearDraftRecovery(ownerId, id);
        setDirty(false);
      }
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', navigate, true);
    return () => {
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('click', navigate, true);
    };
  }, [dirty, ownerId, id]);
  function change<K extends keyof DraftDetails>(key: K, value: DraftDetails[K]) {
    setDetails({ ...details, [key]: value });
    setDirty(true);
    setMessage('Unsaved changes');
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setDirty(true);
    setError('');
    setMessage('');
    const submitted = {
      ...details,
      estimatedHours: hours.trim() === '' ? null : Number(hours),
    };
    try {
      const result = await saveDraft(id, version, submitted);
      if (!mounted.current) return;
      if (result.ok) {
        setSaved(result.value);
        setVersion(result.value.version);
        if (!sameDetails(submitted, result.value.details)) {
          setFields({});
          setError(
            'A saved draft was recovered with different details. Your entered changes are still here. Choose Save draft to update that version, or Reload saved draft to discard your changes and review it.'
          );
          return;
        }
        if (ownerId) clearDraftRecovery(ownerId, id);
        setDirty(false);
        setFields({});
        setMessage('Draft saved');
        if (!draft) router.replace(paths.courseDraft(id));
      } else {
        setError(draftError(result));
        setFields(result.fields ?? {});
      }
    } catch {
      if (!mounted.current) return;
      // A read can detect concurrent changes, but cannot prove this request committed.
      try {
        await readDraft(id);
      } catch {
        /* Keep the entered values when reconciliation is unavailable. */
      }
      setError(
        'The result could not be confirmed. Your changes are still here. Reload saved draft to inspect it before retrying.'
      );
    } finally {
      lock.current = false;
      if (mounted.current) setPending(false);
    }
  }
  function text(key: 'title' | 'description' | 'priorKnowledge', label: string, limit: number) {
    const Control = key === 'title' ? Input : Textarea;
    return (
      <div className="grid min-w-0 gap-2">
        <label htmlFor={key}>{label}</label>
        <Control
          id={key}
          value={details[key]}
          aria-describedby={`${key}-help`}
          aria-invalid={!!fields[key]}
          onChange={(e) => change(key, e.target.value)}
        />
        <p id={`${key}-help`} className="m-0 text-sm text-muted-foreground">
          {[...details[key]].length} / {limit} characters. {fields[key]}
        </p>
      </div>
    );
  }
  return (
    <div className="mt-6 grid min-w-0 max-w-[960px] gap-6">
      <p className="m-0 text-muted-foreground">
        Save an incomplete draft with any fields blank. Title, description, topic, difficulty and
        outcomes are required before future review; prior knowledge and estimated hours are
        optional.
      </p>
      <form
        onSubmit={submit}
        className="grid min-w-0 gap-6 rounded-lg border border-border bg-card p-4 md:p-6"
      >
        <fieldset disabled={pending} className="m-0 grid min-w-0 gap-6 border-0 p-0">
          <legend className="sr-only">Course details</legend>
          {text('title', 'Title', 200)}
          {text('description', 'Description', 2000)}
          <div className="grid min-w-0 gap-2">
            <label htmlFor="primaryTopic">Primary topic</label>
            <select
              id="primaryTopic"
              aria-invalid={!!fields.primaryTopic}
              aria-describedby="topic-error"
              className="min-h-11 w-full min-w-0 max-w-full rounded-md border border-input bg-background p-2 text-base focus-visible:outline-ring"
              value={details.primaryTopic ?? ''}
              onChange={(e) =>
                change('primaryTopic', (e.target.value || null) as DraftDetails['primaryTopic'])
              }
            >
              <option value="">Not selected</option>
              {topics.map((topic) => (
                <option key={topic}>{topic}</option>
              ))}
            </select>
            {fields.primaryTopic && <p id="topic-error">{fields.primaryTopic}</p>}
          </div>
          <div className="grid min-w-0 gap-2">
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              aria-invalid={!!fields.difficulty}
              aria-describedby="difficulty-error"
              className="min-h-11 w-full min-w-0 rounded-md border border-input bg-background p-2 text-base focus-visible:outline-ring"
              value={details.difficulty ?? ''}
              onChange={(e) =>
                change('difficulty', (e.target.value || null) as DraftDetails['difficulty'])
              }
            >
              <option value="">Not selected</option>
              {['Beginner', 'Intermediate', 'Advanced'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            {fields.difficulty && <p id="difficulty-error">{fields.difficulty}</p>}
          </div>
          <fieldset className="m-0 grid min-w-0 gap-4 rounded-md border border-border p-4">
            <legend>Learning outcomes</legend>
            <p className="m-0 text-sm">
              Order outcomes with Move up and Move down. Blank outcomes may remain in a draft.
            </p>
            {details.outcomes.map((outcome, index) => (
              <div key={index} className="grid min-w-0 gap-2">
                <label htmlFor={`outcome-${index}`}>Outcome {index + 1}</label>
                <Textarea
                  id={`outcome-${index}`}
                  aria-describedby={`outcome-${index}-help`}
                  aria-invalid={!!fields.outcomes}
                  value={outcome}
                  onChange={(e) =>
                    change(
                      'outcomes',
                      details.outcomes.map((value, i) => (i === index ? e.target.value : value))
                    )
                  }
                />
                <p id={`outcome-${index}-help`} className="m-0 text-sm">
                  {[...outcome].length} / 500 characters. {fields.outcomes}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[-1, 1].map((direction) => (
                    <Button
                      key={direction}
                      type="button"
                      variant="outline"
                      disabled={
                        index + direction < 0 || index + direction >= details.outcomes.length
                      }
                      aria-label={`Move outcome ${index + 1} ${direction < 0 ? 'up' : 'down'}`}
                      onClick={() => {
                        const next = [...details.outcomes];
                        [next[index], next[index + direction]] = [
                          next[index + direction],
                          next[index],
                        ];
                        change('outcomes', next);
                        document.getElementById(`outcome-${index + direction}`)?.focus();
                      }}
                    >
                      Move {direction < 0 ? 'up' : 'down'}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Remove outcome ${index + 1}`}
                    onClick={() =>
                      change(
                        'outcomes',
                        details.outcomes.filter((_, i) => i !== index)
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => change('outcomes', [...details.outcomes, ''])}
            >
              Add outcome
            </Button>
            {fields.outcomes && <p>{fields.outcomes}</p>}
          </fieldset>
          {text('priorKnowledge', 'Recommended prior knowledge (optional)', 2000)}
          <div className="grid min-w-0 gap-2">
            <label htmlFor="hours">Estimated hours (optional)</label>
            <Input
              id="hours"
              aria-describedby="hours-error"
              type="number"
              step="any"
              value={hours}
              aria-invalid={!!fields.estimatedHours}
              onChange={(e) => {
                setHours(e.target.value);
                setDirty(true);
                setMessage('Unsaved changes');
              }}
            />
            {fields.estimatedHours && <p id="hours-error">{fields.estimatedHours}</p>}
          </div>
        </fieldset>
        {error && (
          <p
            ref={alert}
            tabIndex={-1}
            role="alert"
            className="m-0 text-destructive outline-offset-4"
          >
            {error}
          </p>
        )}
        <p role="status" className="m-0">
          {pending ? 'Saving…' : message}
        </p>
        <div className="flex flex-wrap gap-4">
          <Button disabled={pending} type="submit">
            {pending ? 'Saving…' : 'Save draft'}
          </Button>
          {error && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (window.confirm('Discard your entered changes and reload the saved draft?')) {
                  if (ownerId) clearDraftRecovery(ownerId, id);
                  setDirty(false);
                  window.location.assign(paths.courseDraft(id));
                }
              }}
            >
              Reload saved draft
            </Button>
          )}
        </div>
      </form>
      {saved && <DeleteDraftDialog draft={{ ...saved, version: version ?? saved.version }} />}
    </div>
  );
}

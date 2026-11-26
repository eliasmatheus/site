/**
 * Quest progress (XP), kept in localStorage. Storage can be missing or throw (private mode,
 * blocked site data), so every access is guarded and the site works without it.
 */

export const QUEST_IDS = ['exposure', 'footing', 'name'] as const;
export type QuestId = (typeof QUEST_IDS)[number];
/** Quests on the current journey. The exposure quest is parked with the Prologue. */
export const JOURNEY_QUESTS: readonly QuestId[] = ['footing', 'name'];

const KEY = 'em:quests';
export const QUESTS_EVENT = 'quests:change';

export interface QuestStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function storage(): QuestStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadQuests(store: QuestStorage | undefined = storage()): Set<QuestId> {
  try {
    const raw = store?.getItem(KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return new Set();
    return new Set(list.filter((q): q is QuestId => (QUEST_IDS as readonly unknown[]).includes(q)));
  } catch {
    return new Set();
  }
}

/** Marks a quest as done. Returns the new set. Saving is best effort. */
export function completeQuest(
  id: QuestId,
  store: QuestStorage | undefined = storage(),
): Set<QuestId> {
  const done = loadQuests(store);
  if (done.has(id)) return done;
  done.add(id);
  try {
    store?.setItem(KEY, JSON.stringify([...done]));
  } catch {
    // Not saved; the counter still updates for this visit.
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(QUESTS_EVENT, { detail: done.size }));
  }
  return done;
}

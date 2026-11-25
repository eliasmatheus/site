import { describe, expect, it } from 'vitest';
import { completeQuest, loadQuests, type QuestStorage } from './quests';

const memory = (): QuestStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

describe('quests', () => {
  it('starts empty and saves completed quests', () => {
    const store = memory();
    expect(loadQuests(store).size).toBe(0);
    completeQuest('exposure', store);
    completeQuest('exposure', store);
    expect([...loadQuests(store)]).toEqual(['exposure']);
  });

  it('ignores corrupt or unknown data', () => {
    const store = memory();
    store.setItem('em:quests', '{not json');
    expect(loadQuests(store).size).toBe(0);
    store.setItem('em:quests', JSON.stringify(['exposure', 'hacked']));
    expect([...loadQuests(store)]).toEqual(['exposure']);
  });

  it('survives storage that throws', () => {
    const broken: QuestStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadQuests(broken).size).toBe(0);
    expect(completeQuest('name', broken).size).toBe(1);
    expect(loadQuests(undefined).size).toBe(0);
  });
});

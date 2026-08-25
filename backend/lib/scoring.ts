import { aiEnabled, evaluateImage } from './ai';
import { getImageByUrl } from './images';
import { mockAiScore } from './store';

const pending = (): Set<string> => globalThis.__gpScoring ?? (globalThis.__gpScoring = new Set());

function lastImageUrl(group) {
  for (let i = group.entries.length - 1; i >= 0; i--) {
    if (group.entries[i].url) return group.entries[i].url;
  }
  return null;
}

export function scorePendingGroups(room, onScored) {
  if (room.mode !== 'relay' || !room.options.scored || !room.game) return;
  room.game.groups.forEach((group, gi) => {
    if (!group.done || group.score != null) return;
    const key = `${room.code}:${gi}`;
    if (pending().has(key)) return;
    pending().add(key);

    const url = lastImageUrl(group);
    const entry = getImageByUrl(url);
    if (!aiEnabled() || !entry) {
      group.score = mockAiScore(`${room.code}:relay:${gi}:${group.entries.length}`);
      pending().delete(key);
      onScored?.(room.code);
      return;
    }

    evaluateImage(entry.buffer, room.game.theme?.ko ?? '')
      .then((result) => {
        group.score = result.score ?? mockAiScore(`${room.code}:relay:${gi}:${group.entries.length}`);
        group.comment = result.comment;
      })
      .catch(() => {
        group.score = mockAiScore(`${room.code}:relay:${gi}:${group.entries.length}`);
      })
      .finally(() => {
        pending().delete(key);
        onScored?.(room.code);
      });
  });
}

export function dropPendingScores(code) {
  const prefix = `${String(code).toUpperCase()}:`;
  for (const key of pending()) if (key.startsWith(prefix)) pending().delete(key);
}

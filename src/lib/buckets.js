/**
 * Skill buckets for team building, remembered per group on this device
 * so they can be reused for the next tournament.
 */

const key = (groupId) => `goodminton:buckets:${groupId}`;

export const loadBuckets = (groupId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(key(groupId)) || "null");
    if (Array.isArray(saved?.strong) && Array.isArray(saved?.weak)) return saved;
  } catch {
    // Storage unavailable or corrupted: start empty
  }
  return { strong: [], weak: [] };
};

export const saveBuckets = (groupId, buckets) => {
  try {
    localStorage.setItem(key(groupId), JSON.stringify(buckets));
  } catch {
    // Private mode / storage blocked: buckets just won't be remembered
  }
};

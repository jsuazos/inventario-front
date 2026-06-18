export function splitGenreTags(genreValue) {
  if (!genreValue) {
    return [];
  }

  return genreValue
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
    .filter(tag => tag !== '"World & Country"');
}

export function normalizeGenreTag(tag) {
  return (tag || '').trim().toLowerCase();
}

export function hasGenreTag(genreValue, targetTag) {
  const normalizedTarget = normalizeGenreTag(targetTag);
  if (!normalizedTarget) {
    return false;
  }

  return splitGenreTags(genreValue).some(tag => normalizeGenreTag(tag) === normalizedTarget);
}

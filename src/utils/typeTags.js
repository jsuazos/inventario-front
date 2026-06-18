export function splitTypeTags(typeValue) {
  if (!typeValue) {
    return [];
  }

  return typeValue
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
}

export function normalizeTypeTag(tag) {
  return (tag || '').trim().toLowerCase();
}

export function hasTypeTag(typeValue, targetTag) {
  const normalizedTarget = normalizeTypeTag(targetTag);
  if (!normalizedTarget) {
    return false;
  }

  return splitTypeTags(typeValue).some(tag => normalizeTypeTag(tag) === normalizedTarget);
}

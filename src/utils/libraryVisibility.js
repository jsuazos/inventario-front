export function isVisibleLibraryItem(item = {}) {
  return item.Visible === 'SI' || item.Visible === true;
}

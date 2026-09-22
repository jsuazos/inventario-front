import assert from 'node:assert/strict';
import test from 'node:test';
import { isVisibleLibraryItem } from '../src/utils/libraryVisibility.js';

test('solo reconoce como visibles los valores SI y true', () => {
  assert.equal(isVisibleLibraryItem({ Visible: 'SI' }), true);
  assert.equal(isVisibleLibraryItem({ Visible: true }), true);
  assert.equal(isVisibleLibraryItem({ Visible: 'NO' }), false);
  assert.equal(isVisibleLibraryItem({ Visible: false }), false);
});

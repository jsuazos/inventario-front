import assert from 'node:assert/strict';
import test from 'node:test';
import { escapeHtml, sanitizeHttpUrl } from '../src/utils/htmlSafety.js';

test('escapeHtml neutraliza etiquetas y atributos HTML', () => {
  assert.equal(
    escapeHtml('<img src="x" onerror="alert(1)">'),
    '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;'
  );
});

test('sanitizeHttpUrl solo permite URLs HTTP y HTTPS', () => {
  assert.equal(sanitizeHttpUrl('javascript:alert(1)'), '');
  assert.equal(sanitizeHttpUrl('data:text/html,alert(1)'), '');
  assert.equal(sanitizeHttpUrl('https://example.com/cover.jpg'), 'https://example.com/cover.jpg');
});

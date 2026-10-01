import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('homepage follows the ten-section reference structure', () => {
  const expectedOrder = [
    'class="utility-bar"',
    '<header class="site-header"',
    'id="home"',
    'class="category-strip"',
    'id="about"',
    'id="services"',
    'id="ecosystems"',
    'id="process"',
    'id="contact"',
    '<footer class="site-footer"',
  ];

  let cursor = -1;
  for (const marker of expectedOrder) {
    const next = html.indexOf(marker, cursor + 1);
    assert.ok(next > cursor, `${marker} must appear in the approved order`);
    cursor = next;
  }
});

test('homepage contains the six reference categories and eight reference services', () => {
  const categories = ['Hardware', 'Software', 'Networking', 'IT Support', 'Security', 'Web Development'];
  const services = [
    'Hardware OEM',
    'Software Solutions',
    'Network Services',
    'PC &amp; End User Support',
    'Microsoft 365 Support',
    'CCTV &amp; Security',
    'Printer Services',
    'Website Development',
  ];

  for (const label of [...categories, ...services]) {
    assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.equal((html.match(/class="service-card"/g) || []).length, 8);
});

test('mobile navigation exposes its state and supports reduced motion', () => {
  assert.match(html, /id="menu-toggle"[^>]+aria-expanded="false"/s);
  assert.match(html, /id="primary-navigation"/);
  assert.match(html, /Escape/);
  assert.match(html, /prefers-reduced-motion:\s*reduce/);
  assert.match(html, /aria-controls="primary-navigation"/);
});

test('the page uses supplied assets and both requested motion libraries', () => {
  assert.match(html, /project\/gvt-logo\.png/);
  assert.match(html, /project\/img\/hero-server-aisle\.png/);
  assert.match(html, /project\/img\/logos-row1\.png/);
  assert.match(html, /project\/img\/logos-row2\.png/);
  assert.match(html, /gsap@/);
  assert.match(html, /motion@/);
});

test('semantic essentials are present', () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<main\b/);
  assert.match(html, /<nav[^>]+aria-label="Primary"/);
  assert.match(html, /:focus-visible/);
});

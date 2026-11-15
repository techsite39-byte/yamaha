import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const componentPath = fileURLToPath(new URL('./YamahaAdmin.jsx', import.meta.url));
const stylesheetPath = fileURLToPath(new URL('./YamahaAdmin.css', import.meta.url));
const [component, stylesheet] = await Promise.all([
  readFile(componentPath, 'utf8'),
  readFile(stylesheetPath, 'utf8'),
]);

test('overview shortcuts and KPI cards point to their intended admin destinations', () => {
  const actionBlock = component.match(/action=\{\s*<div className="admin-overview-actions">([\s\S]*?)<\/div>\s*\}/);
  assert.ok(actionBlock, 'overview heading action group should exist');

  const shortcutRoutes = [...actionBlock[1].matchAll(/\['([^']+)', '([^']+)'\]/g)]
    .map(([, label, path]) => [label, path]);
  assert.deepEqual(shortcutRoutes, [
    ['Motorcycles', '/admin/motorcycles'],
    ['Bookings', '/admin/bookings'],
    ['Enquiries', '/admin/enquiries'],
  ]);
  assert.match(actionBlock[1], /<a\b[^>]*href=\{path\}[^>]*onClick=\{\(event\) => navigate\(event, path\)\}/);

  const dashboard = component.match(/function AdminDashboard\([\s\S]*?(?=\nfunction |\nexport default)/);
  assert.ok(dashboard, 'dashboard component should exist');
  for (const [label, path] of [
    ['Total motorcycles', '/admin/motorcycles'],
    ['Total bookings', '/admin/bookings'],
    ['Pending bookings', '/admin/bookings'],
    ['Total enquiries', '/admin/enquiries'],
    ['Confirmed bookings', '/admin/bookings'],
    ['Completed bookings', '/admin/bookings'],
    ['Unread enquiries', '/admin/enquiries'],
    ['Customer reviews', '/admin/reviews'],
    ['Published social posts', '/admin/social/posts'],
    ['Service videos', '/admin/service-videos'],
  ]) {
    assert.match(
      dashboard[0],
      new RegExp(`label: '${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',[^\\n]*path: '${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`),
      `${label} should link to ${path}`,
    );
  }
  assert.match(dashboard[0], /href=\{metric\.path\} onClick=\{\(event\) => onNavigate\(event, metric\.path\)\}/);
});

test('reduced-motion preference disables the loading spinner animation', () => {
  const reducedMotionRule = stylesheet.match(
    /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/,
  );
  assert.ok(reducedMotionRule, 'stylesheet should define a reduced-motion media query');
  assert.match(
    reducedMotionRule[1],
    /\.admin-state__spinner\s*\{\s*animation:\s*none\s*;/,
    'loading spinner animation should be disabled for reduced-motion users',
  );
});

test('recent enquiries report unavailable data from the enquiry source', () => {
  const dashboard = component.match(/function AdminDashboard\([\s\S]*?(?=\nfunction |\nexport default)/);
  assert.ok(dashboard, 'dashboard component should exist');
  assert.match(dashboard[0], /sourceStatus\.enquiries === 'unavailable'\s*\?\s*'Enquiries unavailable\.'/);
});

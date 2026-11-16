import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const profilesPath = path.resolve(__dirname, 'data', 'socialProfiles.json');

test('Social Profiles: JSON structure and footer visibility properties', () => {
  const raw = fs.readFileSync(profilesPath, 'utf8');
  const profiles = JSON.parse(raw);

  assert.ok(Array.isArray(profiles), 'Profiles must be an array');
  assert.ok(profiles.length >= 5, 'Should have at least 5 major social channels');

  const instagram = profiles.find((p) => p.platform?.toLowerCase() === 'instagram');
  assert.ok(instagram, 'Instagram profile must exist');
  assert.equal(instagram.showInFooter, true, 'Instagram should be marked visible in footer by default');
  assert.ok(instagram.profileUrl.includes('instagram.com'), 'Instagram profileUrl should be valid');

  const visibleProfiles = profiles.filter((p) => {
    const isHidden = p.status === 'hidden' || p.showInFooter === false;
    const hasUrl = Boolean(p.profileUrl || p.url);
    return !isHidden && hasUrl;
  });

  assert.ok(visibleProfiles.length > 0, 'Visible profiles for footer must not be empty');
  for (const vp of visibleProfiles) {
    assert.notEqual(vp.status, 'hidden');
    assert.notEqual(vp.showInFooter, false);
    assert.ok(vp.profileUrl || vp.url);
  }
});

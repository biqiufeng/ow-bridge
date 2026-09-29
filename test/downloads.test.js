import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOWNLOADS, downloadURL } from '../src/downloads.js';

test('only the two fixed WorkBuddy invite pages can be opened, and never a renderer-supplied URL', () => {
  assert.deepEqual(Object.keys(DOWNLOADS), ['workbuddy', 'workbuddy-ai']);
  assert.equal(downloadURL('workbuddy'), 'https://www.workbuddy.cn/events/invite?inviteCode=yj5ifq74l');
  assert.equal(downloadURL('workbuddy-ai'), 'https://workbuddy.ai/invite?code=Y4QR3HMP');
  // shell.openExternal reaches the OS, so anything not in the table must resolve to null
  // rather than being passed through: no prototype keys, no URLs, no other schemes.
  for (const id of ['constructor', '__proto__', 'toString', 'hasOwnProperty',
    'file:///etc/passwd', 'javascript:alert(1)', 'data:text/html,<script>', 'HTTPS://EVIL'])
    assert.equal(downloadURL(id), null, `${id} must not open`);
  assert.equal(downloadURL(undefined), null);
  for (const entry of Object.values(DOWNLOADS)) assert.match(entry.url, /^https:\/\//);
});

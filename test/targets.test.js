import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TARGETS, targetIDs, targetFor, routeFor } from '../src/targets.js';

test('every import action reaches the one import route and names its own build', () => {
  // Regression: the desktop client once posted to /admin/import-ai, which does not exist.
  for (const [id, spec] of Object.entries(TARGETS)) {
    assert.equal(targetFor(spec.action), id);
    assert.equal(routeFor(spec.action), 'import', `${spec.action} must not become its own route`);
    assert.equal(spec.setting, `workBuddy${id === 'workbuddy' ? '' : 'Ai'}ModelsFile`);
  }
  assert.equal(targetFor('choose-config'), 'workbuddy', 'The Windows picker belongs to the primary build');
  assert.deepEqual(targetIDs, ['workbuddy', 'workbuddy-ai']);
  for (const action of ['refresh', 'probe', 'system-proxy', 'restart'])
    assert.equal(targetFor(action), null), assert.equal(routeFor(action), action);
  assert.equal(targetFor('nope'), null);
});

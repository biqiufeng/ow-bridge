// The two WorkBuddy builds share one models.json format but not one directory: the
// overseas build declares its own customUserDataDir, so a target is a build, not just
// a file path. This map is the single place that knows the relationship — the service
// resolves paths from it and the desktop client routes actions through it.
export const TARGETS = {
  workbuddy: { label: 'WorkBuddy', folder: '.workbuddy', setting: 'workBuddyModelsFile', env: 'BUDDY_MODELS_FILE', action: 'import' },
  'workbuddy-ai': { label: 'WorkBuddy AI', folder: '.workbuddy-ai', setting: 'workBuddyAiModelsFile', env: 'BUDDY_AI_MODELS_FILE', action: 'import-ai' },
};
export const targetIDs = Object.keys(TARGETS);

// Every import action posts to one route; the build it writes travels in the body.
export function targetFor(action) {
  return targetIDs.find(id => TARGETS[id].action === action)
    ?? (action === 'choose-config' ? 'workbuddy' : null);
}
export function routeFor(action) { return targetFor(action) ? 'import' : action; }

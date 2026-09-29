// shell.openExternal hands a URL to the operating system, so the renderer never supplies
// one: it names a build and the main process looks the fixed URL up here. Keeping the list
// in a testable module is what stops a renderer-supplied string from reaching the OS.
export const DOWNLOADS = {
  workbuddy: { label: '国内版 WorkBuddy', url: 'https://www.workbuddy.cn/events/invite?inviteCode=yj5ifq74l' },
  'workbuddy-ai': { label: '海外版 WorkBuddy AI', url: 'https://workbuddy.ai/invite?code=Y4QR3HMP' },
};
export const downloadURL = id => {
  const entry = Object.hasOwn(DOWNLOADS, id) ? DOWNLOADS[id] : null;
  return entry && entry.url.startsWith('https://') ? entry.url : null;
};

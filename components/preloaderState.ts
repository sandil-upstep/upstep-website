// Tells the page when the preloader (Preloader.tsx, mounted once in the
// layout) steps aside, so scrolling and intro animations start once they can
// be seen rather than behind it. It only plays on a full page load: client
// navigations find it already done.
let done = false;
const listeners = new Set<() => void>();

export const isPreloaderDone = () => done;

export function finishPreloader() {
  if (done) return;
  done = true;
  listeners.forEach((listener) => listener());
  listeners.clear();
}

// Runs `callback` once the preloader is out of the way — straight away if it
// already is. Returns a function that cancels it if it hasn't run yet.
export function onPreloaderDone(callback: () => void) {
  if (done) {
    callback();
    return () => {};
  }
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

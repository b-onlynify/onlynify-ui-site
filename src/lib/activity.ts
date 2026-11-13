/**
 * Counts in-flight API requests so the UI can show the "onlyn" activity bar. Pure module (no DOM), safe on the
 * server and in React Native. Every start has a 30 s safety timer, so a request that never reports back can't
 * leave the bar stuck.
 */
type Listener = (inFlight: number) => void;

const listeners = new Set<Listener>();
const open = new Map<number, ReturnType<typeof setTimeout>>();
let seq = 0;

const emit = () => listeners.forEach((l) => l(open.size));

/** Call when a request starts; call the returned function once when it settles. */
export function startActivity(): () => void {
  const id = ++seq;
  open.set(
    id,
    setTimeout(() => end(), 30_000),
  );
  emit();
  let done = false;
  function end() {
    if (done) return;
    done = true;
    clearTimeout(open.get(id));
    open.delete(id);
    emit();
  }
  return end;
}

export function onActivity(l: Listener): () => void {
  listeners.add(l);
  l(open.size);
  return () => listeners.delete(l);
}

export const inFlight = () => open.size;

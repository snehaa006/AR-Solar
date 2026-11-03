// Must be the first import in index.ts.
// Some Node-oriented libraries call process.emitWarning at load time; React Native has none.
const proc: any = (globalThis as any).process ?? ((globalThis as any).process = {});
if (typeof proc.emitWarning !== 'function') {
  proc.emitWarning = () => {};
}
export {};

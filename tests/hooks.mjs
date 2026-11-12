import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = new URL('./', import.meta.url);
export async function resolve(spec, ctx, next) {
  if (spec === 'expo-sqlite') return { url: new URL('fake-sqlite.mjs', here).href, shortCircuit: true };
  if (spec === 'expo-crypto') return { url: new URL('fake-crypto.mjs', here).href, shortCircuit: true };
  if ((spec.startsWith('./') || spec.startsWith('../')) && !spec.endsWith('.js') && !spec.endsWith('.mjs')) {
    const u = new URL(spec + '.js', ctx.parentURL);
    if (existsSync(fileURLToPath(u))) return { url: u.href, shortCircuit: true, format: 'module' };
  }
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.startsWith(new URL('../src/', import.meta.url).href)) return { ...(await next(url, { ...ctx, format: 'module' })), format: 'module' };
  return next(url, ctx);
}

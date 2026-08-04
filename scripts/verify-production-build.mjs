import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyProduction} from './verify-production.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const buildRoot = join(projectRoot, 'build');

function buildFixtureFetch(url) {
  const {pathname} = new URL(url);
  let relativePath;
  let contentType;
  if (pathname === '/robots.txt' || pathname === '/llms.txt') {
    relativePath = pathname.slice(1);
    contentType = 'text/plain; charset=utf-8';
  } else if (pathname === '/sitemap.xml') {
    relativePath = 'sitemap.xml';
    contentType = 'application/xml';
  } else if (pathname.endsWith('.md')) {
    relativePath = pathname.slice(1);
    contentType = 'text/markdown; charset=utf-8';
  } else if (pathname.startsWith('/guide/')) {
    relativePath = `${pathname.slice(1)}.html`;
    contentType = 'text/html; charset=utf-8';
  } else {
    return Promise.resolve(new Response('not found', {status: 404, headers: {'content-type': 'text/plain'}}));
  }
  try {
    return Promise.resolve(new Response(readFileSync(join(buildRoot, relativePath)), {status: 200, headers: {'content-type': contentType}}));
  } catch {
    return Promise.resolve(new Response('not found', {status: 404, headers: {'content-type': 'text/plain'}}));
  }
}

await verifyProduction({projectRoot, fetchImpl: buildFixtureFetch, retries: 1, delayMs: 0});
console.log('Production verifier build fixture passed: 34 HTML + 34 Markdown routes');

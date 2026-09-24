import { readFileSync, writeFileSync } from 'node:fs';

const buildReference = process.env.GITHUB_SHA?.slice(0, 7)
  || process.env.BUILD_ID
  || new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const cacheVersion = `build-${buildReference}`;

export default {
  base: './',
  plugins: [
    {
      name: 'copy-service-worker',
      closeBundle() {
        const source = readFileSync('service-worker.js', 'utf8');
        const serviceWorker = source.replace('__BUILD_CACHE_VERSION__', cacheVersion);
        writeFileSync('dist/service-worker.js', serviceWorker);
      },
    },
  ],
};

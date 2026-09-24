import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const buildReference = process.env.GITHUB_SHA?.slice(0, 7)
  || process.env.BUILD_ID
  || new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const cacheVersion = `v${buildReference}`;

export default {
  base: './',
  plugins: [
    {
      name: 'copy-service-worker',
      closeBundle() {
        copyFileSync('config.json', 'dist/config.json');
        copyFileSync('manifest.json', 'dist/manifest.json');

        const source = readFileSync('service-worker.js', 'utf8');
        const serviceWorker = source.replace('__BUILD_CACHE_VERSION__', cacheVersion);
        writeFileSync('dist/service-worker.js', serviceWorker);

        const index = readFileSync('dist/index.html', 'utf8');
        const indexWithRuntimeManifest = index.replace(
          /href="\.\/assets\/manifest-[^"]+\.json"/,
          'href="./manifest.json"'
        );
        writeFileSync('dist/index.html', indexWithRuntimeManifest);
      },
    },
  ],
};

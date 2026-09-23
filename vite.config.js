import { copyFileSync } from 'node:fs';

export default {
  base: './',
  plugins: [
    {
      name: 'copy-service-worker',
      closeBundle() {
        copyFileSync('service-worker.js', 'dist/service-worker.js');
      },
    },
  ],
};

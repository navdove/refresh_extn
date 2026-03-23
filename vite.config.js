import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'copy-extension-files',
      apply: 'build',
      writeBundle(options, bundle) {
        const dist = path.resolve(__dirname, 'dist');
        
        // Copy manifest.json
        fs.copyFileSync(
          path.resolve(__dirname, 'manifest.json'),
          path.join(dist, 'manifest.json')
        );
        
        // Copy background.js
        fs.copyFileSync(
          path.resolve(__dirname, 'background.js'),
          path.join(dist, 'background.js')
        );
        
        // Copy icons
        const iconsSrc = path.resolve(__dirname, 'icons');
        const iconsDst = path.join(dist, 'icons');
        fs.mkdirSync(iconsDst, { recursive: true });

        for (const icon of fs.readdirSync(iconsSrc)) {
          const srcPath = path.join(iconsSrc, icon);
          if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, path.join(iconsDst, icon));
          }
        }
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'popup.html'
      }
    },
    outDir: 'dist',
    emptyOutDir: false,
    copyPublicDir: false
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
});

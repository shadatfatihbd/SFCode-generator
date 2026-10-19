import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  // Dynamically resolve base path without hardcoding or inventing repository names:
  // 1. BASE_PATH environment variable (provided by actions/configure-pages in GitHub Actions)
  // 2. GITHUB_REPOSITORY environment variable (auto-provided in GitHub Actions runner as 'owner/repo')
  // 3. Fallback to '/' for local development and root-domain deployments
  const getBasePath = (): string => {
    if (process.env.BASE_PATH !== undefined && process.env.BASE_PATH !== '') {
      const p = process.env.BASE_PATH;
      return p.endsWith('/') ? p : `${p}/`;
    }
    if (process.env.GITHUB_REPOSITORY) {
      const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
      if (repo && repo.toLowerCase().endsWith('.github.io')) {
        return '/';
      }
      return repo ? `/${repo}/` : '/';
    }
    return '/';
  };

  const base = getBasePath();

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: base,
          name: 'SFCode Studio',
          short_name: 'SFCode',
          description: 'Production-grade QR code & barcode generator by SFCode - Shadat Fatih Code',
          theme_color: '#007AFF',
          background_color: '#F5F5F7',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB for client-side libraries
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

function getAppVersion(): string {
  let commitHash = '';
  try {
    commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    commitHash = '';
  }
  const timestamp = Date.now();
  return commitHash ? `${timestamp}-${commitHash}` : `${timestamp}`;
}

const appVersion = getAppVersion();

function versionPlugin(version: string): Plugin {
  return {
    name: 'vite-plugin-version-json',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version }, null, 2),
      });
    },
    closeBundle() {
      try {
        const outDir = resolve(process.cwd(), 'dist');
        mkdirSync(outDir, { recursive: true });
        writeFileSync(
          resolve(outDir, 'version.json'),
          JSON.stringify({ version }, null, 2),
          'utf-8'
        );
      } catch {
        // Ignora erro caso diretorio dist nao esteja acessivel
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    versionPlugin(appVersion),
  ],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

async function copyPublicFiles(sourceDirectory, outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
  const entries = await readdir(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(sourceDirectory, entry.name);
    const outputPath = join(outputDirectory, entry.name);
    if (entry.isDirectory()) {
      await copyPublicFiles(sourcePath, outputPath);
    } else if (entry.isFile() && extname(entry.name).toLowerCase() !== '.zip') {
      await copyFile(sourcePath, outputPath);
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-public-assets-without-archives',
      apply: 'build',
      closeBundle() {
        return copyPublicFiles(join(projectRoot, 'public'), join(projectRoot, 'dist'));
      },
    },
  ],
  build: {
    copyPublicDir: false,
  },
});

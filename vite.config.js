import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

async function copyPublicFiles(sourceDirectory, outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
  const entries = await readdir(sourceDirectory, { withFileTypes: true });
  const entryNames = new Set(entries.map((entry) => entry.name));

  for (const entry of entries) {
    const sourcePath = join(sourceDirectory, entry.name);
    const outputPath = join(outputDirectory, entry.name);
    if (entry.isDirectory()) {
      await copyPublicFiles(sourcePath, outputPath);
    } else if (entry.isFile() && extname(entry.name).toLowerCase() !== '.zip') {
      const bikeFrame = sourceDirectory === join(projectRoot, 'public', 'bikevid')
        && entry.name.match(/^ezgif-frame-(\d{3})\.png$/i);
      const activeBikeFrame = bikeFrame
        && Number(bikeFrame[1]) >= 76
        && Number(bikeFrame[1]) <= 205;
      if (activeBikeFrame) {
        const replacementName = `${entry.name.slice(0, -4)}.webp`;
        if (!entryNames.has(replacementName)) {
          throw new Error(`Missing optimized bike frame: ${join(sourceDirectory, replacementName)}`);
        }
        continue;
      }
      await copyFile(sourcePath, outputPath);
    }
  }
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, projectRoot, '');
  const adminApiTarget = environment.VITE_ADMIN_API_URL || 'http://127.0.0.1:3001';

  return {
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
    server: {
      proxy: {
        '/api': adminApiTarget,
        '/login': adminApiTarget,
        '/logout': adminApiTarget,
        '/callback': adminApiTarget,
      },
    },
  };
});

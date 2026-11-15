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
      try {
        await copyFile(sourcePath, outputPath);
      } catch (err) {
        if (err.code !== 'EBUSY') throw err;
      }
    }
  }
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, projectRoot, '');
  const adminApiTarget = environment.VITE_ADMIN_API_URL;

  return {
    plugins: [
      react(),
      {
        name: 'yamaha-admin-backend-middleware',
        async configureServer(server) {
          try {
            const { app, initializeMongoDatabase } = await import('./server/index.js');
            initializeMongoDatabase().catch((err) => console.warn('Database note:', err.message));
            server.middlewares.use((req, res, next) => {
              const url = req.url || '';
              if (url.startsWith('/api') || url.startsWith('/login') || url.startsWith('/logout') || url.startsWith('/callback')) {
                return app(req, res, next);
              }
              next();
            });
          } catch (err) {
            console.warn('Backend middleware could not be loaded into Vite:', err.message);
          }
        },
      },
      {
        name: 'copy-public-assets-without-archives',
        apply: 'build',
        closeBundle() {
          return copyPublicFiles(join(projectRoot, 'public'), join(projectRoot, 'dist'));
        },
      },
    ],
    build: {
      emptyOutDir: false,
      copyPublicDir: false,
    },
    ...(adminApiTarget ? {
      server: {
        proxy: {
          '/api': adminApiTarget,
          '/login': adminApiTarget,
          '/logout': adminApiTarget,
          '/callback': adminApiTarget,
        },
      },
    } : {}),
  };
});

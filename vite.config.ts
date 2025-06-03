import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    build: {
      target: 'node18',
      outDir: 'dist',
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        formats: ['es'],
        fileName: 'index'
      },
      rollupOptions: {
        external: [
          'telegraf',
          '@prisma/client',
          'dotenv',
          'axios',
          'prisma',
          '@prisma/client/runtime',
          '@prisma/client/runtime/library',
          '@prisma/client/runtime/index',
          '@prisma/client/runtime/library/index'
        ]
      }
    },
    plugins: [
      nodePolyfills({
        // Whether to polyfill `node:` protocol imports.
        protocolImports: true,
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    server: {
      watch: {
        usePolling: true,
      },
      hmr: false
    },
    optimizeDeps: {
      exclude: ['@prisma/client']
    },
    define: {
      // Инжектируем переменные окружения в код
      'process.env.BOT_TOKEN': JSON.stringify(env.BOT_TOKEN),
      'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
      'process.env.CALENDAR_API_URL': JSON.stringify(env.CALENDAR_API_URL)
    }
  };
}); 
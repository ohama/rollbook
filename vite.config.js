import { defineConfig } from 'vite';
import fable from 'vite-plugin-fable';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    fable({
      fsproj: './src/App.fsproj',
    }),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    open: true,
  },
});

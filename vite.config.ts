import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { version } from './package.json';

export default defineConfig({
  plugins: [react()],
  define: {
    '__APP_VERSION__': JSON.stringify(version) // also see vite-env.d.ts
  }
})

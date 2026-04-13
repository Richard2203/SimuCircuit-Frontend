// vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // Simula el DOM del browser (necesario para componentes React + SVG)
    environment: 'jsdom',

    // Archivo de setup que corre antes de cada test
    setupFiles: ['./src/tests/setup.js'],

    // Muestra nombres descriptivos en la terminal
    reporters: ['verbose'],

    // Cobertura de codigo (opcional, para el reporte)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/core/**',
        'src/components/Simulator/models/**',
        'src/components/Library/**',
        'src/hooks/**',
      ],
    },
  },
});

import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // esbuild(vitest 기본)는 emitDecoratorMetadata를 못 만든다 —
  // 타입 없는 @Column()이 붙은 엔티티는 import만 해도 ColumnTypeUndefinedError로 터진다
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
  },
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
});

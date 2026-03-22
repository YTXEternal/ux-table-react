import type { UserConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'
import terser from '@rollup/plugin-terser';
export const baseConfig: UserConfig = {
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  plugins: [
    UnoCSS(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    process.env.NODE_ENV === 'production' && terser({
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    }),
  ],
}

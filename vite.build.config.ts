import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/ux-table-react/example/', // 部署到 github pages 的子路径
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  plugins: [
    UnoCSS(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  build: {
    outDir: 'dist-example', // 指定输出目录，避免与库的打包目录 dist 冲突
    emptyOutDir: true
  }
})

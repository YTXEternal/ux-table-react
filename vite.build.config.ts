import { defineConfig, mergeConfig } from 'vite'
import { baseConfig } from './vite.base.config'

// https://vite.dev/config/
export default defineConfig(mergeConfig(baseConfig, {
  base: '/ux-table-react/example/', // 部署到 github pages 的子路径
  build: {
    outDir: 'dist-example', // 指定输出目录，避免与库的打包目录 dist 冲突
    emptyOutDir: true
  }
}))

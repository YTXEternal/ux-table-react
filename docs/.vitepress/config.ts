import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "UX Table React",
  description: "强大的 React 表格组件",
  base: '/ux-table-react/',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/' },
      { text: '组件', link: '/components/ux-table' }
    ],

    sidebar: [
      {
        text: '指南',
        items: [
          { text: '简介', link: '/guide/' },
          { text: '快速开始', link: '/guide/getting-started' },
        ]
      },
      {
        text: '组件',
        items: [
          { text: 'UxTable', link: '/components/ux-table' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-repo/ux-table-react' }
    ]
  },
  vite: {
    resolve: {
      alias: {
        '@': '../../src'
      }
    }
  }
})

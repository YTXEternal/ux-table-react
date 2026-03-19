import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "UX Table React",
  description: "A powerful React table component",
  base: '/ux-table-react/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Components', link: '/components/ux-table' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/' },
          { text: 'Getting Started', link: '/guide/getting-started' },
        ]
      },
      {
        text: 'Components',
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

import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'SystemVerilog 学习笔记',
  description: 'SystemVerilog 语言核心概念与验证特性',
  base: '/sv-notes/',
  appearance: 'dark',
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    languagePacks: [{ lang: 'system-verilog' }],
    languageAlias: {
      systemverilog: 'system-verilog',
      sv: 'system-verilog',
      SV: 'system-verilog'
    }
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '调度语义', link: '/schedule' },
      { text: '赋值语句', link: '/assignment' },
      { text: 'Clocking Block', link: '/clocking' }
    ],
    sidebar: [
      {
        text: '目录',
        items: [
          { text: '调度语义', link: '/schedule' },
          { text: '赋值语句', link: '/assignment' },
          { text: 'Clocking Block', link: '/clocking' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kpskp77/sv-notes' }
    ],
    footer: {
      message: 'MIT License',
      copyright: 'Copyright © 2024 Carousel'
    }
  },
})
import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { configureDiagramsPlugin } from 'vitepress-plugin-diagrams'
import { figure } from '@mdit/plugin-figure'
import { attrs } from '@mdit/plugin-attrs'
import { Transformer } from 'markmap-lib'

const title = '地块作业管理系统'
const description = '集成 CSDI 官方地理数据的地块/作业管理平台，包含 Web 管理端与移动端任务执行。'
const base = '/llms/'
const transformer = new Transformer()

function markdownItMarkmap(md: { renderer: { rules: Record<string, (...args: any[]) => string> }; utils: { escapeHtml: (input: string) => string } }) {
  const defaultFence = md.renderer.rules.fence

  md.renderer.rules.fence = (...args) => {
    const [tokens, idx, options, env, self] = args
    const token = tokens[idx]
    const info = (token.info || '').trim()
    if (info === 'markmap' || info === 'mindmap') {
      const { root } = transformer.transform(token.content)
      const data = md.utils.escapeHtml(JSON.stringify(root))
      return `<svg class=\"markmap-svg\" data-markmap='${data}'></svg>`
    }
    return defaultFence ? defaultFence(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
  }
}

export default withMermaid(
  defineConfig({
    title,
    description,
    base,

    head: [['link', { rel: 'icon', href: '/llms-favicon.svg' }]],

    markdown: {
      image: {
        lazyLoading: true
      },
      config: (md) => {
        configureDiagramsPlugin(md, {
          diagramsDir: 'docs/public/diagrams',
          publicPath: '/diagrams',
          krokiServerUrl: 'https://kroki.io',
          excludedDiagramTypes: ['mermaid']
        })

        md.use(figure)
        md.use(attrs)
        md.use(markdownItMarkmap)
      }
    },

    themeConfig: {
      logo: '/llms-logo.svg',
      nav: [
        { text: '首页', link: '/' },
        { text: '项目概览', link: '/项目概览/项目介绍' },
        { text: '需求分析', link: '/需求分析/需求总览' },
        { text: '技术方案', link: '/技术方案/总体架构' },
        { text: '接口文档', link: '/接口文档/接口总览与规范' },
        { text: '附录', link: '/附录/会议纪要' }
      ],
      sidebar: [
        {
          text: '文档架构',
          items: [{ text: '文档架构', link: '/文档架构' }]
        },
        {
          text: '项目概览',
          items: [
            { text: '项目介绍', link: '/项目概览/项目介绍' },
            { text: '目标与范围', link: '/项目概览/目标与范围' },
            { text: '角色与权限', link: '/项目概览/角色与权限' }
          ]
        },
        {
          text: '需求分析',
          items: [
            { text: '需求总览', link: '/需求分析/需求总览' },
            { text: '用户故事与验收', link: '/需求分析/用户故事与验收' },
            { text: '非功能与约束', link: '/需求分析/非功能与约束' }
          ]
        },
        {
          text: '技术方案',
          items: [
            { text: '总体架构', link: '/技术方案/总体架构' },
            { text: '数据与GIS', link: '/技术方案/数据与GIS' },
            { text: 'Web端设计', link: '/技术方案/Web端设计' },
            { text: 'Mobile端设计', link: '/技术方案/Mobile端设计' }
          ]
        },
        {
          text: '接口文档',
          items: [
            { text: '接口总览与规范', link: '/接口文档/接口总览与规范' },
            {
              text: 'API文档',
              items: [
                { text: 'API 文档总览', link: '/接口文档/API文档/' },
                { text: '地图与图层接口', link: '/接口文档/API文档/地图与图层接口' },
                { text: 'Work Lot 接口', link: '/接口文档/API文档/work-lot-接口' },
                { text: '任务接口', link: '/接口文档/API文档/任务接口' },
                { text: '报表与查询接口', link: '/接口文档/API文档/报表与查询接口' },
                { text: '用户与权限接口', link: '/接口文档/API文档/用户与权限接口' },
                { text: '移动端接口', link: '/接口文档/API文档/移动端接口' }
              ]
            }
          ]
        },
        {
          text: '附录',
          items: [
            {
              text: '会议纪要',
              items: [
                { text: '会议清单', link: '/附录/会议纪要' },
                { text: 'Kick-off', link: '/附录/会议纪要/kick-off' }
              ]
            },
            { text: '合同摘要', link: '/附录/合同摘要' },
            { text: '术语表', link: '/附录/术语表' }
          ]
        }
      ]
    }
  })
)

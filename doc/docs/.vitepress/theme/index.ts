import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import mediumZoom from 'medium-zoom'
import { nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'

let zoom: ReturnType<typeof mediumZoom> | null = null

function initZoom() {
  zoom?.detach()
  zoom = mediumZoom('.vp-doc img', { background: 'var(--vp-c-bg)' })
}

async function renderMarkmap() {
  const { Markmap } = await import('markmap-view')
  const nodes = document.querySelectorAll<SVGSVGElement>('svg.markmap-svg[data-markmap]')
  nodes.forEach((el) => {
    if (el.dataset.rendered === 'true') return
    const raw = el.dataset.markmap
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      Markmap.create(el, null, data)
      el.dataset.rendered = 'true'
    } catch {
      // Ignore invalid markmap blocks
    }
  })
}

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    enhanceAppWithTabs(app)
  },
  setup() {
    const route = useRoute()
    const enhance = () => {
      initZoom()
      void renderMarkmap()
    }

    onMounted(() => enhance())
    watch(
      () => route.path,
      () => nextTick(() => enhance())
    )
  }
} satisfies Theme

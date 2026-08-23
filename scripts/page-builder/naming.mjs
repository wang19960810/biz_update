import path from 'node:path'

// 将 Windows 路径统一转换为可保存到数据库的斜杠路径。
export const toPosix = value => value.split(path.sep).join('/')

// 生成 4 位随机数，用于外层目录去重。
export const createFolderSuffix = () => String(Math.floor(Math.random() * 10000)).padStart(4, '0')

// 将菜单编码转换为安全的短横线命名。
export const sanitizeCode = (value, fallback = 'page') => {
  const text = String(value ?? '').trim().toLowerCase()
  const normalized = text
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized || fallback
}

// 将编码转换为适合生成 ID 的下划线命名。
export const sanitizeId = value => sanitizeCode(value).replace(/-/g, '_')

// 将文本转换为英文文件名所需的 snake_case 格式。
export const normalizeFileStem = (value, fallback = 'index') => {
  const text = String(value ?? '').trim()
  const normalized = text
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

  return normalized || fallback
}

const translateEndpoint = String(
  process.env.LIBRETRANSLATE_URL || process.env.LIBRETRANSLATE_ENDPOINT || ''
).trim()
const translateCache = new Map()

// 调用 LibreTranslate 将中文名称翻译为英文。
export const translateToEnglish = async value => {
  const text = String(value ?? '').trim()

  if (!text) {
    return ''
  }

  if (/^[\x00-\x7F]+$/.test(text)) {
    return text
  }

  if (!translateEndpoint) {
    return ''
  }

  if (translateCache.has(text)) {
    return translateCache.get(text)
  }

  try {
    const response = await fetch(`${translateEndpoint.replace(/\/$/, '')}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        q: text,
        source: 'auto',
        target: 'en',
        format: 'text'
      })
    })

    if (!response.ok) {
      throw new Error(`translate failed: ${response.status}`)
    }

    const payload = await response.json()
    const translated = String(payload?.translatedText ?? '').trim()

    if (translated) {
      translateCache.set(text, translated)
      return translated
    }
  } catch {
    // 翻译服务不可用时回退到本地命名规则。
  }

  return ''
}

// 翻译并生成最终的英文文件名。
export const buildFileStem = async (value, fallback = 'index') => {
  const translated = await translateToEnglish(value)
  return normalizeFileStem(translated || value, fallback)
}

// 解析本地可复制代码的内层菜单目录名。
export const resolveMenuFolderName = value => sanitizeCode(value, 'menu')

// 解析外层页面目录名，使用文件名加 4 位随机数避免冲突。
export const resolvePageFolderName = value => {
  return `${resolveMenuFolderName(value)}-${createFolderSuffix()}`
}

// 生成当前时间的 ISO 字符串。
export const nowIso = () => new Date().toISOString()

// 将文本转义为 HTML 安全字符串。
export const escapeHtml = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

// 根据菜单名称生成表单或自定义组件的文件名。
export const resolveEntityStem = async node => {
  // 子实体优先使用表单中的文件名称，确保本地记录和可复制代码路径一致。
  return buildFileStem(node?.fileName || node?.comment || node?.code || 'index', node?.code || 'index')
}

// 根据实体数量决定生成 index.vue 还是具名 vue 文件。
export const buildEntityFileName = (stem, multiple) => {
  return multiple ? `${stem}.vue` : 'index.vue'
}

// 生成本地渲染描述文件的路径。
export const buildEntityRenderPath = (page, kind, stem, multiple) => {
  return toPosix(path.join(page.viewRootPath, kind, multiple ? stem : 'index', 'render.json'))
}

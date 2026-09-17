import { readdir, readFile, stat } from 'node:fs/promises'
import { join, sep } from 'node:path'

const TEXT_FILE = /\.(lua|json|md|txt|tsv)$/i
const BINARY_FILE = /\.(xic|png|jpe?g|webp)$/i

export const TEMPLATE_GET_NOTE = '以上是文本源码和素材清单（不含二进制内容）。可运行副本必须用 copy_xtapp_store_template，不要根据本结果手写漏掉的图片或 XIC。'

function posixRelative(prefix, name) {
  return [prefix, name].filter(Boolean).join('/').split(sep).join('/')
}

export async function readStoreTemplate(dir) {
  const files = {}
  const assets = []
  const walk = async (current, prefix = '') => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue
      const relative = posixRelative(prefix, entry.name)
      const absolute = join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(absolute, relative)
        continue
      }
      const info = await stat(absolute)
      if (BINARY_FILE.test(entry.name) || relative.startsWith('assets/') || relative.startsWith('raw/')) {
        assets.push({ path: relative, bytes: info.size })
        continue
      }
      if (TEXT_FILE.test(entry.name)) files[relative] = await readFile(absolute, 'utf8')
    }
  }
  await walk(dir)
  assets.sort((a, b) => a.path.localeCompare(b.path))
  return { dir, files, assets }
}

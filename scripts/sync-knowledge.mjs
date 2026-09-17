import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const contractDir = process.env.XTAPP_CONTRACT_DIR ? resolve(process.env.XTAPP_CONTRACT_DIR) : null
const publicKnowledgeDir = process.env.XTAPP_PUBLIC_KNOWLEDGE_DIR ? resolve(process.env.XTAPP_PUBLIC_KNOWLEDGE_DIR) : null
const sources = [
  ...(contractDir ? [
    join(contractDir, 'SPEC.md'), join(contractDir, 'README.md'), join(contractDir, 'api', 'runtime.md'),
    join(contractDir, 'api', 'input.md'), join(contractDir, 'api', 'graphics.md'), join(contractDir, 'api', 'ui-components.md'),
    join(contractDir, 'api', 'manifest.md'),
  ] : []),
  ...(publicKnowledgeDir ? [publicKnowledgeDir] : []),
]
const studioPreviewKnowledge = join(root, 'knowledge', 'studio-preview.md')
const files = []

async function visit(path) {
  if (!existsSync(path)) return
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name)
    if (entry.isDirectory()) await visit(child)
    else if (/\.(md|jsonc?|lua)$/i.test(entry.name)) files.push(child)
  }
}

for (const source of sources) {
  if (publicKnowledgeDir && source === publicKnowledgeDir) await visit(source)
  else if (existsSync(source)) files.push(source)
}

function topicFor(source, content) {
  const value = source.toLowerCase()
  if (value.includes('/input')) return 'input'
  if (value.includes('/graphics')) return 'graphics'
  if (value.includes('/runtime')) return 'runtime'
  if (value.includes('/manifest')) return 'manifest'
  if (value.includes('ui-components')) return 'ui'
  if (value.includes('studio-preview')) return 'studio-preview'
  if (value.includes('/assets')) return 'assets'
  if (value.includes('/network')) return 'network'
  if (/on_input|ctx\.input|semantic key/i.test(content)) return 'input'
  if (/g:(?:clear|line|rect|circle|text|image|layer)/i.test(content)) return 'graphics'
  return 'overview'
}

function apiFor(content, topic) {
  const patterns = {
    input: /\b(on_input|ctx\.input(?:\.caps)?|normalizeXtappInput)\b/i,
    graphics: /\b(g:(?:clear|line|rect|circle|text|image|layer|size))\b/i,
    runtime: /\b(ctx\.(?:state|screen|sys|longtask|perf)|on_(?:load|enter|tick|draw|leave|unload))\b/i,
    manifest: /\b(manifest(?:\.json)?|app_id|display\.orientation)\b/i,
    network: /\b(ctx\.net:(?:get|post|poll|cancel))\b/i,
    'studio-preview': /\b(?:run_xtapp_preview|preview bridge|Lua Worker|SSE)\b/i,
  }
  return patterns[topic]?.exec(content)?.[1] || null
}

function versionFor(content, source) {
  const match = content.match(/(?:契约版本|contract version|API version|apiVersion|version)\D{0,20}(\d+\.\d+)/i)
  if (match) return match[1]
  if (source.startsWith('contract/')) return '1.0'
  if (source.startsWith('studio/')) return '0.1'
  return '0.8'
}

function publicPath(path, contractDir, publicKnowledgeDir) {
  if (contractDir && (path === contractDir || path.startsWith(`${contractDir}/`))) return `contract/${path.slice(contractDir.length + 1)}`
  if (publicKnowledgeDir && (path === publicKnowledgeDir || path.startsWith(`${publicKnowledgeDir}/`))) return path.slice(publicKnowledgeDir.length + 1)
  return path.split(/[/\\]/).slice(-2).join('/')
}

function exampleFor(content) {
  const match = content.match(/```(?:lua|json|javascript|js)?\s*\n([\s\S]*?)```/i)
  return match?.[1]?.trim().slice(0, 2400) || null
}

const entries = []
for (const path of files.sort()) {
  const content = await readFile(path, 'utf8')
  const sourcePath = publicPath(path, contractDir, publicKnowledgeDir)
  const source = sourcePath.startsWith('contract/') ? 'public-contract' : 'xtapp-studio'
  const topic = topicFor(sourcePath, content)
  entries.push({ topic, api: apiFor(content, topic), version: versionFor(content, sourcePath), source, sourcePath, content, example: exampleFor(content) })
}
if (existsSync(studioPreviewKnowledge)) {
  const content = await readFile(studioPreviewKnowledge, 'utf8')
  entries.push({ topic: 'studio-preview', api: apiFor(content, 'studio-preview'), version: '0.1', source: 'xtapp-studio', sourcePath: 'studio/preview.md', content, example: exampleFor(content) })
}

const hash = createHash('sha256').update(entries.map((entry) => `${entry.source}\0${entry.sourcePath}\0${entry.content}`).join('\0')).digest('hex')
await mkdir(join(root, 'knowledge'), { recursive: true })
const outputPath = join(root, 'knowledge', 'index.json')
let generatedAt = new Date().toISOString()
if (existsSync(outputPath)) {
  try {
    const previous = JSON.parse(await readFile(outputPath, 'utf8'))
    if (previous.sourceHash === hash && typeof previous.generatedAt === 'string') generatedAt = previous.generatedAt
  } catch { /* rebuild malformed or legacy indexes */ }
}
await writeFile(outputPath, JSON.stringify({ schemaVersion: 2, generatedAt, sourceHash: hash, entries }, null, 2) + '\n')
console.log(`Generated ${entries.length} public knowledge entries (${hash.slice(0, 12)}).`)

import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

const SESSION_ID = /^[A-Za-z0-9:_-]{8,160}$/

export function defaultPreviewSessionPath() {
  const override = String(process.env.XTAPP_PREVIEW_SESSION_FILE || '').trim()
  return override || join(homedir(), '.xtapp', 'codex-preview-session')
}

export async function loadOrCreatePreviewSession(filePath = defaultPreviewSessionPath()) {
  try {
    const existing = (await readFile(filePath, 'utf8')).trim()
    if (SESSION_ID.test(existing)) return existing
  } catch { /* missing or unreadable file starts a new stable session */ }
  const sessionId = randomUUID()
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, `${sessionId}\n`, 'utf8')
  return sessionId
}

export function previewRunPath(status) {
  return status === 'stopped' || status === 'error' ? '/preview/restart' : '/preview/run'
}

import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { loadOrCreatePreviewSession, previewRunPath } from './previewSession.mjs'

test('预览 session 落盘后跨进程复用同一 id', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'xtapp-preview-session-'))
  const file = join(dir, 'session')
  const first = await loadOrCreatePreviewSession(file)
  const second = await loadOrCreatePreviewSession(file)
  assert.match(first, /^[0-9a-f-]{36}$/i)
  assert.equal(second, first)
  assert.equal((await readFile(file, 'utf8')).trim(), first)
})

test('损坏的 session 文件会换成新的合法 id', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'xtapp-preview-session-'))
  const file = join(dir, 'session')
  await writeFile(file, '??\n', 'utf8')
  const next = await loadOrCreatePreviewSession(file)
  assert.match(next, /^[A-Za-z0-9:_-]{8,160}$/)
  assert.notEqual(next, '??')
})

test('已停止或出错时 run 改走 restart', () => {
  assert.equal(previewRunPath('stopped'), '/preview/restart')
  assert.equal(previewRunPath('error'), '/preview/restart')
  assert.equal(previewRunPath('running'), '/preview/run')
  assert.equal(previewRunPath('ready'), '/preview/run')
  assert.equal(previewRunPath('not_connected'), '/preview/run')
})

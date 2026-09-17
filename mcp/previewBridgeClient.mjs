export const PREVIEW_SOURCE_WAIT_MS = 120_000
export const PREVIEW_DEFAULT_WAIT_MS = 4_000

export function unwrapPreviewEnvelope(body) {
  if (body && body.ok === false) {
    const error = new Error(body.error?.message || '预览桥请求失败')
    error.code = body.error?.code
    error.details = body.error?.details
    error.status = body.error?.status
    throw error
  }
  if (body && body.ok === true && body.data && typeof body.data === 'object') return body.data
  throw new Error('预览桥响应无效')
}

export function classifyPreviewBridgeError(error, origin = '') {
  if (error?.cause?.code === 'ECONNREFUSED' || error?.code === 'ECONNREFUSED' || error?.cause?.code === 'ECONNRESET') {
    return { status: 'not_connected', message: `无法连接 Studio 预览桥：${origin}` }
  }
  if (error?.name === 'AbortError') {
    return {
      status: 'timeout',
      code: 'PREVIEW_TIMEOUT',
      message: `Studio 响应超时：${origin}`,
    }
  }
  throw error
}

export function formatDroppedAssets(dropped = []) {
  if (!Array.isArray(dropped) || !dropped.length) return ''
  return `未接受：${dropped.map((item) => `${item.path || item.key || 'unknown'}（${item.reason || 'unknown'}）`).join('；')}`
}

export function describeSourceSync(result = {}) {
  const dropped = formatDroppedAssets(result.dropped)
  if (result.status === 'not_connected') {
    return [result.message, dropped].filter(Boolean).join('\n')
  }
  if (result.status === 'timeout') {
    return [result.message || 'Studio 预览桥响应超时，源码还没送完。请确认预览页仍开着同一条链接，然后重试。', dropped].filter(Boolean).join('\n')
  }
  if (result.status === 'unchanged') {
    return [`源码未变化，revision ${result.revision || ''} 已在预览桥上。`, dropped].filter(Boolean).join('\n')
  }
  const accepted = `已同步 revision ${result.revision || ''}，接受 ${result.fileCount ?? result.accepted?.files?.length ?? 0} 个文件、${result.assetCount ?? result.accepted?.assets?.length ?? 0} 个素材。`
  return [accepted, dropped].filter(Boolean).join('\n')
}

export function isFailedCommand(result = {}) {
  return result.ok === false || result.status === 'error' || result.outcome?.status === 'error'
}

export function isRevisionConflict(error) {
  return error?.code === 'REVISION_CONFLICT'
}

export function previewRequestTimeoutMs(path) {
  return path === '/preview/source' || path === '/preview/source/patch' || path === '/preview/source/validate'
    ? PREVIEW_SOURCE_WAIT_MS
    : PREVIEW_DEFAULT_WAIT_MS
}

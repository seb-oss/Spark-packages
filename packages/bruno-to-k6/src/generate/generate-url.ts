import type { BrunoRequest } from '@usebruno/lang'

export const generateUrl = (req: BrunoRequest): string => {
  const encode = req.settings?.encodeUrl !== false
  const enc = (s: string) => (encode ? encodeURIComponent(s) : s)

  let url = req.http?.url ?? ''
  const params = req.params ?? []

  // Replace enabled path params :name → value
  for (const p of params) {
    if (p?.type !== 'path' || p.enabled === false || !p.name) continue
    const val = p.value ?? ''
    const re = new RegExp(`:${p.name}\\b`, 'g')
    url = url.replace(re, enc(String(val)))
  }

  // Collect enabled query params
  const q = params
    .filter((p) => p?.type === 'query' && p.enabled !== false && p.name)
    .map((p) => `${enc(p.name!)}=${enc(String(p.value ?? ''))}`)

  if (q.length) {
    url += (url.includes('?') ? '&' : '?') + q.join('&')
  }

  return url
}

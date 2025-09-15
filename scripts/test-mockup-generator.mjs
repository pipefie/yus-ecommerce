#!/usr/bin/env node
import 'dotenv/config'

const BASE = 'https://api.printful.com'
const TOKEN = process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_TOKEN
const STORE = process.env.PRINTFUL_STORE_ID

if (!TOKEN) {
  console.error('Missing PRINTFUL_API_KEY')
  process.exit(1)
}

async function call(path, opts={}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(STORE ? { 'X-PF-Store-Id': String(STORE) } : {}),
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = text }
  if (!res.ok) throw new Error(`${path} ${res.status} ${text}`)
  return json
}

async function main() {
  const syncVariantId = Number(process.argv[2])
  if (!syncVariantId) {
    console.error('Usage: test-mockup-generator <syncVariantId>')
    process.exit(1)
  }
  const detail = await call(`/sync/variant/${syncVariantId}`)
  const v = detail.result?.sync_variant
  const catalogId = v?.variant_id
  const files = (detail.result?.sync_variant?.files || [])
  const byType = Object.fromEntries(files.map(f => [String(f.type), f]))
  const frontId = byType.default?.id || byType.front?.id
  const backId  = byType.back?.id
  console.log('catalogId', catalogId, 'frontId', frontId, 'backId', backId)
  const payload = {
    variant_ids: [catalogId],
    format: 'png',
    files: []
  }
  if (frontId) payload.files.push({ placement: 'front', image_url: `${BASE}/files/${frontId}` })
  if (backId)  payload.files.push({ placement: 'back',  image_url: `${BASE}/files/${backId}` })
  const create = await call('/mockup-generator/create-task', { method:'POST', body: JSON.stringify(payload) })
  const key = create.result?.task_key
  console.log('task', key)
  for (let i=0;i<20;i++) {
    const status = await call(`/mockup-generator/task?task_key=${key}`)
    const s = status.result?.status
    console.log('status', s)
    if (s === 'completed') {
      console.log(JSON.stringify(status, null, 2))
      return
    }
    if (s === 'failed') throw new Error('failed')
    await new Promise(r => setTimeout(r, 1500))
  }
  throw new Error('timeout')
}

main().catch(err => { console.error(err); process.exit(1) })

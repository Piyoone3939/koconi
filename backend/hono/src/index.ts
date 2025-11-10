import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'

// 🧠 一時保存（メモリ上だけで動作確認用）
const memories: any[] = []

const app = new Hono()

// ✅ Unityなど外部アクセスを許可
app.use('*', cors())

app.get('/', (c) => c.text('Hello from Hono!'))

// ✅ 動作確認
app.get('/health', (c) => c.json({ status: 'ok' }))

// ✅ POST /memory：メモリ登録
app.post('/memory', async (c) => {
  const body = await c.req.json()
  memories.push({
    id: memories.length + 1,
    ...body,
    createdAt: new Date().toISOString(),
  })
  console.log('📥 Received memory:', body)
  return c.json({ ok: true })
})

// ✅ GET /memory：メモリ一覧取得
app.get('/memory', (c) => {
  console.log('📤 Returning memories:', memories)
  return c.json(memories)
})

// ✅ サーバ起動
serve({
  fetch: app.fetch,
  port: 3000,
})
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import prisma from './db'

const app = new Hono()

// ✅ Unityなど外部アクセスを許可
app.use('*', cors())

app.get('/', (c) => c.text('Hello world! My name is Piyoone.'))

// ✅ 動作確認
app.get('/health', (c) => c.json({ status: 'ok' }))

// ✅ POST /memory：メモリ登録
app.post('/memory', async (c) => {
  try {
    const body = await c.req.json()
    const memory = await prisma.memory.create({
      data: {
        title: body.title,
        description: body.description,
      },
    })
    console.log('📥 Received memory:', memory)
    return c.json({ ok: true, memory })
  } catch (e) {
    console.error(e)
    return c.json({ ok: false, error: 'Failed to create memory' }, 500)
  }
})

// ✅ GET /memory：メモリ一覧取得
app.get('/memory', async (c) => {
  try {
    const memories = await prisma.memory.findMany({
      orderBy: { createdAt: 'desc' },
    })
    console.log('📤 Returning memories:', memories)
    return c.json(memories)
  } catch (e) {
    console.error(e)
    return c.json({ ok: false, error: 'Failed to fetch memories' }, 500)
  }
})

// ✅ サーバ起動
serve({
  fetch: app.fetch,
  port: 3000,
})
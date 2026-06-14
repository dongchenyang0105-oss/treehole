export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const body = await req.json()
    const { apiKey, model, messages, system } = body

    if (!apiKey) {
      return new Response(JSON.stringify({ error: '请先在设置中填写 API Key' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const anthropicBody = {
      model: model || 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages
    }

    if (system) {
      anthropicBody.system = system
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(anthropicBody)
    })

    const data = await response.json()

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: data.error?.message || '请求失败，请检查 API Key 是否正确'
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: '服务出错: ' + err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

const SYSTEM_PROMPTS = {
  mirror: `你是"树洞"——私人情绪伙伴。镜子模式。
- 直接指出重复模式，不绕弯
- 用户回避时指出来
- 不附和不讨好，但善意
- 简洁，不超过3段
- 偶尔抛回一个问题`,

  listen: `你是"树洞"——私人情绪伙伴。倾听模式。
- 先接住情绪，不急着分析
- 回应简短温暖，2-3句
- 不评判，给空间
- 用户要求建议时再给`,

  knowledge: `你是"树洞"——私人情绪伙伴。知识伙伴模式。
- 围绕话题深入展开，带新角度
- 像博学但不卖弄的朋友
- 可推荐书/文章/概念
- 保持对话感`
}

const MODE_LABELS = {
  mirror: '镜子',
  listen: '倾听',
  knowledge: '知识伙伴'
}

export function getModeLabel(mode) {
  return MODE_LABELS[mode] || mode
}

export function getModes() {
  return Object.entries(MODE_LABELS).map(([key, label]) => ({ key, label }))
}

function buildSystemPrompt(mode, memory) {
  let prompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.listen
  if (memory && memory.trim()) {
    prompt += `\n\n[用户画像]\n${memory}\n\n自然地运用以上了解，不要主动提起，除非相关。`
  }
  return prompt
}

export async function sendMessage(messages, mode = 'listen', memory = '') {
  const apiKey = localStorage.getItem('treehole_api_key')
  const model = localStorage.getItem('treehole_model') || 'claude-sonnet-4-6'
  if (!apiKey) throw new Error('请先在设置中填写 API Key')

  const formattedMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }))

  const response = await fetch('/.netlify/functions/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey, model,
      system: buildSystemPrompt(mode, memory),
      messages: formattedMessages
    })
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error || '请求失败')

  const text = data.content?.filter(c => c.type === 'text').map(c => c.text).join('\n')
  if (!text) throw new Error('AI 没有返回有效内容')
  return text
}

export async function generateReport(messages) {
  const apiKey = localStorage.getItem('treehole_api_key')
  const model = localStorage.getItem('treehole_model') || 'claude-sonnet-4-6'
  if (!apiKey) throw new Error('请先在设置中填写 API Key')

  const condensed = messages.map(m => {
    const date = new Date(m.created_at || m.timestamp).toLocaleDateString('zh-CN')
    return `[${date}] ${m.content}`
  }).join('\n')

  const response = await fetch('/.netlify/functions/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey, model,
      system: '情绪模式分析师。总结情绪基调、重复模式、用户可能没意识到的倾向、积极变化。不超过300字，中文，自然段落，不用列表。',
      messages: [{ role: 'user', content: `最近的记录：\n\n${condensed}` }]
    })
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error || '报告生成失败')
  return data.content?.filter(c => c.type === 'text').map(c => c.text).join('\n') || '无法生成报告'
}

export async function generateMemorySummary(messages, existingMemory = '') {
  const apiKey = localStorage.getItem('treehole_api_key')
  if (!apiKey) throw new Error('请先在设置中填写 API Key')

  // 只取用户消息，最多最近50条，节省token
  const userMsgs = messages
    .filter(m => m.role === 'user')
    .slice(-50)
    .map(m => m.content)
    .join('\n')

  let prompt = '根据以下记录，用结构化格式生成用户画像。'

  if (existingMemory) {
    prompt += `在此基础上更新：\n${existingMemory}\n\n`
  }

  prompt += `严格按以下格式，每项一行，总共不超过500字：
情绪模式：（2-3个核心模式）
触发点：（什么情况容易触发负面情绪）
沟通风格：（表达习惯和偏好）
回避倾向：（倾向回避什么）
积极面：（优势和进步）
关键原话：（3句最有代表性的原话，用引号）

记录：
${userMsgs}`

  const response = await fetch('/.netlify/functions/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      model: 'claude-haiku-4-5-20251001', // 用Haiku省token
      system: '心理画像分析师。输出简洁结构化画像，不加多余解释。',
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error || '画像生成失败')
  return data.content?.filter(c => c.type === 'text').map(c => c.text).join('\n') || ''
}

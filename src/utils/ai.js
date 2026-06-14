const SYSTEM_PROMPTS = {
  mirror: `你是"树洞"——一个私人情绪伙伴。当前模式：镜子模式。

你的角色：
- 直接指出用户话语中重复出现的模式，不绕弯子
- 如果用户在回避某个问题，指出来
- 不附和、不讨好，但始终善意
- 说话简洁，不超过3段
- 偶尔抛回一个小问题，让用户自己决定要不要往那个方向想
- 绝不说教，只是诚实地说你看到的`,

  listen: `你是"树洞"——一个私人情绪伙伴。当前模式：倾听模式。

你的角色：
- 先接住情绪，不急着分析或建议
- 让用户把话说完
- 回应要简短温暖，不超过2-3句
- 不要问太多问题，给空间
- 绝不评判内容，无论用户说什么
- 如果用户主动要求建议，再给`,

  knowledge: `你是"树洞"——一个私人情绪伙伴。当前模式：知识伙伴。

你的角色：
- 围绕用户提到的话题深入展开
- 带入新角度、延伸知识、有趣的关联
- 语气像一个博学但不卖弄的朋友
- 可以主动推荐相关的书/文章/概念
- 保持对话感，不要变成百科全书`
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

export async function sendMessage(messages, mode = 'listen') {
  const apiKey = localStorage.getItem('treehole_api_key')
  const model = localStorage.getItem('treehole_model') || 'claude-sonnet-4-6'

  if (!apiKey) {
    throw new Error('请先在设置中填写 API Key')
  }

  const formattedMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }))

  const response = await fetch('/.netlify/functions/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      model,
      system: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.listen,
      messages: formattedMessages
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || '请求失败')
  }

  const text = data.content
    ?.filter(c => c.type === 'text')
    .map(c => c.text)
    .join('\n')

  if (!text) {
    throw new Error('AI 没有返回有效内容')
  }

  return text
}

export async function generateReport(messages) {
  const apiKey = localStorage.getItem('treehole_api_key')
  const model = localStorage.getItem('treehole_model') || 'claude-sonnet-4-6'

  if (!apiKey) {
    throw new Error('请先在设置中填写 API Key')
  }

  const condensed = messages
    .filter(m => m.role === 'user')
    .map(m => {
      const date = new Date(m.timestamp).toLocaleDateString('zh-CN')
      return `[${date}] ${m.content}`
    })
    .join('\n')

  const response = await fetch('/.netlify/functions/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      model,
      system: `你是一个情绪模式分析师。用户会给你一段时间内的情绪日记/想法记录。
你需要：
1. 总结这段时间的主要情绪基调（2-3句话）
2. 指出重复出现的模式或主题（如果有的话）
3. 给出一个温和但诚实的观察——用户可能没有意识到的倾向
4. 如果发现积极的变化，指出来

保持简洁，总共不超过300字。用中文回答。不要用列表格式，用自然的段落。`,
      messages: [{ role: 'user', content: `以下是我最近的记录：\n\n${condensed}` }]
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || '报告生成失败')
  }

  return data.content
    ?.filter(c => c.type === 'text')
    .map(c => c.text)
    .join('\n') || '无法生成报告'
}

import { supabase } from './supabase'

export async function saveMessage(role, content, mode = 'listen') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('messages')
    .insert({ user_id: user.id, role, content, mode })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMessages(limit = 100) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getRecentMessages(limit = 20) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []).reverse()
}

export async function getMessagesByDateRange(startDate, endDate) {
  const start = new Date(startDate).toISOString()
  const end = new Date(endDate).toISOString()

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getMessageCount() {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count || 0
}

export async function getUserMessageCount() {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'user')

  if (error) throw error
  return count || 0
}

export async function clearAllData() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('messages').delete().eq('user_id', user.id)
  await supabase.from('reports').delete().eq('user_id', user.id)
}

export async function saveReport(content, rangeLabel, messageCount) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: user.id,
      content,
      range_label: rangeLabel,
      message_count: messageCount
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data || []
}

export async function deleteReport(id) {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function exportData() {
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })

  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  return {
    messages: messages || [],
    reports: reports || [],
    exportedAt: new Date().toISOString()
  }
}

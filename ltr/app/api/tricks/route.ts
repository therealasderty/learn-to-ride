import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function getThumbnail(url: string): Promise<string | null> {
  try {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) {
      return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      const res = await fetch(`https://vimeo.com/api/v2/video/${vimeoMatch[1]}.json`)
      const data = await res.json()
      return data[0]?.thumbnail_large || null
    }
  } catch {}
  return null
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, url, external_url, tags, notes } = body

  const thumbnail_url = external_url ? await getThumbnail(external_url) : null

  const { data, error } = await supabaseAdmin
    .from('tricks')
    .insert({ title, url: url || null, external_url: external_url || null, thumbnail_url, tags, notes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, title, notes, tags } = body

  const { data, error } = await supabaseAdmin
    .from('tricks')
    .update({ title, notes, tags })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
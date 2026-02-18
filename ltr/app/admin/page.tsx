'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, type Trick } from '@/lib/supabase'
import Link from 'next/link'

const PRESET_TAGS = [
  'FS3','FS5','FS7','FS9',
  'BS3','BS5','BS7','BS9',
  'Cab3','Cab5','Cab7',
  'Indy','Mute','Stalefish','Melon','Tail','Nose','Tindy',
  'Kicker','Rail','Box','Pipe','Natural',
  'Cork','Rodeo','Misty','Bio',
]

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState(false)
  const [tricks, setTricks] = useState<Trick[]>([])
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Upload form
  const [mode, setMode] = useState<'upload' | 'external'>('upload')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [externalUrl, setExternalUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editCustomTag, setEditCustomTag] = useState('')

  const handleLogin = async () => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ password }),
      headers: { 'Content-Type': 'application/json' }
    })
    if (res.ok) { setAuthed(true); fetchTricks() }
    else setPwError(true)
  }

  const fetchTricks = async () => {
    const { data } = await supabase.from('tricks').select('*').order('created_at', { ascending: false })
    if (data) setTricks(data)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const addCustomTag = () => {
    const t = customTag.trim().toUpperCase()
    if (t && !selectedTags.includes(t)) setSelectedTags(prev => [...prev, t])
    setCustomTag('')
  }

  const handleUpload = async () => {
    if (!title.trim()) { setError('Il titolo è obbligatorio'); return }
    if (mode === 'upload' && !file) { setError('Seleziona un file'); return }
    if (mode === 'external' && !externalUrl.trim()) { setError('Inserisci un URL'); return }

    setUploading(true); setError('')

    try {
      let fileUrl: string | null = null

      if (mode === 'upload' && file) {
        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage.from('tricks').upload(fileName, file, { contentType: file.type })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('tricks').getPublicUrl(fileName)
        fileUrl = publicUrl
      }

      const res = await fetch('/api/tricks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          url: fileUrl,
          external_url: mode === 'external' ? externalUrl.trim() : null,
          tags: selectedTags,
          notes: notes.trim() || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())

      setTitle(''); setNotes(''); setSelectedTags([]); setFile(null); setPreview(null); setExternalUrl('')
      if (fileRef.current) fileRef.current.value = ''
      setSuccess('AGGIUNTO'); setTimeout(() => setSuccess(''), 3000)
      fetchTricks()
    } catch (err: any) {
      setError(err.message || 'Errore')
    }

    setUploading(false)
  }

  const startEdit = (trick: Trick) => {
    setEditingId(trick.id)
    setEditTitle(trick.title)
    setEditNotes(trick.notes || '')
    setEditTags(trick.tags)
    setEditCustomTag('')
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (id: string) => {
    const res = await fetch('/api/tricks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title: editTitle.trim(), notes: editNotes.trim() || null, tags: editTags }),
    })
    if (!res.ok) { setError(await res.text()); return }
    setEditingId(null)
    setSuccess('MODIFICATO'); setTimeout(() => setSuccess(''), 3000)
    fetchTricks()
  }

  const toggleEditTag = (tag: string) => {
    setEditTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const addEditCustomTag = () => {
    const t = editCustomTag.trim().toUpperCase()
    if (t && !editTags.includes(t)) setEditTags(prev => [...prev, t])
    setEditCustomTag('')
  }

  const handleDelete = async (trick: Trick) => {
    if (!confirm(`Eliminare "${trick.title}"?`)) return
    if (trick.url) {
      const urlParts = trick.url.split('/')
      const fileName = urlParts[urlParts.length - 1].split('?')[0]
      await supabase.storage.from('tricks').remove([fileName])
    }
    await supabase.from('tricks').delete().eq('id', trick.id)
    fetchTricks()
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 40, letterSpacing: '0.1em', color: 'var(--accent)' }}>ADMIN ACCESS</h1>
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ borderColor: pwError ? 'var(--accent2)' : undefined }}
          />
          {pwError && <p style={{ color: 'var(--accent2)', fontSize: 11, fontFamily: 'Space Mono' }}>Password errata</p>}
          <button className="btn" onClick={handleLogin} style={{ width: '100%', justifyContent: 'center' }}>ENTRA</button>
          <Link href="/" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>← BACK TO LIBRARY</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: '0.1em', color: 'var(--accent)' }}>ADMIN — LEARN TO RIDE</h1>
        <Link href="/" className="btn btn-ghost">← LIBRARY</Link>
      </header>

      <div className="container" style={{ padding: 24, display: 'grid', gridTemplateColumns: '400px 1fr', gap: 32, alignItems: 'start' }}>

        {/* Upload form */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 24, position: 'sticky', top: 24 }}>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: '0.08em', marginBottom: 16 }}>NUOVO CONTENUTO</h2>

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, border: '1px solid var(--border)' }}>
            {(['upload', 'external'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px', background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#000' : 'var(--muted)', border: 'none', cursor: 'pointer',
                fontFamily: 'Space Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                {m === 'upload' ? '↑ UPLOAD' : '🔗 LINK ESTERNO'}
              </button>
            ))}
          </div>

          {mode === 'upload' ? (
            <div style={{ marginBottom: 16 }}>
              <label>Video / GIF</label>
              <div onClick={() => fileRef.current?.click()} style={{
                border: '2px dashed var(--border)', padding: preview ? 0 : '32px 16px',
                textAlign: 'center', cursor: 'pointer', overflow: 'hidden',
              }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {preview ? (
                  file?.type.startsWith('video') ? (
                    <video src={preview} style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} muted />
                  ) : (
                    <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                  )
                ) : (
                  <p style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'Space Mono', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Clicca per scegliere<br />
                    <span style={{ fontSize: 9, color: 'var(--border)' }}>MP4 · WEBM · MOV · GIF</span>
                  </p>
                )}
              </div>
              <input ref={fileRef} type="file" accept="video/*,.gif" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <label>URL YouTube / Vimeo</label>
              <input type="text" placeholder="https://youtube.com/watch?v=..." value={externalUrl} onChange={e => setExternalUrl(e.target.value)} />
              <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, fontFamily: 'Space Mono' }}>
                La thumbnail verrà estratta automaticamente
              </p>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label>Titolo *</label>
            <input type="text" placeholder="es. The Art of Flight" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Note (opzionale)</label>
            <textarea placeholder="Descrizione, link capitoli..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Tag</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {PRESET_TAGS.map(tag => (
                <span key={tag} className={`tag ${selectedTags.includes(tag) ? 'active' : ''}`} onClick={() => toggleTag(tag)}>{tag}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="Tag personalizzato..." value={customTag}
                onChange={e => setCustomTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomTag()} style={{ flex: 1 }} />
              <button className="btn btn-ghost" onClick={addCustomTag} style={{ flexShrink: 0 }}>+</button>
            </div>
            {selectedTags.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {selectedTags.map(tag => (
                  <span key={tag} className="tag active" onClick={() => toggleTag(tag)}>{tag} ✕</span>
                ))}
              </div>
            )}
          </div>

          {error && <p style={{ color: 'var(--accent2)', fontSize: 11, marginBottom: 12, fontFamily: 'Space Mono' }}>⚠ {error}</p>}
          {success && <p style={{ color: 'var(--accent)', fontSize: 11, marginBottom: 12, fontFamily: 'Space Mono' }}>✓ {success}</p>}

          <button className="btn" onClick={handleUpload} disabled={uploading}
            style={{ width: '100%', justifyContent: 'center', opacity: uploading ? 0.6 : 1 }}>
            {uploading ? 'CARICAMENTO...' : 'AGGIUNGI'}
          </button>
        </div>

        {/* Tricks list */}
        <div>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: '0.08em', marginBottom: 16 }}>TUTTI I CONTENUTI ({tricks.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tricks.map(trick => (
              <div key={trick.id} style={{ background: 'var(--surface)', border: `1px solid ${editingId === trick.id ? 'var(--accent)' : 'var(--border)'}`, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                  <div style={{ width: 60, height: 40, flexShrink: 0, overflow: 'hidden', background: '#000', position: 'relative' }}>
                    {trick.thumbnail_url ? (
                      <img src={trick.thumbnail_url} alt={trick.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : trick.url?.match(/\.(mp4|webm|mov)/i) ? (
                      <video src={trick.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                    ) : trick.url ? (
                      <img src={trick.url} alt={trick.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : null}
                    {trick.external_url && (
                      <div style={{ position: 'absolute', bottom: 2, right: 2, background: trick.external_url.includes('youtube') ? '#ff0000' : '#1ab7ea', fontSize: 7, fontFamily: 'Space Mono', fontWeight: 700, padding: '1px 3px', color: '#fff' }}>
                        {trick.external_url.includes('youtube') ? 'YT' : 'VM'}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: '0.05em' }}>{trick.title}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3 }}>
                      {trick.tags.map(tag => <span key={tag} className="tag" style={{ fontSize: 9 }}>{tag}</span>)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost" onClick={() => editingId === trick.id ? cancelEdit() : startEdit(trick)}
                      style={{ padding: '6px 12px', fontSize: 10 }}>
                      {editingId === trick.id ? 'ANNULLA' : 'MODIFICA'}
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(trick)} style={{ padding: '6px 12px', fontSize: 10 }}>✕</button>
                  </div>
                </div>

                {editingId === trick.id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label>Titolo</label>
                      <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                    </div>
                    <div>
                      <label>Note</label>
                      <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                    </div>
                    <div>
                      <label>Tag</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                        {PRESET_TAGS.map(tag => (
                          <span key={tag} className={`tag ${editTags.includes(tag) ? 'active' : ''}`} onClick={() => toggleEditTag(tag)}>{tag}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="text" placeholder="Tag personalizzato..." value={editCustomTag}
                          onChange={e => setEditCustomTag(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addEditCustomTag()} style={{ flex: 1 }} />
                        <button className="btn btn-ghost" onClick={addEditCustomTag} style={{ flexShrink: 0 }}>+</button>
                      </div>
                      {editTags.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {editTags.map(tag => (
                            <span key={tag} className="tag active" onClick={() => toggleEditTag(tag)}>{tag} ✕</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="btn" onClick={() => saveEdit(trick.id)} style={{ alignSelf: 'flex-start' }}>
                      SALVA MODIFICHE
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
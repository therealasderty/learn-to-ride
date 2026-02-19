'use client'

import { useState, useEffect } from 'react'
import { supabase, type Trick } from '@/lib/supabase'
import TrickCard from '@/components/TrickCard'

const PRESET_TAGS = [
  'FS3','FS5','FS7','FS9',
  'BS3','BS5','BS7','BS9',
  'Cab3','Cab5','Cab7',
  'Indy','Mute','Stalefish','Melon','Tail','Nose','Tindy',
  'Kicker','Rail','Box','Pipe','Natural',
  'Cork','Rodeo','Misty','Bio',
]

export default function HomePage() {
  const [tricks, setTricks] = useState<Trick[]>([])
  const [filtered, setFiltered] = useState<Trick[]>([])
  const [search, setSearch] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTricks() }, [])

  const fetchTricks = async () => {
    const { data } = await supabase
      .from('tricks')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      setTricks(data)
      const tags = Array.from(new Set(data.flatMap((t: Trick) => t.tags))).sort() as string[]
      setAllTags(tags)
    }
    setLoading(false)
  }

  useEffect(() => {
    let result = tricks
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q)) ||
        t.notes?.toLowerCase().includes(q)
      )
    }
    if (activeTags.length > 0) {
      result = result.filter(t => activeTags.every(tag => t.tags.includes(tag)))
    }
    setFiltered(result)
  }, [tricks, search, activeTags])

  const toggleTag = (tag: string) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const clearFilters = () => { setSearch(''); setActiveTags([]) }
  const displayTags = allTags.length > 0 ? allTags : PRESET_TAGS

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0,
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
      }}>
        <div className="container" style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px', gap: 16,
        }}>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: '0.1em', color: 'var(--accent)', lineHeight: 1, flexShrink: 0 }}>
            LEARN TO RIDE
          </h1>
          <div style={{ flex: 1, maxWidth: 400 }}>
            <input
              type="text"
              placeholder="SEARCH TRICKS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: 11, padding: '8px 12px', letterSpacing: '0.05em' }}
            />
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '10px 24px',
          overflowX: 'auto',
          display: 'flex', gap: 6, alignItems: 'center',
        }}>
          {activeTags.length > 0 && (
            <button onClick={clearFilters} style={{
              background: 'var(--accent2)', border: 'none', color: '#fff',
              fontFamily: 'Space Mono', fontSize: 9, padding: '3px 8px',
              cursor: 'pointer', flexShrink: 0, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>✕ CLEAR</button>
          )}
          {displayTags.map(tag => (
            <span key={tag} className={`tag ${activeTags.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleTag(tag)} style={{ flexShrink: 0 }}>
              {tag}
            </span>
          ))}
        </div>
      </header>

      <main className="container" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 12 }}>
            <p style={{ fontFamily: 'Bebas Neue', fontSize: 48, color: 'var(--border)', letterSpacing: '0.1em' }}>NO TRICKS FOUND</p>
            {(search || activeTags.length > 0) && (
              <button className="btn btn-ghost" onClick={clearFilters}>CLEAR FILTERS</button>
            )}
          </div>
        ) : (
          <div style={{ columns: 'auto', columnWidth: 280, gap: 'var(--card-gap)' }}>
            {filtered.map(trick => (
              <div key={trick.id} style={{ marginBottom: 'var(--card-gap)', breakInside: 'avoid' }}>
                <TrickCard trick={trick} onTagClick={toggleTag} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
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
  const [filterOpen, setFilterOpen] = useState(false)
  const [pendingTags, setPendingTags] = useState<string[]>([])

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

  const togglePendingTag = (tag: string) => {
    setPendingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const openFilter = () => {
    setPendingTags([...activeTags])
    setFilterOpen(true)
  }

  const applyFilter = () => {
    setActiveTags(pendingTags)
    setFilterOpen(false)
  }

  const clearFilters = () => {
    setSearch('')
    setActiveTags([])
    setPendingTags([])
    setFilterOpen(false)
  }

  const displayTags = allTags.length > 0 ? allTags : PRESET_TAGS

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
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
              placeholder="SEARCH..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: 11, padding: '8px 12px', letterSpacing: '0.05em' }}
            />
          </div>
          <button
            onClick={openFilter}
            style={{
              flexShrink: 0,
              background: activeTags.length > 0 ? 'var(--accent)' : 'transparent',
              border: '1px solid var(--border)',
              color: activeTags.length > 0 ? '#000' : 'var(--text)',
              fontFamily: 'Space Mono', fontSize: 11, fontWeight: 700,
              padding: '8px 14px', cursor: 'pointer', letterSpacing: '0.1em',
              textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            FILTRI {activeTags.length > 0 && `(${activeTags.length})`}
          </button>
        </div>

        {/* Desktop tag bar — hidden on mobile */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '10px 24px',
          overflowX: 'auto',
          display: 'flex', gap: 6, alignItems: 'center',
        }}
          className="desktop-tags"
        >
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

      {/* Filter modal */}
      {filterOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-end',
        }}
          onClick={() => setFilterOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              background: 'var(--surface)',
              borderTop: '2px solid var(--accent)',
              padding: '24px 20px 32px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: '0.1em', color: 'var(--accent)' }}>
                FILTRI
              </span>
              <button onClick={() => setFilterOpen(false)} style={{
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text)', fontFamily: 'Space Mono', fontSize: 11,
                padding: '6px 12px', cursor: 'pointer',
              }}>✕</button>
            </div>

            {/* Tags grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {displayTags.map(tag => (
                <span
                  key={tag}
                  onClick={() => togglePendingTag(tag)}
                  style={{
                    padding: '10px 16px',
                    background: pendingTags.includes(tag) ? 'var(--accent)' : 'var(--surface2)',
                    border: `1px solid ${pendingTags.includes(tag) ? 'var(--accent)' : 'var(--border)'}`,
                    color: pendingTags.includes(tag) ? '#000' : 'var(--text)',
                    fontFamily: 'Space Mono', fontSize: 12, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={applyFilter}
                style={{
                  flex: 1, padding: '14px',
                  background: 'var(--accent)', border: 'none',
                  color: '#000', fontFamily: 'Space Mono', fontSize: 13,
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                  cursor: 'pointer',
                }}
              >
                APPLICA {pendingTags.length > 0 && `(${pendingTags.length})`}
              </button>
              <button
                onClick={clearFilters}
                style={{
                  padding: '14px 20px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)', fontFamily: 'Space Mono', fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  cursor: 'pointer',
                }}
              >
                RESET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
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

      <style>{`
        @media (min-width: 768px) {
          .desktop-tags { display: flex !important; }
        }
        @media (max-width: 767px) {
          .desktop-tags { display: none !important; }
        }
      `}</style>
    </div>
  )
}
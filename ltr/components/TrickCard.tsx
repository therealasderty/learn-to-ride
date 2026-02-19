'use client'

import { useState, useRef, useEffect } from 'react'
import type { Trick } from '@/lib/supabase'

interface TrickCardProps {
  trick: Trick
  onTagClick?: (tag: string) => void
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
  return null
}

export default function TrickCard({ trick, onTagClick }: TrickCardProps) {
  const [lightbox, setLightbox] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const lightboxVideoRef = useRef<HTMLVideoElement>(null)
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window)

  const isVideo = trick.url?.match(/\.(mp4|webm|mov)(\?|$)/i)
  const isGif = trick.url?.match(/\.gif(\?|$)/i)
  const isExternal = !!trick.external_url
  const embedUrl = trick.external_url ? getEmbedUrl(trick.external_url) : null

  const handleMouseEnter = () => {
    if (isVideo && videoRef.current && !isTouchDevice) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }
  const handleMouseLeave = () => {
    if (isVideo && videoRef.current && !isTouchDevice) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const handleClick = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
    setLightbox(true)
  }

  const closeLightbox = () => {
    if (lightboxVideoRef.current) lightboxVideoRef.current.pause()
    setLightbox(false)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox() }
    if (lightbox) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightbox])

  useEffect(() => {
    if (lightbox && lightboxVideoRef.current) lightboxVideoRef.current.play()
  }, [lightbox])

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          overflow: 'hidden', cursor: 'pointer',
          transition: 'border-color 0.2s ease, transform 0.2s ease', position: 'relative',
        }}
        onMouseOver={e => { if (!isTouchDevice) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}}
        onMouseOut={e => { if (!isTouchDevice) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}}
      >
        <div style={{ position: 'relative', overflow: 'hidden', background: '#000' }}>

          {/* External — thumbnail con play */}
          {isExternal && trick.thumbnail_url && (
            <>
              <img src={trick.thumbnail_url} alt={trick.title}
                style={{ width: '100%', height: 'auto', display: 'block' }} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.3)', pointerEvents: 'none',
              }}>
                <div style={{ width: 44, height: 44, border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="var(--accent)"><polygon points="3,1 13,7 3,13" /></svg>
                </div>
              </div>
            </>
          )}

          {/* Local video */}
          {!isExternal && isVideo && (
            <>
              <video ref={videoRef} src={trick.url} loop muted playsInline
                autoPlay={isTouchDevice}
                style={{ width: '100%', height: 'auto', display: 'block' }} />
              {!isTouchDevice && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isPlaying ? 'transparent' : 'rgba(0,0,0,0.3)', transition: 'background 0.2s ease',
                  pointerEvents: 'none',
                }}>
                  {!isPlaying && (
                    <div style={{ width: 36, height: 36, border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="var(--accent)"><polygon points="3,1 13,7 3,13" /></svg>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* GIF / image */}
          {!isExternal && !isVideo && trick.url && (
            <img src={trick.url} alt={trick.title}
              style={{ width: '100%', height: 'auto', display: 'block' }} />
          )}

          {/* GIF badge */}
          {isGif && (
            <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--accent)', color: '#000', fontSize: 9, fontFamily: 'Space Mono', fontWeight: 700, padding: '2px 5px', letterSpacing: '0.1em' }}>GIF</div>
          )}
        </div>

        <div style={{ padding: '10px 12px 12px' }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: '0.05em', color: 'var(--text)', marginBottom: 6, lineHeight: 1.1 }}>
            {trick.title}
          </div>
          {trick.notes && (
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.5, fontFamily: 'Space Mono' }}>{trick.notes}</p>
          )}
          {trick.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {trick.tags.map(tag => (
                <span key={tag} className="tag" onClick={e => { e.stopPropagation(); onTagClick?.(tag) }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={closeLightbox} style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.95)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <button onClick={closeLightbox} style={{
            position: 'absolute', top: 20, right: 20, background: 'transparent',
            border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Space Mono',
            fontSize: 11, padding: '6px 12px', cursor: 'pointer', letterSpacing: '0.1em', zIndex: 1001,
          }}>ESC ✕</button>

          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', width: '100%' }}>
            {isExternal && embedUrl ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                <iframe
                  src={embedUrl}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : isVideo ? (
              <video ref={lightboxVideoRef} src={trick.url} loop muted={false} controls playsInline
                style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
            ) : (
              <img src={trick.url} alt={trick.title} style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
            )}
          </div>

          <div onClick={e => e.stopPropagation()} style={{ marginTop: 16, textAlign: 'center', maxWidth: 600 }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 8 }}>
              {trick.title}
            </div>
            {trick.notes && (
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, fontFamily: 'Space Mono', lineHeight: 1.6 }}>{trick.notes}</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
              {trick.tags.map(tag => (
                <span key={tag} className="tag" onClick={e => { e.stopPropagation(); onTagClick?.(tag); closeLightbox() }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
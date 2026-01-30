'use client'

import { useState } from 'react'
import {
  Share2,
  Link2,
  Twitter,
  Linkedin,
  Mail,
  Check,
  X
} from 'lucide-react'

export default function ShareButton({ grant, variant = 'button' }) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const getShareUrl = () => {
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://sacred-grants-dashboard.vercel.app'
    return `${baseUrl}/grants/${grant.id}`
  }

  const shareText = `Check out this grant opportunity: ${grant.name} - ${grant.amount.display}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = getShareUrl()
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: grant.name,
          text: shareText,
          url: getShareUrl(),
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          setShowMenu(true)
        }
      }
    } else {
      setShowMenu(true)
    }
  }

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: copied ? Check : Link2,
      onClick: handleCopyLink,
      className: copied ? 'text-green-600' : ''
    },
    {
      name: 'Twitter',
      icon: Twitter,
      onClick: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getShareUrl())}`
        window.open(url, '_blank', 'width=550,height=420')
      }
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      onClick: () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`
        window.open(url, '_blank', 'width=550,height=420')
      }
    },
    {
      name: 'Email',
      icon: Mail,
      onClick: () => {
        const subject = encodeURIComponent(`Grant Opportunity: ${grant.name}`)
        const body = encodeURIComponent(`${shareText}\n\nView details: ${getShareUrl()}`)
        window.location.href = `mailto:?subject=${subject}&body=${body}`
      }
    }
  ]

  // Inline menu variant (for grant page)
  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap gap-2">
        {shareOptions.map(option => (
          <button
            key={option.name}
            onClick={option.onClick}
            className={`flex items-center gap-2 px-4 py-2 border border-earth-300 rounded-lg hover:bg-earth-100 transition-colors ${option.className || ''}`}
          >
            <option.icon className="w-5 h-5" />
            <span>{option.name === 'Copy Link' && copied ? 'Copied!' : option.name}</span>
          </button>
        ))}
      </div>
    )
  }

  // Button with dropdown variant (for modal)
  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className="flex items-center justify-center gap-2 px-4 py-3 border border-earth-300 rounded-lg hover:bg-earth-100 transition-colors"
      >
        <Share2 className="w-5 h-5" />
        Share
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-lg border border-earth-200 py-2 min-w-[160px] z-20">
            <div className="flex items-center justify-between px-3 py-2 border-b border-earth-100">
              <span className="text-sm font-medium text-earth-700">Share</span>
              <button
                onClick={() => setShowMenu(false)}
                className="p-1 hover:bg-earth-100 rounded"
              >
                <X className="w-4 h-4 text-earth-500" />
              </button>
            </div>
            {shareOptions.map(option => (
              <button
                key={option.name}
                onClick={() => {
                  option.onClick()
                  if (option.name !== 'Copy Link') {
                    setShowMenu(false)
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-earth-50 transition-colors text-left ${option.className || ''}`}
              >
                <option.icon className="w-5 h-5" />
                <span className="text-sm">
                  {option.name === 'Copy Link' && copied ? 'Copied!' : option.name}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

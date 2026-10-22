'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Play, Film } from 'lucide-react';

export function TikTokIcon({ className = "w-4 h-4" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.41a6.33 6.33 0 0 0-.85-.06A6.34 6.34 0 0 0 3 15.69a6.34 6.34 0 0 0 9.77 5.34 6.28 6.28 0 0 0 2.9-5.34V8.75a8.16 8.16 0 0 0 4.92 1.63V6.93a4.85 4.85 0 0 1-1-.24z" />
    </svg>
  );
}

/**
 * Extracts numeric video ID from various TikTok URL patterns:
 * - https://www.tiktok.com/@user/video/7106594312292453678
 * - https://m.tiktok.com/v/7106594312292453678.html
 */
export function extractTikTokVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  
  const videoMatch = trimmed.match(/\/video\/(\d+)/i);
  if (videoMatch && videoMatch[1]) return videoMatch[1];

  const vMatch = trimmed.match(/\/v\/(\d+)/i);
  if (vMatch && vMatch[1]) return vMatch[1];

  return null;
}

export function TikTokVideoModal({ isOpen, onClose, tiktokUrl, productTitle = "Product Styling Video" }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const videoId = useMemo(() => extractTikTokVideoId(tiktokUrl), [tiktokUrl]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (!isOpen) {
      setIframeLoaded(false);
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          key="tiktok-modal-container"
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tiktok-modal-title"
        >
          {/* Backdrop */}
          <motion.div 
            key="tiktok-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />

          {/* Modal Window */}
          <motion.div
            key="tiktok-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm sm:max-w-md bg-[#111111] text-white rounded-[28px] overflow-hidden border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.5)] z-10 flex flex-col"
          >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#161616]">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white border border-white/10 shadow-sm shrink-0">
                <TikTokIcon className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h3 id="tiktok-modal-title" className="text-sm font-semibold text-white truncate leading-tight">
                  {productTitle}
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">
                  TikTok Product Reel
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-2"
              aria-label="Close TikTok modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video Container */}
          <div className="relative w-full bg-black aspect-[9/16] max-h-[70vh] flex items-center justify-center overflow-hidden">
            {videoId ? (
              <>
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 bg-black/90 z-10">
                    <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    <span className="text-xs font-medium text-gray-400">Loading TikTok Player...</span>
                  </div>
                )}
                <iframe
                  src={`https://www.tiktok.com/embed/v2/${videoId}`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  onLoad={() => setIframeLoaded(true)}
                  title={`${productTitle} on TikTok`}
                />
              </>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-4 text-gray-300">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-400">
                  <Film className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white mb-1">Direct Video Link</h4>
                  <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                    This styling clip uses an external short link. You can open and watch it directly on TikTok.
                  </p>
                </div>
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-full transition-all active:scale-95 shadow-md"
                  >
                    <TikTokIcon className="w-4 h-4" />
                    <span>Watch Video on TikTok</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-5 py-3.5 border-t border-white/[0.08] bg-[#161616] flex items-center justify-between gap-3">
            <span className="text-[11px] text-gray-400 truncate">
              Klasik Wardrobe Official Showcase
            </span>
            {tiktokUrl && (
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors shrink-0"
              >
                <span>Open in App</span>
                <ExternalLink className="w-3 h-3 text-gray-300" />
              </a>
            )}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}

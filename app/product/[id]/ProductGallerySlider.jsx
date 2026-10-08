'use client';

import { useState, useRef, useEffect } from 'react';

export default function ProductGallerySlider({ gallery = [], title, tag, selectedImage = null }) {
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const scrollRef = useRef(null);
  const displayImages = gallery && gallery.length > 0 ? gallery : ['/images/media__1786369656046.jpg'];

  useEffect(() => {
    if (!selectedImage) return;
    const idx = displayImages.findIndex((img) => img === selectedImage);
    if (idx !== -1) {
      scrollToSlide(idx);
    }
  }, [selectedImage]);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    if (!el) return;
    const width = el.offsetWidth || 1;
    const idx = Math.round(el.scrollLeft / width);
    if (idx !== activeSlideIdx && idx >= 0 && idx < displayImages.length) {
      setActiveSlideIdx(idx);
    }
  };

  const scrollToSlide = (idx) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: idx * width,
        behavior: 'smooth'
      });
      setActiveSlideIdx(idx);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Slideable Image Box: 24px radius, horizontal snap */}
      <div className="w-full bg-[#EDEDEF] aspect-[4/5] rounded-[24px] overflow-hidden p-3 sm:p-4 shadow-[0_8px_24px_rgba(17,17,17,0.06)] relative group flex items-center justify-center">
        
        {/* Touch-swipeable Gallery (slide with hand on mobile) */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none overscroll-x-contain touch-pan-x"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {displayImages.map((imgUrl, idx) => (
            <div
              key={idx}
              className="w-full h-full flex-shrink-0 snap-center snap-always relative overflow-hidden flex items-center justify-center"
            >
              <img
                src={imgUrl}
                referrerPolicy="no-referrer"
                alt={`${title} - angle ${idx + 1}`}
                className="w-full h-full object-cover rounded-[20px] pointer-events-none select-none"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Tag Pill in top-left */}
        {tag && (
          <span className="absolute top-4 left-4 bg-[#111111] text-white px-3 py-1 text-xs font-sans font-semibold rounded-full shadow-xs pointer-events-none z-20 select-none">
            {tag}
          </span>
        )}
      </div>

      {/* Dots Indicator ONLY (No prev/next buttons, no scrollbar) */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-1.5 mt-4 z-10">
          {displayImages.map((_, idx) => {
            const isActive = activeSlideIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                className={`transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'w-6 h-2 bg-[#7C3AED] rounded-full'
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400 rounded-full'
                }`}
                onClick={() => scrollToSlide(idx)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

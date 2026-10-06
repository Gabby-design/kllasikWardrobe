"use client";

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const categories = [
    { label: 'All Pieces', value: 'All' },
    { label: 'Essential (₦30k)', value: 'Essential' },
    { label: 'Signature (₦35k)', value: 'Signature' },
    { label: 'Executive (₦40k)', value: 'Executive' },
  ];
  
  const currentCategory = searchParams.get('category') || 'All';

  const handleCategoryClick = (category) => {
    const params = new URLSearchParams(searchParams);
    
    if (category === 'All') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      {/* Horizontal Scrollable Row of Category Chips */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none sm:justify-center -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((cat) => {
          const isActive = currentCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => handleCategoryClick(cat.value)}
              className={`flex-shrink-0 font-sans text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:text-[#7C3AED] border border-black/[0.04] shadow-[0_4px_16px_rgba(17,17,17,0.05)]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

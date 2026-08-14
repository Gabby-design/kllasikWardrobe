"use client";

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const categories = [
    { label: 'All Collections', value: 'All' },
    { label: 'Essential (₦30,000)', value: 'Essential' },
    { label: 'Signature (₦35,000)', value: 'Signature' },
    { label: 'Executive (₦40,000)', value: 'Executive' },
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
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
      {categories.map((cat) => {
        const isActive = currentCategory === cat.value;
        return (
          <button
            key={cat.value}
            onClick={() => handleCategoryClick(cat.value)}
            className={`font-sans text-xs uppercase tracking-[0.16em] px-5 py-2.5 transition-all duration-300 cursor-pointer ${
              isActive
                ? 'bg-foreground text-background font-bold shadow-md'
                : 'bg-white text-foreground/70 border border-foreground/15 hover:border-foreground hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

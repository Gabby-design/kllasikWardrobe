"use client";

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const categories = ['All', 'Essential', 'Signature', 'Executive'];
  const currentCategory = searchParams.get('category') || 'All';

  const handleCategoryClick = (category) => {
    const params = new URLSearchParams(searchParams);
    
    if (category === 'All') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    
    // Crucial: reset page to 1 whenever category changes
    params.set('page', '1');
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
      {categories.map((cat) => {
        const isActive = currentCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
              isActive
                ? 'bg-foreground text-background border-foreground'
                : 'bg-transparent text-foreground/70 border-border/50 hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}

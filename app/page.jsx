import { getAuthoritativeProducts } from '../src/lib/db.js';
import { HomePageClient } from './HomePageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  let initialProducts = null;
  let initialError = null;

  try {
    initialProducts = await getAuthoritativeProducts();
  } catch (err) {
    console.error('[HomePage] Error loading authoritative products:', err.message);
    initialError = err.message || 'Database connection unavailable';
  }

  return (
    <HomePageClient 
      initialProducts={initialProducts} 
      initialError={initialError} 
    />
  );
}

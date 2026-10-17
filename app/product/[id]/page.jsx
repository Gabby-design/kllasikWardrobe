import { notFound } from 'next/navigation';
import { getAuthoritativeProductById } from '../../../src/lib/db';
import ProductPageClient from './ProductPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProductPage({ params }) {
  const { id } = await params;
  
  const product = await getAuthoritativeProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductPageClient initialProduct={product} />;
}

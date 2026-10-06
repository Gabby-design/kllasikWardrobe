import { redirect } from 'next/navigation';

export default async function CatalogPage({ searchParams }) {
  const sp = await searchParams;
  const params = new URLSearchParams(sp || {}).toString();
  redirect(params ? `/?${params}` : '/');
}

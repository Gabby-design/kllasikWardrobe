export const metadata = {
  title: 'Admin Dashboard | Klasik Wardrobe',
  description: 'Manage store orders, products, and inventory for Klasik Wardrobe.',
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#111111] font-sans flex flex-col">
      {children}
    </div>
  );
}

import { redirect } from 'next/navigation'
import { createClient } from '../../backend/lib/supabase'

export default async function AdminLayout({ children }) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  if (user.email !== 'gabrieltolulope50@gmail.com') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col">
      <header className="bg-white border-b border-neutral-200 py-4 px-8 flex justify-between items-center">
        <h1 className="text-xl font-bold font-['Syne'] text-[#1a1a1a]">ADMIN DASHBOARD</h1>
        <div className="text-sm font-['DM_Sans'] text-neutral-500">
          Logged in as {user.email}
        </div>
      </header>
      <main className="flex-grow p-8">
        {children}
      </main>
    </div>
  )
}

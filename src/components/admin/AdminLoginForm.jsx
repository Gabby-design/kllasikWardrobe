'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, ArrowLeft, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { KlasikLogo } from '../KlasikLogo';

export function AdminLoginForm() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        // Force complete page reload to render AdminDashboard with authenticated session
        window.location.href = '/admin';
      } else {
        setError(data.error || 'Incorrect administrator passphrase. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError('Connection error while verifying passphrase. Please retry.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-[24px] border border-black/[0.04] p-8 sm:p-10 shadow-[0_8px_24px_rgba(17,17,17,0.06)] text-center">
        
        <div className="mb-6 flex justify-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <KlasikLogo height={32} className="w-auto" fill="#111111" />
          </Link>
        </div>

        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] text-xs font-bold border border-[#DDD6FE] mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Concierge Admin</span>
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-[#111111] mb-2">
            Admin Dashboard
          </h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            Enter your store passphrase to manage products, catalog pricing, and orders.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-[16px] bg-red-50 border border-red-200/80 text-left flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Access Denied</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Admin Passphrase
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                autoFocus
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passphrase"
                className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-3 text-xs text-[#111111] outline-none transition-all pl-10 pr-10"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label={showPassword ? 'Hide passphrase' : 'Show passphrase'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5 pl-2">
              Enter the administrator passphrase configured in your environment.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-[#7C3AED]/60 text-white font-sans text-xs font-bold py-3.5 px-6 rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer mt-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Access...</span>
              </>
            ) : (
              <span>Access Dashboard &rarr;</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-black/[0.04]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#7C3AED] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Store</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

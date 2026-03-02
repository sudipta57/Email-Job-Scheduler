'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Email login not implemented');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div
        className="bg-white border border-gray-200 rounded-2xl"
        style={{ padding: '48px', width: '480px' }}
      >
        <h1 className="text-3xl font-bold text-black text-center mb-8">Login</h1>

        {/* Google Login */}
        <a
          href="https://email-job-scheduler-production-2024.up.railway.app/auth/google"
          className="flex items-center justify-center gap-3 w-full bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl py-3 text-gray-700 transition-colors mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          Login with Google
        </a>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-gray-400 text-sm whitespace-nowrap">or sign up through email</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-200 transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-200 transition"
          />
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-medium transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

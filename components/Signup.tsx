

import React, { useState } from 'react';
import { User, ViewType } from '../types';
import SupabaseService from '../lib/supabaseService';

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);

const LockIconSvg = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

interface SignupProps {
    onSignupSuccess?: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSignupSuccess }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Kata sandi tidak cocok.');
            return;
        }

        // Email uniqueness will be handled by Supabase Auth

        setIsLoading(true);

        try {
            await SupabaseService.signUp(email, password, { fullName });
            setIsLoading(false);
            setIsSubmitted(true);
            if (onSignupSuccess) {
                onSignupSuccess();
            }
        } catch (error: any) {
            console.error('Signup error:', error);
            setIsLoading(false);
            if (error.message.includes('User already registered')) {
                setError('Email sudah terdaftar.');
            } else if (error.message.includes('Password should be at least 6 characters')) {
                setError('Kata sandi harus minimal 6 karakter.');
            } else {
                setError('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
            }
        }
    };
    
    if (isSubmitted) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
                <div className="w-full max-w-sm mx-auto text-center bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                    <h1 className="text-2xl font-bold" style={{color: '#4f46e5'}}>Pendaftaran Berhasil!</h1>
                    <p className="text-slate-600 mt-4">
                        Akun Anda telah dibuat dan sekarang menunggu persetujuan dari admin. Anda akan dapat masuk setelah akun Anda diaktifkan.
                    </p>
                    <button 
                        type="button" 
                        onClick={() => window.location.hash = '#/login'} 
                        className="button-primary w-full mt-6"
                    >
                        Kembali ke Halaman Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
            <div className="w-full max-w-sm mx-auto">
                 <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold" style={{color: '#4f46e5'}}>Daftar Akun Baru</h1>
                        <p className="text-sm text-slate-500 mt-2">Buat akun untuk mulai mengelola bisnis Anda.</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                required
                                className="w-full h-12 pl-12 pr-4 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                placeholder="Nama Lengkap"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                         <div className="relative">
                            <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full h-12 pl-12 pr-4 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <LockIconSvg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="w-full h-12 pl-12 pr-4 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                placeholder="Kata Sandi"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <LockIconSvg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                className="w-full h-12 pl-12 pr-4 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                placeholder="Konfirmasi Kata Sandi"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="button-primary w-full"
                            >
                                {isLoading ? 'Mendaftar...' : 'Daftar'}
                            </button>
                        </div>
                    </form>
                    
                     <div className="text-center mt-6 text-sm">
                        <p className="text-slate-500">
                            Sudah punya akun?{' '}
                            <button 
                                type="button" 
                                onClick={() => window.location.hash = '#/login'} 
                                className="font-semibold text-brand-accent hover:text-brand-accent-hover transition-colors duration-200 underline-offset-4 hover:underline"
                            >
                                Masuk di sini
                            </button>
                        </p>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default Signup;
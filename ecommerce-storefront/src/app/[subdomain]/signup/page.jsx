"use client";
import React, { useState, useEffect } from 'react';
import API from '@/api/api';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage({ params }) {
    const { subdomain } = React.use(params);
    const router = useRouter();
    const { checkAuthStatus } = useAuth();

    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        otp: '',
    });

    // ── Timer countdown ───────────────────────────────────────────────────────
    useEffect(() => {
        if (otpTimer <= 0) return;
        const interval = setInterval(() => {
            setOtpTimer((prev) => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [otpTimer]);

    const formatTimer = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const handleChange = (field) => (e) =>
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));

    // ── Send OTP ──────────────────────────────────────────────────────────────
    const handleSendOtp = async () => {
        setError('');
        if (!formData.fullName.trim()) { setError('Please enter your full name first.'); return; }
        if (!formData.email.trim())    { setError('Please enter your email address.'); return; }
        if (!formData.password)        { setError('Please set a password first.'); return; }
        if (otpTimer > 0) return;

        setLoading(true);
        try {
            await API.post('/auth/send-otp', { email: formData.email.trim() });
            setOtpSent(true);
            setOtpTimer(180);
            toast.success('Verification code sent to your email!');
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Submit (verify OTP + register) ────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (!formData.otp || formData.otp.length !== 6) {
            setError('Please enter the 6-digit verification code.');
            return;
        }

        setLoading(true);
        try {
            await API.post('/auth/register-customer', {
                fullName:  formData.fullName.trim(),
                email:     formData.email.trim(),
                password:  formData.password,
                subdomain,
                otp:       formData.otp,
            });

            // Backend sets the HttpOnly cookie; refresh auth context
            await checkAuthStatus();

            toast.success('Account created successfully!');
            router.push('/account');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 text-white rounded-2xl mb-6 shadow-xl shadow-gray-900/20">
                        <UserPlus size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight capitalize">
                        Join {subdomain}
                    </h1>
                    <p className="text-gray-500 mt-2">Create your account to track orders and checkout faster.</p>
                </div>

                {/* Card */}
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-2xl shadow-gray-200/20">

                    {/* Inline error */}
                    {error && (
                        <div className="mb-5 p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Full Name */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    required
                                    type="text"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={handleChange('fullName')}
                                    disabled={otpSent}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-gray-900 focus:bg-white outline-none transition-all disabled:opacity-60"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    required
                                    type="email"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange('email')}
                                    disabled={otpSent}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-gray-900 focus:bg-white outline-none transition-all disabled:opacity-60"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    required
                                    type="password"
                                    placeholder="At least 6 characters"
                                    value={formData.password}
                                    onChange={handleChange('password')}
                                    disabled={otpSent}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-gray-900 focus:bg-white outline-none transition-all disabled:opacity-60"
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    required
                                    type="password"
                                    placeholder="Repeat your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange('confirmPassword')}
                                    disabled={otpSent}
                                    className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-gray-900 focus:bg-white outline-none transition-all disabled:opacity-60 ${
                                        formData.confirmPassword && formData.confirmPassword !== formData.password
                                            ? 'border-red-300 bg-red-50/30'
                                            : 'border-gray-100'
                                    }`}
                                />
                            </div>
                            {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                                <p className="mt-1 text-xs text-red-500 ml-1">Passwords do not match.</p>
                            )}
                        </div>

                        {/* OTP Field (shown after sending code) */}
                        {otpSent && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Verification Code
                                </label>
                                <input
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="6-digit code from your email"
                                    value={formData.otp}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                                    className="w-full px-4 py-3.5 bg-indigo-50/40 border border-indigo-200 rounded-xl text-center tracking-[0.4em] font-mono text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-gray-500">Check your inbox for the code.</p>
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={otpTimer > 0 || loading}
                                        className="text-xs font-semibold text-indigo-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {otpTimer > 0 ? `Resend in ${formatTimer(otpTimer)}` : 'Resend Code'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* CTA Button */}
                        {!otpSent ? (
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={loading || otpTimer > 0}
                                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-4 shadow-xl shadow-gray-900/10"
                            >
                                {loading ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Send Verification Code <ArrowRight size={18} /></>
                                )}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading || formData.otp.length !== 6}
                                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-4 shadow-xl shadow-gray-900/10"
                            >
                                {loading ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Verify & Create Account <ArrowRight size={18} /></>
                                )}
                            </button>
                        )}
                    </form>

                    {/* Footer link */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link href="/account" className="text-gray-900 font-bold hover:underline underline-offset-4">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium">
                    Secure 256-bit SSL Encryption
                </p>
            </div>
        </div>
    );
}

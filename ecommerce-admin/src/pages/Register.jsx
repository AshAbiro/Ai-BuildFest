import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';

const SUBDOMAIN_REGEX = /^[a-z0-9]+$/;

const Register = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    // Step 1: Email + OTP
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);

    // Step 2: Store details
    const [shopName, setShopName] = useState('');
    const [subdomain, setSubdomain] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [subdomainError, setSubdomainError] = useState('');

    // ── Timer countdown ───────────────────────────────────────────────────────
    const startTimer = (seconds) => {
        setOtpTimer(seconds);
        const interval = setInterval(() => {
            setOtpTimer(prev => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTimer = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    // ── Send OTP ──────────────────────────────────────────────────────────────
    const handleSendOtp = async () => {
        setError('');
        if (!email.trim()) { setError('Please enter your email address.'); return; }
        if (otpTimer > 0) return;

        setSendingOtp(true);
        try {
            await API.post('/auth/send-otp', { email: email.trim() });
            setOtpSent(true);
            startTimer(180);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to send OTP. Please try again.');
        } finally {
            setSendingOtp(false);
        }
    };

    // ── Verify OTP (advance to step 2) ────────────────────────────────────────
    const handleVerifyOtp = () => {
        setError('');
        if (otp.length !== 6) {
            setError('Please enter the 6-digit verification code.');
            return;
        }
        setOtpVerified(true);
    };

    // ── Subdomain validation ──────────────────────────────────────────────────
    const handleSubdomainChange = (e) => {
        const val = e.target.value.toLowerCase();
        setSubdomain(val);
        if (val && !SUBDOMAIN_REGEX.test(val)) {
            setSubdomainError('Only letters (a–z) and numbers (0–9) allowed — no spaces or special characters.');
        } else {
            setSubdomainError('');
        }
    };

    // ── Final submit: create store ────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!SUBDOMAIN_REGEX.test(subdomain)) {
            setSubdomainError('Only letters and numbers are allowed in the subdomain.');
            return;
        }
        if (subdomain.length < 3) {
            setSubdomainError('Subdomain must be at least 3 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await API.post('/auth/register', {
                shopName: shopName.trim(),
                subdomain: subdomain.trim(),
                email: email.trim(),
                password,
                fullName: fullName.trim(),
                otp,
            });

            // Backend sets cookie; also set user in context
            if (res.data.user) {
                // Refresh full user object via /auth/me (it includes shopName + subdomain)
                const meRes = await API.get('/auth/me');
                if (meRes.data.success) setUser(meRes.data.user);
            }

            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="max-w-md w-full space-y-6">

                {/* Header */}
                <div className="text-center">
                    <span className="text-3xl font-black text-indigo-600 tracking-tight">ScaleUp.</span>
                    <h2 className="mt-3 text-2xl font-extrabold text-gray-900">Create your store</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Start selling in minutes — no credit card required.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 space-y-5">

                    {/* Global error */}
                    {error && (
                        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* ── STEP 1: Email + OTP ─────────────────────────────── */}
                    {!otpVerified && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={otpSent}
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
                                />
                            </div>

                            {!otpSent ? (
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={sendingOtp || otpTimer > 0 || !email.trim()}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sendingOtp ? 'Sending…' : 'Send Verification Code'}
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            6-Digit Verification Code
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            placeholder="_ _ _ _ _ _"
                                            className="w-full px-4 py-2.5 border border-indigo-300 bg-indigo-50/30 rounded-lg text-sm text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <div className="flex justify-between items-center mt-1.5">
                                            <p className="text-xs text-gray-500">Check your inbox for the code.</p>
                                            <button
                                                type="button"
                                                onClick={handleSendOtp}
                                                disabled={otpTimer > 0 || sendingOtp}
                                                className="text-xs font-semibold text-indigo-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            >
                                                {otpTimer > 0 ? `Resend in ${formatTimer(otpTimer)}` : 'Resend'}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleVerifyOtp}
                                        disabled={otp.length !== 6}
                                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Verify Code & Continue
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 2: Store details ────────────────────────────── */}
                    {otpVerified && (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Email verified: <strong className="ml-1">{email}</strong>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Your full name"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Shop Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                                <input
                                    required
                                    type="text"
                                    value={shopName}
                                    onChange={(e) => setShopName(e.target.value)}
                                    placeholder="My Awesome Store"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Subdomain */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Store Subdomain
                                </label>
                                <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                                    <input
                                        required
                                        type="text"
                                        value={subdomain}
                                        onChange={handleSubdomainChange}
                                        placeholder="mystore"
                                        minLength={3}
                                        maxLength={20}
                                        className="flex-1 px-4 py-2.5 text-sm outline-none"
                                    />
                                    <span className="bg-gray-50 px-3 flex items-center text-gray-500 text-sm border-l border-gray-300 whitespace-nowrap">
                                        .scaleup.codes
                                    </span>
                                </div>
                                {subdomainError ? (
                                    <p className="mt-1 text-xs text-red-600">{subdomainError}</p>
                                ) : (
                                    <p className="mt-1 text-xs text-gray-400">Letters and numbers only, 3–20 characters.</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <input
                                    required
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat your password"
                                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                        confirmPassword && confirmPassword !== password
                                            ? 'border-red-400 bg-red-50'
                                            : 'border-gray-300'
                                    }`}
                                />
                                {confirmPassword && confirmPassword !== password && (
                                    <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !!subdomainError}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Launching Store…
                                    </>
                                ) : (
                                    '🚀 Launch Store'
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;

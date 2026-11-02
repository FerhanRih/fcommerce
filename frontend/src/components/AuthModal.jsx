// frontend/src/components/AuthModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Phone, Lock, User, MapPin, X, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

// Make sure API request goes to backend port (e.g., 5000), not Vite frontend port (5173)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  // STEPS: 'phone' -> 'otp' (if exists) OR 'register' (if new user)
  const [step, setStep] = useState('phone'); 
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // STEP 1: Submit Phone Number -> Check User Status & Request OTP
  const handlePhoneCheck = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('Please enter a valid phone number.');
      return;
    }

    try {
      setLoading(true);
      // Backend checks if user exists and sends OTP
      const response = await axios.post(`${API_BASE_URL}/api/auth/request-otp`, { 
        phone: cleanPhone 
      });

      if (response.data.isRegistered) {
        // User exists -> Ask for OTP
        setStep('otp');
      } else {
        // User does not exist -> Collect registration details
        setStep('register');
      }
    } catch (err) {
      console.error('Auth Phone Check Error:', err);
      // Fallback for demo or offline backend
      setError(err.response?.data?.message || 'Cannot reach auth server. Check backend URL.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2A: Verify OTP for existing user
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
        phone: phone.trim(),
        otp: otp.trim(),
      });

      if (response.data.token) {
        completeAuth(response.data.user, response.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2B: Register new user (Name + Phone + OTP Verification)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Full Name is required.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        phone: phone.trim(),
        name: name.trim(),
        otp: otp.trim(),
      });

      if (response.data.token) {
        completeAuth(response.data.user, response.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const completeAuth = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    onAuthSuccess(userData, token);
    handleClose();
  };

  const handleClose = () => {
    setStep('phone');
    setPhone('');
    setOtp('');
    setName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-slate-100">
        
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-[#1E4D58]/10 text-[#1E4D58] rounded-xl">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {step === 'phone' && 'Sign In / Register'}
              {step === 'otp' && 'Enter OTP Code'}
              {step === 'register' && 'Complete Account Details'}
            </h2>
            <p className="text-xs text-slate-500">
              {step === 'phone' && 'Enter phone number to check account'}
              {step === 'otp' && `OTP sent to ${phone}`}
              {step === 'register' && `Creating new account for ${phone}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-3 mb-2 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-xl">
            {error}
          </div>
        )}

        {/* STEP 1: PHONE INPUT */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneCheck} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678 or 251912345678"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#1E4D58] focus:bg-white focus:outline-none transition"
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 text-sm font-semibold text-white bg-[#1E4D58] hover:bg-[#163C45] rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Next</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        {/* STEP 2A: OTP FORM (Existing User) */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                OTP Code
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter SMS OTP code"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-[#1E4D58] focus:bg-white focus:outline-none transition"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-1/3 py-3 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 flex items-center justify-center space-x-2 py-3 text-sm font-semibold text-white bg-[#1E4D58] hover:bg-[#163C45] rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <> <CheckCircle2 className="w-4 h-4" /> <span>Verify & Sign In</span> </>}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2B: REGISTRATION FORM (New User) */}
        {step === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 mt-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Abebe Bikila"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1E4D58] focus:bg-white focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                SMS OTP Code
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP sent to phone"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-[#1E4D58] focus:bg-white focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-1/3 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold text-white bg-[#1E4D58] hover:bg-[#163C45] rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Account</span>}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
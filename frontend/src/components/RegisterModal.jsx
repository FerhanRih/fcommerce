import React, { useState } from 'react';
import API from '../services/api';

export default function RegisterModal({ isOpen, onClose, onRegisterSuccess }) {
  const [step, setStep] = useState(1); // Step 1: Check Phone, Step 2: Password / Registration
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Reset modal state on close
  const handleModalClose = () => {
    setStep(1);
    setPhone('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setIsExistingUser(false);
    onClose();
  };

  // Step 1: Check if Phone exists in Database
  const handleCheckPhone = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setError('Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/auth/check-phone', { phone: cleanPhone });
      if (response.data.success) {
        setIsExistingUser(response.data.isExistingUser);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify phone number.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle Login or Registration Form Submission
  const handleSubmitAuth = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();

    if (!cleanPassword) {
      setError('Password is required.');
      return;
    }

    if (!isExistingUser) {
      if (!name.trim()) {
        setError('Full name is required.');
        return;
      }
      if (cleanPassword.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (cleanPassword !== confirmPassword.trim()) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      // Using relative paths via centralized API helper
      const endpoint = isExistingUser ? '/auth/login' : '/auth/register';
      const payload = isExistingUser
        ? { phone: cleanPhone, password: cleanPassword }
        : { phone: cleanPhone, name: name.trim(), password: cleanPassword };

      const response = await API.post(endpoint, payload);

      if (response.data.success) {
        const { token, user, store } = response.data;

        // Save session details to local storage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        if (store) {
          localStorage.setItem('store', JSON.stringify(store));
        } else {
          localStorage.removeItem('store');
        }

        if (onRegisterSuccess) {
          onRegisterSuccess(user, store);
        }
        handleModalClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || (isExistingUser ? 'Invalid phone or password.' : 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative border border-slate-100">
        {/* Close Button */}
        <button
          onClick={handleModalClose}
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
        >
          ✕
        </button>

        <h2 className="text-xl font-black text-[#1E4D58] mb-1">
          {step === 1
            ? 'Welcome to FCOMMERCE'
            : isExistingUser
            ? 'Welcome Back'
            : 'Create Account'}
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {step === 1
            ? 'Enter your phone number to sign in or register'
            : isExistingUser
            ? `Enter password for account ${phone}`
            : `Complete details for phone number ${phone}`}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100">
            {error}
          </div>
        )}

        {step === 1 ? (
          /* STEP 1: Phone Request Form */
          <form onSubmit={handleCheckPhone} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 0911234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1E4D58]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1E4D58] text-white font-bold text-xs rounded-xl uppercase tracking-wider hover:bg-[#163C45] transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Checking Phone...' : 'Continue'}
            </button>
          </form>
        ) : (
          /* STEP 2: Login or Registration Form */
          <form onSubmit={handleSubmitAuth} className="space-y-4">
            {!isExistingUser && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Abebe Bikila"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1E4D58]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1E4D58]"
              />
            </div>

            {!isExistingUser && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1E4D58]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1E4D58] text-white font-bold text-xs rounded-xl uppercase tracking-wider hover:bg-[#163C45] transition disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? 'Processing...'
                : isExistingUser
                ? 'Sign In'
                : 'Create Account'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setPassword('');
                setConfirmPassword('');
                setError('');
              }}
              className="w-full text-center text-xs text-slate-400 font-semibold hover:underline mt-2 cursor-pointer"
            >
              Change Phone Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
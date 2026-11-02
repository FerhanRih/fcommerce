// frontend/src/components/CreateStoreModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Store, MapPin, X, Loader2, Navigation, Clock } from 'lucide-react';
import StoreLocationPicker from './StoreLocationPicker';

const ADDIS_SUBCITIES = [
  'Addis Ketema',
  'Akaki Kaliti',
  'Arada',
  'Bole',
  'Gullele',
  'Kirkos',
  'Kolfe Keranio',
  'Lideta',
  'Nifas Silk-Lafto',
  'Yeka',
  'Lemi Kura'
];

const CreateStoreModal = ({ isOpen, onClose, currentUser, token, existingStore, onCreateStoreSuccess, onStoreCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: 'Bole',
    landmark: '',
    latitude: 9.0300,
    longitude: 38.7400,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedPending, setSubmittedPending] = useState(false);

  // Pre-fill form if editing a rejected or existing store
  useEffect(() => {
    if (existingStore) {
      setFormData({
        name: existingStore.store_name || existingStore.name || '',
        address: existingStore.address || 'Bole',
        landmark: existingStore.landmark || '',
        latitude: existingStore.latitude || 9.0300,
        longitude: existingStore.longitude || 38.7400,
      });
    }
  }, [existingStore, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationSelect = ({ lat, lng }) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Store name is required.');
      return;
    }

    if (!formData.address.trim()) {
      setError('Please select your store sub-city.');
      return;
    }

    const authToken = token || localStorage.getItem('token') || localStorage.getItem('jwt');

    if (!authToken || authToken === 'undefined' || authToken === 'null') {
      setError('Authentication token missing. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      
      // 👇 Always use POST /api/stores (our backend controller handles upsert/resubmission)
      const endpoint = '/api/stores';
      const method = 'post';

      const response = await axios[method](
        endpoint,
        {
          name: formData.name.trim(),
          store_name: formData.name.trim(),
          address: formData.address.trim(),
          landmark: formData.landmark.trim(),
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken.replace(/^Bearer\s+/i, '')}`,
          },
        }
      );
      
      if (response.data.success) {
        const savedStore = response.data.store;
        setSubmittedPending(true);

        setTimeout(() => {
          if (typeof onCreateStoreSuccess === 'function') {
            onCreateStoreSuccess(savedStore);
          } else if (typeof onStoreCreated === 'function') {
            onStoreCreated(savedStore);
          }
          setSubmittedPending(false);
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Store submission error:', err);
      setError(
        err.response?.data?.message || 'Failed to submit store. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-100 my-8">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedPending ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Store Submitted for Review!</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your store is currently under review by FCOMMERCE administration. You will receive an SMS notification once approved.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 bg-[#1E4D58]/10 text-[#1E4D58] rounded-xl">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {existingStore ? 'Update & Resubmit Store' : 'Create Your Store'}
              </h2>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Vendor account phone:{' '}
              <span className="font-semibold text-[#1E4D58]">{currentUser?.phone}</span>
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Store Name *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Merkato Electronics & Hardware"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4D58] focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Store Sub-City (Dispatch Zone) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <select
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E4D58] focus:bg-white transition cursor-pointer"
                    required
                  >
                    {ADDIS_SUBCITIES.map((subcity) => (
                      <option key={subcity} value={subcity}>
                        {subcity} Sub-City, Addis Ababa
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nearest Landmark / Building Details
                </label>
                <div className="relative">
                  <Navigation className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="e.g., Behind Raguel Church, 2nd Floor, Shop #12"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4D58] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <StoreLocationPicker onLocationSelect={handleLocationSelect} />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#1E4D58] hover:bg-[#163C45] rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Submitting...' : (existingStore ? 'Resubmit for Review' : 'Register Store')}</span>
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

export default CreateStoreModal;
// frontend/src/components/admin/SuperAdminStoreApproval.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, User, CheckCircle2, XCircle, 
  Search, ShieldAlert, MapPin, Calendar, Navigation 
} from 'lucide-react';

const SuperAdminStoreApproval = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending'); // 'pending' | 'approved'
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Rejection Modal State
  const [storeToReject, setStoreToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Keep track of previous store count for notification triggers
  const prevCountRef = useRef(0);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Request Browser Notification Permission on Mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 2. Notification Helper for Pending Store Applications
  const checkAndNotifyStores = (storesList) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const count = storesList.filter(s => s.status !== 'approved').length;
    if (count > prevCountRef.current && prevCountRef.current !== 0) {
      new Notification('🏪 FCOMMERCE Store Approval Alert', {
        body: `You have ${count} pending merchant store application(s) awaiting review.`,
        icon: '/logo.png',
        badge: '/logo.png'
      });
    }
    prevCountRef.current = count;
  };

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/stores?tab=${tab}&search=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const fetchedStores = data.stores || [];
        setStores(fetchedStores);
        if (tab === 'pending') {
          checkAndNotifyStores(fetchedStores);
        }
      }
    } catch (error) {
      console.error('Fetch Stores Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh polling every 10 seconds for real-time notification sync
  useEffect(() => {
    fetchStores();
    const interval = setInterval(() => {
      fetchStores();
    }, 10000);
    return () => clearInterval(interval);
  }, [tab, searchQuery]);

  const handleUpdateStatus = async (storeId, newStatus, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/stores/${storeId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, rejectionReason: reason })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`Store successfully ${newStatus.toUpperCase()}!`);
        setStoreToReject(null);
        setRejectionReason('');
        fetchStores();

        // Launch SMS launcher & Browser Notification
        if (data.ownerPhone) {
          const smsMsg = newStatus === 'approved' 
            ? `[FCOMMERCE] Congratulations! Your store has been APPROVED. You can now start listing products and selling on FCOMMERCE.`
            .trim()
            : `[FCOMMERCE] Store Application Update: Unfortunately, your store was not approved. Reason: ${reason || 'Review criteria not met.'}`;
          
          const cleanPhone = data.ownerPhone.startsWith('+') ? data.ownerPhone : `+251${data.ownerPhone.replace(/^0/, '')}`;
          window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(smsMsg)}`;
        }

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('FCOMMERCE Admin', {
            body: `Store application has been ${newStatus}!`,
            icon: '/logo.png'
          });
        }
      } else {
        alert(data.message || 'Failed to update store status.');
      }
    } catch (error) {
      console.error('Update Store Error:', error);
      alert('Network error while updating store status.');
    }
  };

  return (
    <div className="space-y-6">
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E4D58] text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-black flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* REJECTION MODAL */}
      {storeToReject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Reject Store Application</h3>
                <p className="text-xs text-slate-500">Store: {storeToReject.storeName || storeToReject.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Provide a reason for rejection. This will be included in the SMS sent to the merchant.
            </p>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Rejection Reason</label>
              <textarea 
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete business documentation or invalid address..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => { setStoreToReject(null); setRejectionReason(''); }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(storeToReject.id, 'rejected', rejectionReason)}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER & SEARCH BAR */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Store Approval & Merchant Directory</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Review merchant store applications, verify user credentials, and approve store access.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search store, owner, phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#1E4D58]"
          />
        </div>
      </div>

      {/* TABS */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs space-x-1">
        {[
          { id: 'pending', label: '1. Waiting for Approval' },
          { id: 'approved', label: '2. All Approved Stores' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition cursor-pointer text-center ${
              tab === t.id ? 'bg-[#1E4D58] text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* STORES LIST */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold">
            <span>Loading merchant stores directory...</span>
          </div>
        ) : stores.length === 0 ? (
          <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
            <Store className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">No stores found in this queue</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stores.map((store) => (
              <div key={store.id} className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-slate-300 transition space-y-4 bg-slate-50/50">
                
                {/* TOP ROW */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                    <span className="font-black text-[#1E4D58] text-sm">Store ID #{store.id}</span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      store.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {store.status || 'Pending Review'}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-slate-500 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Applied: {new Date(store.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* STORE & OWNER DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  {/* STORE INFO */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center space-x-2 text-[#1E4D58]">
                      <Store className="w-4 h-4 shrink-0" />
                      <span className="font-black uppercase text-[10px] tracking-wider">Store & Specific Address</span>
                    </div>
                    <p className="font-extrabold text-slate-900 text-sm break-words">{store.storeName || store.name || 'Store Name'}</p>
                    <p className="text-slate-700 flex items-start gap-1 break-words">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span><strong>Sub-City/Address:</strong> {store.address || 'Not specified'}</span>
                    </p>
                    {store.landmark && (
                      <p className="text-slate-600 flex items-start gap-1 break-words">
                        <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span><strong>Landmark/Building:</strong> {store.landmark}</span>
                      </p>
                    )}
                  </div>

                  {/* MERCHANT OWNER INFO */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center space-x-2 text-emerald-700">
                      <User className="w-4 h-4 shrink-0" />
                      <span className="font-black uppercase text-[10px] tracking-wider">Merchant Owner Profile</span>
                    </div>
                    <p className="font-extrabold text-slate-900 text-sm break-words">{store.ownerName || 'Merchant User'}</p>
                    <p className="text-slate-700 font-mono font-bold">Phone: {store.phone || 'N/A'}</p>
                    <p className="text-slate-500">Email: {store.email || 'N/A'}</p>
                  </div>

                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-bold">
                    Linked User ID: #{store.userId || 'N/A'}
                  </span>

                  <div className="flex space-x-2">
                    {tab === 'pending' && (
                      <>
                        <button
                          onClick={() => setStoreToReject(store)}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-xl cursor-pointer transition flex items-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(store.id, 'approved')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer shadow-xs transition flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Store</span>
                        </button>
                      </>
                    )}

                    {tab === 'approved' && (
                      <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active Approved Merchant</span>
                      </span>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default SuperAdminStoreApproval;
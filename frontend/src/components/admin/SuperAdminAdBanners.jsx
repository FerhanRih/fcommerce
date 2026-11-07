// frontend/src/components/admin/SuperAdminAdBanners.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Megaphone, CheckCircle2, XCircle, RefreshCw, DollarSign, Clock, Check, X, Eye, Plus, Trash2, Edit3, ShieldCheck 
} from 'lucide-react';
import API, { API_URL } from '../../services/api';

const SuperAdminAdBanners = () => {
  const [banners, setBanners] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  
  // Ad Sub-Tab State ('live' | 'requests')
  const [activeAdTab, setActiveAdTab] = useState('live');

  // New House Ad Form State
  const [newAd, setNewAd] = useState({ title: '', subtitle: '', cta: 'EXPLORE CATALOG', tag: 'HOUSE AD', linkUrl: '', packageName: 'Admin Custom Spotlight', price: 0, durationDays: 7, imageFile: null });
  // Payment Account Form State
  const [accountForm, setAccountForm] = useState({ id: null, bankName: '', accountNumber: '', accountHolder: '', instructions: '' });

  // Keep track of previous pending requests count for notifications
  const prevPendingCountRef = useRef(0);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchBanners = async () => {
    try {
      const token = localStorage.getItem('token');
      
const response = await API.get('/admin/ad-banners');
const data = response.data;
      if (data.success) {
        const fetchedBanners = data.banners || [];
        const pendingCount = fetchedBanners.filter(b => b.status === 'pending').length;
        
        // 🛠️ Fixed lowercase 'granted' permission check
        if (pendingCount > prevPendingCountRef.current && prevPendingCountRef.current !== 0) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('📢 New Ad Campaign Request!', {
              body: 'A vendor has submitted a new ad banner for review.',
              icon: '/logo.png',
              badge: '/logo.png'
            });
          }
        }
        prevPendingCountRef.current = pendingCount;
        setBanners(fetchedBanners);
      }
    } catch (error) {
      console.error('Fetch Banners Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentAccounts = async () => {
    try {
  const response = await API.get('/admin/payment-accounts');
  const data = response.data;
  if (data.success) setPaymentAccounts(data.accounts || []);
} catch (err) { 
  console.error(err); 
}
  };

  useEffect(() => {
    fetchBanners();
    fetchPaymentAccounts();
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    const interval = setInterval(fetchBanners, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBannerAction = async (bannerId, action, extraBody = {}) => {
    try {
      const token = localStorage.getItem('token');
     const response = await API.put(`/admin/ad-banners/${bannerId}`, {
  action,
  ...extraBody
});
const data = response.data;
      if (data.success) {
        showToast(`Banner campaign ${action}d successfully!`);
        fetchBanners();
      }
    } catch (error) {
      alert('Action failed.');
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('title', newAd.title);
    formData.append('subtitle', newAd.subtitle);
    formData.append('cta', newAd.cta);
    formData.append('tag', newAd.tag);
    formData.append('linkUrl', newAd.linkUrl);
    formData.append('packageName', newAd.packageName);
    formData.append('price', newAd.price);
    formData.append('durationDays', newAd.durationDays);
    if (newAd.imageFile) formData.append('image', newAd.imageFile);

    try {
      const response = await API.post('/admin/ad-banners/create', formData);
const data = response.data;
      if (data.success) {
        showToast('House ad published successfully!');
        setShowCreateModal(false);
        setNewAd({ title: '', subtitle: '', cta: 'EXPLORE CATALOG', tag: 'HOUSE AD', linkUrl: '', packageName: 'Admin Custom Spotlight', price: 0, durationDays: 7, imageFile: null });
        fetchBanners();
      }
    } catch (err) { alert('Failed to create ad.'); }
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await API.post('/admin/payment-accounts', accountForm);
const data = response.data;
      if (data.success) {
        showToast('Payment account saved!');
        setShowAccountModal(false);
        setAccountForm({ id: null, bankName: '', accountNumber: '', accountHolder: '', instructions: '' });
        fetchPaymentAccounts();
      }
    } catch (err) { alert('Failed to save account.'); }
  };

  const handleDeleteAccount = async (id) => {
  if (!confirm('Remove this payment account?')) return;
  try {
    await API.delete(`/admin/payment-accounts/${id}`);
    showToast('Payment account removed.');
    fetchPaymentAccounts();
  } catch (err) { alert('Failed to delete.'); }
};

  // Filtered lists based on active tab (Completely hides expired ads)
  const filteredBanners = banners.filter(ad => {
    const now = new Date();
    const isExpired = (ad.status === 'expired') || (ad.expiresAt && new Date(ad.expiresAt) < now);

    // 🛑 Never show expired ads anywhere under any condition
    if (isExpired) return false;

    if (activeAdTab === 'live') {
      return ad.status === 'active';
    } else {
      // Requests tab: Strictly pending submissions waiting for review
      return ad.status === 'pending';
    }
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E4D58] text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-black flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Ad Campaigns & Payment Accounts Hub</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage live ads, review vendor applications, and maintain payment deposit accounts.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Create House Ad</span>
          </button>
          <button onClick={() => setShowAccountModal(true)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
            <DollarSign className="w-4 h-4" />
            <span>Manage Payment Accounts</span>
          </button>
          <button onClick={() => setShowPackageModal(true)} className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
            <Clock className="w-4 h-4" />
            <span>Edit Ad Packages (Prices & Days)</span>
          </button>
          <button onClick={fetchBanners} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* PAYMENT ACCOUNTS PREVIEW SECTION */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Active Vendor Deposit Accounts (Visible on User Checkout)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {paymentAccounts.map(acc => (
            <div key={acc.id} className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-900">{acc.bankName}</p>
                <p className="text-[11px] font-mono text-slate-600">{acc.accountNumber} ({acc.accountHolder})</p>
              </div>
              <button onClick={() => handleDeleteAccount(acc.id)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* AD SUB-TABS (LIVE ADS VS REQUESTS) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex gap-2">
        <button
          onClick={() => setActiveAdTab('live')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeAdTab === 'live' ? 'bg-[#1E4D58] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-4 h-4 shrink-0" />
          <span>Live Ads ({banners.filter(b => b.status === 'active' && (!b.expiresAt || new Date(b.expiresAt) > new Date())).length})</span>
        </button>

        <button
          onClick={() => setActiveAdTab('requests')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeAdTab === 'requests' ? 'bg-[#1E4D58] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Advertiser Requests ({banners.filter(b => b.status === 'pending').length})</span>
        </button>
      </div>

      {/* AD CAMPAIGN LIST SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          {activeAdTab === 'live' ? 'Currently Running Live Campaigns' : 'Pending, Rejected & Expired Requests'}
        </h3>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-bold">Loading campaigns...</div>
        ) : filteredBanners.length === 0 ? (
          <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-bold">
            {activeAdTab === 'live' ? 'No active ads currently running.' : 'No pending ad campaign requests.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBanners.map((ad) => {
              const storeName = ad.Store?.store_name || ad.Store?.name || 'House / Admin Ad';
              const vendorPhone = ad.Store?.phoneNumber || ad.User?.phone || 'N/A';
              const isExpired = ad.expiresAt && new Date(ad.expiresAt) < new Date();

              return (
                <div key={ad.id} className="border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-900 text-sm">{storeName}</h4>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isExpired ? 'bg-slate-200 text-slate-700' :
                        ad.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        ad.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isExpired ? 'Expired' : ad.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">
                      Package: <strong>{ad.packageName}</strong> • Price: <span className="text-[#1E4D58] font-black">{ad.price} ETB</span> • Duration: <strong>{ad.durationDays} Days</strong>
                    </p>
                    <p className="text-xs text-slate-400">Vendor Phone: {vendorPhone}</p>
                    {ad.rejectionReason && <p className="text-[11px] text-rose-600 font-bold">Rejection Reason: {ad.rejectionReason}</p>}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {ad.imageUrl && (
                      <button onClick={() => setSelectedImage(ad.imageUrl)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer">
                        <Eye className="w-3.5 h-3.5" /> Banner
                      </button>
                    )}
                    {ad.paymentReceiptUrl && (
                      <button onClick={() => setSelectedReceipt(ad.paymentReceiptUrl)} className="px-3 py-2 bg-[#1E4D58]/10 text-[#1E4D58] font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer">
                        <Eye className="w-3.5 h-3.5" /> Receipt
                      </button>
                    )}

                    <button onClick={() => {
                      const newDays = prompt('Enter new duration days for this campaign:', ad.durationDays);
                      if (newDays && !isNaN(newDays)) handleBannerAction(ad.id, 'update', { durationDays: Number(newDays) });
                    }} className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer">
                      Edit Days
                    </button>

                    {ad.status !== 'active' && (
                      <button onClick={() => handleBannerAction(ad.id, 'approve')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer">
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}

                    {ad.status !== 'rejected' && (
                      <button onClick={() => {
                        const reason = prompt('Enter rejection reason for applicant visibility:');
                        if (reason) handleBannerAction(ad.id, 'reject', { rejectionReason: reason });
                      }} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer">
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE HOUSE AD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleCreateAd} className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900">Create Manual / House Ad Banner</h3>
            <input type="text" placeholder="Ad Title" value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} className="w-full p-3 border rounded-xl text-xs font-bold" required />
            <input type="text" placeholder="Subtitle / Description" value={newAd.subtitle} onChange={e => setNewAd({...newAd, subtitle: e.target.value})} className="w-full p-3 border rounded-xl text-xs font-bold" />
            <input type="text" placeholder="CTA Button Text (e.g. EXPLORE NOW)" value={newAd.cta} onChange={e => setNewAd({...newAd, cta: e.target.value})} className="w-full p-3 border rounded-xl text-xs font-bold" />
            <input type="number" placeholder="Duration Days (e.g. 7)" value={newAd.durationDays} onChange={e => setNewAd({...newAd, durationDays: e.target.value})} className="w-full p-3 border rounded-xl text-xs font-bold" required />
            <div>
              <label className="text-[11px] font-black text-slate-500">Banner Image File</label>
              <input type="file" onChange={e => setNewAd({...newAd, imageFile: e.target.files[0]})} className="w-full text-xs mt-1" required />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black text-xs cursor-pointer">Cancel</button>
              <button type="submit" className="flex-2 py-3 bg-[#1E4D58] text-white rounded-xl font-black text-xs cursor-pointer">Publish Ad Now</button>
            </div>
          </form>
        </div>
      )}

      {/* PAYMENT ACCOUNT MODAL */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleSaveAccount} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900">Add / Edit Payment Deposit Account</h3>
            <input type="text" placeholder="Bank / Platform Name (e.g. CBE / Telebirr)" value={accountForm.bankName} onChange={e => setAccountForm({...accountForm, bankName: e.target.value})} className="w-full p-3 border rounded-xl text-xs font-bold" required />
            <input type="text" placeholder="Account Number" value={accountForm.accountNumber} onChange={e => setAccountForm({...accountForm, accountNumber: e.target.value})} className="w-full p-3 border rounded-xl text-xs font-bold" required />
            <input type="text" placeholder="Account Holder Name" value={accountForm.accountHolder} onChange={e => setAccountForm({...accountForm, accountHolder: e.target.value})} className="w-full p-3 border rounded-xl text-xs font-bold" required />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowAccountModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black text-xs cursor-pointer">Cancel</button>
              <button type="submit" className="flex-2 py-3 bg-[#1E4D58] text-white rounded-xl font-black text-xs cursor-pointer">Save Account</button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT AD PACKAGES MODAL */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">Manage Advertising Packages (Prices & Durations)</h3>
              <button onClick={() => setShowPackageModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            
            <div className="space-y-3">
              {adPackages.map((pkg) => (
                <div key={pkg.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-xs">{pkg.name}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold">{pkg.days} Days • {pkg.price.toLocaleString()} ETB</p>
                  </div>
                  <button
                    onClick={() => {
                      const newPrice = prompt(`Enter new price for ${pkg.name} (ETB):`, pkg.price);
                      const newDays = prompt(`Enter new duration days for ${pkg.name}:`, pkg.days);
                      if (newPrice !== null && newDays !== null) {
                        setAdPackages(adPackages.map(p => p.id === pkg.id ? { ...p, price: Number(newPrice) || p.price, days: Number(newDays) || p.days } : p));
                        showToast(`Package "${pkg.name}" updated successfully!`);
                      }
                    }}
                    className="px-3 py-1.5 bg-[#1E4D58] text-white font-black text-[11px] rounded-xl cursor-pointer"
                  >
                    Edit Package
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => setShowPackageModal(false)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl cursor-pointer">
              Close & Save
            </button>
          </div>
        </div>
      )}

      {selectedImage && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
    <div className="bg-white rounded-3xl p-4 max-w-2xl w-full relative space-y-3">
      <div className="flex justify-between items-center border-b pb-2">
        <h4 className="text-xs font-black uppercase text-slate-700">Banner Artwork Preview</h4>
        <button onClick={() => setSelectedImage(null)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full font-black text-xs text-slate-800 cursor-pointer">✕ Close</button>
      </div>
      <img src={selectedImage.startsWith('http') ? selectedImage : `${API_URL}${selectedImage}`} alt="Banner" className="max-w-full max-h-[70vh] object-contain mx-auto rounded-xl" />
    </div>
  </div>
)}
{selectedReceipt && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
    <div className="bg-white rounded-3xl p-4 max-w-2xl w-full relative space-y-3">
      <div className="flex justify-between items-center border-b pb-2">
        <h4 className="text-xs font-black uppercase text-slate-700">Payment Receipt Preview</h4>
        <button onClick={() => setSelectedReceipt(null)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full font-black text-xs text-slate-800 cursor-pointer">✕ Close</button>
      </div>
      <img src={selectedReceipt.startsWith('http') ? selectedReceipt : `${API_URL}${selectedReceipt}`} alt="Receipt" className="max-w-full max-h-[70vh] object-contain mx-auto rounded-xl" />
    </div>
  </div>
      )}
    </div>
  );
};

export default SuperAdminAdBanners;
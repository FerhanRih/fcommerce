// frontend/src/components/UserAdHubModal.jsx
import React, { useState, useEffect } from 'react';
import { Megaphone, Upload, CheckCircle2, XCircle, Clock, ShieldCheck, Plus, ArrowLeft, Eye } from 'lucide-react';
import API, { API_URL } from '../services/api';

export default function UserAdHubModal({ onClose }) {
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [myBanners, setMyBanners] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [packages, setPackages] = useState([]); // 👉 Dynamic packages fetched from database
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Image Preview Modal State
  const [previewImage, setPreviewImage] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Helper to safely resolve image paths using your imported API_URL
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path;
    const base = API_URL ? API_URL.replace('/api', '') : 'https://fcommerce-backenddd.onrender.com';
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const fetchMyData = async () => {
    try {
      setLoading(true);
      const [bannersRes, accountsRes, pkgsRes] = await Promise.all([
        API.get('/banners/my-campaigns'),
        API.get('/admin/payment-accounts'),
        API.get('/banners/packages') // 👉 Fetch dynamic live packages
      ]);
      
      if (Array.isArray(bannersRes.data)) setMyBanners(bannersRes.data);
      if (accountsRes.data.success) setPaymentAccounts(accountsRes.data.accounts || []);
      if (pkgsRes.data.success && pkgsRes.data.packages.length > 0) {
        setPackages(pkgsRes.data.packages);
        setSelectedPkg(pkgsRes.data.packages[0]); // Default to first active package
      }
    } catch (err) {
      console.error('Error fetching user campaigns & packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyData();
  }, []);

  const handleSubmitAd = async (e) => {
    e.preventDefault();
    if (!imageFile || !receiptFile) {
      showToast('Please upload both your banner artwork and your payment receipt screenshot.');
      return;
    }

    if (!selectedPkg) {
      showToast('Please select an active advertising package.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('subtitle', subtitle);
    formData.append('linkUrl', linkUrl || '#');
    formData.append('packageName', selectedPkg.name);
    formData.append('price', selectedPkg.price);
    formData.append('durationDays', selectedPkg.days);
    formData.append('image', imageFile);
    formData.append('receipt', receiptFile);
      
    try {
      const response = await API.post('/banners/submit', formData);
      if (response.data.success) {
        showToast('Ad campaign request submitted successfully!');
        setTitle('');
        setSubtitle('');
        setImageFile(null);
        setReceiptFile(null);
        setView('list');
        fetchMyData();
      } else {
        showToast(response.data.message || 'Failed to submit campaign.');
      }
    } catch (err) {
      showToast('Network error during ad submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 relative shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        
        {toast && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs font-black flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-3">
            {view === 'create' && (
              <button onClick={() => setView('list')} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">
                <ArrowLeft className="w-4 h-4 text-slate-700" />
              </button>
            )}
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#1E4D58]" />
                {view === 'list' ? 'My Ad Campaigns & Tracker' : 'Create New Ad Campaign'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {view === 'list' ? 'Track active countdowns, review feedback, or launch a new campaign.' : 'Select package, upload artwork and payment receipt.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full font-black text-xs text-slate-700 cursor-pointer">✕</button>
        </div>

        {/* VIEW 1: CAMPAIGNS LIST & TRACKER */}
        {view === 'list' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Submitted & Active Campaigns</h3>
              <button onClick={() => setView('create')} className="px-4 py-2.5 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm">
                <Plus className="w-4 h-4" />
                <span>Run New Ad Campaign</span>
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">Loading your campaigns...</div>
            ) : myBanners.filter(ad => {
                const now = new Date();
                return !(ad.status === 'expired' || (ad.expiresAt && new Date(ad.expiresAt) < now));
              }).length === 0 ? (
              <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">No active ad campaigns running.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myBanners
                  .filter(ad => {
                    const now = new Date();
                    return !(ad.status === 'expired' || (ad.expiresAt && new Date(ad.expiresAt) < now));
                  })
                  .map((ad) => {
                    const now = new Date();
                    const daysLeft = ad.expiresAt ? Math.max(0, Math.ceil((new Date(ad.expiresAt) - now) / (1000 * 60 * 60 * 24))) : ad.durationDays;

                    return (
                      <div key={ad.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-900 text-sm">{ad.title || 'Untitled Campaign'}</h4>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              ad.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                              ad.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ad.status || 'Pending'}
                            </span>
                          </div>
                          <span className="text-xs font-black text-[#1E4D58]">{ad.price} ETB</span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <p>Package: <strong>{ad.packageName}</strong></p>
                          <p className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{ad.status === 'active' ? `${daysLeft} Days Remaining` : `Duration: ${ad.durationDays} Days`}</span>
                          </p>
                        </div>

                        {ad.imageUrl && (
                          <div className="flex items-center gap-2 pt-1">
                            <button onClick={() => setPreviewImage(ad.imageUrl)} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer">
                              <Eye className="w-3.5 h-3.5" /> View Submitted Artwork
                            </button>
                          </div>
                        )}

                        {ad.status === 'rejected' && ad.rejectionReason && (
                          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-700 font-bold flex items-start gap-2">
                            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-black">Review Feedback:</span> {ad.rejectionReason}
                            </div>
                          </div>
                        )}

                        {ad.status === 'active' && (
                          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Congratulations! Your campaign is live and currently spotlighted on the marketplace home page.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: CREATE & PAY FORM */}
        {view === 'create' && (
          <form onSubmit={handleSubmitAd} className="space-y-5">
            {/* 1. DYNAMIC PACKAGE SELECTION */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider">1. Select Advertising Package</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {packages.map(pkg => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`border rounded-2xl p-3.5 cursor-pointer transition ${
                      selectedPkg?.id === pkg.id ? 'border-[#1E4D58] bg-[#1E4D58]/5 ring-2 ring-[#1E4D58]/20' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <h4 className="font-black text-slate-900 text-xs">{pkg.name}</h4>
                    <p className="text-sm font-black text-[#1E4D58] mt-1">{pkg.price.toLocaleString()} ETB</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{pkg.days} Days Spotlight</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. PAYMENT INSTRUCTIONS & ACCOUNT LIST */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
              <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                2. Deposit Payment to Verified Accounts
              </h4>
              <p className="text-[11px] text-amber-800 font-medium">Please transfer <strong>{selectedPkg?.price || 0} ETB</strong> to one of the accounts below before uploading your payment receipt screenshot:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {paymentAccounts.map(acc => (
                  <div key={acc.id} className="bg-white border border-amber-200 p-2.5 rounded-xl text-xs font-bold text-slate-800">
                    <p className="font-black text-[#1E4D58]">{acc.bankName}</p>
                    <p className="font-mono text-[11px]">{acc.accountNumber}</p>
                    <p className="text-[10px] text-slate-500">Holder: {acc.accountHolder}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. BANNER & FORM DETAILS */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider">3. Campaign Details & Artwork</label>
              <input type="text" placeholder="Campaign Title (e.g. Wholesale Steel Promotion)" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 border rounded-xl text-xs font-bold" required />
              <input type="text" placeholder="Subtitle / Short Description" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full p-3 border rounded-xl text-xs font-bold" />
              <input type="text" placeholder="Destination Link URL (optional)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="w-full p-3 border rounded-xl text-xs font-bold" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-black text-slate-500">Banner Artwork Image</label>
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full text-xs mt-1" required />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-500">Payment Receipt Screenshot</label>
                  <input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files[0])} className="w-full text-xs mt-1" required />
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button type="button" onClick={() => setView('list')} className="flex-1 py-3 bg-slate-100 rounded-xl font-black text-xs cursor-pointer">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-2 py-3 bg-[#1E4D58] hover:bg-[#163C45] text-white rounded-xl font-black text-xs shadow-md transition cursor-pointer">
                {submitting ? 'Submitting Request...' : 'Submit Ad Request'}
              </button>
            </div>
          </form>
        )}

      </div>

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-4 max-w-2xl w-full relative space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="text-xs font-black uppercase text-slate-700">Artwork Preview</h4>
              <button onClick={() => setPreviewImage(null)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full font-black text-xs text-slate-800 cursor-pointer">✕ Close</button>
            </div>
            <img src={getImageUrl(previewImage)} alt="Artwork Preview" className="max-w-full max-h-[70vh] object-contain mx-auto rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
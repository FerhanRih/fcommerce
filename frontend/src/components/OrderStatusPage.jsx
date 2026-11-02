// frontend/src/components/OrderStatusPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function OrderStatusPage({ orderId, onBackToMarketplace, onTryAnotherStore }) {
  const [order, setOrder] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [loading, setLoading] = useState(true);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fetchOrderStatus = async () => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.get(`http://localhost:5000/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.data.success) {
      setOrder(response.data.order);
      setTimeLeft(response.data.remainingSeconds || 0);
    }
  } catch (err) {
    console.error('Error fetching order status:', err);
  } finally {
    setLoading(false);
  }
};

// Extract and parse real merchant bank accounts from the order's store
  const getRealBankAccounts = () => {
    let rawAccounts = order?.store?.bankAccounts;
    if (typeof rawAccounts === 'string') {
      try {
        rawAccounts = JSON.parse(rawAccounts);
      } catch (e) {
        rawAccounts = [];
      }
    }
    return Array.isArray(rawAccounts) ? rawAccounts : [];
  };

  const realBankAccounts = getRealBankAccounts();


  useEffect(() => {
    fetchOrderStatus();
    // Poll status every 5 seconds
    const interval = setInterval(fetchOrderStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Countdown clock tick
  useEffect(() => {
    if (order?.status !== 'pending_merchant' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          fetchOrderStatus(); // Trigger auto-expire check
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, order?.status]);

  // Format seconds into MM:SS
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleUploadReceipt = async (e) => {
  e.preventDefault();
  if (!receiptFile) {
    setFeedback({ type: 'error', text: 'Please select a payment receipt image first.' });
    return;
  }

  setUploading(true);
  setFeedback({ type: '', text: '' });
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('receipt', receiptFile);

  try {
    const response = await axios.put(`http://localhost:5000/api/orders/${orderId}/upload-receipt`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      setUploadSuccess(true);
      setFeedback({ type: 'success', text: '✓ Payment receipt uploaded successfully!' });
      fetchOrderStatus();
    }
  } catch (err) {
    console.error('Receipt upload error:', err);
    setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to upload receipt screenshot.' });
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Back Navigation Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToMarketplace}
            className="text-xs font-bold text-slate-700 hover:text-[#1E4D58] transition cursor-pointer"
          >
            ← Back to Marketplace
          </button>
          <span className="text-xs font-black text-[#1E4D58]">
            Order #{orderId}
          </span>
        </div>

        {/* 1. STATUS: PENDING MERCHANT ACCEPTANCE (10-MIN TIMER) */}
        {order?.status === 'pending_merchant' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-xs space-y-4">
            <div className="inline-block px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-black uppercase tracking-wider">
              Waiting for Merchant Approval
            </div>

            <h2 className="text-xl font-black text-slate-900">
              Merchant Response Countdown
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              We have notified the merchant. If they do not respond within 10 minutes, your order request will be automatically canceled.
            </p>

            {/* Countdown Clock Display */}
            <div className="py-4 my-2 bg-slate-900 text-amber-400 rounded-2xl font-mono text-3xl font-black tracking-widest shadow-inner max-w-xs mx-auto">
              {formatTimer(timeLeft)}
            </div>

            <div className="pt-2 text-[11px] text-slate-400 font-semibold">
              Please keep this page open or check your SMS link.
            </div>
          </div>
        )}

        {/* 2. STATUS: REJECTED OR EXPIRED */}
        {(order?.status === 'rejected' || order?.status === 'expired') && (
          <div className="bg-white border border-rose-200 rounded-3xl p-6 text-center shadow-xs space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-black text-xl mx-auto">
              ✕
            </div>

            <h2 className="text-xl font-black text-slate-900">
              {order.status === 'expired' ? 'Order Request Expired' : 'Order Request Declined'}
            </h2>

            <p className="text-xs text-rose-700 font-bold bg-rose-50 p-3 rounded-2xl border border-rose-100">
              {order.status === 'expired'
                ? 'We apologize! The merchant did not accept the request within the 10-minute window.'
                : `Merchant note: "${order.rejectionReason || 'Item currently unavailable.'}"`}
            </p>

            <p className="text-xs text-slate-500 font-medium">
              We sincerely apologize for the inconvenience. Would you like to explore alternative stores selling similar items?
            </p>

            <button
              onClick={onTryAnotherStore}
              className="w-full py-3 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs rounded-2xl uppercase tracking-wider shadow-md transition cursor-pointer"
            >
              Explore Alternative Stores
            </button>
          </div>
        )}

        {/* 3. STATUS: ACCEPTED -> SHOW BANK ACCOUNTS & SCREENSHOT UPLOADER */}
        {(order?.status === 'accepted' || order?.status === 'payment_uploaded') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="text-center space-y-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black uppercase tracking-wider">
                Order Accepted by Merchant!
              </span>
              <h2 className="text-lg font-black text-slate-900">
                Complete Bank Transfer
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Transfer the product subtotal ({Number(order.subtotal || order.totalAmount).toLocaleString()} ETB) to any of the merchant bank accounts below, then upload your payment screenshot.
              </p>
            </div>

            {/* Price Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-bold space-y-1.5">
              <div className="flex justify-between text-slate-700">
                <span>Product Subtotal to Transfer:</span>
                <span className="text-[#1E4D58] font-black text-sm">{Number(order.subtotal).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Estimated Delivery Fee:</span>
                <span>{Number(order.deliveryFee || 200).toLocaleString()} ETB</span>
              </div>
              <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200/60 mt-2 font-semibold">
                * Reminder: Delivery fee is paid directly in cash/transfer upon physical arrival of your items.
              </p>
            </div>

                        {/* Store Name & Order Breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Store / Vendor</span>
              <h3 className="text-sm font-black text-slate-900">{order?.store?.storeName || 'Partner Store'}</h3>
            </div>
            <span className="text-xs font-bold text-[#1E4D58] bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
              Status: {order?.status.toUpperCase()}
            </span>
          </div>

          {/* Items List (Showing approved vs rejected quantities) */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-700 uppercase">Ordered Items:</span>
            {(() => {
              let items = order?.items;
              if (typeof items === 'string') {
                try { items = JSON.parse(items); } catch (e) { items = []; }
              }
              return Array.isArray(items) ? items.map((item, idx) => (
                <div key={idx} className={`p-3 rounded-2xl border text-xs flex justify-between items-center ${item.status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <span className="font-extrabold block">{item.name || item.title}</span>
                    <span className="text-[11px] text-slate-500">
                      Price: {Number(item.price || 0).toLocaleString()} ETB | Qty Ordered: {item.quantity}
                      {item.approvedQuantity !== undefined && item.approvedQuantity !== item.quantity && (
                        <span className="font-bold text-amber-700 ml-2">→ Approved Qty: {item.approvedQuantity}</span>
                      )}
                    </span>
                    {item.status === 'rejected' && <span className="text-[10px] font-black text-rose-600 block mt-0.5">✕ Rejected by merchant</span>}
                  </div>
                  <span className="font-black text-slate-900">
                    {Number(item.price * (item.approvedQuantity !== undefined ? item.approvedQuantity : item.quantity)).toLocaleString()} ETB
                  </span>
                </div>
              )) : null;
            })()}
          </div>

          {/* Merchant Rejection / Adjustment Note */}
          {order?.rejectionReason && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-900">
              💬 Merchant Note: "{order.rejectionReason}"
            </div>
          )}
        </div>


            {/* Merchant Bank Accounts */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Select Bank Account
              </h3>
              {realBankAccounts.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-800">
                  ⚠️ The merchant has not configured any bank accounts yet. Please contact them.
                </div>
              ) : (
                realBankAccounts.map((b, idx) => (
                  <div key={b.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-slate-900 block">{b.bankName}</span>
                      <span className="text-slate-500 font-medium">Acc: {b.accountNumber}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#1E4D58] bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                      {b.accountHolder}
                    </span>
                  </div>
                ))
              )}
            </div>


            {/* Screenshot Receipt Upload Form */}
            {order.status === 'payment_uploaded' || uploadSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                <span className="text-emerald-800 font-black text-xs uppercase block">
                  ✓ Payment Receipt Uploaded
                </span>
                <p className="text-[11px] text-emerald-700 font-medium">
                  Your payment screenshot has been received and is being verified by the merchant for immediate dispatch.
                </p>
              </div>
            ) : (
              <form onSubmit={handleUploadReceipt} className="space-y-3 pt-2">
                <label className="block text-xs font-black text-slate-800 uppercase">
                  Upload Payment Screenshot
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files[0])}
                  required
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1E4D58] file:text-white hover:file:bg-[#163C45] cursor-pointer"
                />
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3.5 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs rounded-2xl uppercase tracking-wider shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {uploading ? 'Uploading Receipt...' : 'Confirm & Send Payment Receipt'}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
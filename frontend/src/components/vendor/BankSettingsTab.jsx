// frontend/src/components/vendor/BankSettingsTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function BankSettingsTab({ currentStore, setActiveStoreTab, onUpdate }) {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankName, setBankName] = useState('Commercial Bank of Ethiopia (CBE)');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const pendingOrderId = localStorage.getItem('pendingOrderIdForAccept');

  // Sync store accounts whenever currentStore updates
  useEffect(() => {
    if (currentStore?.bankAccounts) {
      try {
        const parsed = typeof currentStore.bankAccounts === 'string'
          ? JSON.parse(currentStore.bankAccounts)
          : currentStore.bankAccounts;
        setBankAccounts(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setBankAccounts([]);
      }
    }
  }, [currentStore]);

  // Handle adding an account and saving permanently
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!accountNumber || !accountHolder) {
      setStatusMsg({ type: 'error', text: 'Please fill in both account number and account holder name.' });
      return;
    }

    setStatusMsg({ type: '', text: '' });
    const newAccounts = [...bankAccounts, { id: Date.now(), bankName, accountNumber, accountHolder }];
    
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(
        `http://localhost:5000/api/stores/${currentStore.id}`,
        { bankAccounts: newAccounts },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const savedAccounts = response.data.store.bankAccounts;
        const parsed = typeof savedAccounts === 'string' ? JSON.parse(savedAccounts) : savedAccounts;
        setBankAccounts(Array.isArray(parsed) ? parsed : newAccounts);
        
        setAccountNumber('');
        setAccountHolder('');
        setStatusMsg({ type: 'success', text: '✓ Bank account added and saved permanently!' });
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000);
        
        if (typeof onUpdate === 'function') {
          onUpdate(response.data.store);
        }
      }
    } catch (err) {
      console.error('Error adding bank account:', err);
      setStatusMsg({ type: 'error', text: 'Failed to save new bank account to database.' });
    }
  };

  // Handle removing an account permanently
  const handleDeleteAccount = async (id) => {
    const updatedAccounts = bankAccounts.filter((acc) => acc.id !== id);
    setBankAccounts(updatedAccounts); // Remove from local UI immediately

    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(
        `http://localhost:5000/api/stores/${currentStore.id}`,
        { bankAccounts: updatedAccounts },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const savedAccounts = response.data.store.bankAccounts;
        const parsed = typeof savedAccounts === 'string' ? JSON.parse(savedAccounts) : savedAccounts;
        setBankAccounts(Array.isArray(parsed) ? parsed : updatedAccounts);

        setStatusMsg({ type: 'success', text: '✓ Bank account removed successfully.' });
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000);
        
        if (typeof onUpdate === 'function') {
          onUpdate(response.data.store); 
        }
      }
    } catch (err) {
      console.error('Error removing bank account:', err);
      setStatusMsg({ type: 'error', text: 'Failed to sync deletion with database.' });
    }
  };

  // Save all accounts to database and optionally accept pending order
  const handleSaveAndFinish = async (shouldAcceptOrder = false) => {
    setLoading(true);
    setStatusMsg({ type: '', text: '' });
    const token = localStorage.getItem('token');

    try {
      const response = await axios.put(
        `http://localhost:5000/api/stores/${currentStore.id}`,
        { bankAccounts },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const savedAccounts = response.data.store.bankAccounts;
        const parsed = typeof savedAccounts === 'string' ? JSON.parse(savedAccounts) : savedAccounts;
        setBankAccounts(Array.isArray(parsed) ? parsed : bankAccounts);

        if (typeof onUpdate === 'function') {
          onUpdate(response.data.store); 
        }

        if (shouldAcceptOrder && pendingOrderId) {
          localStorage.removeItem('pendingOrderIdForAccept');
          
          await axios.put(
            `http://localhost:5000/api/orders/${pendingOrderId}/merchant-response`,
            { action: 'accept' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setStatusMsg({ type: 'success', text: '✓ Bank accounts saved & order accepted successfully!' });
          
          setTimeout(() => {
            if (typeof setActiveStoreTab === 'function') {
              setActiveStoreTab('orders');
            }
          }, 1200);
        } else {
          setStatusMsg({ type: 'success', text: '✓ Bank accounts saved successfully!' });
        }
      }
    } catch (err) {
      console.error('Error saving bank accounts:', err);
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save bank accounts.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl bg-white p-6 rounded-3xl border border-slate-200">
      <div>
        <h3 className="text-sm font-black text-slate-900 uppercase">Payout & Bank Account Settings</h3>
        <p className="text-xs text-slate-500 mt-1">
          Add one or multiple bank or mobile money accounts (CBE, Telebirr, etc.) for customer payments.
        </p>
        {statusMsg.text && (
          <div className={`mt-3 p-3 rounded-2xl text-xs font-bold border ${
            statusMsg.type === 'error' 
              ? 'bg-rose-50 border-rose-200 text-rose-800' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {statusMsg.text}
          </div>
        )}
        {pendingOrderId && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-800">
            ⚠️ You were interrupted while accepting Order #{pendingOrderId}. Add your accounts below and click "Save & Accept Order" when you are done!
          </div>
        )}
      </div>

      {/* Existing / Added Accounts List */}
      <div className="space-y-3">
        <span className="text-xs font-black text-slate-700 uppercase">Configured Accounts ({bankAccounts.length}):</span>
        {bankAccounts.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-500">
            No accounts added yet. Add at least one account below.
          </div>
        ) : (
          bankAccounts.map((acc) => (
            <div key={acc.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <span className="text-xs font-black text-slate-900 block">{acc.bankName}</span>
                <span className="text-xs font-bold text-[#1E4D58]">Acc: {acc.accountNumber}</span>
                <span className="text-[10px] text-slate-500 block">Holder: {acc.accountHolder}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteAccount(acc.id)}
                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl cursor-pointer"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add New Account Form */}
      <form onSubmit={handleAddAccount} className="space-y-4 pt-4 border-t border-slate-100">
        <span className="text-xs font-black text-slate-700 uppercase">Add Another Account:</span>
        
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Bank / Provider</label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
          >
            <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE)</option>
            <option value="Telebirr">Telebirr</option>
            <option value="Awash Bank">Awash Bank</option>
            <option value="Dashen Bank">Dashen Bank</option>
            <option value="Abyssinia Bank">Abyssinia Bank</option>
            <option value="CBE Birr">CBE Birr</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Account Number / Phone Number</label>
          <input
            type="text"
            placeholder="e.g. 1000123456789 or 0911223344"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Account Holder Full Name</label>
          <input
            type="text"
            placeholder="e.g. Ferehad Yasin"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-black uppercase cursor-pointer"
        >
          + Add to List
        </button>
      </form>

      {/* Save Action Buttons */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        {pendingOrderId ? (
          <button
            type="button"
            disabled={loading || bankAccounts.length === 0}
            onClick={() => handleSaveAndFinish(true)}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? 'Saving...' : ' Save Accounts & Accept Pending Order'}
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSaveAndFinish(false)}
            className="w-full py-3.5 bg-[#1E4D58] hover:bg-[#163C45] text-white rounded-xl text-xs font-black uppercase cursor-pointer shadow-md"
          >
            {loading ? 'Saving...' : 'Save Bank Accounts'}
          </button>
        )}
      </div>
    </div>
  );
}
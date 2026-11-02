// frontend/src/components/Sidebar.jsx
import React, { useState } from 'react';

export default function Sidebar({ 
  isOpen, 
  onClose, 
  onOpenMyStore, 
  onOpenDeliveryPortal, 
  onOpenAuth,
  onNavigate,
  currentUser,
  cartItemCount = 0,
  onOpenCart 
}) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'Perfume', label: 'Perfumes & Fragrances' },
    { id: 'Cosmetics', label: 'Cosmetics & Beauty' },
    { id: 'Jewelry', label: 'Jewelry & Gold/Silver' },
    { id: 'Watch', label: 'Watches & Timepieces' },
    { id: 'Eyewear', label: 'Eyewear & Sunglasses' },
  ];

  const handleProtectedAction = (action) => {
    onClose();
    if (!currentUser || !currentUser.phone) {
      if (typeof onOpenAuth === 'function') {
        onOpenAuth();
      } else {
        console.warn("onOpenAuth function is not provided in parent props.");
      }
    } else {
      action();
    }
  };

  const handleSelectCategory = (catId) => {
    onClose();
    if (onNavigate) onNavigate('category', catId);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Sidebar Panel */}
      <div className="relative w-80 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="font-extrabold text-slate-900 text-base uppercase tracking-wider">
            Navigation Menu
          </span>
          <button onClick={onClose} className="px-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition cursor-pointer">
            Close
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="p-3 flex-1 space-y-1 overflow-y-auto">
          {/* 1. Home Page */}
          <button onClick={() => { onClose(); if (onNavigate) onNavigate('home'); }} className="w-full flex items-center px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-xs uppercase tracking-wider transition cursor-pointer">
            <span>Home Page</span>
          </button>

          {/* 2. Categories Dropdown */}
          <div className="w-full">
            <button onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-xs uppercase tracking-wider transition cursor-pointer">
              <span>Categories</span>
              <span className="text-xs text-slate-400 font-mono">{isCategoryOpen ? '▲' : '▼'}</span>
            </button>
            {isCategoryOpen && (
              <div className="ml-4 pl-3 border-l-2 border-slate-200 my-1 space-y-1">
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => handleSelectCategory(cat.id)} className="w-full text-left px-3 py-1.5 rounded-lg text-slate-600 hover:text-[#1E4D58] hover:bg-slate-50 font-bold text-xs transition cursor-pointer">
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

{/* 3. Shopping Cart (Protected - Requires Sign In) */}
<button 
  onClick={() => handleProtectedAction(() => {
    onClose();
    if (onNavigate) onNavigate('cart-checkout'); // 👈 Directs to your cart-checkout view page safely
  })} 
  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-xs uppercase tracking-wider transition cursor-pointer"
>
  <div className="flex items-center space-x-2">
    <span>Cart</span>
    {cartItemCount > 0 && (
      <span className="px-1.5 py-0.5 bg-[#1E4D58] text-white rounded-full text-[10px] font-black">
        {cartItemCount}
      </span>
    )}
  </div>
  {!currentUser?.phone && <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">Sign In</span>}
</button>

{/* 4. Wishlist (Protected) - Navigates to Wishlist Page */}
<button 
  onClick={() => handleProtectedAction(() => {
    if (onNavigate) onNavigate('wishlist');
  })} 
  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-xs uppercase tracking-wider transition cursor-pointer"
>
  <span>Wishlist</span>
  {!currentUser?.phone && <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">Sign In</span>}
</button>

          {/* 5. Order History (Protected) */}
          <button onClick={() => handleProtectedAction(() => onNavigate && onNavigate('orders'))} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-xs uppercase tracking-wider transition cursor-pointer">
            <span>Order History</span>
            {!currentUser?.phone && <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">Sign In</span>}
          </button>

          {/* 6. Track Order (Protected) */}
          <button onClick={() => handleProtectedAction(() => onNavigate && onNavigate('track-order'))} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-xs uppercase tracking-wider transition cursor-pointer">
            <span>Track Order</span>
            {!currentUser?.phone && <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">Sign In</span>}
          </button>

          <div className="pt-2 my-2 border-t border-slate-100"></div>

          {/* 7. Merchant Portal */}
          <button onClick={() => handleProtectedAction(onOpenMyStore)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold text-xs uppercase tracking-wider transition cursor-pointer">
            <span>My Store</span>
            <span className="text-[9px] font-black bg-emerald-200/60 text-emerald-900 px-1.5 py-0.5 rounded uppercase">Merchant</span>
          </button>

          {/* 8. Delivery Partner Portal */}
          <button onClick={() => handleProtectedAction(onOpenDeliveryPortal)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-xs uppercase tracking-wider transition cursor-pointer">
            <span>Delivery Partner</span>
            <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">Courier</span>
          </button>

          {/* 9. Settings */}
          <button onClick={() => handleProtectedAction(() => onNavigate && onNavigate('settings'))} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-xs uppercase tracking-wider transition cursor-pointer">
            <span>Settings</span>
          </button>
        </div>

        {/* Auth Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          {currentUser && currentUser.phone ? (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
              <p className="text-xs font-extrabold text-slate-900 truncate max-w-[200px]">{currentUser.name || 'Account User'}</p>
              <p className="text-[11px] font-bold text-[#1E4D58]">{currentUser.phone}</p>
            </div>
          ) : (
            <button onClick={() => { onClose(); if (typeof onOpenAuth === 'function') onOpenAuth(); }} className="w-full py-2.5 bg-[#1E4D58] text-white rounded-xl font-extrabold text-xs uppercase tracking-wider hover:bg-[#163C45] transition cursor-pointer shadow-xs">
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
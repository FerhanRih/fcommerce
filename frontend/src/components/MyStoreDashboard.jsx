// frontend/src/components/MyStoreDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OrdersTab from './vendor/OrdersTab';
import BankSettingsTab from "./vendor/BankSettingsTab";
import StoreSettingsPage from './vendor/StoreSettingsPage';


export default function MyStoreDashboard({ currentStore, currentUser, onOpenCreateStore, onBackToMain, onLogout, onStoreUpdated }) {
  
  const activeUser = currentUser || currentStore?.user || {};

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'orders', 'reports', 'settings'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Merchant Products State
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Profile Image State
  const [storeImage, setStoreImage] = useState(currentStore?.imageUrl || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Product Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Perfume');
  const [imageFile, setImageFile] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [description, setDescription] = useState('');
  const [editingProduct, setEditingProduct] = useState(null); // Holds the product being edited
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editCategory, setEditCategory] = useState('Perfume');
  const [editDescription, setEditDescription] = useState('');
  const [editImageFile, setEditImageFile] = useState(null);
  const [minOrderQty, setMinOrderQty] = useState(1); // For creating products
  const [editMinOrderQty, setEditMinOrderQty] = useState(1); // For editing products

  // Fetch Merchant's Listed Products
  const fetchStoreProducts = async () => {  
    if (!currentStore?.id) return;
    setLoadingProducts(true);
    try {
      const response = await axios.get(`/api/products?storeId=${currentStore.id}`);
      if (response.data.success) {
        setProducts(response.data.products || response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching store products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchStoreProducts();
  }, [currentStore?.id]);

  useEffect(() => {
    if (currentStore?.logoUrl) {
      setStoreImage(currentStore.logoUrl);
    }
  }, [currentStore]);

 

  // Handle Store Profile Image Upload
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentStore?.id) return;

    setUploadingImage(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.put(`/api/stores/${currentStore.id}/profile-image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setStoreImage(response.data.imageUrl);
      }
    } catch (err) {
      console.error('Failed to update store profile image:', err);
      alert('Failed to update store profile image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const openEditModal = (product) => {
  setEditingProduct(product);
  setEditTitle(product.title || '');
  setEditPrice(product.price || '');
  setEditStock(product.stock || '');
  setEditCategory(product.category || 'Perfume');
  setEditDescription(product.description || '');
  setEditMinOrderQty(product.minOrderQty || 1);
  setEditImageFile(null);
};

const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const token = localStorage.getItem('token');
    try {
      const formData = new FormData();
      formData.append('title', editTitle.trim());
      formData.append('price', Number(editPrice));
      formData.append('stock', Number(editStock));
      formData.append('category', editCategory);
      formData.append('description', editDescription.trim());
      formData.append('minOrderQty', Number(editMinOrderQty));
      
      if (editImageFile) {
        formData.append('image', editImageFile);
      }

      // Explicitly target port 5000 to bypass proxy/port confusion
      const response = await axios.put(`http://localhost:5000/api/products/${editingProduct.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setEditingProduct(null);
        fetchStoreProducts(); // Refresh inventory list
      }
    } catch (err) {
      console.error('Failed to update product:', err);
      alert('Failed to update product.');
    }
  };

  // Add this inside your Merchant / Store Dashboard component (e.g., MerchantDashboard.jsx)
useEffect(() => {
  const checkStoreStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/stores/my-store', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && data.store) {
        const currentStatus = data.store.status;
        const lastKnownStatus = localStorage.getItem('merchant_store_last_status');

        if (lastKnownStatus && lastKnownStatus !== currentStatus) {
          if ('Notification' in window && Notification.permission === 'granted') {
            if (currentStatus === 'approved') {
              new Notification('🎉 Store Approved!', {
                body: 'Congratulations! Your store has been approved by FCOMMERCE administration.',
                icon: '/logo.png'
              });
            } else if (currentStatus === 'rejected') {
              new Notification('❌ Store Application Update', {
                body: `Your store application was declined. Reason: ${data.store.rejectionReason || 'Review criteria not met.'}`,
                icon: '/logo.png'
              });
            }
          }
        }
        localStorage.setItem('merchant_store_last_status', currentStatus);
      }
    } catch (err) {
      // Handle silently
    }
  };

  const interval = setInterval(checkStoreStatus, 10000); // Check every 10 seconds
  return () => clearInterval(interval);
}, []);

  // 🗑️ Delete Product Handler
  const handleDeleteProduct = async (productId, productTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${productTitle || 'this product'}"?`)) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await axios.delete(`http://localhost:5000/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        fetchStoreProducts(); // Refresh catalog
      } else {
        alert(response.data.message || 'Failed to delete product.');
      }
    } catch (err) {
      console.error('Delete Product Error:', err);
      alert('Failed to delete product.');
    }
  };
  // Submit New Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title || !price || !stock) {
      setFormError('Please fill in all required product fields.');
      return;
    }

    if (!currentStore?.id) {
      setFormError('Store reference missing. Please re-select your store.');
      return;
    }

    setFormLoading(true);
    const token = localStorage.getItem('token');
    
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userPhone = storedUser?.phone || currentStore?.phoneNumber || '';

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('price', Number(price));
      formData.append('stock', Number(stock));
      formData.append('category', category);
      formData.append('storeId', currentStore.id);
      formData.append('storeName', currentStore.name || 'Boutique Store');
      formData.append('phoneNumber', userPhone);
      formData.append('description', description.trim()); // Added description
      formData.append('minOrderQty', Number(minOrderQty));
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await axios.post('/api/products', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setTitle('');
        setPrice('');
        setStock('');
        setMinOrderQty(1);
        setDescription(''); // Reset description
        setImageFile(null);
        setIsAddModalOpen(false);
        fetchStoreProducts(); // Refresh inventory list
      }
    } catch (err) {
      console.error('Product Creation Error:', err.response || err);
      setFormError(err.response?.data?.message || 'Failed to add product.');
    } finally {
      setFormLoading(false);
    }
  };

  const getFormattedImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* TOP HEADER BAR with Hamburger Button */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          {/* Hamburger Menu Button (No Icons) */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#1E4D58] font-black text-xs rounded-xl uppercase tracking-wider transition cursor-pointer"
          >
             ≡
          </button>
          
          
        </div>

        <button
          onClick={onBackToMain}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
        >
          X
        </button>
      </header>

      {/* DRAWER SIDEBAR (Triggered by Hamburger) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-64 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-4 z-50">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <span className="text-xs font-black text-[#1E4D58] uppercase">Store Menu</span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <nav className="space-y-1">
                <button
                  onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'inventory' ? 'bg-[#1E4D58] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  1. My Products 
                </button>
                <button
                  onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'orders' ? 'bg-[#1E4D58] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  2. Orders
                </button>
                <button
                  onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'reports' ? 'bg-[#1E4D58] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  3. Reports
                </button>
<button
  onClick={() => { setActiveTab('bank-settings'); setIsSidebarOpen(false); }}
  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
    activeTab === 'bank-settings' ? 'bg-[#1E4D58] text-white' : 'text-slate-600 hover:bg-slate-100'
  }`}
>
  <span>4. Bank Accounts</span>
  {(!currentStore?.bankAccounts || JSON.parse(typeof currentStore?.bankAccounts === 'string' ? currentStore.bankAccounts : JSON.stringify(currentStore?.bankAccounts || [])).length === 0) && (
    <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] rounded-full font-extrabold">
      Needs Setup
    </span>
  )}
</button>
                <button
  onClick={() => { 
    setActiveTab('settings'); 
    setIsSidebarOpen(false); 
  }}
  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
    activeTab === 'settings' ? 'bg-[#1E4D58] text-white' : 'text-slate-600 hover:bg-slate-100'
  }`}
>
  <span>5. Store Settings</span>
  {(!currentStore?.logoUrl || !currentStore?.address) && (
    <span className="px-2 py-0.5 bg-sky-500 text-white text-[9px] rounded-full font-extrabold">
      Needs Setup
    </span>
  )}
</button>
              </nav>
            </div>

            <button
              onClick={onLogout}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl uppercase transition cursor-pointer text-center"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

{currentStore && currentStore.status === 'pending' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center space-x-3 m-6">
          <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs shrink-0">⏳</span>
          <div>
            <h4 className="font-black text-amber-900 text-xs uppercase">Store Application Under Review</h4>
            <p className="text-[11px] text-amber-700">
              Your store "{currentStore.store_name || currentStore.name || 'Store'}" is currently awaiting Super Admin approval. You will receive an SMS notification once approved!
            </p>
          </div>
        </div>
      )}

     {currentStore && currentStore.status === 'rejected' && (
  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 m-6">
    <div className="flex items-center space-x-3">
      <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs shrink-0">⚠️</span>
      <div>
        <h4 className="font-black text-rose-900 text-xs uppercase">Store Application Declined</h4>
        <p className="text-[11px] text-rose-700 mt-0.5">
          Reason: {currentStore.rejectionReason || 'Please update your store details and resubmit for review.'}
        </p>
      </div>
    </div>

    <button
      onClick={onOpenCreateStore} // 👈 Triggers the App.jsx modal state cleanly!
      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition uppercase tracking-wider shrink-0 cursor-pointer"
    >
      Update & Re-Apply
    </button>
  </div>
)}

{/* MAIN CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">

    {/* 📍 MERCHANT STORE PROFILE HEADER CARD (Visible ONLY on Inventory/Overview Tab) */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {/* Store Profile Image Container */}
              <div className="relative w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {getFormattedImageUrl(storeImage) ? (
                  <img src={getFormattedImageUrl(storeImage)} alt="Store Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Logo</span>
                )}
                <label className="absolute inset-0 bg-black/30 hover:bg-black/50 text-white text-[9px] font-black uppercase flex items-center justify-center opacity-0 hover:opacity-100 transition cursor-pointer">
                  {uploadingImage ? '...' : 'Upload'}
                  <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                </label>
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900">{currentStore?.name || 'My Store'}</h2>
                <p className="text-xs text-slate-500 font-semibold">{currentStore?.address || 'Addis Ababa'}</p>
                {currentStore?.status && currentStore.status !== 'approved' && (
                  <span className="inline-block mt-1 text-[10px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                    Status: {currentStore.status} (Product listing locked)
                  </span>
                )}
              </div>
            </div>

            {/* ADD PRODUCT BUTTON (Disabled / Hidden if store is not approved) */}
            {currentStore?.status === 'approved' ? (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full sm:w-auto py-3 px-6 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs rounded-xl uppercase tracking-wider transition shadow-sm cursor-pointer text-center"
              >
                + Add New Product
              </button>
            ) : (
              <button
                disabled
                className="w-full sm:w-auto py-3 px-6 bg-slate-200 text-slate-400 font-black text-xs rounded-xl uppercase tracking-wider cursor-not-allowed text-center"
                title="Your store must be approved by Super Admin before you can list products."
              >
                Store Pending Approval
              </button>
            )}
          </div>
        )}

        {/* TAB CONTENT 1: PRODUCT CATALOG OVERVIEW & EDITING */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#1E4D58]">Your Listed Products</h3>
              <span className="text-xs text-slate-500 font-bold">{products.length} Items Listed</span>
            </div>

            {loadingProducts ? (
              <div className="text-center py-12 text-slate-400 text-xs font-semibold">Loading catalog...</div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
                <p className="text-xs text-slate-500 font-semibold">No products listed in your store catalog yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((item) => (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs flex flex-col justify-between">
                    <div className="h-36 bg-slate-100 relative flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={getFormattedImageUrl(item.imageUrl)} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase">No Image</span>
                      )}
                      <span className="absolute top-2 right-2 text-[9px] font-extrabold bg-slate-900/80 text-white px-2 py-0.5 rounded-md uppercase">
                        {item.category || 'General'}
                      </span>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs truncate">{item.title}</h4>
                        <div className="text-sm font-black text-[#1E4D58] mt-1">
                          {Number(item.price).toLocaleString()} <span className="text-[10px]">ETB</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">Stock: {item.stock} available</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex space-x-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg uppercase transition cursor-pointer text-center"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(item.id, item.title)}
                          className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[10px] rounded-lg uppercase transition cursor-pointer text-center"
                          title="Delete Product"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 2: ORDERS */}
        {activeTab === 'orders' && <OrdersTab currentStore={currentStore} setActiveStoreTab={setActiveTab} />}

        {/* TAB CONTENT 3: REPORTS PLACEHOLDER */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-black text-[#1E4D58] mb-1">Sales Reports</h3>
            <p className="text-xs text-slate-500">Daily, weekly, and monthly PDF export report generator.</p>
          </div>
        )}

        {/* TAB CONTENT 4: BANK SETTINGS */}
        {activeTab === 'bank-settings' && (
          <BankSettingsTab 
            currentStore={currentStore} 
            setActiveStoreTab={setActiveTab}
          />
        )}

        {/* TAB CONTENT 5: STORE SETTINGS PAGE */}
        {activeTab === 'settings' && (
          <StoreSettingsPage
            currentUser={currentUser}
            currentStore={currentStore}
            onStoreUpdated={onStoreUpdated}
            onBack={() => setActiveTab('inventory')}
          />
        )}
      </main>

      {/* EDIT PRODUCT MODAL FORM */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-[#1E4D58] mb-1">Edit Product</h3>
            <p className="text-xs text-slate-500 mb-6">Update your item details.</p>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1E4D58]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white"
                >
                  <option value="Perfume">Perfumes & Fragrances</option>
                  <option value="Cosmetics">Cosmetics & Beauty</option>
                  <option value="Jewelry">Jewelry & Gold/Silver</option>
                  <option value="Watch">Watches & Timepieces</option>
                  <option value="Eyewear">Eyewear & Sunglasses</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Price (ETB)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stock</label>
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Minimum Sell Limit (MOQ)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editMinOrderQty}
                  onChange={(e) => setEditMinOrderQty(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1E4D58]"
                  placeholder="1"
                />
                <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">
                  Minimum units required per order.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditImageFile(e.target.files[0])}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs rounded-xl uppercase tracking-wider transition cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL FORM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-[#1E4D58] mb-1">Add Product to Store</h3>
            <p className="text-xs text-slate-500 mb-6">List a new item.</p>

            {formError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">{formError}</div>}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Title</label>
                <input
                  type="text"
                  placeholder="e.g. Dior Sauvage Eau De Parfum 100ml"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1E4D58]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Niche Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1E4D58] bg-white"
                >
                  <option value="Perfume">Perfumes & Fragrances</option>
                  <option value="Cosmetics">Cosmetics & Beauty</option>
                  <option value="Jewelry">Jewelry & Gold/Silver</option>
                  <option value="Watch">Watches & Timepieces</option>
                  <option value="Glass">Eyewear & Sunglasses</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Price (ETB)</label>
                  <input
                    type="number"
                    placeholder="e.g. 8500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1E4D58]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    placeholder="e.g. 12"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1E4D58]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Minimum Sell Limit (MOQ)
                </label>
                <input
                  type="number"
                  min="1"
                  value={minOrderQty}
                  onChange={(e) => setMinOrderQty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1E4D58]"
                  placeholder="e.g., 5"
                />
                <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">
                  Minimum units a buyer must purchase in an order.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#1E4D58] file:text-white hover:file:bg-[#163C45] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Description / Details</label>
                <textarea
                  placeholder="e.g. 100ml authentic eau de parfum with long-lasting woody notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1E4D58] resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3.5 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs rounded-xl uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
              >
                {formLoading ? 'Publishing...' : 'Publish Item to Store'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
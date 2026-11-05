// frontend/src/components/ProductCatalog.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CategoryBar from './CategoryBar';
import ProductCard from './ProductCard';
import API, { API_URL } from '../services/api';

const ProductCatalog = ({ selectedStore, onSelectProduct, wishlist = [], onToggleWishlist }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: 'list' | 'stores'
  const [activeView, setActiveView] = useState('list');
  
  // Initialize store drill-down automatically if selectedStore prop is passed from App.jsx!
  const [selectedStoreDetail, setSelectedStoreDetail] = useState(selectedStore || null);

  // Update selectedStoreDetail if prop changes
  useEffect(() => {
    if (selectedStore) {
      setSelectedStoreDetail(selectedStore);
    }
  }, [selectedStore]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
API.get('/products')
  .then((res) => {
    if (Array.isArray(res.data.products)) {
      setProducts(res.data.products);
    } else if (Array.isArray(res.data)) {
      setProducts(res.data);
    }
  })
  .catch((err) => {
    console.error('Error fetching products from database:', err.message);
  })
  .finally(() => {
    setLoading(false);
  });
  }, []);

  const slugify = (text) =>
    (text || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '');

  // Extract unique stores dynamically from live database items
  const storeMap = products.reduce((acc, product) => {
    const sName = product.storeName || product.merchantName || 'General Store';
    if (!acc[sName]) {
      acc[sName] = {
        name: sName,
        categories: new Set(),
        sampleImage: null,
        logoUrl: product.storeLogoUrl || product.logoUrl || null,
      };
    }
    if (product.category) acc[sName].categories.add(product.category);
    if (!acc[sName].sampleImage && product.imageUrl) {
      acc[sName].sampleImage = product.imageUrl;
    }
    if (!acc[sName].logoUrl && (product.storeLogoUrl || product.logoUrl)) {
      acc[sName].logoUrl = product.storeLogoUrl || product.logoUrl;
    }
    return acc;
  }, {});

  const storeList = Object.values(storeMap);

  const filteredProducts = products.filter((product) => {
    if (!product) return false;

    const safeSearch = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (product.title || '').toLowerCase().includes(safeSearch) ||
      (product.description || '').toLowerCase().includes(safeSearch);

    const productCat = product.category || '';
    const productCatSlug = typeof slugify === 'function' ? slugify(productCat) : productCat.toLowerCase();
    
    const currentSelected = selectedCategory ? String(selectedCategory).toLowerCase() : 'all';

    const matchesCategory =
      currentSelected === 'all' ||
      productCatSlug.toLowerCase() === currentSelected ||
      productCat.toLowerCase() === currentSelected;

    return matchesSearch && matchesCategory;
  });

  // Filter stores for the stores view
  const filteredStores = storeList.filter((store) => {
    const safeSearch = (searchTerm || '').toLowerCase();
    const matchesSearch = (store.name || '').toLowerCase().includes(safeSearch);
    
    const currentCat = selectedCategory ? String(selectedCategory).toLowerCase() : 'all';

    const matchesCategory =
      currentCat === 'all' ||
      Array.from(store.categories).some(
        (cat) => {
          const catStr = cat || '';
          const catSlug = typeof slugify === 'function' ? slugify(catStr) : catStr.toLowerCase();
          return catSlug === currentCat || catStr.toLowerCase() === currentCat;
        }
      );

    return matchesSearch && matchesCategory;
  });

  const getFullImageUrl = (url) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

  // -------------------------------------------------------------
  // DRILL-DOWN VIEW: SINGLE STORE FRONT PAGE
  // -------------------------------------------------------------
  if (selectedStoreDetail) {
    const storeProducts = products.filter((p) => {
      const sName = p.storeName || p.merchantName || '';
      return sName.toLowerCase() === selectedStoreDetail.toLowerCase();
    });

    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
        {/* Back Button & Store Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs mb-6">
          <button
            onClick={() => setSelectedStoreDetail(null)}
            className="flex items-center gap-2 text-xs font-extrabold text-[#1E4D58] hover:underline mb-4 cursor-pointer"
          >
            ← Back to All Stores
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#1E4D58] rounded-2xl flex items-center justify-center text-white font-black text-2xl uppercase tracking-wider shadow-md">
                {selectedStoreDetail.substring(0, 2)}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {selectedStoreDetail}
                </h1>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  Verified Merchant Partner
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600">
              Active Store Front
            </div>
          </div>
        </div>

        {/* Store Items Heading */}
        <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase mb-4 px-1">
          Store Inventory ({storeProducts.length})
        </h2>

        {/* Store Items Grid */}
        {storeProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {storeProducts.map((product) => {
              const isWishlisted = wishlist.some((item) => item.id === product.id);
              return (
                <ProductCard
                  key={product.id || product._id}
                  product={product}
                  onSelectProduct={onSelectProduct}
                  isWishlisted={isWishlisted}
                  onToggleWishlist={onToggleWishlist}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center my-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              No products found for this merchant.
            </p>
          </div>
        )}
      </div>
    );
  }
  // -------------------------------------------------------------
  // MAIN CATALOG VIEW (LIST & STORES MODES)
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4">
      {/* 1. Category Bar */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* 2. Top Control Panel: View Switcher & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Explore Mode:
            </span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveView('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  activeView === 'list'
                    ? 'bg-[#1E4D58] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Single Items List
              </button>
              <button
                onClick={() => setActiveView('stores')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  activeView === 'stores'
                    ? 'bg-[#1E4D58] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Merchant Stores ({storeList.length})
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeView === 'list'
                ? 'Search items by title or description...'
                : 'Search merchant stores by name...'
            }
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-[#1E4D58] transition"
          />
        </div>
      </div>

      {/* 3. Section Title Bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight uppercase">
          {activeView === 'list' ? 'Single Items' : 'Merchant Stores'}
        </h2>
        {(selectedCategory !== 'all' || searchTerm !== '') && (
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchTerm('');
            }}
            className="text-[11px] font-extrabold text-[#1E4D58] underline hover:text-[#163C45] cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 4. Main Dynamic View Content */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
          Loading catalog from database...
        </div>
      ) : activeView === 'list' ? (
        /* ==================================== */
        /* VIEW 1: SINGLE PRODUCTS LIST         */
        /* ==================================== */
        filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const isWishlisted = wishlist.some((item) => item.id === product.id);
              return (
                <ProductCard
                  key={product.id || product._id}
                  product={product}
                  onSelectProduct={onSelectProduct}
                  isWishlisted={isWishlisted}
                  onToggleWishlist={onToggleWishlist}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center my-6">
            <h3 className="text-sm font-bold text-slate-700">No products found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search keywords or category selection.
            </p>
          </div>
        )
      ) : (
        /* ==================================== */
        /* VIEW 2: MERCHANT STORES GRID         */
        /* ==================================== */
        filteredStores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStores.map((store) => (
              <div
                key={store.name}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-[#1E4D58] transition"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[#1E4D58] rounded-xl overflow-hidden flex items-center justify-center text-white font-black text-lg uppercase shadow-xs shrink-0">
                      {getFullImageUrl(store.logoUrl) ? (
                        <img src={getFullImageUrl(store.logoUrl)} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                        store.name.substring(0, 2)
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {store.name}
                      </h3>
                      <span className="text-[11px] font-bold text-slate-400">
                        Verified Merchant
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {Array.from(store.categories).map((cat) => (
                      <span
                        key={cat}
                        className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStoreDetail(store.name)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-[#1E4D58] hover:text-white text-[#1E4D58] rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Explore Store →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center my-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              No merchant stores found.
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default ProductCatalog;
// frontend/src/components/ProductDetailPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProductDetailPage({
  product,
  currentUser, // <-- Receive currentUser prop
  onBack,
  onOpenCart,
  onOpenWishlist,
  onAddToCart,
  onDirectOrder,
  onSelectProduct,
  onSelectStore,
  cartCount = 0,
  wishlistCount = 0,
  isWishlisted = false,
  onToggleWishlist,
}) {
  const minQty = product?.minOrderQty || 1;
  const [quantity, setQuantity] = useState(minQty);
  const [qtyWarning, setQtyWarning] = useState('');

  // Real Reviews State from DB
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Cross-selling state
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [suggestedStores, setSuggestedStores] = useState([]);
  const [loadingCrossSell, setLoadingCrossSell] = useState(false);

const averageRating = reviews.length > 0 
  ? (reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / reviews.length).toFixed(1) 
  : (product.rating || '5.0');

const totalReviewsCount = reviews.length > 0 ? reviews.length : (product.reviewsCount || 0);

  // 1. Initialize quantity on product change
  useEffect(() => {
    const defaultQty = product?.minOrderQty || 1;
    setQuantity(defaultQty);
    setQtyWarning('');
  }, [product]);

  // 2. SINGLE Unified Review Fetching useEffect (LocalStorage Cache + Silent API Fetch)
  useEffect(() => {
    if (!product?.id) return;
    setLoadingReviews(true);

    // Load instantly from localStorage cache
    try {
      const cachedReviews = localStorage.getItem(`fcommerce_reviews_${product.id}`);
      if (cachedReviews) {
        setReviews(JSON.parse(cachedReviews));
      }
    } catch (err) {
      console.error('Error reading review cache:', err);
    }

    // Fetch from backend API silently without console noise
    const fetchReviews = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/reviews/product/${product.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
            setReviews(data.reviews);
            localStorage.setItem(`fcommerce_reviews_${product.id}`, JSON.stringify(data.reviews));
          }
        }
      } catch (err) {
        // Handled silently
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [product?.id]);

  // 3. Fetch cross-selling recommendations
  useEffect(() => {
    const fetchCrossSellData = async () => {
      if (!product) return;
      setLoadingCrossSell(true);
      try {
        const res = await axios.get('/api/products');
        const allProducts = res.data.products || res.data || [];
        if (Array.isArray(allProducts)) {
          const filtered = allProducts.filter(
            (p) => p.category?.toLowerCase() === product.category?.toLowerCase() && p.id !== product.id
          );
          setRelatedProducts(filtered.slice(0, 4));

          const storeMap = new Map();
          allProducts.forEach((p) => {
            const sName = p.storeName || p.merchantName;
            if (sName && p.category?.toLowerCase() === product.category?.toLowerCase()) {
              storeMap.set(sName.toLowerCase(), {
                id: p.storeId,
                name: sName,
                category: p.category,
              });
            }
          });
          setSuggestedStores(Array.from(storeMap.values()).slice(0, 3));
        }
      } catch (err) {
        console.error('Error loading recommendations:', err);
      } finally {
        setLoadingCrossSell(false);
      }
    };

    fetchCrossSellData();
  }, [product]);
  const getFormattedImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleQuantityChange = (newVal) => {
    const val = parseInt(newVal) || minQty;
    if (val < minQty) {
      setQtyWarning(`Minimum order limit for this item is ${minQty} unit(s).`);
      setQuantity(minQty);
    } else {
      setQtyWarning('');
      setQuantity(val);
    }
  };

  const validateQuantityBeforeAction = (actionCallback) => {
    if (quantity < minQty) {
      setQtyWarning(`Please select at least ${minQty} unit(s) before proceeding.`);
      return;
    }
    setQtyWarning('');
    if (actionCallback) {
      actionCallback({ ...product, selectedQuantity: quantity });
    }
  };

  // Replace review-fetching useEffect in ProductDetailPage.jsx with this:

 const handleAddReview = async (e) => {
  e.preventDefault();
  if (!newComment.trim()) return;

  // Extract exact user name
  const realUserName = currentUser?.fullName || currentUser?.name || currentUser?.phone || 'Customer';

  // Format exact current date and time
  const exactFormattedDate = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }); // e.g. "Oct 16, 2026, 6:03 PM"

  const newRev = {
    id: Date.now(),
    user: realUserName,
    rating: newRating,
    comment: newComment.trim(),
    date: exactFormattedDate,
  };

  const updatedReviews = [newRev, ...reviews];
  setReviews(updatedReviews);
  
  // Persist to localStorage for this specific product ID
  try {
    localStorage.setItem(`fcommerce_reviews_${product.id}`, JSON.stringify(updatedReviews));
  } catch (err) {
    console.error('Error saving review to cache', err);
  }

  setNewComment('');
  setReviewSuccess(true);
  setTimeout(() => setReviewSuccess(false), 3000);

  // Send to backend API
  try {
    const token = localStorage.getItem('token');
    await axios.post(
      'http://localhost:5000/api/reviews',
      { 
        productId: product.id, 
        rating: newRating, 
        comment: newComment.trim(),
        user: realUserName,
        date: exactFormattedDate
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err) {
    // Silent catch so local cache works even if backend endpoint isn't listening
  }
};
  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* 1. TOP NAV BAR */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#1E4D58] transition cursor-pointer"
        >
          <span className="text-base">←</span> Back to Catalog
        </button>

        <div className="flex items-center gap-3">
          {/* Wishlist Icon */}
          <button
            onClick={onOpenWishlist}
            className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition cursor-pointer text-rose-500"
            title="Wishlist"
          >
            ♥
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-xl bg-[#1E4D58] text-white hover:bg-[#163C45] transition cursor-pointer"
            title="Cart"
          >
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 2. LARGE IMAGE VIEWER & WISHLIST HEART */}
        <div className="relative w-full h-72 sm:h-96 bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={getFormattedImageUrl(product.imageUrl)}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-slate-400 text-xs font-bold uppercase">No Image Available</div>
          )}

          {/* Floating Wishlist Heart */}
          <button
            onClick={() => onToggleWishlist && onToggleWishlist(product)}
            className="absolute bottom-4 right-4 w-11 h-11 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg text-rose-500 text-xl hover:scale-110 transition cursor-pointer"
          >
            {isWishlisted ? '♥' : '♡'}
          </button>
        </div>

        {/* 3. PRODUCT INFO & MERCHANT MOQ QUANTITY PICKER */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#1E4D58] bg-slate-100 px-3 py-1 rounded-full">
              {product.category || 'Boutique Item'}
            </span>
            
            <button
              onClick={() => onSelectStore && onSelectStore(product.storeName)}
              className="text-xs font-bold text-slate-500 hover:text-[#1E4D58] transition cursor-pointer flex items-center gap-1"
            >
              Merchant: <strong className="text-slate-900 underline">{product.storeName || 'Verified Store'}</strong> →
            </button>
          </div>

          <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
            {product.title}
          </h1>

          <div className="text-xl sm:text-3xl font-black text-[#1E4D58]">
            {Number(product.price || 0).toLocaleString()} <span className="text-xs font-bold">ETB</span>
          </div>

          {/* Merchant Set MOQ Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-900 block">
                Minimum Order Quantity (MOQ): {minQty} unit(s)
              </span>
              <span className="text-[10px] text-amber-700 font-medium">
                Set directly by merchant for wholesale/bulk order handling.
              </span>
            </div>
            <span className="text-xs font-black text-amber-800 bg-amber-200/50 px-2.5 py-1 rounded-xl shrink-0">
              Min: {minQty}
            </span>
          </div>

          {/* Custom Quantity Selector */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Select Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity - 1)}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-lg flex items-center justify-center transition cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min={minQty}
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-20 py-2 text-center border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:outline-none focus:border-[#1E4D58]"
              />
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity + 1)}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-lg flex items-center justify-center transition cursor-pointer"
              >
                +
              </button>
            </div>
            {qtyWarning && (
              <p className="text-xs font-bold text-rose-600 mt-2">{qtyWarning}</p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-1">Product Description</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* 4. REVIEWS & RATINGS SECTION */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase">Customer Reviews & Ratings</h2>
            {/* Replace hardcoded rating with dynamic values */}
<div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
  <span className="text-amber-500">★</span>
  <span>{averageRating}</span>
  <span className="text-slate-400 font-normal">({totalReviewsCount} verified reviews)</span>
</div>
          </div>

          {/* Submit Review Form */}
          <form onSubmit={handleAddReview} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase">Write a Review</h3>
            {reviewSuccess && (
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">
                Review submitted successfully!
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Your Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className={`text-base cursor-pointer ${
                      star <= newRating ? 'text-amber-400' : 'text-slate-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows="2"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your feedback about this product..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1E4D58] bg-white"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#1E4D58] text-white rounded-xl text-xs font-bold hover:bg-[#163C45] transition cursor-pointer"
            >
              Submit Review
            </button>
          </form>

          {/* Existing Reviews List */}
          <div className="space-y-3">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div key={rev.id} className="p-3 border-b border-slate-100 last:border-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-black text-slate-900">{rev.user || 'Verified Buyer'}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{rev.date || 'Recently'}</span>
                  </div>
                  <div className="flex text-amber-400 text-xs mb-1">
                    {'★'.repeat(rev.rating || 5)}
                    {'☆'.repeat(5 - (rev.rating || 5))}
                  </div>
                  <p className="text-xs text-slate-600">{rev.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-xs font-bold text-slate-400 text-center py-2">No reviews yet. Be the first!</p>
            )}
          </div>
        </div>

        {/* 5. CROSS-SELLING: RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase">
              More in {product.category || 'This Category'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectProduct && onSelectProduct(rel)}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="w-full h-28 bg-slate-200 rounded-xl overflow-hidden mb-2">
                    {rel.imageUrl && (
                      <img
                        src={getFormattedImageUrl(rel.imageUrl)}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#1E4D58]">
                    {rel.title}
                  </h4>
                  <p className="text-xs font-black text-[#1E4D58] mt-1">
                    {Number(rel.price || 0).toLocaleString()} ETB
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. CROSS-SELLING: SUGGESTED STORES */}
{suggestedStores.length > 0 && (
  <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-4">
    <h2 className="text-sm font-black text-slate-900 uppercase">
      Recommended Stores for {product.category}
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {suggestedStores.map((st, idx) => (
        <div
          key={idx}
          onClick={() => onSelectStore && onSelectStore(st.name)}
          className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-[#1E4D58] transition group"
        >
          <div className="w-10 h-10 bg-[#1E4D58] text-white font-black rounded-xl flex items-center justify-center text-xs uppercase group-hover:scale-105 transition">
            {st.name.substring(0, 2)}
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 group-hover:text-[#1E4D58]">{st.name}</h4>
            <span className="text-[10px] text-slate-400 font-semibold block">
              Verified  →
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
      </div>

      {/* 7. LOCKED STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => validateQuantityBeforeAction(onAddToCart)}
            className="w-12 h-12 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-2xl flex items-center justify-center text-xl shadow-xs transition active:scale-95 cursor-pointer"
            title="Add to Cart"
          >
            🛒
          </button>

          <button
            type="button"
            onClick={() => validateQuantityBeforeAction(onDirectOrder)}
            className="flex-1 py-3.5 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs sm:text-sm rounded-2xl uppercase tracking-wider shadow-md transition active:scale-[0.99] cursor-pointer"
          >
            Order Now ({quantity} units)
          </button>
        </div>
      </div>
    </div>
  );
}
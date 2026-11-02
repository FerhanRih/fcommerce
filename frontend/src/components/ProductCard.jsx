// frontend/src/components/ProductCard.jsx
import React, { useState, useEffect } from 'react';

const ProductCard = ({ product, onSelectProduct, onToggleWishlist, isWishlisted = false }) => {
  const stockCount = product?.stock !== undefined ? Number(product.stock) : 0;
  const isOutOfStock = stockCount <= 0;

  // Dynamic rating state based on local reviews cache or product props
  const [cardRating, setCardRating] = useState(product?.rating ? Number(product.rating).toFixed(1) : '4.8');
  const [cardReviewCount, setCardReviewCount] = useState(product?.reviewsCount || 0);

  useEffect(() => {
    if (!product?.id) return;
    try {
      const cached = localStorage.getItem(`fcommerce_reviews_${product.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const avg = (parsed.reduce((acc, r) => acc + Number(r.rating || 5), 0) / parsed.length).toFixed(1);
          setCardRating(avg);
          setCardReviewCount(parsed.length);
        }
      }
    } catch (err) {
      // Fallback silently
    }
  }, [product?.id]);

  // Format image URL for relative backend paths (/uploads/...)
  const getFormattedImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const finalImageUrl = getFormattedImageUrl(product?.imageUrl);

  return (
    <div 
      onClick={() => onSelectProduct && onSelectProduct(product)}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group cursor-pointer relative"
    >
      {/* Product Image & Badges */}
      <div className="relative w-full h-36 sm:h-44 md:h-52 bg-slate-100 overflow-hidden flex items-center justify-center">
        {finalImageUrl ? (
          <img
            src={finalImageUrl}
            alt={product?.title || 'Product'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">No Image</div>
        )}

        {/* Wishlist Heart Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent opening card detail when clicking heart
            if (onToggleWishlist) onToggleWishlist(product);
          }}
          className="absolute bottom-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-xs rounded-full flex items-center justify-center shadow-md hover:bg-white transition text-rose-500 cursor-pointer"
          title="Wishlist"
        >
          {isWishlisted ? '♥' : '♡'}
        </button>

        {/* Stock / Out of Stock Badge */}
        {isOutOfStock && (
          <span className="absolute top-2 left-2 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
            Sold Out
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Store Name Display */}
          <div className="text-[10px] text-[#1E4D58] font-black uppercase tracking-wider mb-1 truncate">
            {product?.storeName || 'Verified Store'}
          </div>

          {/* Product Name */}
          <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-[#1E4D58] transition-colors">
            {product?.title || 'Unnamed Item'}
          </h3>

          {/* Dynamic Rating Display */}
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-amber-400 text-xs">★</span>
            <span className="text-[11px] font-bold text-slate-700">
              {cardRating}
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              ({cardReviewCount})
            </span>
          </div>
        </div>

        {/* Price Section */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Price</span>
            <span className="text-sm sm:text-base font-black text-slate-900 leading-none">
              {Number(product?.price || 0).toLocaleString()} <span className="text-[10px] text-[#1E4D58] font-bold">ETB</span>
            </span>
          </div>
          {product?.minOrderQty > 1 && (
            <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Min: {product.minOrderQty}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
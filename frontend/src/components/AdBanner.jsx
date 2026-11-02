// frontend/src/components/AdBanner.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserAdHubModal from './UserAdHubModal';

// Default fallback banners when database has no uploaded banners
const defaultBannerAds = [
  {
    id: 'default-1',
    title: 'Escrow Protected Bulk Orders',
    subtitle: 'Trade steel, electronics, and wholesale goods with guaranteed payment protection.',
    cta: 'EXPLORE B2B CATALOG',
    tag: 'VERIFIED SUPPLIERS',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
    linkUrl: '/catalog'
  },
  {
    id: 'default-2',
    title: 'Grow Your Business With FCOMMERCE Ads',
    subtitle: 'Promote your brand, services, or physical shop directly to thousands of active buyers daily.',
    cta: 'START AD CAMPAIGN',
    tag: 'SPONSORED SPOTLIGHT',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
    linkUrl: ''
  },
];

const AdBanner = ({ onPromoteAdClick, onNavigate }) => {
  const [banners, setBanners] = useState(defaultBannerAds);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);

  // Fetch active banners from backend
  useEffect(() => {
    axios.get('http://localhost:5000/api/banners')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const formattedBanners = res.data.map((banner) => ({
            ...banner,
            imageUrl: banner.imageUrl.startsWith('http')
              ? banner.imageUrl
              : `http://localhost:5000${banner.imageUrl}`
          }));
          setBanners(formattedBanners);
        }
      })
      .catch((err) => {
        console.warn('Using default ad banners. Could not fetch from backend:', err.message);
      });
  }, []);

  // Auto slide timer
  useEffect(() => {
    if (banners.length <= 1) return;
    const slideTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, [banners.length]);

  const handleOpenAdHub = (currentSlide) => {
    if (onPromoteAdClick) {
      onPromoteAdClick(currentSlide || { type: 'ad_submission' });
    }
    setShowAdModal(true);
  };

  const handleCtaClick = (linkUrl) => {
    if (!linkUrl || linkUrl === '#') return;
    if (linkUrl.startsWith('/')) {
      const pageName = linkUrl.replace('/', '');
      if (onNavigate) onNavigate(pageName);
    } else {
      window.open(linkUrl, '_blank');
    }
  };

  const currentAd = banners[currentIndex] || defaultBannerAds[0];
  const hasValidLink = currentAd.linkUrl && currentAd.linkUrl.trim() !== '' && currentAd.linkUrl !== '#';

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-3">
        {/* Primary Auto-sliding Hero Banner */}
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden shadow-xs min-h-[260px] flex items-center justify-center bg-slate-950">
          {currentAd.imageUrl && (
            <img
              src={currentAd.imageUrl}
              alt={currentAd.title || 'Ad Banner'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Deep Dark Vignette Overlay */}
          <div className="absolute inset-0 bg-black/75" />

          {(currentAd.title || currentAd.subtitle) && (
            <div className="relative z-10 p-6 sm:p-8 w-full flex flex-col items-start space-y-2.5">
              {currentAd.tag && (
                <span className="px-3.5 py-1 rounded-full text-[10px] font-white uppercase tracking-widest bg-[#1E4D58] text-white shadow-md">
                  {currentAd.tag}
                </span>
              )}

            {currentAd.title && (
  <h2 
    className="text-xl sm:text-3xl font-white uppercase tracking-wider leading-snug !text-white max-w-xl"
    style={{ textShadow: '0 4px 12px #000000, 0 0 20px #000000' }}
  >
    {currentAd.title}
  </h2>
)}
              {currentAd.subtitle && (
                <p 
                  className="text-xs sm:text-sm font-extrabold uppercase tracking-wide leading-relaxed max-w-lg line-clamp-2"
                  style={{ 
                    color: '#ffffff !important', 
                    textShadow: '0 2px 8px rgba(0,0,0,1)' 
                  }}
                >
                  {currentAd.subtitle}
                </p>
              )}

              {/* Conditional Destination Link Button */}
              {hasValidLink && (
                <div className="pt-2">
                  <button
                    onClick={() => handleCtaClick(currentAd.linkUrl)}
                    className="px-6 py-2.5 bg-white text-[#1E4D58] hover:bg-slate-100 font-black text-xs rounded-xl transition shadow-xl uppercase tracking-widest cursor-pointer"
                  >
                    {currentAd.cta || 'Explore Destination'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Carousel Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    currentIndex === idx ? 'w-6 bg-white' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Side Commercial Business Ad Box */}
        <div className="lg:col-span-4 bg-gradient-to-br from-[#1E4D58]/10 via-emerald-50 to-slate-100 border border-[#1E4D58]/20 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden min-h-[220px]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#1E4D58] bg-[#1E4D58]/15 px-2.5 py-1 rounded-full">
              COMMERCIAL AD PLACEMENT
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-3 leading-snug">
              Promote Your Business or Service
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
              Reach commercial clients and thousands of daily shoppers. Run custom ad campaigns for your store or enterprise.
            </p>
          </div>

          <button
            onClick={() => handleOpenAdHub()}
            className="mt-4 w-full py-2.5 px-4 bg-[#1E4D58] hover:bg-[#163C45] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-xs text-center cursor-pointer"
          >
            Run an Ad Campaign
          </button>
        </div>
      </div>

      {/* USER AD HUB & CAMPAIGN TRACKER MODAL */}
      {showAdModal && (
        <UserAdHubModal onClose={() => setShowAdModal(false)} />
      )}
    </>
  );
};

export default AdBanner;
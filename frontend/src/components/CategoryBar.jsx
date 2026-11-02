// frontend/src/components/CategoryBar.jsx
import React from 'react';

const categories = [
  { id: 'all', label: 'All Items' },
  { id: 'Perfume', label: 'Perfumes' },
  { id: 'Cosmetics', label: 'Cosmetics' },
  { id: 'Jewelry', label: 'Jewelry' },
  { id: 'Watch', label: 'Watches' },
  { id: 'Eyewear', label: 'Eyewear' },
];

const CategoryBar = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="w-full overflow-x-auto py-2 my-2 scrollbar-none touch-pan-x">
      <div className="flex items-center space-x-2 min-w-max px-0.5">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id || (cat.id === 'all' && !selectedCategory);
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id === 'all' ? null : cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
                isActive
                  ? 'bg-[#1E4D58] text-white border-[#1E4D58] shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBar;
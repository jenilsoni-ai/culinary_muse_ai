
import React from 'react';

interface FridgeItem {
  id: string;
  name: string;
  emoji: string;
  category: 'protein' | 'veg' | 'dairy' | 'pantry';
}

const ITEMS: FridgeItem[] = [
  { id: '1', name: 'Chicken', emoji: '🍗', category: 'protein' },
  { id: '2', name: 'Eggs', emoji: '🥚', category: 'protein' },
  { id: '3', name: 'Spinach', emoji: '🥬', category: 'veg' },
  { id: '4', name: 'Tomato', emoji: '🍅', category: 'veg' },
  { id: '5', name: 'Milk', emoji: '🥛', category: 'dairy' },
  { id: '6', name: 'Cheese', emoji: '🧀', category: 'dairy' },
  { id: '7', name: 'Pasta', emoji: '🍝', category: 'pantry' },
  { id: '8', name: 'Rice', emoji: '🍚', category: 'pantry' },
  { id: '9', name: 'Bell Pepper', emoji: '🫑', category: 'veg' },
  { id: '10', name: 'Tofu', emoji: '🧊', category: 'protein' },
];

interface Props {
  selectedItems: string[];
  onToggleItem: (name: string) => void;
}

const VisualFridge: React.FC<Props> = ({ selectedItems, onToggleItem }) => {
  const onDragStart = (e: React.DragEvent, name: string) => {
    e.dataTransfer.setData("ingredient", name);
    // Visual feedback for dragging
    e.currentTarget.classList.add('opacity-50');
  };

  const onDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  return (
    <div className="bg-stone-200 rounded-3xl p-6 border-8 border-stone-300 shadow-inner max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-1/2 w-1 h-full bg-stone-300 transform -translate-x-1/2 opacity-50"></div>
      <div className="mb-6 flex justify-between items-center px-4">
        <div>
          <h3 className="font-bold text-stone-600 uppercase text-[9px] tracking-widest">Master Pantry</h3>
          <p className="text-[7px] text-stone-400 font-bold uppercase tracking-tighter">Drag to Chat Assistant</p>
        </div>
        <div className="w-12 h-1 bg-stone-400 rounded-full"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Left Side Shelf */}
        <div className="space-y-4">
          <div className="bg-white/40 h-2 w-full rounded-full"></div>
          <div className="grid grid-cols-2 gap-2">
            {ITEMS.filter(i => i.category === 'protein' || i.category === 'dairy').map(item => (
              <button
                key={item.id}
                type="button"
                draggable
                onDragStart={(e) => onDragStart(e, item.name)}
                onDragEnd={onDragEnd}
                onClick={() => onToggleItem(item.name)}
                className={`group relative flex flex-col items-center p-2 rounded-xl transition-all cursor-grab active:cursor-grabbing ${
                  selectedItems.includes(item.name) 
                  ? 'bg-orange-500 text-white scale-95 shadow-inner ring-2 ring-orange-300' 
                  : 'bg-white hover:bg-stone-50 text-stone-700 shadow-sm'
                }`}
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse"></div>
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-[10px] font-bold mt-1 uppercase truncate w-full text-center">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Right Side Shelf */}
        <div className="space-y-4">
          <div className="bg-white/40 h-2 w-full rounded-full"></div>
          <div className="grid grid-cols-2 gap-2">
            {ITEMS.filter(i => i.category === 'veg' || i.category === 'pantry').map(item => (
              <button
                key={item.id}
                type="button"
                draggable
                onDragStart={(e) => onDragStart(e, item.name)}
                onDragEnd={onDragEnd}
                onClick={() => onToggleItem(item.name)}
                className={`group relative flex flex-col items-center p-2 rounded-xl transition-all cursor-grab active:cursor-grabbing ${
                  selectedItems.includes(item.name) 
                  ? 'bg-orange-500 text-white scale-95 shadow-inner ring-2 ring-orange-300' 
                  : 'bg-white hover:bg-stone-50 text-stone-700 shadow-sm'
                }`}
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse"></div>
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-[10px] font-bold mt-1 uppercase truncate w-full text-center">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-stone-300 h-24 rounded-b-xl flex items-end justify-around pb-4">
        <div className="w-8 h-8 rounded-full bg-stone-400 opacity-30"></div>
        <div className="w-8 h-8 rounded-full bg-stone-400 opacity-30"></div>
      </div>
    </div>
  );
};

export default VisualFridge;

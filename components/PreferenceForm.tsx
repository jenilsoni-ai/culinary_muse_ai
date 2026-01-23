
import React, { useRef, useState, useCallback } from 'react';
import { 
  CityType, KitchenSetup, UserPreferences
} from '../types';
import VisualFridge from './VisualFridge';
import { identifyIngredients } from '../services/geminiService';

interface Props {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
  onNext: () => void;
  onBack: () => void;
}

const PreferenceForm: React.FC<Props> = ({ prefs, setPrefs, onNext, onBack }) => {
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleIngredient = useCallback((name: string) => {
    setPrefs(p => {
      const exists = p.ingredients.includes(name);
      const nextIngs = exists ? p.ingredients.filter(i => i !== name) : [...p.ingredients, name];
      return { ...p, ingredients: nextIngs, lockedIngredients: p.lockedIngredients.filter(i => i !== name) };
    });
  }, [setPrefs]);

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const detected = await identifyIngredients(ev.target?.result as string);
        setPrefs(p => ({ ...p, ingredients: Array.from(new Set([...p.ingredients, ...detected])) }));
      } catch (err) {
        console.error("Scan failed", err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 pb-20 space-y-12 animate-in fade-in slide-in-from-right-4 duration-500" role="form" aria-label="Inventory and Logistics Profile">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold italic font-serif">Pantry & Logistics</h2>
        <p className="text-stone-500 text-sm">Current inventory and financial constraints.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pantry Section */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-stone-100 flex flex-col h-full">
          <header className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="p-2 bg-orange-100 rounded-lg text-lg" aria-hidden="true">📦</span> Available Stock
            </h3>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest" aria-live="polite">{prefs.ingredients.length} items cataloged</span>
          </header>
          <div className="flex-1">
            <VisualFridge selectedItems={prefs.ingredients} onToggleItem={toggleIngredient} />
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            aria-label="Upload photo of fridge to identify ingredients"
            className="w-full mt-8 py-5 border-2 border-dashed border-stone-200 rounded-2xl text-stone-500 hover:border-orange-500 hover:text-orange-500 transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em]"
          >
            {isScanning ? "Visual Identification Active..." : "📷 Analyze Fridge (Scan Photo)"}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleScan} className="hidden" accept="image/*" aria-hidden="true" />
        </div>

        {/* Global Logistics Section */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-stone-100 flex flex-col justify-between space-y-8">
          <div className="space-y-8">
            <fieldset className="space-y-4">
              <legend className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Market Tier</legend>
              <div className="grid grid-cols-3 gap-3">
                {[CityType.METRO, CityType.TIER_2, CityType.TIER_3].map((tier) => (
                  <button 
                    key={tier}
                    type="button" 
                    onClick={() => setPrefs({...prefs, cityType: tier})} 
                    aria-pressed={prefs.cityType === tier}
                    className={`p-4 text-[9px] font-black rounded-2xl border transition-all uppercase tracking-tighter ${prefs.cityType === tier ? 'bg-stone-900 text-white border-stone-900 shadow-xl' : 'bg-white text-stone-400 border-stone-100 hover:bg-stone-50'}`}
                  >
                    {tier.split(' ')[0]}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="space-y-4">
              <label htmlFor="kitchen-setup" className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Kitchen Infrastructure</label>
              <select 
                id="kitchen-setup"
                value={prefs.kitchenSetup} 
                onChange={e => setPrefs({...prefs, kitchenSetup: e.target.value as KitchenSetup})} 
                className="w-full p-5 bg-stone-50 border-none rounded-2xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              >
                {Object.values(KitchenSetup).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-4 pt-6">
              <div className="flex justify-between items-end">
                <label htmlFor="budget-slider" className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Daily Budget Cap</label>
                <span className="text-3xl font-black text-stone-900" aria-live="polite">₹{prefs.dailyBudget}</span>
              </div>
              <input 
                id="budget-slider"
                type="range" min="200" max="5000" step="100" 
                value={prefs.dailyBudget} 
                onChange={e => setPrefs({...prefs, dailyBudget: Number(e.target.value)})} 
                aria-valuemin={200}
                aria-valuemax={5000}
                aria-valuenow={prefs.dailyBudget}
                className="w-full accent-orange-500 h-1.5 bg-stone-100 rounded-full cursor-pointer" 
              />
            </div>
          </div>
          
          <fieldset className="bg-stone-900 p-8 rounded-[2.5rem] text-white">
             <legend className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-4 block">Meal Horizon</legend>
             <div className="flex gap-3">
                {[1, 3, 5, 7].map(d => (
                  <button 
                    key={d} 
                    type="button" 
                    onClick={() => setPrefs({...prefs, days: d})} 
                    aria-label={`Plan for ${d} days`}
                    aria-pressed={prefs.days === d}
                    className={`flex-1 py-4 rounded-xl font-black text-xs transition-all border ${prefs.days === d ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-white/5 text-stone-500 border-white/5 hover:bg-white/10'}`}
                  >
                    {d}D
                  </button>
                ))}
             </div>
          </fieldset>
        </div>
      </div>

      <nav className="flex items-center justify-between pt-12" aria-label="Step navigation">
        <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">← Back to Identity</button>
        <button 
          onClick={onNext}
          disabled={prefs.ingredients.length < 3}
          aria-label="Next to temporal scheduling"
          className={`px-12 py-6 rounded-3xl text-xs font-black uppercase tracking-[0.3em] transition-all shadow-xl ${prefs.ingredients.length < 3 ? 'bg-stone-100 text-stone-300 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
        >
          Next: Temporal Scheduling
        </button>
      </nav>
    </div>
  );
};

export default PreferenceForm;

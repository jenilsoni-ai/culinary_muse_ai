
import React, { useRef, useState } from 'react';
import { 
  DietType, CityType, KitchenSetup, UserPreferences, 
  DUMMY_WORKOUT_PLAN, WorkoutDay 
} from '../types';
import VisualFridge from './VisualFridge';
import { identifyIngredients } from '../services/geminiService';

interface Props {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
  onSubmit: (prefs: UserPreferences) => void;
  isLoading: boolean;
}

const PreferenceForm: React.FC<Props> = ({ prefs, setPrefs, onSubmit, isLoading }) => {
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleIngredient = (name: string) => {
    setPrefs(p => {
      const exists = p.ingredients.includes(name);
      const nextIngs = exists ? p.ingredients.filter(i => i !== name) : [...p.ingredients, name];
      return { ...p, ingredients: nextIngs, lockedIngredients: p.lockedIngredients.filter(i => i !== name) };
    });
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const detected = await identifyIngredients(ev.target?.result as string);
      setPrefs(p => ({ ...p, ingredients: Array.from(new Set([...p.ingredients, ...detected])) }));
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const updatePersona = (field: string, value: string) => {
    setPrefs(p => ({
      ...p,
      persona: { ...p.persona, [field]: value }
    }));
  };

  const selectWorkoutDay = (day: WorkoutDay) => {
    setPrefs(p => ({ ...p, selectedWorkoutDay: day }));
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 pb-20 space-y-8">
      {/* Triple Column Command Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-stretch">
        
        {/* 1. Pantry Visualizer */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="p-2 bg-orange-100 rounded-lg text-lg">📦</span> Pantry
            </h2>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{prefs.ingredients.length} items</span>
          </div>
          <div className="flex-1">
            <VisualFridge selectedItems={prefs.ingredients} onToggleItem={toggleIngredient} />
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="w-full mt-6 py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-500 hover:border-orange-500 hover:text-orange-500 transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest"
          >
            {isScanning ? "Vision Processing..." : "📷 Scan Fridge Photo"}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleScan} className="hidden" accept="image/*" />
        </div>

        {/* 2. Global Logistics & Budget */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 flex flex-col h-full justify-between space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-stone-100 rounded-lg text-lg">⚙️</span>
            <h2 className="text-xl font-bold">Logistics</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Logistics Tier</label>
              <div className="grid grid-cols-3 gap-2">
                {[CityType.METRO, CityType.TIER_2, CityType.TIER_3].map((tier) => (
                  <button 
                    key={tier}
                    type="button" 
                    onClick={() => setPrefs({...prefs, cityType: tier})} 
                    className={`p-3 text-[9px] font-black rounded-xl border transition-all uppercase tracking-tighter ${prefs.cityType === tier ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-white text-stone-400 border-stone-100'}`}
                  >
                    {tier.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Equipment</label>
              <select 
                value={prefs.kitchenSetup} 
                onChange={e => setPrefs({...prefs, kitchenSetup: e.target.value as KitchenSetup})} 
                className="w-full p-4 bg-stone-50 border-none rounded-2xl text-xs font-bold appearance-none outline-none focus:ring-1 focus:ring-orange-500"
              >
                {Object.values(KitchenSetup).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Budget Cap</label>
                <span className="text-xl font-black text-orange-600">₹{prefs.dailyBudget}</span>
              </div>
              <input 
                type="range" min="100" max="3000" step="100" 
                value={prefs.dailyBudget} 
                onChange={e => setPrefs({...prefs, dailyBudget: Number(e.target.value)})} 
                className="w-full accent-orange-500 h-1 bg-stone-100 cursor-pointer" 
              />
            </div>
          </div>
          
          <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100">
             <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4 block">Meal Horizon</label>
             <div className="flex gap-2">
                {[1, 2, 3].map(d => (
                  <button 
                    key={d} 
                    type="button" 
                    onClick={() => setPrefs({...prefs, days: d})} 
                    className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all border ${prefs.days === d ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-400 border-stone-100'}`}
                  >
                    {d}D
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* 3. Persona & Workout Tuning */}
        <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col h-full">
          <div className="relative z-10 space-y-6 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                Persona Tuning
              </h3>
              <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Context Engine</span>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[8px] uppercase tracking-widest text-stone-400 font-bold">Mental Baseline</label>
                <select 
                  value={prefs.persona?.mentalState || "Stable"}
                  onChange={(e) => updatePersona('mentalState', e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-orange-500 transition-colors cursor-pointer"
                >
                  <option className="bg-stone-900" value="Stable">Stable / Focused</option>
                  <option className="bg-stone-900" value="Exhausted/Stressed">Exhausted / Stressed</option>
                  <option className="bg-stone-900" value="Energetic">Energetic / Creative</option>
                  <option className="bg-stone-900" value="Burned Out">Burned Out</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] uppercase tracking-widest text-stone-400 font-bold">Daily Load Factor</label>
                <select 
                  value={prefs.persona?.workload || "Medium"}
                  onChange={(e) => updatePersona('workload', e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-orange-500 transition-colors cursor-pointer"
                >
                  <option className="bg-stone-900" value="Low">Low (Relaxed)</option>
                  <option className="bg-stone-900" value="Medium">Medium (Standard)</option>
                  <option className="bg-stone-900" value="High">High (Busy)</option>
                  <option className="bg-stone-900" value="Extreme">Extreme (Peak)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Workout Sync</span>
                    <span className="text-[8px] text-stone-500 uppercase font-bold">Nutritional Performance</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setPrefs({...prefs, workoutPlanEnabled: !prefs.workoutPlanEnabled})}
                    className={`w-12 h-6 rounded-full relative transition-all ${prefs.workoutPlanEnabled ? 'bg-orange-500' : 'bg-stone-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${prefs.workoutPlanEnabled ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
                
                {prefs.workoutPlanEnabled && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-4 gap-2">
                      {DUMMY_WORKOUT_PLAN.map((workout) => {
                        const isSelected = prefs.selectedWorkoutDay?.day === workout.day;
                        return (
                          <button
                            key={workout.day}
                            type="button"
                            onClick={() => selectWorkoutDay(workout)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${isSelected ? 'bg-orange-500 border-orange-400 text-white' : 'bg-white/5 border-white/5 text-stone-500 hover:bg-white/10'}`}
                          >
                            <span className="text-[8px] font-black uppercase tracking-tighter">{workout.day.substring(0, 3)}</span>
                          </button>
                        );
                      })}
                    </div>
                    {prefs.selectedWorkoutDay && (
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                        <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">{prefs.selectedWorkoutDay.activity}</p>
                        <p className="text-[8px] text-stone-400 uppercase font-bold leading-tight">{prefs.selectedWorkoutDay.focus}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>
      </div>

      {/* Global Action Section */}
      <div className="max-w-4xl mx-auto pt-8">
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(prefs); }} className="space-y-6">
          <button 
            type="submit" 
            disabled={isLoading || prefs.ingredients.length < 5}
            className={`w-full py-8 rounded-[2.5rem] font-black text-2xl tracking-[0.1em] transition-all uppercase shadow-2xl relative overflow-hidden group ${
              isLoading || prefs.ingredients.length < 5 ? 'bg-stone-100 text-stone-300 cursor-not-allowed' : 'bg-stone-900 text-white hover:bg-orange-600 hover:shadow-orange-300 active:scale-[0.98]'
            }`}
          >
            <span className="relative z-10">{isLoading ? "Synthesizing Plan..." : "Calculate Master Logistics"}</span>
            {!isLoading && prefs.ingredients.length >= 5 && (
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            )}
          </button>
          
          {prefs.ingredients.length < 5 && (
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
               <p className="text-center text-orange-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
                Configuration Incomplete: Add {5 - prefs.ingredients.length} more ingredients to validate logic
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PreferenceForm;

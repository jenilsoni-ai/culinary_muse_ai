
import React, { useState, useEffect, useCallback } from 'react';
import { UserPreferences, MealPlanResponse, OptimizationGoal, DietType, CityType, KitchenSetup } from './types';
import PreferenceForm from './components/PreferenceForm';
import MealPlanDisplay from './components/RecipeDisplay';
import ChatWidget from './components/ChatWidget';
import MusicPlayer from './components/MusicPlayer';
import { generateMealPlan } from './services/geminiService';

const LoadingOverlay: React.FC<{ onMinimize: () => void }> = ({ onMinimize }) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const steps = [
    "Initializing Logistics Engine...",
    "Scanning Pantry Inventory...",
    "Applying City-Tier Cost Multipliers...",
    "Analyzing User Workload & State...",
    "Checking Workout Performance Goals...",
    "Validating Daily Budget Constraints...",
    "Optimizing Daily Cooking Sequence...",
    "Finalizing Performance-Matched Plan..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => {
        const next = s < steps.length - 1 ? s + 1 : s;
        setProgress((next / (steps.length - 1)) * 100);
        return next;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-12">
        <div className="w-24 h-24 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center font-black text-white text-xl">M</div>
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-3xl font-bold text-white font-serif italic">Crafting Your Plan</h2>
        
        <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-orange-500 h-full transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="bg-black/40 rounded-2xl p-6 border border-white/5 font-mono text-left space-y-2">
          {steps.slice(0, step + 1).map((s, i) => (
            <div key={i} className={`text-xs flex items-center gap-3 ${i === step ? 'text-orange-400' : 'text-stone-500'}`}>
              <span className="w-4">{i === step ? "→" : "✓"}</span>
              {s}
            </div>
          ))}
          <div className="animate-pulse text-orange-500 text-xs ml-7">_</div>
        </div>
        
        <button 
          onClick={onMinimize}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/10"
        >
          Continue in Background
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [plan, setPlan] = useState<MealPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [prefs, setPrefs] = useState<UserPreferences>({
    dietType: DietType.VEG,
    ingredients: [],
    lockedIngredients: [],
    cityType: CityType.METRO,
    dailyBudget: 500,
    kitchenSetup: KitchenSetup.STANDARD,
    days: 1,
    timePerMeal: 30,
    workoutPlanEnabled: false,
    persona: { workload: 'Medium', profession: 'Professional', mentalState: 'Stable' }
  });

  const handleGenerate = useCallback(async (currentPrefs: UserPreferences) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setIsMinimized(false);
    setError(null);
    
    try {
      const result = await generateMealPlan(currentPrefs);
      if (!result || !result.days || result.days.length === 0) {
        throw new Error("AI failed to return a valid plan structure. Ensure you have enough ingredients.");
      }
      setPlan(result);
      setIsMinimized(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Generation Error:", err);
      setError((err as Error).message || "An unexpected error occurred during planning.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleOptimize = (goal: OptimizationGoal) => {
    const updatedPrefs = { ...prefs, optimizationGoal: goal };
    setPrefs(updatedPrefs);
    handleGenerate(updatedPrefs);
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-orange-100">
      {isLoading && !isMinimized && <LoadingOverlay onMinimize={() => setIsMinimized(true)} />}
      
      <MusicPlayer />
      
      <ChatWidget 
        prefs={prefs} 
        setPrefs={setPrefs} 
        onGenerate={handleGenerate} 
        isLoading={isLoading} 
      />

      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100 px-6 py-4 flex flex-col items-center">
        <div className="w-full flex justify-between items-center max-w-7xl">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPlan(null)}>
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white font-black text-xl">M</div>
            <span className="text-xl font-black tracking-tighter text-stone-900 uppercase">Culinary<span className="text-orange-500 italic">Muse</span></span>
          </div>
          <div className="flex items-center gap-6">
            {isLoading && isMinimized && (
              <div className="flex items-center gap-3 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 animate-pulse">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Processing Plan...</span>
                <button onClick={() => setIsMinimized(false)} className="text-[8px] font-bold text-orange-400 hover:text-orange-600 uppercase">View</button>
              </div>
            )}
            <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest hidden md:block">
              AI Logistics Engine v3.3
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 mt-12">
        {error && (
          <div className="max-w-4xl mx-auto mb-12 p-6 bg-red-50 text-red-700 rounded-3xl border border-red-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-bold text-sm">Logistics Configuration Error</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-[10px] font-bold uppercase tracking-widest bg-red-100 px-4 py-2 rounded-xl">Dismiss</button>
          </div>
        )}

        {plan ? (
          <MealPlanDisplay plan={plan} prefs={prefs} onReset={() => setPlan(null)} onOptimize={handleOptimize} />
        ) : (
          <>
            <div className="text-center max-w-4xl mx-auto mb-16 space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-stone-900 leading-[1.1]">
                Kitchen <span className="text-orange-500 italic font-serif">Intelligence.</span>
              </h1>
              <p className="text-lg text-stone-500 max-w-2xl mx-auto font-medium">
                Talk to our Chef Assistant to calibrate your meal plan to your profession, workload, and mental state.
              </p>
            </div>
            <PreferenceForm 
              prefs={prefs}
              setPrefs={setPrefs}
              onSubmit={handleGenerate} 
              isLoading={isLoading} 
            />
          </>
        )}
      </main>

      <footer className="mt-20 py-12 border-t border-stone-100 text-center">
        <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">Built for high-performance living • 2025</p>
      </footer>
    </div>
  );
};

export default App;

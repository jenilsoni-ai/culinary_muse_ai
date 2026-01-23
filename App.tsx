
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  UserPreferences, MealPlanResponse, OptimizationGoal, 
  DietType, CityType, KitchenSetup, PersonaType 
} from './types';
import Onboarding from './components/Onboarding';
import PreferenceForm from './components/PreferenceForm';
import SchedulingPanel from './components/SchedulingPanel';
import MealPlanDisplay from './components/RecipeDisplay';
import ChatWidget from './components/ChatWidget';
import MusicPlayer from './components/MusicPlayer';
import HealthCoachWidget from './components/HealthCoachWidget';
import { generateMealPlan } from './services/geminiService';

const CACHE_KEY = 'culinary_muse_latest_plan';

const LoadingOverlay: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="fixed inset-0 z-[100] bg-stone-900/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center">
    <div className="w-32 h-32 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin mb-12"></div>
    <div className="max-w-md w-full space-y-6">
      <h2 className="text-4xl font-serif italic text-white animate-pulse">Synthesizing Profile...</h2>
      <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
        <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="text-[10px] font-black uppercase text-stone-500 tracking-[0.3em]">Grounding Logistics & Temporal Windows</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [plan, setPlan] = useState<MealPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [prefs, setPrefs] = useState<UserPreferences>({
    dietType: DietType.VEG,
    ingredients: [],
    lockedIngredients: [],
    cityType: CityType.METRO,
    dailyBudget: 1000,
    kitchenSetup: KitchenSetup.STANDARD,
    days: 3,
    timePerMeal: 30,
    workoutPlanEnabled: false,
    persona: { type: PersonaType.PROFESSIONAL, workload: 'Medium', dislikes: [] },
    scheduling: { reminderTime: 'Both', cookingWindowStart: '18:00', cookingWindowEnd: '20:30', remindersPerDay: 2 },
    onboardingStep: 0
  });

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setPlan(parsed);
      } catch (e) {
        localStorage.removeItem(CACHE_KEY);
      }
    }
  }, []);

  const handleGenerate = useCallback(async (currentPrefs: UserPreferences) => {
    if (currentPrefs.ingredients.length < 1) {
      setError("Please add at least one ingredient to catalyze the recipe engine.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(15);
    
    const interval = setInterval(() => setProgress(p => p < 92 ? p + 3 : p), 700);

    try {
      const result = await generateMealPlan(currentPrefs);
      setPlan(result);
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operational Fault in Logic Engine");
    } finally {
      clearInterval(interval);
      setIsLoading(false);
      setProgress(0);
    }
  }, []);

  const handleReset = useCallback(() => {
    setPlan(null);
    localStorage.removeItem(CACHE_KEY);
  }, []);

  const stepContent = useMemo(() => {
    if (plan) return <MealPlanDisplay plan={plan} prefs={prefs} onReset={handleReset} onOptimize={(g) => handleGenerate({...prefs, optimizationGoal: g})} />;
    
    switch (prefs.onboardingStep) {
      case 0: return <Onboarding prefs={prefs} setPrefs={setPrefs} onNext={() => setPrefs(p => ({...p, onboardingStep: 1}))} />;
      case 1: return <PreferenceForm prefs={prefs} setPrefs={setPrefs} onNext={() => setPrefs(p => ({...p, onboardingStep: 2}))} onBack={() => setPrefs(p => ({...p, onboardingStep: 0}))} />;
      case 2: return <SchedulingPanel prefs={prefs} setPrefs={setPrefs} onNext={() => handleGenerate(prefs)} onBack={() => setPrefs(p => ({...p, onboardingStep: 1}))} />;
      default: return null;
    }
  }, [plan, prefs, handleGenerate, handleReset]);

  return (
    <div className="min-h-screen bg-stone-50 selection:bg-orange-100">
      {isLoading && <LoadingOverlay progress={progress} />}
      <MusicPlayer />
      <HealthCoachWidget />
      <ChatWidget prefs={prefs} setPrefs={setPrefs} onGenerate={handleGenerate} isLoading={isLoading} />

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-stone-100 p-6 transition-all">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <button className="flex items-center gap-2 hover:opacity-70 transition-opacity" onClick={handleReset}>
            <div className="w-10 h-10 bg-stone-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">M</div>
            <span className="text-xl font-black uppercase tracking-tighter">Culinary <span className="text-orange-500 font-serif italic">Muse</span></span>
          </button>
          <div className="flex items-center gap-6">
            <div className="text-[10px] font-black text-stone-300 uppercase tracking-widest hidden md:block">v5.3 Stable | Live Grounding</div>
            {plan && (
              <button onClick={handleReset} className="text-[9px] font-black text-orange-500 uppercase border border-orange-200 px-4 py-2 rounded-full hover:bg-orange-50">New Plan</button>
            )}
          </div>
        </div>
      </header>

      <main>
        {error && (
          <div className="max-w-2xl mx-auto my-12 p-10 bg-red-50 rounded-[3rem] border border-red-100 text-red-700 animate-in slide-in-from-top-4" role="alert">
            <h4 className="font-bold mb-3 italic text-xl">Operational Fault Identified</h4>
            <p className="text-sm opacity-80 leading-relaxed">{error}</p>
            <div className="mt-8 flex gap-4">
               <button onClick={() => setError(null)} className="text-[10px] font-black uppercase bg-red-700 text-white px-6 py-3 rounded-xl shadow-lg">Acknowledge</button>
               <button onClick={() => window.location.reload()} className="text-[10px] font-black uppercase border border-red-200 px-6 py-3 rounded-xl">Hard Restart</button>
            </div>
          </div>
        )}
        {stepContent}
      </main>
    </div>
  );
};

export default App;


import React, { useState } from 'react';
import { UserPreferences, PersonaType, DietType } from '../types';

interface Props {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
  onNext: () => void;
}

const Onboarding: React.FC<Props> = ({ prefs, setPrefs, onNext }) => {
  const [dislikeInput, setDislikeInput] = useState('');

  const addDislike = () => {
    if (!dislikeInput.trim()) return;
    setPrefs(p => ({
      ...p,
      persona: { ...p.persona, dislikes: [...new Set([...p.persona.dislikes, dislikeInput.trim()])] }
    }));
    setDislikeInput('');
  };

  const removeDislike = (item: string) => {
    setPrefs(p => ({
      ...p,
      persona: { ...p.persona, dislikes: p.persona.dislikes.filter(d => d !== item) }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-stone-900 text-white rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-2xl">M</div>
        <h1 className="text-5xl font-bold italic font-serif">Welcome to the Muse.</h1>
        <p className="text-stone-500 text-lg">Let's craft your culinary profile for precision planning.</p>
      </div>

      <div className="space-y-12">
        {/* Persona Selection */}
        <section className="space-y-6">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] block text-center">Your Professional Identity</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(PersonaType).map(type => (
              <button
                key={type}
                onClick={() => setPrefs(p => ({ ...p, persona: { ...p.persona, type } }))}
                className={`p-8 rounded-[2rem] border-2 transition-all text-left space-y-2 group ${prefs.persona.type === type ? 'bg-stone-900 border-stone-900 text-white shadow-2xl scale-105' : 'bg-white border-stone-100 hover:border-orange-200'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${prefs.persona.type === type ? 'bg-orange-500' : 'bg-stone-100'}`}>
                  {type === PersonaType.PROFESSIONAL ? '💼' : type === PersonaType.STUDENT ? '🎓' : '🏠'}
                </div>
                <h3 className="font-bold text-sm uppercase tracking-tight">{type}</h3>
                <p className={`text-[10px] leading-relaxed ${prefs.persona.type === type ? 'text-stone-400' : 'text-stone-400'}`}>
                  {type === PersonaType.PROFESSIONAL ? 'Optimized for high workload & quick recovery.' : type === PersonaType.STUDENT ? 'Focus on budget-friendly, high-energy meals.' : 'Designed for variety & scalability.'}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Diet Selection */}
        <section className="space-y-6">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] block text-center">Dietary Framework</label>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.values(DietType).map(diet => (
              <button
                key={diet}
                onClick={() => setPrefs(p => ({ ...p, dietType: diet }))}
                className={`px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest transition-all border-2 ${prefs.dietType === diet ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-white border-stone-100 text-stone-400 hover:border-orange-200'}`}
              >
                {diet}
              </button>
            ))}
          </div>
        </section>

        {/* Dislikes / Constraints */}
        <section className="bg-stone-50 p-10 rounded-[3rem] border border-stone-100 space-y-6">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] block">Strict Dislikes & Allergies</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {prefs.persona.dislikes.map(d => (
              <span key={d} className="bg-stone-900 text-white text-[10px] font-bold px-4 py-2 rounded-full flex items-center gap-2 animate-in zoom-in">
                {d}
                <button onClick={() => removeDislike(d)} className="text-orange-500 hover:text-white transition-colors">×</button>
              </span>
            ))}
            {prefs.persona.dislikes.length === 0 && <span className="text-stone-400 text-[10px] italic">No restrictions added yet.</span>}
          </div>
          <div className="flex gap-2">
            <input
              value={dislikeInput}
              onChange={e => setDislikeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDislike()}
              placeholder="e.g. Mushrooms, Cilantro, Peanuts"
              className="flex-1 bg-white border border-stone-200 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
            <button onClick={addDislike} className="bg-stone-900 text-white px-8 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all">Add</button>
          </div>
        </section>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={onNext}
          className="px-20 py-8 bg-orange-500 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-[0.3em] shadow-2xl hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all"
        >
          Initialize Profile
        </button>
      </div>
    </div>
  );
};

export default Onboarding;

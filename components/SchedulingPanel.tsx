
import React from 'react';
import { UserPreferences } from '../types';

interface Props {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
  onNext: () => void;
  onBack: () => void;
}

const SchedulingPanel: React.FC<Props> = ({ prefs, setPrefs, onNext, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 space-y-16 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold italic font-serif">Temporal Logistics</h2>
        <p className="text-stone-500 text-sm">Synchronize your kitchen with your daily rhythm.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cooking Window */}
        <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Kitchen Operation Window</label>
            <p className="text-[11px] text-stone-400">When do you prefer to start and end cooking?</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Start Time</span>
              <input 
                type="time" 
                value={prefs.scheduling.cookingWindowStart} 
                onChange={e => setPrefs(p => ({ ...p, scheduling: { ...p.scheduling, cookingWindowStart: e.target.value } }))}
                className="w-full bg-stone-50 border-none p-4 rounded-xl font-bold text-xs"
              />
            </div>
            <div className="space-y-2">
              <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">End Time</span>
              <input 
                type="time" 
                value={prefs.scheduling.cookingWindowEnd} 
                onChange={e => setPrefs(p => ({ ...p, scheduling: { ...p.scheduling, cookingWindowEnd: e.target.value } }))}
                className="w-full bg-stone-50 border-none p-4 rounded-xl font-bold text-xs"
              />
            </div>
          </div>
        </div>

        {/* Reminder Logic */}
        <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em]">Smart Notification Engine</label>
            <p className="text-[11px] text-stone-500">How would you like to be nudged for prep?</p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Nudge Frequency</span>
              <div className="flex gap-2">
                {[1, 2].map(num => (
                  <button
                    key={num}
                    onClick={() => setPrefs(p => ({ ...p, scheduling: { ...p.scheduling, remindersPerDay: num as 1 | 2 } }))}
                    className={`flex-1 py-4 rounded-xl font-black text-xs transition-all border ${prefs.scheduling.remindersPerDay === num ? 'bg-orange-500 border-orange-500' : 'bg-white/5 border-white/5 text-stone-500'}`}
                  >
                    {num} Per Day
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Nudge Horizon</span>
              <div className="flex gap-2">
                {['Morning', 'Evening', 'Both'].map(time => (
                  <button
                    key={time}
                    onClick={() => setPrefs(p => ({ ...p, scheduling: { ...p.scheduling, reminderTime: time as any } }))}
                    className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${prefs.scheduling.reminderTime === time ? 'bg-orange-500 border-orange-500' : 'bg-white/5 border-white/5 text-stone-500'}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 flex items-center gap-6">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">🔔</div>
        <div className="flex-1">
          <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Notification Preview</h4>
          <p className="text-stone-600 text-xs italic">"Morning Muse: You have 20 mins of prep for tonight's {prefs.dietType} feast. Start chopping at {prefs.scheduling.cookingWindowStart}!"</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-12">
        <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">← Back to Pantry</button>
        <button 
          onClick={onNext}
          className="px-12 py-6 bg-stone-900 text-white rounded-3xl text-xs font-black uppercase tracking-[0.3em] transition-all hover:bg-orange-500 shadow-xl"
        >
          Synthesize Master Logistics
        </button>
      </div>
    </div>
  );
};

export default SchedulingPanel;

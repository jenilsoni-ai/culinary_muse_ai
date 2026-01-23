
import React, { useState, useMemo, useCallback, memo } from 'react';
import { MealPlanResponse, OptimizationGoal, UserPreferences, Meal, CalendarEvent } from '../types';
import { synthesizeSpeech } from '../services/geminiService';

const MealCard = memo(({ meal }: { meal: Meal }) => (
  <article className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-6">
      <h3 className="text-2xl font-bold font-serif italic text-stone-800">{meal.recipeTitle || meal.mealName}</h3>
      <div className="flex gap-2">
        <button 
          onClick={() => synthesizeSpeech(`Steps for ${meal.recipeTitle || meal.mealName}: ${Array.isArray(meal.instructions) ? meal.instructions.join('. ') : 'Wait for instructions.'}`)}
          className="bg-stone-100 p-2.5 rounded-xl hover:bg-orange-100 transition-colors"
          title="Narrate Steps"
        >🔊</button>
        <span className="bg-stone-50 px-3 py-1 rounded-lg text-[10px] font-black text-stone-400 uppercase">{meal.prepTime || 0}m</span>
      </div>
    </div>
    <p className="text-xs text-stone-500 mb-6 italic opacity-75">"{meal.logicForWorkload || 'Selected for your workload profile.'}"</p>
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Pantry Requirements</h4>
        <ul className="space-y-2">
          {Array.isArray(meal.ingredients) && meal.ingredients.map((ing, i) => (
            <li key={i} className="text-xs text-stone-600 flex justify-between border-b border-stone-50 pb-1">
              <span>{ing.amount} {ing.name}</span>
              <span className="text-stone-300 font-medium">₹{ing.estimatedCost || 0}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Execution Sequence</h4>
        <ol className="space-y-2">
          {Array.isArray(meal.instructions) && meal.instructions.map((step, i) => (
            <li key={i} className="text-[11px] text-stone-500 flex gap-2">
              <span className="text-orange-400 font-bold">{i+1}.</span>
              <p className="leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </article>
));

const FlexSlotCard = memo(({ event }: { event: CalendarEvent }) => (
  <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-4 hover:bg-white/10 transition-all">
    <div className="flex justify-between items-start">
      <div className="flex gap-4 items-center">
        <span className="text-3xl">{event.type === 'shopping' ? '🛒' : event.type === 'prep' ? '🔪' : '🔥'}</span>
        <div>
          <h4 className="font-bold text-lg">{event.title}</h4>
          <p className="text-[10px] text-stone-500 uppercase font-black">{new Date(event.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - PRIMARY WINDOW</p>
        </div>
      </div>
    </div>
    
    {Array.isArray(event.alternativeSlots) && event.alternativeSlots.length > 0 && (
      <div className="pt-4 border-t border-white/10">
        <p className="text-[9px] font-black text-orange-400 uppercase tracking-[0.2em] mb-3">🕒 Flex Slots (Backup Windows)</p>
        <div className="flex flex-wrap gap-2">
          {event.alternativeSlots.map((slot, idx) => (
            <div key={idx} className="bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full text-[9px] font-bold text-orange-300">
              {slot.label}: {new Date(slot.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
));

interface Props {
  plan: MealPlanResponse;
  prefs: UserPreferences;
  onReset: () => void;
  onOptimize: (goal: OptimizationGoal) => void;
}

const MealPlanDisplay: React.FC<Props> = ({ plan, prefs, onReset, onOptimize }) => {
  const [activeDay, setActiveDay] = useState(1);
  const [activeTab, setActiveTab] = useState<'meals' | 'inventory' | 'calendar'>('meals');

  const dayData = useMemo(() => {
    if (!Array.isArray(plan.days)) return null;
    return plan.days.find(d => d.dayNumber === activeDay);
  }, [plan.days, activeDay]);

  const handleDownloadICS = useCallback(() => {
    if (!Array.isArray(plan.calendarEvents)) return;

    const calendarHeader = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Culinary Muse//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'].join('\n');
    
    const events = plan.calendarEvents.flatMap(event => {
      const primaryStart = event.start.replace(/[-:]/g, '').split('.')[0] + 'Z';
      const primaryEnd = event.end.replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      const mainEvent = [
        'BEGIN:VEVENT',
        `UID:${Math.random().toString(36).substring(7)}@muse.ai`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${primaryStart}`,
        `DTEND:${primaryEnd}`,
        `SUMMARY:${event.title} (Primary)`,
        `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
        'END:VEVENT'
      ].join('\n');

      const flexEvents = Array.isArray(event.alternativeSlots) ? event.alternativeSlots.map(slot => {
        const fStart = slot.start.replace(/[-:]/g, '').split('.')[0] + 'Z';
        const fEnd = slot.end.replace(/[-:]/g, '').split('.')[0] + 'Z';
        return [
          'BEGIN:VEVENT',
          `UID:flex_${Math.random().toString(36).substring(7)}@muse.ai`,
          `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
          `DTSTART:${fStart}`,
          `DTEND:${fEnd}`,
          `SUMMARY:[FLEX] ${event.title} (${slot.label})`,
          `DESCRIPTION:Alternative slot for uncertain schedules. ${event.description.replace(/\n/g, '\\n')}`,
          'TRANSP:TRANSPARENT',
          'END:VEVENT'
        ].join('\n');
      }) : [];

      return [mainEvent, ...flexEvents];
    }).join('\n');

    const icsContent = `${calendarHeader}\n${events}\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Culinary_Muse_Full_Plan.ics`;
    link.click();
  }, [plan.calendarEvents]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="bg-stone-900 text-white p-12 md:p-16 rounded-[4rem] shadow-2xl relative overflow-hidden border border-white/5">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-bold font-serif italic leading-tight">{plan.planTitle || 'Your Custom Plan'}</h1>
            <p className="text-stone-400 text-sm max-w-xl opacity-80">{plan.fitnessNote}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/10 text-center min-w-[300px]">
            <button 
              onClick={() => synthesizeSpeech(`Plan: ${plan.planTitle}. Summary: ${plan.fitnessNote}. Total cost ₹${plan.totalEstimatedCost}.`)}
              className="mb-6 bg-orange-500 p-4 rounded-full hover:scale-110 transition-transform shadow-lg"
              title="Hear Summary"
            >🔊 Play Overview</button>
            <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">Estimated Plan Cost</div>
            <div className="text-5xl font-black text-orange-400">₹{plan.totalEstimatedCost || 0}</div>
            <div className="text-[9px] font-bold text-orange-500/60 mt-2 uppercase tracking-tighter">{plan.budgetStatus}</div>
          </div>
        </div>
      </header>

      <nav className="flex flex-col lg:flex-row gap-6 justify-between items-center bg-stone-100 p-4 rounded-[3rem] shadow-inner">
        <div className="flex gap-1">
          {(['meals', 'inventory', 'calendar'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-stone-900 shadow-md scale-105' : 'text-stone-400 hover:text-stone-600'}`}
            >
              {tab === 'meals' ? '🍱 Meal Plan' : tab === 'inventory' ? '🛒 Logistics' : '📅 Temporal Sync'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {Array.isArray(plan.days) && plan.days.map(d => (
            <button
              key={d.dayNumber}
              onClick={() => setActiveDay(d.dayNumber)}
              className={`w-12 h-12 rounded-2xl font-black text-xs transition-all border ${activeDay === d.dayNumber ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white text-stone-400 border-stone-100 hover:border-orange-200'}`}
            >
              D{d.dayNumber}
            </button>
          ))}
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          {activeTab === 'meals' && dayData && Array.isArray(dayData.meals) && dayData.meals.map((meal, i) => <MealCard key={i} meal={meal} />)}
          {activeTab === 'meals' && (!dayData || !Array.isArray(dayData.meals)) && (
            <div className="bg-white p-20 rounded-[4rem] text-center text-stone-400 italic">No meals synthesized for this day.</div>
          )}
          
          {activeTab === 'inventory' && Array.isArray(plan.groceryList) && (
            <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-stone-100 space-y-12">
              <h3 className="text-3xl font-serif italic text-stone-800">Operational Inventory</h3>
              <div className="grid md:grid-cols-2 gap-12">
                {plan.groceryList.map((cat, i) => (
                  <div key={i} className="space-y-4">
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span> {cat.category}
                    </h4>
                    <ul className="space-y-3">
                      {Array.isArray(cat.items) && cat.items.map((item, j) => <li key={j} className="text-xs text-stone-600 pl-4 border-l-2 border-orange-50 hover:border-orange-200 transition-all">{item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && Array.isArray(plan.calendarEvents) && (
            <div className="bg-stone-900 text-white p-12 rounded-[4rem] shadow-2xl space-y-12 border border-white/5">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-3xl font-serif italic">Resilient Scheduling</h3>
                  <p className="text-stone-500 text-xs mt-2">Flex Slots added for every major kitchen operation.</p>
                </div>
                <button 
                  onClick={handleDownloadICS}
                  className="bg-orange-500 hover:bg-orange-600 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3 active:scale-95"
                >
                  📥 Download Calendar (.ics)
                </button>
              </div>
              <div className="grid gap-6">
                {plan.calendarEvents.map((event, i) => <FlexSlotCard key={i} event={event} />)}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <section className="bg-stone-100 p-8 rounded-[3rem] border border-stone-200 shadow-inner">
            <h4 className="text-[10px] font-black uppercase text-stone-400 mb-6 tracking-widest">Grounding Intelligence</h4>
            <div className="space-y-4">
              {Array.isArray(plan.nearbyStores) && plan.nearbyStores.length > 0 ? plan.nearbyStores.map((store, i) => (
                <a key={i} href={store.uri} target="_blank" className="block bg-white p-4 rounded-2xl shadow-sm hover:border-orange-500 transition-all border border-stone-200 group">
                  <p className="text-xs font-bold text-stone-800 group-hover:text-orange-600">{store.name}</p>
                  <p className="text-[9px] text-orange-500 uppercase font-black mt-1">Open in Maps →</p>
                </a>
              )) : <p className="text-[10px] text-stone-400 italic">No stores localized in this session.</p>}
              
              <div className="pt-4 border-t border-stone-200 flex flex-wrap gap-2">
                {Array.isArray(plan.groundingSources) && plan.groundingSources.filter(s => s.type === 'web').map((s, i) => (
                  <a key={i} href={s.uri} target="_blank" className="bg-stone-200 text-stone-600 px-3 py-1.5 rounded-full text-[8px] font-bold hover:bg-orange-100">🔗 Web Evidence</a>
                ))}
              </div>
            </div>
          </section>
          
          <div className="p-8 bg-orange-50 rounded-[3rem] border border-orange-100 text-center">
             <span className="text-3xl">🧩</span>
             <h5 className="font-serif italic font-bold text-orange-800 mt-4">Temporal Flex Ready</h5>
             <p className="text-[10px] text-orange-700/60 mt-2">Primary windows missed? Use backup slots in the 'Temporal Sync' tab.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MealPlanDisplay;

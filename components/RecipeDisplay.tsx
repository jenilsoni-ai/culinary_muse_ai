
import React, { useState } from 'react';
import { MealPlanResponse, OptimizationGoal, UserPreferences } from '../types';

interface Props {
  plan: MealPlanResponse;
  prefs: UserPreferences;
  onReset: () => void;
  onOptimize: (goal: OptimizationGoal) => void;
}

const MealPlanDisplay: React.FC<Props> = ({ plan, prefs, onReset, onOptimize }) => {
  const [activeDay, setActiveDay] = useState(1);

  const isItemInPantry = (itemName: string) => {
    return prefs.ingredients.some(ing => 
      itemName.toLowerCase().includes(ing.toLowerCase()) || 
      ing.toLowerCase().includes(itemName.toLowerCase())
    );
  };

  const calculateActualSpend = () => {
    // Basic heuristic: if item is in pantry, its cost from grocery list or recipes is "saved"
    // Since grocery list doesn't have prices per item in the JSON, we look at meal ingredients
    let totalValue = plan.totalEstimatedCost;
    let saved = 0;
    
    plan.days.forEach(day => {
      day.meals.forEach(meal => {
        meal.ingredients.forEach(ing => {
          if (isItemInPantry(ing.name)) {
            saved += ing.estimatedCost;
          }
        });
      });
    });
    
    return Math.max(0, totalValue - saved);
  };

  const actualSpend = calculateActualSpend();

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in zoom-in duration-500 px-4">
      {/* Header Info */}
      <div className="bg-stone-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left space-y-4">
            <span className="bg-orange-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Validated Master Plan</span>
            <h1 className="text-4xl md:text-6xl font-bold italic font-serif leading-tight">{plan.planTitle}</h1>
            <p className="text-stone-400 max-w-lg text-sm">{plan.fitnessNote}</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 text-center min-w-[200px]">
              <div className="text-[10px] font-bold text-stone-400 uppercase mb-1">Out-of-pocket Cost</div>
              <div className="text-4xl font-black text-orange-400 mb-2">₹{actualSpend}</div>
              <div className="text-[9px] text-stone-500 uppercase font-black">₹{plan.totalEstimatedCost} Total Value</div>
            </div>
            <div className={`text-[10px] font-bold px-3 py-1 rounded-full text-center uppercase tracking-widest ${plan.budgetStatus === 'Under Budget' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {plan.budgetStatus}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Logistics Column */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">🛒 Grocery Logistics</h3>
              <span className="text-[9px] font-black bg-stone-100 px-2 py-1 rounded text-stone-500">AUTO-MATCHED</span>
            </div>
            <div className="space-y-8">
              {plan.groceryList.map((cat, i) => (
                <div key={i}>
                  <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    {cat.category}
                  </h4>
                  <ul className="space-y-4">
                    {cat.items.map((item, j) => {
                      const stocked = isItemInPantry(item);
                      return (
                        <li key={j} className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium flex items-center gap-2 ${stocked ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                              <input type="checkbox" checked={stocked} readOnly className="w-4 h-4 rounded border-stone-300 accent-green-500" />
                              {item}
                            </span>
                            {stocked && (
                              <span className="text-[8px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded uppercase">In Pantry</span>
                            )}
                          </div>
                          {!stocked && (
                            <button 
                              onClick={() => window.open(`https://www.zomato.com/search?q=${encodeURIComponent(item)}`, '_blank')}
                              className="text-[9px] font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest flex items-center gap-1.5 self-start ml-6"
                            >
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                              Order via Zomato
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-stone-800 p-8 rounded-[2rem] text-white space-y-4">
            <h3 className="text-lg font-bold">🚀 Strategy refinement</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(OptimizationGoal).map(goal => (
                <button key={goal} onClick={() => onOptimize(goal)} className="py-3 px-2 rounded-xl border border-white/10 text-[10px] font-bold hover:bg-orange-500 hover:border-orange-500 transition-all uppercase tracking-tighter">
                  {goal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Plan Details Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Day Selector */}
          <div className="flex gap-4">
            {plan.days.map(d => (
              <button 
                key={d.dayNumber}
                onClick={() => setActiveDay(d.dayNumber)}
                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase transition-all shadow-sm ${activeDay === d.dayNumber ? 'bg-orange-500 text-white shadow-orange-200' : 'bg-white text-stone-400 border border-stone-100'}`}
              >
                Day {d.dayNumber}
              </button>
            ))}
          </div>

          {/* Day Context Bar */}
          <div className="bg-orange-50 border border-orange-100 p-6 rounded-[2rem] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Workout Focus</h4>
                <p className="text-xs text-stone-500">{plan.days.find(d => d.dayNumber === activeDay)?.workoutInfo || "Standard Daily Movement"}</p>
              </div>
            </div>
          </div>

          {/* Meals */}
          <div className="space-y-8">
            {plan.days.find(d => d.dayNumber === activeDay)?.meals.map((meal, idx) => (
              <div key={idx} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-stone-100 relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-all"></div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{meal.type}</span>
                    <h2 className="text-2xl md:text-3xl font-bold text-stone-800 mt-1">{meal.recipeTitle}</h2>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-100 text-xs font-medium text-stone-500 leading-relaxed italic">
                  "Logistics: {meal.logicForWorkload}"
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Ingredients</h4>
                    <ul className="space-y-2">
                      {meal.ingredients.map((ing, k) => (
                        <li key={k} className="flex justify-between text-xs font-medium pb-2 border-b border-stone-50">
                          <span className={isItemInPantry(ing.name) ? "text-green-600 font-bold" : ""}>
                            {ing.amount} {ing.name} {isItemInPantry(ing.name) && "✓"}
                          </span>
                          <span className="text-stone-400">₹{ing.estimatedCost}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Master Substitutions</h4>
                    <div className="flex flex-wrap gap-2">
                      {meal.substitutions.map((sub, k) => (
                        <span key={k} className="px-2 py-1 bg-stone-100 rounded text-[10px] font-bold text-stone-500 uppercase tracking-tighter">
                          Sub {k+1}: {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Daily Cooking Sequence */}
            <div className="bg-stone-900 rounded-[2.5rem] p-10 text-white">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">⏱️ Efficiency Sequence</h3>
              <div className="space-y-4">
                {plan.days.find(d => d.dayNumber === activeDay)?.dailyCookingSequence.map((step, k) => (
                  <div key={k} className="flex gap-4 items-start">
                    <span className="text-orange-500 font-black font-mono">{k+1}.</span>
                    <p className="text-sm text-stone-400 font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-12">
        <button onClick={onReset} className="text-stone-400 font-bold flex items-center gap-2 hover:text-stone-900 transition-all uppercase text-[10px] tracking-widest">
          <span>←</span> Adjust Logistics Chat
        </button>
      </div>
    </div>
  );
};

export default MealPlanDisplay;

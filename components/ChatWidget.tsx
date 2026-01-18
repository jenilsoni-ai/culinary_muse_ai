
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserPreferences, UserPersona, DietType } from '../types';
import { chatWithChef } from '../services/geminiService';
import { marked } from 'marked';

interface Props {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
  onGenerate: (prefs: UserPreferences) => void;
  isLoading: boolean;
}

const ChatWidget: React.FC<Props> = ({ prefs, setPrefs, onGenerate, isLoading }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hey! **How was your day?** I'm here to build a meal plan that matches your current vibe and energy.\n\nTell me about your workload today or any upcoming events! I'll make sure to use **at least 3** of your ingredients to keep things easy." }
  ]);
  const [input, setInput] = useState('');
  const [stagedIngredients, setStagedIngredients] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      setGenerationProgress(5);
      interval = window.setInterval(() => {
        setGenerationProgress(prev => (prev < 90 ? prev + 1 : prev));
      }, 300);
    } else {
      setGenerationProgress(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const renderMarkdown = (text: string) => {
    return { __html: marked.parse(text) };
  };

  const handleSend = async (text?: string) => {
    const finalMessage = text || input;
    if (!finalMessage.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: finalMessage };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatWithChef(newMessages, prefs);
      setMessages([...newMessages, { role: 'model', text: response || "Understood. I'll take that into account for your plan." }]);
      
      const lower = finalMessage.toLowerCase();
      const p = { ...prefs.persona };
      
      if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('stress')) {
        p.mentalState = 'Exhausted/Stressed';
        p.workload = 'High';
      } else if (lower.includes('productive') || lower.includes('busy')) {
        p.workload = 'High';
        p.mentalState = 'Stable';
      } else if (lower.includes('calm') || lower.includes('relax')) {
        p.workload = 'Low';
        p.mentalState = 'Energetic';
      }
      
      setPrefs(prev => ({ ...prev, persona: p }));
    } catch (err) {
      console.error("Chat Error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const ingredient = e.dataTransfer.getData("ingredient");
    if (ingredient && !prefs.ingredients.includes(ingredient)) {
      setPrefs(p => ({ ...p, ingredients: [...p.ingredients, ingredient] }));
    }
  };

  const handleGenerateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onGenerate(prefs);
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex flex-col items-end transition-all duration-500 ${isOpen ? 'w-[400px] md:w-[480px]' : 'w-16'}`}>
      {isOpen ? (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={onDrop}
          className={`bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-stone-100 flex flex-col h-[550px] w-full overflow-hidden animate-in slide-in-from-bottom-10 relative transition-all duration-300 ${isDraggingOver ? 'bg-orange-50 border-orange-400 ring-8 ring-orange-100 scale-[1.02]' : ''}`}
        >
          {/* Header */}
          <div className="bg-stone-900 p-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">M</div>
              <div>
                <span className="text-white text-xs font-black uppercase tracking-widest block">Chef Assistant</span>
                <span className="text-stone-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Intelligent Context
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="bg-white/10 p-2 rounded-xl text-stone-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Pantry Ribbon */}
          <div className="bg-stone-50 border-b border-stone-100 px-6 py-3 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Active Pantry: {prefs.ingredients.length} items</span>
            <div className="flex -space-x-2">
              {prefs.ingredients.slice(0, 5).map((ing, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[10px] shadow-sm">
                  {ing.charAt(0)}
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 chat-scrollbar bg-[#fafafa]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                  m.role === 'user' ? 'bg-stone-900 text-white rounded-tr-none' : 'bg-white text-stone-800 rounded-tl-none border border-stone-100'
                }`} 
                dangerouslySetInnerHTML={m.role === 'model' ? renderMarkdown(m.text) : undefined}>
                  {m.role === 'user' ? m.text : null}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl border border-stone-100 flex gap-1 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {!isLoading && (
            <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-stone-50/50 shrink-0 border-t border-stone-50">
              <button type="button" onClick={() => handleSend("Exhausted 😫")} className="whitespace-nowrap px-4 py-2 bg-white border border-stone-200 rounded-2xl text-[10px] font-black text-stone-600 hover:border-orange-500 transition-all shadow-sm uppercase tracking-tighter">Exhausted 😫</button>
              <button type="button" onClick={() => handleSend("Productive 🚀")} className="whitespace-nowrap px-4 py-2 bg-white border border-stone-200 rounded-2xl text-[10px] font-black text-stone-600 hover:border-orange-500 transition-all shadow-sm uppercase tracking-tighter">Productive 🚀</button>
              <button type="button" onClick={() => handleSend("Calm 🧘")} className="whitespace-nowrap px-4 py-2 bg-white border border-stone-200 rounded-2xl text-[10px] font-black text-stone-600 hover:border-orange-500 transition-all shadow-sm uppercase tracking-tighter">Calm 🧘</button>
            </div>
          )}

          {/* Form */}
          {!isLoading && (
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-6 border-t border-stone-100 flex gap-3 bg-white shrink-0">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your energy levels..."
                className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all"
              />
              <button type="submit" className="bg-stone-900 text-white p-3 rounded-2xl hover:bg-orange-600 transition-colors shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </form>
          )}

          {/* CTA */}
          <button 
            type="button"
            onClick={handleGenerateClick}
            disabled={isLoading || prefs.ingredients.length < 5}
            className={`w-full py-5 text-xs font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden shrink-0 ${
              isLoading || prefs.ingredients.length < 5 
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed' 
                : 'bg-orange-500 text-white active:scale-[0.98] shadow-lg shadow-orange-200'
            }`}
          >
            {isLoading && (
              <div 
                className="absolute inset-0 bg-orange-600 transition-all duration-300 ease-out opacity-40"
                style={{ width: `${generationProgress}%` }}
              ></div>
            )}
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  `Synthesizing... ${generationProgress}%`
                </>
              ) : (
                "Generate Plan"
              )}
            </span>
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform relative border-4 border-white ${isLoading ? 'bg-orange-500 animate-pulse' : 'bg-stone-900'}`}
        >
          {isLoading ? (
             <span className="text-[10px] font-black text-white">{generationProgress}%</span>
          ) : (
            <span className="text-2xl">👨‍🍳</span>
          )}
        </button>
      )}
    </div>
  );
};

export default ChatWidget;


import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserPreferences } from '../types';
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
    { role: 'model', text: "Hey! I'm your Culinary Muse. **How can I help you eat better today?**\n\nTell me your cravings, or tap the 🎤 to speak!" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = async (text?: string, audioData?: string) => {
    const finalContent = text || input;
    if (!finalContent && !audioData) return;

    const userMsg: ChatMessage = { 
      role: 'user', 
      text: audioData ? "[Voice Message]" : finalContent 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const payload = audioData 
        ? { inlineData: { data: audioData, mimeType: "audio/webm" } }
        : finalContent;

      const response = await chatWithChef([...messages, { role: 'user', text: payload as any }], prefs);
      setMessages(prev => [...prev, { role: 'model', text: response || "I'm ready when you are." }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I had a momentary kitchen fire. Can you try that again?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          handleSend(undefined, base64);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access failed", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex flex-col items-end transition-all duration-500 ${isOpen ? 'w-[400px] md:w-[480px]' : 'w-16'}`}>
      {isOpen ? (
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-stone-100 flex flex-col h-[550px] w-full overflow-hidden animate-in slide-in-from-bottom-10">
          <div className="bg-stone-900 p-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">M</div>
              <span className="text-white text-[10px] font-black uppercase tracking-widest">Assistant Hub</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-white">✕</button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 chat-scrollbar bg-[#fafafa]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'bg-stone-900 text-white rounded-tr-none' : 'bg-white text-stone-800 rounded-tl-none border border-stone-100'}`} 
                dangerouslySetInnerHTML={m.role === 'model' ? { __html: marked.parse(m.text) } : undefined}>
                  {m.role === 'user' ? m.text : null}
                </div>
              </div>
            ))}
            {isTyping && <div className="text-[10px] text-stone-400 font-bold uppercase animate-pulse">Assistant is crafting a response...</div>}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-6 border-t border-stone-100 flex gap-3 bg-white shrink-0">
            <button 
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              className={`p-4 rounded-2xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
              title="Hold to speak"
            >
              🎤
            </button>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type message or hold mic..."
              className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-5 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button type="submit" className="bg-stone-900 text-white p-4 rounded-2xl hover:bg-orange-600 transition-colors">➔</button>
          </form>

          <button 
            onClick={() => onGenerate(prefs)}
            disabled={isLoading || prefs.ingredients.length < 3}
            className="w-full py-5 bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.3em] disabled:bg-stone-200"
          >
            {isLoading ? "Synthesizing Plan..." : "Generate Master Plan"}
          </button>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="w-16 h-16 rounded-full bg-stone-900 shadow-2xl flex items-center justify-center text-2xl">👨‍🍳</button>
      )}
    </div>
  );
};

export default ChatWidget;

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { domToPng } from 'modern-screenshot';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, BookOpen, AlertCircle, RefreshCw, Layers, Share2, Download } from "lucide-react";

// Types
interface FrayerData {
  word: string;
  meaning: string;
  synonyms: string[];
  antonyms: string[];
  example: string;
}

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [data, setData] = useState<FrayerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  // Gemini AI Initialization
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError("Please enter a vocabulary word.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a Frayer Model for the word: "${inputText}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              meaning: { type: Type.STRING },
              synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
              antonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
              example: { type: Type.STRING },
            },
            required: ["word", "meaning", "synonyms", "antonyms", "example"]
          }
        },
      });

      const result = JSON.parse(response.text || '{}');
      setData(result);
      
      // Smooth scroll to result
      setTimeout(() => {
        posterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate model. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPNG = async () => {
    const posterElement = document.getElementById('frayer-poster-area'); 
    if (!posterElement) return;
    
    setIsDownloading(true);
    try {
        const dataUrl = await domToPng(posterElement, {
            scale: 2,
            backgroundColor: "#F9F8F6",
        });
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `Frayer-Model-${data?.word || 'Study-Poster'}.png`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setIsDownloading(false);
    } catch (error) {
        console.error("PNG Export Error:", error);
        alert("Failed to export PNG. This is usually due to browser restrictions on external assets. Try the 'Print / PDF' button instead.");
        setIsDownloading(false);
    }
  };

  const handleReset = () => {
    setData(null);
    setInputText('');
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center py-10 px-4 print:p-0 print:bg-white transition-colors">
      {/* Header Section - Hidden on print */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1024px] w-full border-b-2 border-brand-dark pb-8 mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:hidden"
      >
        <div>
          <h1 className="text-5xl md:text-6xl font-serif font-black uppercase italic leading-none tracking-tighter">
            Frayer Model
          </h1>
          <p className="text-xs font-mono mt-3 tracking-[0.3em] uppercase opacity-60">
            Vocabulary Acquisition Tool AI v2.5
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-grow md:flex-grow-0 group">
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-50">Word to Generate</label>
            <div className="relative">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="Enter word..."
                className="bg-transparent border-b-2 border-brand-dark text-2xl font-serif font-bold text-slate-800 focus:text-brand-orange focus:border-brand-orange outline-none transition-all w-full md:w-64 py-1"
              />
              <BookOpen className="absolute right-0 bottom-2 w-5 h-5 text-brand-dark opacity-20" />
            </div>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="bg-brand-dark text-white hover:bg-brand-orange px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Regenerate"}
          </button>
        </div>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 flex items-center gap-2 text-red-600 bg-red-50 brutalist-border p-4 shadow-sm font-mono text-sm uppercase tracking-tighter print:hidden"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}

      <AnimatePresence>
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="max-w-[1024px] w-full"
          >
            <div 
              id="frayer-poster-area"
              className="bg-brand-bg p-4 md:p-12 flex flex-col print:p-0 print:bg-white"
              style={{ minHeight: '700px' }}
            >
              <button 
                onClick={handleReset}
                className="mb-8 self-center flex items-center gap-2 text-gray-400 hover:text-brand-orange transition-colors font-mono text-[10px] uppercase tracking-widest print:hidden"
              >
                <RefreshCw className="w-4 h-4" />
                Change Word
              </button>

              {/* Mobile Only Word Header */}
              <div className="mobile-center-word">
                {data.word}
              </div>

              <div className="frayer-grid-container flex-grow relative">
                {/* 1. Definition */}
                <div className="brutalist-border bg-white p-6 md:p-12 md:pb-20 md:pr-20 relative overflow-hidden group print:p-8">
                  <div className="decorative-badge -top-4 -left-4 rotate-[-15deg] print:rotate-0 print:top-0 print:left-0 print:w-10 print:h-10 print:text-sm">
                    <span className="mt-4 ml-4 print:m-0">01</span>
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-6 md:mb-10 text-center opacity-30 italic">Definition</h3>
                  <p className="text-xl md:text-2xl font-serif leading-relaxed text-brand-dark lowercase">
                    {data.meaning}
                  </p>
                </div>

                {/* 2. Synonyms */}
                <div className="brutalist-border bg-white p-6 md:p-10 md:pb-16 md:pl-16 relative overflow-hidden print:p-8">
                  <div className="decorative-badge -top-4 -right-4 rotate-[15deg] print:rotate-0 print:top-0 print:right-0 print:w-10 print:h-10 print:text-sm">
                    <span className="mt-4 mr-4 print:m-0">02</span>
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-6 md:mb-10 text-center opacity-30 italic">Synonyms</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {data.synonyms.map((s, i) => (
                      <span key={i} className="px-3 py-1 md:px-4 md:py-2 bg-gray-100 brutalist-border rounded-full text-xs md:text-sm font-black uppercase tracking-tight text-brand-dark print:border-brand-dark">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3. Example */}
                <div className="brutalist-border bg-white p-6 md:p-10 md:pt-16 md:pr-16 relative overflow-hidden print:p-8">
                  <div className="decorative-badge -bottom-4 -left-4 rotate-[15deg] print:rotate-0 print:bottom-0 print:left-0 print:w-10 print:h-10 print:text-sm">
                    <span className="mb-4 ml-4 print:m-0">03</span>
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-6 md:mb-10 text-center opacity-30 italic">Example Usage</h3>
                  <p className="text-lg md:text-xl font-serif italic border-l-4 border-brand-orange pl-6 md:pl-8 leading-relaxed text-brand-dark">
                    "{data.example}"
                  </p>
                </div>

                {/* 4. Antonyms */}
                <div className="brutalist-border bg-white p-6 md:p-10 md:pt-16 md:pl-16 relative overflow-hidden print:p-8">
                  <div className="decorative-badge -bottom-4 -right-4 rotate-[-15deg] print:rotate-0 print:bottom-0 print:right-0 print:w-10 print:h-10 print:text-sm">
                    <span className="mb-4 mr-4 print:m-0">04</span>
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-6 md:mb-10 text-center opacity-30 italic">Antonyms</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {data.antonyms.map((a, i) => (
                      <span key={i} className="px-3 py-1 md:px-4 md:py-2 bg-brand-dark text-white rounded-full text-xs md:text-sm font-black uppercase tracking-tight">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                {/* The Center Word (Desktop & Print Only) */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="frayer-center print:flex"
                >
                  <h2 className={`${
                    data.word.length > 18 ? 'text-sm' : 
                    data.word.length > 14 ? 'text-base' : 
                    data.word.length > 10 ? 'text-xl' : 
                    data.word.length > 7  ? 'text-2xl' : 
                    'text-4xl'
                  } font-serif font-black text-white italic tracking-tight leading-tight px-5 break-all text-center`}>
                    {data.word}
                  </h2>
                </motion.div>
              </div>

              <div className="mt-16 pt-8 border-t border-brand-dark/10 flex flex-col items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest opacity-40 uppercase">Designed for Academic Excellence • {new Date().getFullYear()}</span>
                <span className="text-[11px] font-mono font-bold tracking-wider text-brand-orange">https://cbse.smartresourcesacademy.com/frayer-model-generator</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 pb-12 print:hidden">
              <button 
                onClick={handlePrint}
                className="flex items-center justify-center gap-3 bg-brand-dark text-white px-8 py-5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-brand-orange transition-all shadow-xl active:scale-95"
              >
                <Share2 className="w-5 h-5" />
                Print / PDF
              </button>
              
              <button 
                onClick={handleDownloadPNG}
                disabled={isDownloading}
                className="flex items-center justify-center gap-3 border-2 border-brand-dark text-brand-dark bg-white px-8 py-5 rounded-xl font-black text-sm uppercase tracking-widest hover:border-brand-orange hover:text-brand-orange transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                {isDownloading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isDownloading ? "Generating..." : "Export as PNG"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;

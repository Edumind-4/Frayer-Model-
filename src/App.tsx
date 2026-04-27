import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, BookOpen, AlertCircle, RefreshCw, Layers, Share2 } from "lucide-react";

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
        model: "gemini-2.5-flash-lite",
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

  const handleShareAndDownload = async () => {
    const posterElement = document.getElementById('frayer-poster-area'); 
    if (!posterElement) return;

    setIsDownloading(true);
    try {
        // 1. Generate the PDF
        const canvas = await html2canvas(posterElement, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // 2. Package the PDF as a File object
        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], 'Frayer-Model-Study-Poster.pdf', { type: 'application/pdf' });
        const wpUrl = 'https://cbse.smartresourcesacademy.com/frayer-model-generator';

        // 3. Try sharing the File + URL (Works on most mobile devices)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Frayer Model Generator',
                text: 'Check out this vocabulary Frayer Model I generated!',
                url: wpUrl
            });
        } else {
            // 4. Fallback for Desktop (Downloads the file and copies the link)
            pdf.save('Frayer-Model-Study-Poster.pdf');
            navigator.clipboard.writeText(wpUrl);
            alert('PDF downloaded and website link copied to clipboard!');
        }
        
    } catch (error) {
        console.error("Share Error:", error);
        alert("Oops! Something went wrong while sharing.");
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center py-10 px-4">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1024px] w-full border-b-2 border-brand-dark pb-8 mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
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
          className="mb-8 flex items-center gap-2 text-red-600 bg-red-50 brutalist-border p-4 shadow-sm font-mono text-sm uppercase tracking-tighter"
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
              className="bg-brand-bg p-4 md:p-12 flex flex-col"
              style={{ minHeight: '700px' }}
            >
              {/* Mobile Only Word Header */}
              <div className="mobile-center-word">
                {data.word}
              </div>

              <div className="frayer-grid-container flex-grow relative">
                {/* 1. Definition */}
                <div className="brutalist-border bg-white p-6 md:p-12 md:pb-20 md:pr-20 relative overflow-hidden group">
                  <div className="decorative-badge -top-4 -left-4 rotate-[-15deg]">
                    <span className="mt-4 ml-4">01</span>
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-6 md:mb-10 text-center opacity-30 italic">Definition</h3>
                  <p className="text-xl md:text-2xl font-serif leading-relaxed text-brand-dark lowercase">
                    {data.meaning}
                  </p>
                </div>

                {/* 2. Synonyms */}
                <div className="brutalist-border bg-white p-6 md:p-10 md:pb-16 md:pl-16 relative overflow-hidden">
                  <div className="decorative-badge -top-4 -right-4 rotate-[15deg]">
                    <span className="mt-4 mr-4">02</span>
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-6 md:mb-10 text-center opacity-30 italic">Synonyms</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {data.synonyms.map((s, i) => (
                      <span key={i} className="px-3 py-1 md:px-4 md:py-2 bg-gray-100 brutalist-border rounded-full text-xs md:text-sm font-black uppercase tracking-tight text-brand-dark">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3. Example */}
                <div className="brutalist-border bg-white p-6 md:p-10 md:pt-16 md:pr-16 relative overflow-hidden">
                  <div className="decorative-badge -bottom-4 -left-4 rotate-[15deg]">
                    <span className="mb-4 ml-4">03</span>
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-6 md:mb-10 text-center opacity-30 italic">Example Usage</h3>
                  <p className="text-lg md:text-xl font-serif italic border-l-4 border-brand-orange pl-6 md:pl-8 leading-relaxed text-brand-dark">
                    "{data.example}"
                  </p>
                </div>

                {/* 4. Antonyms */}
                <div className="brutalist-border bg-white p-6 md:p-10 md:pt-16 md:pl-16 relative overflow-hidden">
                  <div className="decorative-badge -bottom-4 -right-4 rotate-[-15deg]">
                    <span className="mb-4 mr-4">04</span>
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

                {/* The Center Word (Desktop Only) */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="frayer-center"
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

              <div className="mt-10 flex justify-between items-center text-[10px] font-mono tracking-widest opacity-40 uppercase">
                <span>Designed for Academic Excellence</span>
                <span>(c) {new Date().getFullYear()} smartresourcesacademy.com</span>
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-12 pb-12">
              <button 
                onClick={handleShareAndDownload}
                disabled={isDownloading}
                className="flex items-center gap-3 bg-brand-dark text-white px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-brand-orange transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                {isDownloading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                {isDownloading ? "Generating PDF..." : "Share PDF & Link"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;

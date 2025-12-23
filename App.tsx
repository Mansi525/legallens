
import React, { useState, useEffect, useRef } from 'react';
import { ScaleIcon, LoaderIcon, HistoryIcon, AlertCircleIcon, UploadIcon, FileTextIcon, FilePdfIcon } from './components/Icons';
import { simplifyLegalText } from './services/geminiService';
import { AnalysisResult, TranslationHistoryItem } from './types';
import { AnalysisView } from './components/AnalysisView';

// pdfjs-dist import for PDF parsing
import * as pdfjs from 'https://esm.sh/pdfjs-dist@4.10.38';
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;

const STORAGE_KEY = 'legal_lens_history';

function App() {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [isPdfSource, setIsPdfSource] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const extractTextFromPdf = async (file: File) => {
    setIsExtractingPdf(true);
    setIsPdfSource(false);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      if (!fullText.trim()) {
        throw new Error("We couldn't find any text in this PDF. It might be an image-only document.");
      }
      
      setInputText(fullText.trim());
      setIsPdfSource(true);
    } catch (err: any) {
      setError(err.message || "Failed to read the PDF document.");
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError("Please upload a PDF file.");
        return;
      }
      extractTextFromPdf(file);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setCurrentResult(null);

    try {
      const result = await simplifyLegalText(inputText);
      setCurrentResult(result);
      
      // Add to history
      const newItem: TranslationHistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        originalText: inputText.substring(0, 100) + (inputText.length > 100 ? '...' : ''),
        result
      };
      setHistory(prev => [newItem, ...prev].slice(0, 10)); // Keep last 10
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearInput = () => {
    setInputText('');
    setIsPdfSource(false);
    setCurrentResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // If the user starts typing or clears it manually, it's no longer purely the PDF source
    if (isPdfSource) {
      setIsPdfSource(false);
    }
  };

  const loadFromHistory = (item: TranslationHistoryItem) => {
    setCurrentResult(item.result);
    setInputText(item.originalText);
    setIsPdfSource(false); // History items are treated as text snapshots
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <ScaleIcon className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">LegalLens</h1>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-medium px-4 py-2 rounded-full hover:bg-slate-100"
          >
            <HistoryIcon className="w-5 h-5" />
            <span>History</span>
          </button>
        </div>
      </nav>

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 pt-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Stop guessing. <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Start knowing.</span>
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto serif italic">
            Paste text or upload a PDF to get clear, actionable English for your complex documents.
          </p>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 md:p-8 mb-12">
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${isPdfSource ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                  {isPdfSource ? <FilePdfIcon className="w-5 h-5" /> : <FileTextIcon className="w-5 h-5" />}
                </div>
                <label htmlFor="legalese" className="block text-sm font-bold text-slate-700 uppercase tracking-widest">
                  Document Content
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="application/pdf" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtractingPdf}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {isExtractingPdf ? (
                    <LoaderIcon className="w-4 h-4" />
                  ) : (
                    <UploadIcon className="w-4 h-4" />
                  )}
                  {isExtractingPdf ? "Extracting..." : "Upload PDF"}
                </button>
              </div>
            </div>

            <textarea
              id="legalese"
              className="w-full h-64 p-5 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 transition-all resize-none text-slate-800 text-lg leading-relaxed font-mono placeholder:text-slate-300"
              placeholder="Paste legal text here or click 'Upload PDF' to extract content from a document..."
              value={inputText}
              onChange={handleTextChange}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <p className="text-sm text-slate-400">
              {inputText.length} characters ready for analysis.
              {isPdfSource && <span className="ml-2 text-red-500 font-semibold">(Extracted from PDF)</span>}
            </p>
            <div className="flex gap-4 w-full md:w-auto">
              <button 
                onClick={clearInput}
                className="flex-1 md:flex-none px-6 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !inputText.trim() || isExtractingPdf}
                className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold px-10 py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {isAnalyzing ? (
                  <>
                    <LoaderIcon className="w-5 h-5" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Simplify Now</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 mb-12 flex items-start gap-4 animate-in fade-in zoom-in-95">
            <AlertCircleIcon className="text-red-500 w-6 h-6 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-red-800 mb-1">Issue found</h4>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {currentResult && <AnalysisView result={currentResult} />}

        {/* Empty State / Tips */}
        {!currentResult && !isAnalyzing && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60 hover:opacity-100 transition-opacity mt-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200">
              <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center mb-4 font-bold">1</div>
              <h5 className="font-bold mb-2">Identify Risks</h5>
              <p className="text-sm text-slate-600">We highlight hidden fees, long-term commitments, and sneaky penalties.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200">
              <div className="bg-green-100 text-green-600 w-10 h-10 rounded-full flex items-center justify-center mb-4 font-bold">2</div>
              <h5 className="font-bold mb-2">Check Deadlines</h5>
              <p className="text-sm text-slate-600">Never miss a renewal or cancellation window again.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200">
              <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-full flex items-center justify-center mb-4 font-bold">3</div>
              <h5 className="font-bold mb-2">Take Action</h5>
              <p className="text-sm text-slate-600">Get a step-by-step checklist of what you actually need to do next.</p>
            </div>
          </div>
        )}
      </main>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-all" onClick={() => setShowHistory(false)}>
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl p-8 flex flex-col animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-slate-900">Recent Analyses</h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600 font-bold text-2xl">&times;</button>
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <HistoryIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No history yet.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => loadFromHistory(item)}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-300 hover:bg-white transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-indigo-600 uppercase mb-1">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-800 line-clamp-2 italic">"{item.originalText}"</p>
                    <div className="mt-3 flex items-center gap-2 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold">
                      View Analysis &rarr;
                    </div>
                  </div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <button 
                onClick={() => { setHistory([]); localStorage.removeItem(STORAGE_KEY); }}
                className="mt-6 w-full py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                Clear History
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 text-center border-t border-slate-200 text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} LegalLens Plain Language Advocate.</p>
      </footer>
    </div>
  );
}

export default App;

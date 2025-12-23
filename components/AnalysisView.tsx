
import React from 'react';
import { AnalysisResult } from '../types';
import { CheckCircleIcon, AlertCircleIcon, FileTextIcon } from './Icons';

interface AnalysisViewProps {
  result: AnalysisResult;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ result }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center gap-3">
          <FileTextIcon className="text-white w-6 h-6" />
          <h2 className="text-xl font-semibold text-white">Your Plain English Analysis</h2>
        </div>

        <div className="p-8 space-y-10">
          {/* Summary */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Summary</h3>
            <p className="text-lg leading-relaxed text-slate-700 serif">{result.summary}</p>
          </section>

          {/* Bottom Line */}
          <section className="bg-amber-50 rounded-xl p-6 border-l-4 border-amber-400">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-800 mb-3">
              <AlertCircleIcon className="w-4 h-4" />
              What This Means for You
            </h3>
            <p className="text-lg font-medium text-amber-900">{result.whatItMeans}</p>
          </section>

          {/* Deadlines & Costs */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Important Deadlines & Costs</h3>
            {result.deadlinesAndCosts.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.deadlinesAndCosts.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="inline-block p-1 bg-red-100 rounded text-red-600 font-bold text-xs mt-0.5">ALERT</span>
                    <span className="font-bold text-slate-900">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">No specific deadlines or costs identified.</p>
            )}
          </section>

          {/* Checklist */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Your Action Checklist</h3>
            <div className="space-y-3">
              {result.actionChecklist.map((task, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-indigo-500 group-hover:text-indigo-500 transition-colors">
                    {i + 1}
                  </div>
                  <p className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{task}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Glossary */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Plain English Glossary</h3>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-sm font-bold text-slate-600">Legalese Term</th>
                    <th className="px-6 py-3 text-sm font-bold text-slate-600">Simple Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.glossary.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-indigo-700 font-semibold">{row.term}</td>
                      <td className="px-6 py-4 text-slate-700">{row.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Disclaimer */}
        <div className="bg-slate-100 border-t border-slate-200 px-8 py-4">
          <p className="text-xs text-slate-500 text-center italic">
            Disclaimer: LegalLens is an AI-powered assistant designed for informational purposes only. It is not a lawyer, and this analysis does not constitute legal advice. Always consult with a qualified legal professional before making decisions based on legal documents.
          </p>
        </div>
      </div>
    </div>
  );
};

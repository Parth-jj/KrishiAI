import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  BarChart3, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Database, 
  Target, 
  Sparkles, 
  Layers, 
  Award,
  RefreshCw,
  HelpCircle,
  FileCheck
} from "lucide-react";
import { api } from "../services/api.js";
import { EvaluationItem, EvaluationRunResult } from "../types/index.js";

export const EvaluationBenchmark: React.FC = () => {
  const [dataset, setDataset] = useState<EvaluationItem[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [latestResult, setLatestResult] = useState<EvaluationRunResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pass' | 'fail'>('all');

  useEffect(() => {
    loadBenchmarkDataset();
  }, []);

  const loadBenchmarkDataset = async () => {
    try {
      const data = await api.getEvaluationDataset();
      setDataset(data);
    } catch (err) {
      console.warn("Failed to load evaluation dataset:", err);
    }
  };

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    try {
      const result = await api.runEvaluationBenchmark();
      setLatestResult(result);
    } catch (err: any) {
      alert(err.message || "Benchmark failed to run");
    } finally {
      setIsRunning(false);
    }
  };

  const filteredDetails = latestResult?.details?.filter(item => {
    const isPass = item.cropCorrect && item.intentCorrect;
    if (activeFilter === 'pass') return isPass;
    if (activeFilter === 'fail') return !isPass;
    return true;
  }) || [];

  return (
    <div id="evaluation-benchmark-view" className="space-y-6">
      
      {/* Banner */}
      <div className="bg-[#2D5A27] text-white rounded-[28px] p-6 sm:p-8 shadow-md border-2 border-[#1E3D1A]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3D1A] text-xs font-black text-[#FFD700] mb-2 border border-[#3E7A37]">
              <Award className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>Academic Project Evaluation Suite (PRD Section 30-32)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              RAG Performance & Accuracy Benchmark
            </h1>
            <p className="text-sm text-[#E0E7D9] mt-1 max-w-2xl font-medium">
              Automated testing across 30+ standardized agricultural questions to validate Entity Extraction, Vector Retrieval Hit Rate, F1-Score, and Latency.
            </p>
          </div>

          <motion.button
            id="run-benchmark-btn"
            onClick={handleRunBenchmark}
            disabled={isRunning}
            whileHover={!isRunning ? { scale: 1.05, y: -1 } : {}}
            whileTap={!isRunning ? { scale: 0.95 } : {}}
            className="px-6 py-3 bg-[#FFD700] hover:bg-[#F2C94C] disabled:opacity-50 text-[#2D5A27] text-xs font-black rounded-full flex items-center gap-2 shadow-md transition cursor-pointer"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#2D5A27]" />
                <span>Evaluating RAG Pipeline (30 Queries)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-[#2D5A27]" />
                <span>Run Evaluation Benchmark</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Metrics Summary Cards (if benchmark has run) */}
      {latestResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Intent Accuracy */}
            <div className="bg-white rounded-[24px] border-2 border-[#E0E7D9] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-[#2D5A27] uppercase tracking-wider">Intent Accuracy</span>
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#2E7D32]"><Target className="w-4 h-4" /></div>
              </div>
              <div className="text-3xl font-black text-[#2E7D32]">{latestResult.intentAccuracy}%</div>
              <div className="text-[11px] text-stone-500 font-medium mt-1">Category & symptom matching</div>
            </div>

            {/* Crop Accuracy */}
            <div className="bg-white rounded-[24px] border-2 border-[#E0E7D9] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-[#2D5A27] uppercase tracking-wider">Crop Detection</span>
                <div className="p-2 rounded-xl bg-[#E1F5FE] text-[#0288D1]"><Layers className="w-4 h-4" /></div>
              </div>
              <div className="text-3xl font-black text-[#0288D1]">{latestResult.cropAccuracy}%</div>
              <div className="text-[11px] text-stone-500 font-medium mt-1">Entity resolution precision</div>
            </div>

            {/* Retrieval Hit Rate */}
            <div className="bg-white rounded-[24px] border-2 border-[#E0E7D9] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-[#2D5A27] uppercase tracking-wider">Top-K Recall (Hit Rate)</span>
                <div className="p-2 rounded-xl bg-[#F3E5F5] text-[#7B1FA2]"><Database className="w-4 h-4" /></div>
              </div>
              <div className="text-3xl font-black text-[#7B1FA2]">{latestResult.retrievalHitRate}%</div>
              <div className="text-[11px] text-stone-500 font-medium mt-1">Grounding knowledge presence</div>
            </div>

            {/* F1 Score & Latency */}
            <div className="bg-white rounded-[24px] border-2 border-[#E0E7D9] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-[#2D5A27] uppercase tracking-wider">F1-Score / Avg Latency</span>
                <div className="p-2 rounded-xl bg-[#FFF9C4] text-[#F57F17]"><Award className="w-4 h-4" /></div>
              </div>
              <div className="text-3xl font-black text-[#1A2E1A]">{latestResult.f1Score} <span className="text-sm font-bold text-stone-500">/ {latestResult.averageLatencyMs}ms</span></div>
              <div className="text-[11px] text-stone-500 font-medium mt-1">Precision: {latestResult.precision} • Recall: {latestResult.recall}</div>
            </div>

          </div>

          {/* Detailed Question Table */}
          <div className="bg-white rounded-[24px] border-2 border-[#E0E7D9] p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E0E7D9]">
              <div>
                <h3 className="text-sm font-black text-[#2D5A27]">Per-Question Verification Details</h3>
                <p className="text-xs text-stone-500 font-medium">Benchmark results for all {latestResult.totalQuestions} standardized test cases.</p>
              </div>

              <div className="flex items-center gap-1.5 bg-[#F0F4ED] p-1.5 rounded-full text-xs border border-[#D0DBC7]">
                <motion.button
                  onClick={() => setActiveFilter('all')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3.5 py-1 rounded-full font-bold transition cursor-pointer ${activeFilter === 'all' ? 'bg-[#2D5A27] text-white shadow-xs' : 'text-[#2D5A27]'}`}
                >
                  All ({latestResult.details.length})
                </motion.button>
                <motion.button
                  onClick={() => setActiveFilter('pass')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3.5 py-1 rounded-full font-bold transition cursor-pointer ${activeFilter === 'pass' ? 'bg-[#2E7D32] text-white shadow-xs' : 'text-[#2E7D32]'}`}
                >
                  Pass ({latestResult.details.filter(d => d.cropCorrect && d.intentCorrect).length})
                </motion.button>
                <motion.button
                  onClick={() => setActiveFilter('fail')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3.5 py-1 rounded-full font-bold transition cursor-pointer ${activeFilter === 'fail' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700'}`}
                >
                  Fail ({latestResult.details.filter(d => !d.cropCorrect || !d.intentCorrect).length})
                </motion.button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F4F7F2] text-[#2D5A27] border-b border-[#E0E7D9]">
                    <th className="p-3 font-extrabold">#</th>
                    <th className="p-3 font-extrabold">Farmer Question</th>
                    <th className="p-3 font-extrabold">Crop (Expected / Detected)</th>
                    <th className="p-3 font-extrabold">Intent (Expected / Detected)</th>
                    <th className="p-3 font-extrabold">Retrieved Grounding Source</th>
                    <th className="p-3 font-extrabold">Similarity</th>
                    <th className="p-3 font-extrabold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E7D9]">
                  {filteredDetails.map((item, idx) => {
                    const isPass = item.cropCorrect && item.intentCorrect;
                    return (
                      <tr key={item.questionId} className="hover:bg-[#F1F8E9]/60">
                        <td className="p-3 font-mono text-stone-400 font-bold">{idx + 1}</td>
                        <td className="p-3 font-bold text-[#1A2E1A] max-w-xs">{item.question}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold border ${item.cropCorrect ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                            {item.expectedCrop} → {item.detectedCrop}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold border ${item.intentCorrect ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                            {item.expectedIntent}
                          </span>
                        </td>
                        <td className="p-3 text-stone-700 max-w-[200px] truncate font-medium" title={item.retrievedSources.join(", ")}>
                          {item.retrievedSources[0] || "No chunk"}
                        </td>
                        <td className="p-3 font-mono font-black text-[#2D5A27]">
                          {item.topScore}
                        </td>
                        <td className="p-3">
                          {isPass ? (
                            <span className="inline-flex items-center gap-1 text-[#2E7D32] font-black bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-black bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                              <XCircle className="w-3.5 h-3.5" /> Review
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Preview (when benchmark not run yet) */}
      {!latestResult && (
        <div className="bg-white rounded-[24px] border-2 border-[#E0E7D9] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E0E7D9]">
            <div>
              <h3 className="text-sm font-black text-[#2D5A27]">Benchmark Dataset ({dataset.length} Standard Test Questions)</h3>
              <p className="text-xs text-stone-500 font-medium">Curated test suite covering diseases, pests, fertilizers, weeds, and government schemes.</p>
            </div>
            <span className="text-xs bg-[#E8F5E9] border border-[#C8E6C9] text-[#2E7D32] font-black px-3.5 py-1 rounded-full">
              Ready for Evaluation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dataset.slice(0, 8).map(item => (
              <div key={item.id} className="p-3.5 rounded-2xl border border-[#E0E7D9] bg-[#FBFEFA] text-xs space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[#2D5A27]">{item.crop}</span>
                  <span className="text-[10px] font-bold bg-[#E8F0E5] text-[#2D5A27] px-2.5 py-0.5 rounded-full border border-[#D0DBC7]">{item.intent}</span>
                </div>
                <p className="text-[#1A2E1A] font-semibold leading-relaxed">"{item.question}"</p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleRunBenchmark}
              className="px-6 py-3 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white text-xs font-black rounded-full shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
              <span>Execute Benchmark on All {dataset.length} Questions</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

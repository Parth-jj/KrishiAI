import React from "react";
import { 
  Languages, 
  Search, 
  Cpu, 
  Database, 
  CheckCircle2, 
  Sparkles, 
  ShieldAlert,
  Clock,
  Layers,
  ArrowRight
} from "lucide-react";

interface PipelineVisualizerProps {
  stage: 'idle' | 'extracting' | 'retrieving' | 'generating' | 'validating' | 'completed';
  pipelineData?: {
    latencyMs?: number;
    detectedLanguage?: string;
    extractedCrop?: string | null;
    extractedIntent?: string;
    retrievedCount?: number;
    topSimilarity?: number;
    modelUsed?: string;
  };
}

export const QueryPipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  stage,
  pipelineData
}) => {
  if (stage === 'idle') return null;

  const steps = [
    {
      id: "extracting",
      title: "Query & Intent",
      description: pipelineData?.extractedCrop 
        ? `${pipelineData.extractedCrop} • ${pipelineData.extractedIntent || "Diagnosis"}` 
        : "Extracting Crop & Symptoms",
      icon: Languages,
      completed: stage !== 'extracting',
      active: stage === 'extracting'
    },
    {
      id: "retrieving",
      title: "Vector Retrieval",
      description: pipelineData?.retrievedCount 
        ? `${pipelineData.retrievedCount} ICAR Chunks (${(pipelineData.topSimilarity! * 100).toFixed(0)}% match)` 
        : "Searching ICAR Knowledge Base",
      icon: Database,
      completed: stage === 'generating' || stage === 'validating' || stage === 'completed',
      active: stage === 'retrieving'
    },
    {
      id: "generating",
      title: "LLM Advisory",
      description: "Gemini 3.7 Flash Grounded Synthesis",
      icon: Cpu,
      completed: stage === 'validating' || stage === 'completed',
      active: stage === 'generating'
    },
    {
      id: "validating",
      title: "Safety & Output",
      description: stage === 'completed' ? `Verified in ${pipelineData?.latencyMs || 850}ms` : "Dosage & Precision Checks",
      icon: CheckCircle2,
      completed: stage === 'completed',
      active: stage === 'validating'
    }
  ];

  return (
    <div id="query-pipeline-visualizer" className="bg-[#2D5A27] text-white rounded-[24px] p-4 sm:p-5 shadow-lg border border-[#1E3D1A] mb-6 overflow-hidden relative">
      <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[#3E7A37]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#FFD700]" />
          <span className="text-xs font-black text-[#FFD700] tracking-wider uppercase">
            RAG Processing Pipeline Execution
          </span>
        </div>

        {pipelineData?.latencyMs && (
          <div className="flex items-center gap-1 text-[11px] font-mono text-white bg-[#1E3D1A] px-2.5 py-0.5 rounded-full border border-[#3E7A37]">
            <Clock className="w-3 h-3 text-[#FFD700]" />
            <span className="font-bold">{pipelineData.latencyMs}ms</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                step.active
                  ? "bg-[#1E3D1A] border-[#8BC34A] shadow-md ring-2 ring-[#8BC34A] animate-pulse"
                  : step.completed
                  ? "bg-[#1E3D1A]/90 border-[#3E7A37] text-white"
                  : "bg-[#1E3D1A]/40 border-[#152B13] text-[#E0E7D9]/50 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-[#FFD700] text-[#2D5A27]">
                    0{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-white truncate">{step.title}</span>
                </div>
                <Icon className={`w-3.5 h-3.5 ${step.active ? 'text-[#FFD700] animate-spin' : step.completed ? 'text-[#8BC34A]' : 'text-white/40'}`} />
              </div>
              <p className="text-[11px] text-[#E0E7D9] truncate font-medium">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

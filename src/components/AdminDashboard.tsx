import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ShieldCheck, 
  Database, 
  FileText, 
  PlusCircle, 
  Trash2, 
  RefreshCw, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Sparkles, 
  Layers, 
  BarChart, 
  ExternalLink,
  BookOpen,
  Filter
} from "lucide-react";
import { api } from "../services/api.js";
import { AdminStats, KnowledgeDocument, QueryRecord, KnowledgeChunk } from "../types/index.js";

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [queries, setQueries] = useState<QueryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'documents' | 'ingest' | 'queries'>('documents');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Ingestion Form State
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocSource, setNewDocSource] = useState("ICAR - Krishi Vigyan Kendra Bulletin");
  const [newDocCrop, setNewDocCrop] = useState("Paddy");
  const [newDocCategory, setNewDocCategory] = useState("crop_disease");
  const [newDocContent, setNewDocContent] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);

  // Chunk Inspector Modal
  const [inspectingDoc, setInspectingDoc] = useState<KnowledgeDocument | null>(null);
  const [inspectingChunks, setInspectingChunks] = useState<KnowledgeChunk[]>([]);

  // Query Filter State
  const [queryConfidenceFilter, setQueryConfidenceFilter] = useState<string>("all");
  const [queryCropFilter, setQueryCropFilter] = useState<string>("all");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [s, docs, qs] = await Promise.all([
        api.getAdminStats(),
        api.getDocuments(),
        api.getAdminQueries()
      ]);
      setStats(s);
      setDocuments(docs);
      setQueries(qs);
    } catch (err) {
      console.warn("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleIngestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim()) {
      alert("Please provide both document title and content.");
      return;
    }

    setIsIngesting(true);
    try {
      const result = await api.ingestDocument({
        title: newDocTitle,
        source: newDocSource,
        crop: newDocCrop,
        category: newDocCategory,
        content: newDocContent
      });

      setActionMessage(`Document "${result.document.title}" successfully indexed into ${result.chunksCreated} vector chunks!`);
      setNewDocTitle("");
      setNewDocContent("");
      setActiveTab('documents');
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Failed to ingest document");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDeleteDocument = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the knowledge base?`)) return;

    try {
      await api.deleteDocument(id);
      setActionMessage(`Document "${title}" removed.`);
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Failed to delete document");
    }
  };

  const handleReindex = async () => {
    setLoading(true);
    try {
      const msg = await api.reindexKnowledgeBase();
      setActionMessage(msg);
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Failed to reindex");
    } finally {
      setLoading(false);
    }
  };

  const handleInspectChunks = async (doc: KnowledgeDocument) => {
    setInspectingDoc(doc);
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}/chunks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("agri_auth_token")}` }
      });
      const data = await res.json();
      setInspectingChunks(data.chunks || []);
    } catch (err) {
      console.warn(err);
    }
  };

  // Filtered queries
  const filteredQueries = queries.filter(q => {
    if (queryConfidenceFilter !== "all" && q.confidence !== queryConfidenceFilter) return false;
    if (queryCropFilter !== "all" && (q.detectedCrop !== queryCropFilter && q.selectedCrop !== queryCropFilter)) return false;
    return true;
  });

  return (
    <div id="admin-dashboard-view" className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#2D5A27] text-white rounded-[28px] p-6 sm:p-8 shadow-md border-2 border-[#1E3D1A]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3D1A] text-xs font-black text-[#FFD700] mb-2 border border-[#3E7A37]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>KVK Knowledge Management & System Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Agricultural Knowledge Base Operations
            </h1>
            <p className="text-sm text-[#E0E7D9] mt-1 max-w-2xl font-medium">
              Ingest research documents, inspect indexed vector chunks, monitor farmer queries, and evaluate retrieval precision.
            </p>
          </div>

          <motion.button
            onClick={handleReindex}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2.5 bg-[#FFD700] hover:bg-[#F2C94C] text-[#2D5A27] text-xs font-black rounded-full flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-Index Vector Database</span>
          </motion.button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-[#E8F5E9] border-2 border-[#C8E6C9] text-[#2E7D32] rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-[#2E7D32] hover:text-[#1E3D1A] font-black cursor-pointer">✕</button>
        </div>
      )}

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white rounded-[24px] border-2 border-[#E0E7D9] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[#2D5A27] uppercase tracking-wider">Registered Farmers</span>
              <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#2E7D32]"><Users className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-black text-[#1A2E1A]">{stats.totalFarmers}</div>
            <div className="text-[11px] text-stone-500 font-medium mt-1">Across Andhra Pradesh & Telangana</div>
          </div>

          <div className="bg-white rounded-[24px] border-2 border-[#E0E7D9] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[#2D5A27] uppercase tracking-wider">Total Queries</span>
              <div className="p-2 rounded-xl bg-[#E1F5FE] text-[#0288D1]"><MessageSquare className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-black text-[#1A2E1A]">{stats.totalQueries}</div>
            <div className="text-[11px] text-[#2E7D32] font-bold mt-1">+{stats.queriesToday} queries today</div>
          </div>

          <div className="bg-white rounded-[24px] border-2 border-[#E0E7D9] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[#2D5A27] uppercase tracking-wider">Vector Chunks</span>
              <div className="p-2 rounded-xl bg-[#F3E5F5] text-[#7B1FA2]"><Database className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-black text-[#1A2E1A]">{stats.totalIndexedChunks}</div>
            <div className="text-[11px] text-stone-500 font-medium mt-1">Indexed across {stats.totalDocuments} documents</div>
          </div>

          <div className="bg-white rounded-[24px] border-2 border-[#E0E7D9] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[#2D5A27] uppercase tracking-wider">Satisfaction Rate</span>
              <div className="p-2 rounded-xl bg-[#FFF9C4] text-[#F57F17]"><CheckCircle2 className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-black text-[#1A2E1A]">{stats.averageSatisfactionRate}%</div>
            <div className="text-[11px] text-stone-500 font-medium mt-1">Based on field feedback</div>
          </div>

        </div>
      )}

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 border-b-2 border-[#E0E7D9] pb-3">
        <motion.button
          onClick={() => setActiveTab('documents')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`px-4 py-2 rounded-full text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'documents'
              ? 'bg-[#2D5A27] text-white shadow-xs'
              : 'bg-[#F0F4ED] text-[#2D5A27] hover:bg-[#E0E7D9]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Knowledge Repository ({documents.length})</span>
        </motion.button>

        <motion.button
          onClick={() => setActiveTab('ingest')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`px-4 py-2 rounded-full text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'ingest'
              ? 'bg-[#2D5A27] text-white shadow-xs'
              : 'bg-[#F0F4ED] text-[#2D5A27] hover:bg-[#E0E7D9]'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Ingest New Document</span>
        </motion.button>

        <motion.button
          onClick={() => setActiveTab('queries')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`px-4 py-2 rounded-full text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'queries'
              ? 'bg-[#2D5A27] text-white shadow-xs'
              : 'bg-[#F0F4ED] text-[#2D5A27] hover:bg-[#E0E7D9]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Query Audit Log ({queries.length})</span>
        </motion.button>
      </div>

      {/* TAB 1: Document Repository */}
      {activeTab === 'documents' && (
        <div id="documents-tab-content" className="bg-white rounded-[24px] border-2 border-[#E0E7D9] p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header and Search/Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E0E7D9]">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#2D5A27]" />
                <h3 className="text-base font-black text-[#2D5A27]">ICAR Verified Knowledge Library</h3>
                <span className="bg-[#E8F5E9] text-[#2E7D32] text-xs px-2.5 py-0.5 rounded-full font-bold border border-[#C8E6C9]">
                  {documents.length} Packages Available
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Official agricultural practices from ICAR, TNAU, and State KVKs powering the AI advisory system.
              </p>
            </div>

            {/* Quick Action */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('ingest')}
                className="px-3.5 py-2 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-4 h-4 text-[#FFD700]" />
                <span>Add New Guide</span>
              </button>
            </div>
          </div>

          {/* Simple Crop Filter Chips & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Crop Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold scrollbar-none">
              {["All Crops", "Paddy", "Cotton", "Maize", "Groundnut", "Chilli", "Tomato", "Banana", "Mango", "General"].map(crop => (
                <button
                  key={crop}
                  onClick={() => setQueryCropFilter(crop === "All Crops" ? "all" : crop)}
                  className={`px-3 py-1.5 rounded-full transition whitespace-nowrap cursor-pointer text-xs ${
                    (queryCropFilter === "all" && crop === "All Crops") || queryCropFilter === crop
                      ? "bg-[#2D5A27] text-white shadow-2xs"
                      : "bg-[#F0F4ED] text-[#2D5A27] hover:bg-[#E0E7D9]"
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search diseases, crops, or chemicals..."
                value={newDocTitle}
                onChange={e => setNewDocTitle(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#D0DBC7] bg-[#FBFEFA] focus:outline-none focus:ring-2 focus:ring-[#8BC34A] text-[#1A2E1A]"
              />
              {newDocTitle && (
                <button
                  onClick={() => setNewDocTitle("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Document Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents
              .filter(doc => {
                if (queryCropFilter !== "all" && doc.crop.toLowerCase() !== queryCropFilter.toLowerCase() && !(queryCropFilter === "General" && (doc.crop === "General Agriculture" || doc.crop === "General"))) {
                  return false;
                }
                if (newDocTitle.trim() && !doc.title.toLowerCase().includes(newDocTitle.toLowerCase()) && !doc.content.toLowerCase().includes(newDocTitle.toLowerCase()) && !doc.crop.toLowerCase().includes(newDocTitle.toLowerCase())) {
                  return false;
                }
                return true;
              })
              .map(doc => {
                // Category color & label mapping
                const catLabels: Record<string, { label: string, bg: string, text: string }> = {
                  crop_disease: { label: "Crop Disease", bg: "bg-rose-50 border-rose-200", text: "text-rose-700" },
                  pest_management: { label: "Pest Management", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
                  nutrient_deficiency: { label: "Nutrient / Deficiency", bg: "bg-orange-50 border-orange-200", text: "text-orange-700" },
                  fertilizer: { label: "Fertilizer & Soil", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
                  government_scheme: { label: "Government Scheme", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
                  general_agriculture: { label: "General Guide", bg: "bg-stone-50 border-stone-200", text: "text-stone-700" }
                };
                const catInfo = catLabels[doc.category] || { label: doc.category, bg: "bg-[#E8F0E5] border-[#D0DBC7]", text: "text-[#2D5A27]" };

                return (
                  <div 
                    key={doc.id} 
                    className="p-5 rounded-2xl border-2 border-[#E0E7D9] hover:border-[#8BC34A] bg-[#FBFEFA] flex flex-col justify-between transition shadow-2xs hover:shadow-xs group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-[#FFD700] text-[#2D5A27] border border-[#E5C100]">
                            🌾 {doc.crop}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.bg} ${catInfo.text}`}>
                            {catInfo.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold bg-[#E8F0E5] text-[#2D5A27] px-2.5 py-0.5 rounded-full border border-[#D0DBC7]">
                          {doc.chunkCount || 3} Search Chunks
                        </span>
                      </div>

                      {/* Title & Sourced Institute */}
                      <h4 className="text-sm font-bold text-[#1A2E1A] leading-snug group-hover:text-[#2D5A27] transition-colors mb-1">
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 font-medium flex items-center gap-1 mb-3">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8BC34A]"></span>
                        {doc.source}
                      </p>
                      
                      {/* Clean content summary box */}
                      <div className="bg-[#F4F7F2] p-3 rounded-xl border border-[#D0DBC7] text-xs text-stone-700 font-normal leading-relaxed line-clamp-3">
                        {doc.content.replace(/\n+/g, " ")}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E0E7D9]">
                      <motion.button
                        onClick={() => handleInspectChunks(doc)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="text-xs font-bold text-[#2D5A27] hover:text-[#1E3D1A] flex items-center gap-1.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#2E7D32]" />
                        <span>View Grounding Chunks</span>
                      </motion.button>

                      <motion.button
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                );
              })}
          </div>

          {documents.filter(doc => {
            if (queryCropFilter !== "all" && doc.crop.toLowerCase() !== queryCropFilter.toLowerCase() && !(queryCropFilter === "General" && (doc.crop === "General Agriculture" || doc.crop === "General"))) return false;
            if (newDocTitle.trim() && !doc.title.toLowerCase().includes(newDocTitle.toLowerCase()) && !doc.content.toLowerCase().includes(newDocTitle.toLowerCase()) && !doc.crop.toLowerCase().includes(newDocTitle.toLowerCase())) return false;
            return true;
          }).length === 0 && (
            <div className="text-center py-12 bg-[#F9FBF8] rounded-2xl border-2 border-dashed border-[#D0DBC7]">
              <BookOpen className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-stone-600">No documents found matching your filter</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Try selecting "All Crops" or clearing your search keywords.</p>
              <button
                onClick={() => { setQueryCropFilter("all"); setNewDocTitle(""); }}
                className="mt-3 px-3 py-1 bg-[#2D5A27] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Ingest New Document */}
      {activeTab === 'ingest' && (
        <div id="ingest-tab-content" className="bg-white rounded-[24px] border-2 border-[#E0E7D9] p-6 shadow-xs max-w-3xl">
          <h3 className="text-base font-black text-[#2D5A27] mb-1">Ingest New Agricultural Document / Advisory Bulletin</h3>
          <p className="text-xs text-stone-500 mb-5 font-medium">
            Documents will be automatically tokenized, chunked, and added to the semantic search vector index.
          </p>

          <form onSubmit={handleIngestDocument} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1A2E1A] mb-1">Document Title</label>
              <input
                type="text"
                value={newDocTitle}
                onChange={e => setNewDocTitle(e.target.value)}
                placeholder="e.g. Integrated Pest Management for Tomato Pinworm"
                className="w-full text-xs p-3 rounded-xl border-2 border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:border-[#2D5A27] focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1A2E1A] mb-1">Source / Institute</label>
                <input
                  type="text"
                  value={newDocSource}
                  onChange={e => setNewDocSource(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border-2 border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:border-[#2D5A27] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A2E1A] mb-1">Target Crop</label>
                <select
                  value={newDocCrop}
                  onChange={e => setNewDocCrop(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border-2 border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:border-[#2D5A27] focus:outline-none bg-white font-medium"
                >
                  <option value="Paddy">Paddy</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Maize">Maize</option>
                  <option value="Groundnut">Groundnut</option>
                  <option value="Chilli">Chilli</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Banana">Banana</option>
                  <option value="Mango">Mango</option>
                  <option value="General">General Agriculture</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A2E1A] mb-1">Category</label>
                <select
                  value={newDocCategory}
                  onChange={e => setNewDocCategory(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border-2 border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:border-[#2D5A27] focus:outline-none bg-white font-medium"
                >
                  <option value="crop_disease">Crop Disease</option>
                  <option value="pest_attack">Pest Attack</option>
                  <option value="fertilizer_usage">Fertilizer Usage</option>
                  <option value="irrigation">Irrigation</option>
                  <option value="weed_management">Weed Management</option>
                  <option value="nutrient_deficiency">Nutrient Deficiency</option>
                  <option value="government_scheme">Government Scheme</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A2E1A] mb-1">Full Document Text Content</label>
              <textarea
                rows={7}
                value={newDocContent}
                onChange={e => setNewDocContent(e.target.value)}
                placeholder="Paste ICAR guideline content, diagnostic symptoms, chemical dosages (e.g. Hexaconazole 2ml/L), and safety measures..."
                className="w-full text-xs p-3 rounded-xl border-2 border-[#D0DBC7] focus:ring-2 focus:ring-[#8BC34A] focus:border-[#2D5A27] focus:outline-none font-mono"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <motion.button
                type="submit"
                disabled={isIngesting}
                whileHover={!isIngesting ? { scale: 1.05, y: -1 } : {}}
                whileTap={!isIngesting ? { scale: 0.95 } : {}}
                className="px-6 py-2.5 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white text-xs font-black rounded-full transition shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-[#FFD700]" />
                <span>{isIngesting ? "Chunking & Indexing..." : "Ingest & Index Document"}</span>
              </motion.button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Query Monitoring & Audit Log */}
      {activeTab === 'queries' && (
        <div id="queries-tab-content" className="bg-white rounded-[24px] border-2 border-[#E0E7D9] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E0E7D9]">
            <div>
              <h3 className="text-sm font-black text-[#2D5A27]">Farmer Query Audit Log</h3>
              <p className="text-xs text-stone-500 font-medium">Review AI responses, extracted metadata, confidence levels, and user feedback.</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-stone-500" />
              <select
                value={queryConfidenceFilter}
                onChange={e => setQueryConfidenceFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-[#D0DBC7] bg-[#F4F7F2] font-semibold text-[#1A2E1A]"
              >
                <option value="all">All Confidence Levels</option>
                <option value="high">High Confidence</option>
                <option value="medium">Medium Confidence</option>
                <option value="low">Low Confidence (Flagged)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredQueries.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">No queries match the selected filter.</div>
            ) : (
              filteredQueries.map(q => (
                <div key={q.id} className="p-4 rounded-2xl border-2 border-[#E0E7D9] bg-[#FBFEFA] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFD700] text-[#2D5A27]">
                        {q.detectedCrop}
                      </span>
                      <span className="text-xs font-bold text-[#1A2E1A]">{q.farmerName}</span>
                      <span className="text-stone-400 text-xs">•</span>
                      <span className="text-xs text-stone-500 font-medium">{new Date(q.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        q.confidence === 'high' ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' : 'bg-[#FFF9C4] text-[#F57F17] border-[#FFE082]'
                      }`}>
                        {q.confidence?.toUpperCase()} CONFIDENCE
                      </span>

                      {q.feedback && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          q.feedback.isUseful ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                          {q.feedback.isUseful ? '👍 User Approved' : '👎 Disapproved'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-[#1A2E1A] font-bold">
                    Question: <span className="font-medium text-stone-700">"{q.question}"</span>
                  </div>

                  <div className="bg-[#F4F7F2] p-3.5 rounded-xl border border-[#D0DBC7] text-xs text-[#1A2E1A] space-y-1">
                    <div className="font-bold text-[#2D5A27]">Diagnosis: {q.advisory?.problem}</div>
                    <div className="text-stone-700 font-medium leading-relaxed line-clamp-2">
                      {q.advisory?.recommendations?.map(r => r.title).join(" • ")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chunks Inspector Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-2xl w-full p-6 border-2 border-[#E0E7D9] shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#E0E7D9] mb-4">
              <div>
                <span className="text-[10px] font-mono text-[#2D5A27] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-0.5 rounded-full font-bold">
                  Vector Chunks Inspector
                </span>
                <h3 className="text-base font-bold text-[#1A2E1A] mt-1.5">{inspectingDoc.title}</h3>
                <p className="text-xs text-stone-500 font-medium">{inspectingDoc.source} • {inspectingChunks.length} Chunks</p>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {inspectingChunks.map((chunk, idx) => (
                <div key={chunk.chunkId} className="p-3.5 bg-[#F4F7F2] rounded-2xl border border-[#D0DBC7]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#1A2E1A]">Chunk #{idx + 1} ({chunk.chunkId})</span>
                    <span className="text-[10px] font-bold bg-[#E8F0E5] px-2.5 py-0.5 rounded-full text-[#2D5A27] border border-[#D0DBC7]">
                      {chunk.category}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-stone-800 bg-white p-3 rounded-xl border border-[#E0E7D9] leading-relaxed whitespace-pre-wrap">
                    {chunk.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setInspectingDoc(null)}
                className="px-5 py-2 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { documentAPI } from '../services/api';
import Navbar from '../components/Navbar';
import {
  FileText, Download, ArrowLeft, Calendar, ShieldAlert, Sparkles,
  Search, Shield, AlertTriangle, AlertCircle, CheckCircle, Info,
  DollarSign, Briefcase, Percent, Clock, MapPin, User, ChevronDown, ChevronUp, FileCode
} from 'lucide-react';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [docData, setDocData] = useState(null);
  const [clauses, setClauses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'clauses', 'entities', 'timeline'
  const [clauseSearch, setClauseSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [expandedClauses, setExpandedClauses] = useState({});

  useEffect(() => {
    fetchDocumentDetails();
  }, [id]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const docRes = await documentAPI.get(id);
      setDocData(docRes.data);

      const clauseRes = await documentAPI.getClauses(id);
      setClauses(clauseRes.data);

      const summaryRes = await documentAPI.getSummary(id);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve contract details. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const toggleClause = (clauseId) => {
    setExpandedClauses(prev => ({
      ...prev,
      [clauseId]: !prev[clauseId]
    }));
  };

  const handleDownload = async () => {
    try {
      const response = await documentAPI.downloadReport(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const baseName = docData.filename.substring(0, docData.filename.lastIndexOf('.')) || docData.filename;
      link.setAttribute('download', `ContractIQ_RiskReport_${baseName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download report PDF. Please check backend connection.');
    }
  };

  const getFilteredClauses = () => {
    return clauses.filter(c => {
      const matchesSearch = c.content.toLowerCase().includes(clauseSearch.toLowerCase()) || 
                            c.title.toLowerCase().includes(clauseSearch.toLowerCase());
      const matchesRisk = riskFilter === 'ALL' || c.risk_level === riskFilter;
      const matchesType = typeFilter === 'ALL' || c.type.toLowerCase().includes(typeFilter.toLowerCase());
      return matchesSearch && matchesRisk && matchesType;
    });
  };

  // Group clauses by type for filtering
  const clauseTypes = Array.from(new Set(clauses.map(c => c.type))).filter(Boolean);

  // Group entities by type
  const entitiesByType = docData?.entities?.reduce((acc, curr) => {
    if (!acc[curr.entity_type]) {
      acc[curr.entity_type] = [];
    }
    acc[curr.entity_type].push(curr.entity_value);
    return acc;
  }, {}) || {};

  const getEntityIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'date':
      case 'deadline':
        return <Calendar className="w-4 h-4 text-sky-400" />;
      case 'money':
      case 'contract_value':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'percentage':
      case 'penalty':
        return <Percent className="w-4 h-4 text-indigo-400" />;
      case 'company':
      case 'company names':
        return <Briefcase className="w-4 h-4 text-purple-400" />;
      case 'individual':
      case 'individuals':
        return <User className="w-4 h-4 text-amber-400" />;
      case 'obligation':
      case 'obligations':
        return <Info className="w-4 h-4 text-teal-400" />;
      case 'duration':
      case 'contract duration':
        return <Clock className="w-4 h-4 text-slate-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  // Get risk color tokens
  const getRiskColor = (level) => {
    if (level === 'HIGH') return {
      text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/25', rawHex: '#ef4444'
    };
    if (level === 'MEDIUM') return {
      text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25', rawHex: '#f59e0b'
    };
    return {
      text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', rawHex: '#10b981'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-brand-purple/20 border-t-brand-purple animate-spin mb-4"></div>
            <p className="text-slate-400 text-sm">Loading contract intelligence report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !docData) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Failed to load report</h2>
          <p className="text-slate-400 text-sm mb-6">{error || 'The requested contract record does not exist.'}</p>
          <Link to="/dashboard" className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-sm text-white">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Count risk distribution
  const highRiskClauses = clauses.filter(c => c.risk_level === 'HIGH').length;
  const mediumRiskClauses = clauses.filter(c => c.risk_level === 'MEDIUM').length;
  const lowRiskClauses = clauses.filter(c => c.risk_level === 'LOW').length;
  const totalClauses = clauses.length;

  // Custom SVG pie chart angle math
  const highPercent = totalClauses > 0 ? (highRiskClauses / totalClauses) * 100 : 0;
  const medPercent = totalClauses > 0 ? (mediumRiskClauses / totalClauses) * 100 : 0;
  const lowPercent = totalClauses > 0 ? (lowRiskClauses / totalClauses) * 100 : 0;

  // Timeline items
  const timelineEntities = docData.entities?.filter(e => 
    e.entity_type.toLowerCase() === 'date' || e.entity_type.toLowerCase() === 'deadline'
  ) || [];

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <header className="border-b border-white/5 bg-dark-900/60 backdrop-blur px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-brand-purple" />
                <h1 className="text-xl font-bold text-white max-w-lg truncate">{docData.filename}</h1>
              </div>
              <p className="text-xs text-slate-400">
                Uploaded on {new Date(docData.uploaded_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Download Audit PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Main Content & Tabs */}
        <section className="lg:col-span-2 space-y-6">
          
          {/* Tab buttons */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            {[
              { id: 'summary', name: 'Executive Summary', icon: Sparkles },
              { id: 'clauses', name: `Clauses (${clauses.length})`, icon: FileCode },
              { id: 'entities', name: 'Entities Grid', icon: Briefcase },
              { id: 'timeline', name: 'Timeline Vectors', icon: Calendar },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>

          {/* TAB CONTENT: EXECUTIVE SUMMARY */}
          {activeTab === 'summary' && summary && (
            <div className="space-y-6">
              <div className="glass-panel rounded-3xl p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Contract Overview</h3>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {summary.contract_overview || 'No overview summary generated.'}
                  </p>
                </div>

                <div className="border-t border-white/5 pt-6">
                  <h3 className="text-lg font-bold text-white mb-2">Purpose</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {summary.purpose || 'No purpose scope identified.'}
                  </p>
                </div>

                <div className="border-t border-white/5 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Key Obligations</h3>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {summary.key_obligations?.map((ob, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-purple mt-2 flex-shrink-0" />
                          <span>{ob}</span>
                        </li>
                      )) || <li className="text-slate-500">None extracted</li>}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Important Deadlines</h3>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {summary.deadlines?.map((dl, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                          <span>{dl}</span>
                        </li>
                      )) || <li className="text-slate-500">No specific deadlines recorded</li>}
                    </ul>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Risk Assessment</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-4">
                      {summary.risks || 'No structured risk narrative parsed.'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Recommendations</h3>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {summary.recommendations?.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5">
                          <Sparkles className="w-4 h-4 text-brand-purple flex-shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      )) || <li className="text-slate-500">None generated</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: CLAUSES */}
          {activeTab === 'clauses' && (
            <div className="space-y-6">
              {/* Clause Filters */}
              <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={clauseSearch}
                    onChange={(e) => setClauseSearch(e.target.value)}
                    placeholder="Search inside clauses..."
                    className="w-full glass-input rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500"
                  />
                </div>

                <div className="flex gap-3">
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="glass-input rounded-xl px-3 py-2 text-xs text-white bg-dark-900 border border-white/10"
                  >
                    <option value="ALL">All Risk Levels</option>
                    <option value="HIGH">High Risk Only</option>
                    <option value="MEDIUM">Medium Risk Only</option>
                    <option value="LOW">Low Risk Only</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="glass-input rounded-xl px-3 py-2 text-xs text-white bg-dark-900 border border-white/10"
                  >
                    <option value="ALL">All Types</option>
                    {clauseTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clause List */}
              <div className="space-y-4">
                {getFilteredClauses().length === 0 ? (
                  <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-sm">
                    No clauses match the filters. Try broadening your keywords.
                  </div>
                ) : (
                  getFilteredClauses().map((c) => {
                    const expanded = expandedClauses[c.id];
                    const color = getRiskColor(c.risk_level);
                    return (
                      <div 
                        key={c.id} 
                        className={`glass-panel rounded-2xl border transition-all duration-200 overflow-hidden ${
                          expanded ? 'border-white/10 ring-1 ring-brand-purple/20' : 'hover:border-white/15'
                        }`}
                      >
                        {/* Header trigger */}
                        <div 
                          onClick={() => toggleClause(c.id)}
                          className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${color.bg} ${color.text} border ${color.border}`}>
                              {c.risk_level}
                            </span>
                            <span className="font-semibold text-white text-sm">
                              {c.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-500 font-semibold uppercase bg-white/5 px-2 py-0.5 rounded">
                              {c.type}
                            </span>
                            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {/* Expandable Panel */}
                        {expanded && (
                          <div className="px-5 pb-5 pt-1 border-t border-white/5 space-y-4">
                            <div className="p-4 bg-white/5 rounded-xl text-slate-300 text-sm leading-relaxed whitespace-pre-line font-mono text-xs">
                              {c.content}
                            </div>
                            
                            <div className={`p-4 rounded-xl border ${color.bg} ${color.border} text-xs flex gap-3`}>
                              <Shield className={`w-5 h-5 flex-shrink-0 ${color.text}`} />
                              <div>
                                <p className="font-bold text-white mb-1">
                                  Risk Assessment Details (Score: {c.risk_score}/100)
                                </p>
                                <p className="text-slate-300 leading-relaxed">
                                  {c.reason}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: ENTITIES */}
          {activeTab === 'entities' && (
            <div className="glass-panel rounded-3xl p-8 space-y-6">
              <h3 className="text-lg font-bold text-white">Extracted Metadata Entities</h3>
              <p className="text-slate-400 text-sm">Important values extracted by ContractIQ's NLP entity recognition engine.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {Object.keys(entitiesByType).length === 0 ? (
                  <div className="col-span-2 text-center py-6 text-slate-400 text-sm">
                    No significant metadata entities extracted.
                  </div>
                ) : (
                  Object.entries(entitiesByType).map(([type, values]) => (
                    <div key={type} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                        {getEntityIcon(type)}
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                          {type.replace(/_/g, ' ')}
                        </h4>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {values.map((v, i) => (
                          <span key={i} className="text-xs bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg text-slate-300 font-medium">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="glass-panel rounded-3xl p-8 space-y-6">
              <h3 className="text-lg font-bold text-white">Agreement Timeline</h3>
              <p className="text-slate-400 text-sm">Chronological log of critical deadlines and contractual milestones.</p>
              
              {timelineEntities.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No date markers or milestones detected.
                </div>
              ) : (
                <div className="relative border-l border-white/10 ml-4 pl-6 space-y-8 py-4">
                  {timelineEntities.map((t, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-brand-purple bg-dark-950 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                      </span>
                      
                      <div className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-brand-purple/20 transition-all max-w-md">
                        <span className="text-[10px] font-bold text-brand-purple uppercase bg-brand-purple/10 px-2 py-0.5 rounded">
                          {t.entity_type}
                        </span>
                        <p className="text-sm font-semibold text-white mt-1.5">
                          {t.entity_value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </section>

        {/* Right Panel: Risk Summary & Distribution */}
        <aside className="space-y-6">
          
          {/* Card: overall risk score */}
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden text-center flex flex-col items-center">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Contract Risk Integrity
            </h4>
            
            {/* Visual Circular Meter */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Outer SVG Gauge */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className="stroke-white/5"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className={`transition-all duration-1000 ${
                    docData.avg_risk_level === 'HIGH' ? 'stroke-red-500' :
                    docData.avg_risk_level === 'MEDIUM' ? 'stroke-amber-500' : 'stroke-emerald-500'
                  }`}
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 68}
                  strokeDashoffset={2 * Math.PI * 68 * (1 - (docData.avg_risk_score || 0) / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-white">
                  {docData.avg_risk_score || 0}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  Risk Rating
                </span>
              </div>
            </div>

            <div className="mt-4">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${
                docData.avg_risk_level === 'HIGH' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                docData.avg_risk_level === 'MEDIUM' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                {docData.avg_risk_level} risk profile
              </span>
            </div>
          </div>

          {/* Card: Risk Distribution Breakout */}
          <div className="glass-panel rounded-3xl p-6 space-y-5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Risk Breakdown ({clauses.length} Clauses)
            </h4>

            {/* Custom visual progress distributions */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    High Risk
                  </span>
                  <span className="text-white">{highRiskClauses} ({Math.round(highPercent)}%)</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-red-500 h-full" style={{ width: `${highPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Medium Risk
                  </span>
                  <span className="text-white">{mediumRiskClauses} ({Math.round(medPercent)}%)</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${medPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Low Risk
                  </span>
                  <span className="text-white">{lowRiskClauses} ({Math.round(lowPercent)}%)</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${lowPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Rapid Audit details */}
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Document Audit Details
            </h4>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-white/5">
                <span className="text-slate-400">Filename</span>
                <span className="text-white font-medium truncate max-w-[160px]" title={docData.filename}>
                  {docData.filename}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-white/5">
                <span className="text-slate-400">Total Clauses</span>
                <span className="text-white font-medium">{totalClauses}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-white/5">
                <span className="text-slate-400">Metadata Entities</span>
                <span className="text-white font-medium">{docData.entities?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Audited
                </span>
              </div>
            </div>
          </div>

        </aside>

      </main>
    </div>
  );
}

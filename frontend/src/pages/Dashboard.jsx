import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { documentAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { 
  FileText, Plus, Search, Calendar, Shield, Trash2, ArrowUpRight, 
  AlertTriangle, CheckCircle2, ChevronRight, Activity, Download
} from 'lucide-react';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await documentAPI.list();
      setDocuments(response.data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve uploaded documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this contract and all its analyzed data?')) {
      return;
    }
    try {
      await documentAPI.delete(id);
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete document.');
    }
  };

  const handleDownload = async (id, filename, e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const response = await documentAPI.downloadReport(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const baseName = filename.substring(0, filename.lastIndexOf('.')) || filename;
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

  const getFilteredDocs = () => {
    return documents.filter(doc => 
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Metrics calculations
  const totalContracts = documents.length;
  const highRiskCount = documents.filter(doc => doc.avg_risk_level === 'HIGH').length;
  const medRiskCount = documents.filter(doc => doc.avg_risk_level === 'MEDIUM').length;
  const lowRiskCount = documents.filter(doc => doc.avg_risk_level === 'LOW').length;
  
  // Calculate global average risk score
  const avgRiskScore = totalContracts > 0 
    ? Math.round(documents.reduce((acc, curr) => acc + (curr.avg_risk_score || 0), 0) / totalContracts)
    : 0;

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Contract Repository</h1>
            <p className="text-slate-400 mt-1">Review, monitor, and audit contractual risk vectors across legal agreements.</p>
          </div>
          <Link
            to="/upload"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-indigo hover:from-brand-purple/90 hover:to-brand-indigo/90 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-brand-purple/20"
          >
            <Plus className="w-4 h-4" />
            Analyze Document
          </Link>
        </div>

        {/* Dashboard Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 rounded-full border-4 border-brand-purple/20 border-t-brand-purple animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-center max-w-md mx-auto">
            <p className="font-semibold mb-2">Error Loading Data</p>
            <p className="text-sm">{error}</p>
            <button onClick={fetchDocuments} className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/35 text-xs">
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Analytics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Total Documents</span>
                  <div className="p-2 bg-white/5 rounded-lg text-white">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white">{totalContracts}</div>
                <div className="text-xs text-slate-500 mt-1">Contracts Analyzed</div>
              </div>

              <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Avg Risk Score</span>
                  <div className="p-2 bg-white/5 rounded-lg text-brand-purple">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white">
                  {avgRiskScore}
                  <span className="text-lg text-slate-500 font-normal">/100</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Overall platform average</div>
              </div>

              <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">High Risk Alerts</span>
                  <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-red-500">{highRiskCount}</div>
                <div className="text-xs text-slate-500 mt-1">Requires immediate attention</div>
              </div>

              <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Medium / Low Risks</span>
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-amber-500">{medRiskCount} <span className="text-slate-400 text-lg font-bold">/</span> <span className="text-emerald-500 text-3xl font-extrabold">{lowRiskCount}</span></div>
                <div className="text-xs text-slate-500 mt-1">Balanced / compliant items</div>
              </div>
            </div>

            {/* List and search */}
            <div className="glass-panel rounded-3xl overflow-hidden">
              {/* Toolbar */}
              <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-white">Document History</h3>
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents by filename..."
                    className="w-full glass-input rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Table or Empty view */}
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="bg-white/5 p-4 rounded-full text-slate-500 mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">No contracts uploaded yet</h4>
                  <p className="text-slate-400 text-sm max-w-xs mb-6">
                    Get started by uploading and analyzing your first document.
                  </p>
                  <Link
                    to="/upload"
                    className="px-4 py-2.5 rounded-lg bg-brand-purple hover:bg-brand-purple/90 text-white font-semibold text-sm transition-all"
                  >
                    Upload Document
                  </Link>
                </div>
              ) : getFilteredDocs().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-slate-400">No documents found matching "{searchQuery}"</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="p-6">Filename</th>
                        <th className="p-6">Uploaded At</th>
                        <th className="p-6">Avg Risk Score</th>
                        <th className="p-6">Avg Risk Level</th>
                        <th className="p-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {getFilteredDocs().map((doc) => (
                        <tr
                          key={doc.id}
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          className="group hover:bg-white/5 cursor-pointer transition-all duration-150"
                        >
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-brand-purple/10 rounded-lg text-brand-purple group-hover:scale-105 transition-transform">
                                <FileText className="w-5 h-5" />
                              </div>
                              <span className="font-semibold text-white group-hover:text-brand-purple transition-colors truncate max-w-[280px]">
                                {doc.filename}
                              </span>
                            </div>
                          </td>
                          <td className="p-6 text-slate-400 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              {new Date(doc.uploaded_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    doc.avg_risk_level === 'HIGH' ? 'bg-red-500' :
                                    doc.avg_risk_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`} 
                                  style={{ width: `${doc.avg_risk_score || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-white">
                                {doc.avg_risk_score || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="p-6">
                            <span 
                              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                                doc.avg_risk_level === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                doc.avg_risk_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {doc.avg_risk_level || 'LOW'}
                            </span>
                          </td>
                          <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => handleDownload(doc.id, doc.filename, e)}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                title="Download PDF Report"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(doc.id, e)}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                title="Delete Document"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

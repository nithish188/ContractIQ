import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import { UploadCloud, FileText, X, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(''); // 'extracting', 'analyzing', 'saving'
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    // Check size (20 MB max)
    const maxSize = 20 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File size exceeds the 20 MB limit.');
      return;
    }

    // Check type
    const validExtensions = ['.pdf', '.docx', '.txt'];
    const fileName = selectedFile.name.toLowerCase();
    const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExtension) {
      setError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    setError('');
    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setError('');
      setLoading(true);
      
      // Simulate processing stage indicators
      setStatus('Uploading and extracting document content...');
      setTimeout(() => setStatus('Running Clause Segmentation & Classification...'), 4000);
      setTimeout(() => setStatus('AI Risk Analysis Engine assessing liabilities and terms...'), 10000);
      setTimeout(() => setStatus('Extracting named entities, dates, and compiling Executive Summary...'), 16000);

      const response = await documentAPI.upload(file);
      navigate(`/documents/${response.data.id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred during document processing.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
            Analyze New Contract
          </h1>
          <p className="text-slate-400 text-lg">
            Upload your agreement to extract key clauses, identify risks, and view an AI-generated summary.
          </p>
        </div>

        <div className="glass-panel-glow rounded-3xl p-8 relative overflow-hidden">
          {error && (
            <div className="flex items-center gap-2 mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading ? (
            <div className="space-y-6">
              {/* Drag Area */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                  dragActive
                    ? 'border-brand-purple bg-brand-purple/5 scale-[0.99]'
                    : 'border-white/10 hover:border-brand-purple/50 hover:bg-white/5'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleChange}
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                />
                
                <div className="bg-brand-purple/10 p-4 rounded-full text-brand-purple mb-4">
                  <UploadCloud className="w-8 h-8" />
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-1">
                  Drag & drop file here
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  or click to browse your files
                </p>
                <div className="flex gap-3 text-xs text-slate-500">
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/5">PDF</span>
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/5">DOCX</span>
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/5">TXT</span>
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/5">Max 20MB</span>
                </div>
              </div>

              {/* File details */}
              {file && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-purple/10 rounded-lg text-brand-purple">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white truncate max-w-md">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload Button */}
              {file && (
                <button
                  onClick={handleUpload}
                  className="w-full bg-gradient-to-r from-brand-purple to-brand-indigo hover:from-brand-purple/90 hover:to-brand-indigo/90 text-white rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-brand-purple/20"
                >
                  Start Analysis Pipeline
                </button>
              )}
            </div>
          ) : (
            /* Loader State */
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-brand-purple/20 border-t-brand-purple animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-brand-purple animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Analyzing Document</h3>
              <p className="text-sm text-brand-purple font-medium text-center max-w-sm animate-pulse">
                {status}
              </p>
              <div className="mt-8 w-full max-w-md bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-brand-purple to-brand-indigo h-full animate-[loading-bar_20s_ease-in-out_infinite]"></div>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                This might take a minute depending on document length.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

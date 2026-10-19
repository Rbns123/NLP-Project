import React, { useState, useEffect } from 'react';
import CompareModal from './components/CompareModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('summary');
  const [status, setStatus] = useState('idle'); // 'idle', 'processing', 'completed', 'failed'
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const [presets, setPresets] = useState([]);
  const [selectedPaperName, setSelectedPaperName] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch preset papers gallery
  useEffect(() => {
    fetch('http://localhost:8000/api/presets')
      .then(res => res.json())
      .then(data => setPresets(data))
      .catch(() => {});
  }, []);

  const pollJob = (id, paperName) => {
    setStatus('processing');
    setSelectedPaperName(paperName);
    setError(null);

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/jobs/${id}`);
        if (!res.ok) throw new Error('Failed to fetch job status');
        const data = await res.json();

        setProgress(data.progress_percentage || 0);
        setCurrentStage(data.current_stage || 'Analyzing paper...');

        if (data.status === 'completed') {
          clearInterval(interval);
          setStatus('completed');
          setResult(data.result);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setStatus('failed');
          setError(data.error_message || 'Pipeline analysis failed.');
        }
      } catch (err) {
        clearInterval(interval);
        setStatus('failed');
        setError(err.message);
      }
    }, 400);
  };

  const handlePresetSelect = async (paperId, paperTitle) => {
    setStatus('processing');
    setProgress(5);
    setCurrentStage(`Loading ${paperTitle}...`);
    setError(null);
    setSelectedPaperName(paperTitle);

    try {
      const res = await fetch(`http://localhost:8000/api/analyze-preset/${paperId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not load preset');
      pollJob(data.job_id, paperTitle);
    } catch (err) {
      setStatus('failed');
      setError(err.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('processing');
    setError(null);
    setProgress(5);
    setCurrentStage('Uploading your research paper...');
    setSelectedPaperName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      pollJob(data.job_id, file.name);
    } catch (err) {
      setStatus('failed');
      setError(err.message);
    }
  };

  const jumpToSection = (secTitle) => {
    if (!result) return;
    const sec = result.sections.find(
      s => s.title.toLowerCase().includes(secTitle.toLowerCase()) || secTitle.toLowerCase().includes(s.title.toLowerCase())
    );
    if (sec) {
      setSelectedSection(sec);
      setActiveTab('sections');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{
        background: '#0d1321', borderBottom: '1px solid #1e293b',
        padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '8px',
            background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '16px'
          }}>PL</div>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
              PaperLens <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, marginLeft: '6px' }}>NLP Research Analyzer</span>
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {result && (
            <>
              <button
                onClick={() => setShowCompare(true)}
                style={{
                  background: 'rgba(99, 102, 241, 0.15)', border: '1px solid #6366f1', color: '#a5b4fc',
                  padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600
                }}>
                ⇄ Compare 2 Papers
              </button>
              <button
                onClick={() => setResult(null)}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid #334155', color: '#e2e8f0',
                  padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
                }}>
                ⌂ Choose Another Paper
              </button>
            </>
          )}

          <label style={{
            padding: '7px 14px', background: 'var(--primary-gradient)', borderRadius: '6px',
            cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: '#fff'
          }}>
            Upload PDF / DOCX
            <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </header>

      {/* Main Area */}
      <main style={{ flex: 1, padding: '28px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* VIEW 1: HOME & PAPER LIBRARY (When not viewing a result) */}
        {!result && (
          <div>
            {/* Simple Hero */}
            <div style={{ textAlign: 'center', margin: '30px auto 40px', maxWidth: '780px' }}>
              <div style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
                background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '12px', fontWeight: 600,
                marginBottom: '12px', border: '1px solid rgba(56, 189, 248, 0.2)'
              }}>
                Natural Language Processing System
              </div>
              <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>
                Understand & Audit Any Research Paper
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: 1.6 }}>
                Extract quantifiable metrics, classify scientific claims, audit open-science reproducibility, and cite exact source sections with zero hallucination.
              </p>
            </div>

            {/* Processing state indicator */}
            {status === 'processing' && (
              <div className="glass-panel" style={{ maxWidth: '650px', margin: '0 auto 40px', padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{currentStage}</span>
                  <span style={{ fontWeight: 700 }}>{progress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-gradient)', transition: 'width 0.3s ease' }} />
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '10px', textAlign: 'center' }}>
                  Analyzing: <strong>{selectedPaperName}</strong>
                </p>
              </div>
            )}

            {error && (
              <div style={{
                maxWidth: '650px', margin: '0 auto 30px', padding: '14px', background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--rose-accent)', borderRadius: '8px', color: '#fca5a5', fontSize: '14px'
              }}>
                ⚠️ Error: {error}
              </div>
            )}

            {/* Instant 1-Click Library Cards */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Choose a Classic NLP Research Paper to Analyze</h3>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Click any card to analyze it instantly with PaperLens:</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                {presets.map(paper => (
                  <div
                    key={paper.id}
                    onClick={() => handlePresetSelect(paper.id, paper.title)}
                    className="glass-panel"
                    style={{
                      padding: '24px', cursor: 'pointer', transition: 'all 0.2s ease',
                      border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#1e293b';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{
                          background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '11px',
                          fontWeight: 700, padding: '2px 8px', borderRadius: '4px'
                        }}>
                          {paper.file.endsWith('.pdf') ? 'PDF ARXlV PAPER' : 'DOCX BENCHMARK'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>Click to Analyze →</span>
                      </div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', lineHeight: 1.4 }}>{paper.title}</h4>
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>{paper.authors}</p>
                      <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>{paper.description}</p>
                    </div>

                    <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                      <span>Ready in server repository</span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>● Ready</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Paper Upload Dropzone */}
            <div className="glass-panel" style={{
              padding: '36px', textAlign: 'center', border: '2px dashed #27354f', borderRadius: '12px'
            }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>Or Upload Your Own Custom Research Paper</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                Accepts multi-column scientific papers in PDF or DOCX format (up to 50 MB).
              </p>
              <label style={{
                display: 'inline-block', padding: '10px 24px', background: '#1e293b', border: '1px solid #334155',
                borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: '#f8fafc'
              }}>
                Browse Document From Computer
                <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}

        {/* VIEW 2: INTERACTIVE DASHBOARD RESULT */}
        {result && (
          <div>
            {/* Header info bar */}
            <div className="glass-panel" style={{
              padding: '20px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
            }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8', fontWeight: 700 }}>
                  Active Paper Analysis
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>{result.metadata.filename}</h2>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  <span>Pages: {result.metadata.total_pages}</span>
                  <span>Words: {result.metadata.total_words}</span>
                  <span>Sections: {result.sections.length}</span>
                  <span>Extraction Time: {result.engine_telemetry.execution_time_seconds}s</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  background: '#111827', padding: '10px 18px', borderRadius: '8px',
                  border: '1px solid #1e293b', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>REPRODUCIBILITY SCORE</div>
                  <div style={{
                    fontSize: '20px', fontWeight: 800,
                    color: result.reproducibility.score >= 70 ? '#10b981' : '#f59e0b'
                  }}>
                    {result.reproducibility.score}% ({result.reproducibility.rating})
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1e293b', marginBottom: '20px', overflowX: 'auto' }}>
              {[
                { id: 'summary', label: '1. Structured Brief (Evidence-Linked)' },
                { id: 'triplets', label: `2. Result Triplets (${result.triplets.length})` },
                { id: 'claims', label: `3. Claims & Hedging (${result.claims.length})` },
                { id: 'repro', label: `4. Open Science Audit (${result.reproducibility.score}%)` },
                { id: 'citations', label: `5. Citations (${result.citations.total_references})` },
                { id: 'entities', label: `6. Scientific NER (${result.entities.length})` },
                { id: 'sections', label: `7. Full Sections (${result.sections.length})` },
                { id: 'telemetry', label: '8. Engine Telemetry' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '10px 18px', background: 'transparent', border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                    color: activeTab === tab.id ? '#fff' : '#94a3b8',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap'
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT 1: Structured Brief */}
            {activeTab === 'summary' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {[
                  { title: 'Problem Formulation', icon: '🎯', list: result.summary.problem, color: '#f59e0b' },
                  { title: 'Proposed Approach', icon: '⚙️', list: result.summary.approach, color: '#3b82f6' },
                  { title: 'Key Results & Findings', icon: '📈', list: result.summary.key_results, color: '#10b981' },
                  { title: 'Limitations & Caveats', icon: '⚠️', list: result.summary.limitations, color: '#ef4444' }
                ].map((block, i) => (
                  <div key={i} className="glass-panel" style={{ padding: '22px', borderTop: `3px solid ${block.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <span style={{ fontSize: '18px' }}>{block.icon}</span>
                      <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{block.title}</h3>
                    </div>
                    {block.list.length === 0 ? (
                      <p style={{ color: '#64748b', fontSize: '13px' }}>Not explicitly detailed in document.</p>
                    ) : (
                      block.list.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '14px' }}>
                          <p style={{ fontSize: '13.5px', lineHeight: 1.5, marginBottom: '6px' }}>"{item.sentence}"</p>
                          <span
                            onClick={() => jumpToSection(item.source_section)}
                            style={{
                              fontSize: '11px', color: '#38bdf8', cursor: 'pointer',
                              textDecoration: 'underline', background: 'rgba(56, 189, 248, 0.1)',
                              padding: '2px 8px', borderRadius: '4px'
                            }}>
                            📍 Source: {item.source_section}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT 2: Result Triplets */}
            {activeTab === 'triplets' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Quantitative Result Triplets</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
                  Extracted relations formatted as (Method, Dataset, Metric, Normalized Value, Source Section).
                </p>

                {result.triplets.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '14px' }}>No quantitative result triplets identified in the paper.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                          <th style={{ padding: '12px' }}>METHOD / MODEL</th>
                          <th style={{ padding: '12px' }}>DATASET</th>
                          <th style={{ padding: '12px' }}>METRIC</th>
                          <th style={{ padding: '12px' }}>REPORTED VALUE</th>
                          <th style={{ padding: '12px' }}>SOURCE CONTEXT</th>
                          <th style={{ padding: '12px' }}>SECTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.triplets.map(t => (
                          <tr key={t.id} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#93c5fd' }}>{t.method}</td>
                            <td style={{ padding: '12px', color: '#c4b5fd' }}>{t.dataset}</td>
                            <td style={{ padding: '12px', fontWeight: 600 }}>{t.metric}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                background: 'rgba(16, 185, 129, 0.15)', color: '#34d399',
                                padding: '3px 8px', borderRadius: '4px', fontWeight: 700
                              }}>
                                {t.raw_value}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: '#94a3b8', maxWidth: '340px' }}>"{t.source_sentence}"</td>
                            <td style={{ padding: '12px' }}>
                              <button
                                onClick={() => jumpToSection(t.source_section)}
                                style={{
                                  background: 'transparent', border: 'none', color: '#38bdf8',
                                  textDecoration: 'underline', cursor: 'pointer', fontSize: '12px'
                                }}>
                                {t.source_section}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: Claims */}
            {activeTab === 'claims' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Scientific Claims & Rhetorical Stance</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
                  Classified into Novelty, Performance, Comparison, and Limitations with hedging markers.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.claims.map(c => {
                    let strengthBadge = { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' };
                    if (c.strength === 'strong') strengthBadge = { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' };
                    if (c.strength === 'weak/hedged') strengthBadge = { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' };

                    return (
                      <div key={c.id} style={{
                        background: '#111827', border: '1px solid #1e293b',
                        borderRadius: '8px', padding: '14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{
                              background: '#1e293b', color: '#f1f5f9', fontSize: '11px',
                              padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700
                            }}>
                              {c.claim_type}
                            </span>
                            <span style={{
                              background: strengthBadge.bg, color: strengthBadge.text, fontSize: '11px',
                              padding: '2px 8px', borderRadius: '4px', fontWeight: 700
                            }}>
                              STRENGTH: {c.strength.toUpperCase()}
                            </span>
                          </div>

                          <button
                            onClick={() => jumpToSection(c.source_section)}
                            style={{
                              background: 'transparent', border: 'none', color: '#38bdf8',
                              fontSize: '12px', cursor: 'pointer', textDecoration: 'underline'
                            }}>
                            📍 {c.source_section}
                          </button>
                        </div>

                        <p style={{ fontSize: '13.5px', lineHeight: 1.5, marginBottom: '6px' }}>"{c.sentence}"</p>

                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                          <span>Rationale: {c.rationale}</span>
                          {c.hedging_cues?.length > 0 && (
                            <span style={{ color: '#f87171' }}>Hedging cues: {c.hedging_cues.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: Reproducibility */}
            {activeTab === 'repro' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Open Science & Reproducibility Audit</h3>
                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                      Audits source code, dataset availability, hyperparameters, compute hardware, and statistical significance.
                    </p>
                  </div>
                  <div style={{
                    fontSize: '24px', fontWeight: 800,
                    color: result.reproducibility.score >= 70 ? '#10b981' : '#f59e0b'
                  }}>
                    {result.reproducibility.score} / 100
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.reproducibility.checklist.map(item => (
                    <div key={item.key} style={{
                      background: '#111827', border: '1px solid #1e293b',
                      borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: item.status === 'found' ? '#10b981' : '#64748b'
                          }} />
                          <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{item.label}</h4>
                        </div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{item.description}</p>
                        {item.evidence_text && (
                          <div style={{
                            fontSize: '12px', background: '#0b0f19', padding: '5px 10px', borderRadius: '4px',
                            color: '#94a3b8', fontStyle: 'italic'
                          }}>
                            "{item.evidence_text}" — <span style={{ color: '#38bdf8' }}>{item.source_section}</span>
                          </div>
                        )}
                      </div>

                      <span style={{
                        padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                        background: item.status === 'found' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        color: item.status === 'found' ? '#34d399' : '#94a3b8'
                      }}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: Citations */}
            {activeTab === 'citations' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Reference List & In-Text Citation Frequency</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.citations.all_references.map(ref => (
                    <div key={ref.id} style={{
                      background: '#111827', border: '1px solid #1e293b',
                      borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px', marginBottom: '2px' }}>
                          [{ref.citation_marker}] {ref.title || ref.raw_reference}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Authors: {ref.authors || 'Unknown'} | Year: {ref.year || 'N/A'}
                        </div>
                      </div>
                      <span style={{
                        background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa',
                        padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600
                      }}>
                        {ref.in_text_count} mentions
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 6: Scientific NER */}
            {activeTab === 'entities' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Scientific Named Entities</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {result.entities.map(ent => (
                    <div key={ent.id} style={{
                      background: '#111827', border: '1px solid #1e293b',
                      borderRadius: '6px', padding: '6px 12px', fontSize: '13px'
                    }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, marginRight: '6px', color: '#38bdf8' }}>
                        {ent.label}:
                      </span>
                      <strong>{ent.normalized_text}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>({ent.source_section})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 7: Sections */}
            {activeTab === 'sections' && (
              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
                  <h4 style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>
                    Document Sections ({result.sections.length})
                  </h4>
                  {result.sections.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSection(s)}
                      style={{
                        padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px',
                        background: (selectedSection?.id || result.sections[0].id) === s.id ? '#3b82f6' : 'transparent',
                        color: (selectedSection?.id || result.sections[0].id) === s.id ? '#fff' : '#94a3b8',
                        fontSize: '13px', fontWeight: 500
                      }}>
                      {s.title}
                    </div>
                  ))}
                </div>

                <div className="glass-panel" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                  {(() => {
                    const activeSec = selectedSection || result.sections[0];
                    return (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{activeSec.title}</h3>
                          <span style={{
                            background: '#111827', padding: '2px 8px', borderRadius: '4px',
                            fontSize: '11px', color: '#38bdf8', textTransform: 'uppercase'
                          }}>
                            {activeSec.section_type}
                          </span>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '14px', color: '#d1d5db' }}>
                          {activeSec.text}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAB CONTENT 8: Telemetry */}
            {activeTab === 'telemetry' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Engine Telemetry & Hardware Execution</h3>
                <div style={{ background: '#0b0f19', padding: '16px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a5b4fc' }}>
                  <pre>{JSON.stringify(result.engine_telemetry, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Compare Modal */}
      {showCompare && result && (
        <CompareModal onClose={() => setShowCompare(false)} baseResult={result} />
      )}
    </div>
  );
}

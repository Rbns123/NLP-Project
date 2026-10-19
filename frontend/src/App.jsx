import React, { useState } from 'react';
import CompareModal from './components/CompareModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'triplets', 'claims', 'repro', 'entities', 'sections'
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null); // 'idle', 'uploading', 'polling', 'completed', 'failed'
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showCompare, setShowCompare] = useState(false);

  // Health and Telemetry status
  const [healthStatus, setHealthStatus] = useState(null);

  React.useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => setHealthStatus(data))
      .catch(() => setHealthStatus({ status: 'offline' }));
  }, []);

  const pollJob = (id) => {
    setStatus('polling');
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/jobs/${id}`);
        if (!res.ok) throw new Error('Failed to fetch job status');
        const data = await res.json();
        
        setProgress(data.progress_percentage || 0);
        setCurrentStage(data.current_stage || 'Analyzing...');

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('uploading');
    setError(null);
    setProgress(5);
    setCurrentStage('Uploading paper to backend...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      
      setJobId(data.job_id);
      pollJob(data.job_id);
    } catch (err) {
      setStatus('failed');
      setError(err.message);
    }
  };

  const handleDemoRun = async () => {
    setStatus('uploading');
    setError(null);
    setProgress(5);
    setCurrentStage('Initiating bundled sample research study...');

    try {
      const res = await fetch('http://localhost:8000/api/sample-demo');
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Demo initiation failed');

      setJobId(data.job_id);
      pollJob(data.job_id);
    } catch (err) {
      setStatus('failed');
      setError(err.message);
    }
  };

  const jumpToSection = (secTitle) => {
    if (!result) return;
    const sec = result.sections.find(s => s.title.toLowerCase().includes(secTitle.toLowerCase()) || secTitle.toLowerCase().includes(s.title.toLowerCase()));
    if (sec) {
      setSelectedSection(sec);
      setActiveTab('sections');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <header style={{
        background: 'rgba(17, 24, 39, 0.85)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-color)', padding: '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--glow-blue)', fontWeight: 800, fontSize: '18px'
          }}>PL</div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', margin: 0 }}>
              PaperLens <span style={{ fontSize: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px' }}>v0.1.0</span>
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Verifiable NLP Research Paper & Evidence Extractor</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {healthStatus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: healthStatus.status === 'healthy' ? 'var(--emerald-accent)' : 'var(--rose-accent)'
              }} />
              <span>Hardware: {healthStatus.telemetry?.device?.toUpperCase() || 'CPU'}</span>
            </div>
          )}

          {result && (
            <button
              onClick={() => setShowCompare(true)}
              style={{
                background: 'rgba(99, 102, 241, 0.2)', border: '1px solid #6366f1', color: '#a5b4fc',
                padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600
              }}>
              ⇄ Compare Mode
            </button>
          )}

          <button
            onClick={handleDemoRun}
            style={{
              background: 'var(--primary-gradient)', border: 'none', color: '#fff',
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              boxShadow: 'var(--shadow-sm)'
            }}>
            ⚡ Load Sample Paper
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '32px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* Upload Hero (when no result or during upload) */}
        {!result && (
          <div className="glass-panel" style={{
            maxWidth: '750px', margin: '60px auto', padding: '48px', textAlign: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              📄
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '10px' }}>Analyze Academic Literature</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '28px', lineHeight: 1.5 }}>
              Upload any machine learning, engineering, or scientific paper in PDF or DOCX format.
              PaperLens will segment sections, extract result triplets, classify claims with hedging cues, and audit reproducibility.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <label style={{
                padding: '12px 28px', background: 'var(--primary-gradient)', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 600, fontSize: '15px', boxShadow: 'var(--glow-blue)'
              }}>
                Choose Research Paper (.pdf, .docx)
                <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              <button
                onClick={handleDemoRun}
                style={{
                  padding: '12px 24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px'
                }}>
                Run Bundled Demo
              </button>
            </div>

            {/* Progress Bar & Status */}
            {(status === 'uploading' || status === 'polling') && (
              <div style={{ marginTop: '36px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--cyan-accent)' }}>{currentStage}</span>
                  <span style={{ fontWeight: 600 }}>{progress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progress}%`, height: '100%', background: 'var(--primary-gradient)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            {error && (
              <div style={{
                marginTop: '24px', padding: '14px', background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--rose-accent)', borderRadius: '8px', color: '#fca5a5', fontSize: '14px'
              }}>
                ⚠️ Error: {error}
              </div>
            )}
          </div>
        )}

        {/* Results Dashboard */}
        {result && (
          <div>
            {/* Top Paper Header Bar */}
            <div className="glass-panel" style={{
              padding: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
            }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--cyan-accent)', fontWeight: 700 }}>
                  Active Document Analysis
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '2px' }}>{result.metadata.filename}</h2>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>Pages: {result.metadata.total_pages}</span>
                  <span>Words: {result.metadata.total_words}</span>
                  <span>Sections: {result.sections.length}</span>
                  <span>Execution Time: {result.engine_telemetry.execution_time_seconds}s</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{
                  background: 'var(--bg-secondary)', padding: '10px 18px', borderRadius: '8px',
                  border: '1px solid var(--border-color)', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>REPRODUCIBILITY SCORE</div>
                  <div style={{
                    fontSize: '18px', fontWeight: 700,
                    color: result.reproducibility.score >= 70 ? 'var(--emerald-accent)' : 'var(--amber-accent)'
                  }}>
                    {result.reproducibility.score}% ({result.reproducibility.rating})
                  </div>
                </div>

                <label style={{
                  padding: '10px 18px', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  display: 'flex', alignItems: 'center'
                }}>
                  Upload Another Paper
                  <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', overflowX: 'auto' }}>
              {[
                { id: 'summary', label: 'Structured Brief (Evidence-Linked)' },
                { id: 'triplets', label: `Result Triplets (${result.triplets.length})` },
                { id: 'claims', label: `Claim Analysis (${result.claims.length})` },
                { id: 'repro', label: `Reproducibility Checklist (${result.reproducibility.score}%)` },
                { id: 'citations', label: `Citations & Top Works (${result.citations.total_references})` },
                { id: 'entities', label: `Scientific NER (${result.entities.length})` },
                { id: 'sections', label: `Parsed Sections (${result.sections.length})` },
                { id: 'telemetry', label: 'Engine Telemetry' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '10px 18px', background: 'transparent', border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid var(--primary-accent)' : '2px solid transparent',
                    color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap'
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Evidence-Linked Structured Brief */}
            {activeTab === 'summary' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {[
                  { title: 'Problem Formulation', icon: '🎯', list: result.summary.problem, color: '#f59e0b' },
                  { title: 'Proposed Approach', icon: '⚙️', list: result.summary.approach, color: '#3b82f6' },
                  { title: 'Key Results & Findings', icon: '📈', list: result.summary.key_results, color: '#10b981' },
                  { title: 'Limitations & Caveats', icon: '⚠️', list: result.summary.limitations, color: '#ef4444' }
                ].map((block, i) => (
                  <div key={i} className="glass-panel" style={{ padding: '24px', borderTop: `3px solid ${block.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '18px' }}>{block.icon}</span>
                      <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{block.title}</h3>
                    </div>
                    {block.list.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Not explicitly detailed in document.</p>
                    ) : (
                      block.list.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '14px' }}>
                          <p style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '6px' }}>"{item.sentence}"</p>
                          <span
                            onClick={() => jumpToSection(item.source_section)}
                            style={{
                              fontSize: '11px', color: 'var(--cyan-accent)', cursor: 'pointer',
                              textDecoration: 'underline', background: 'rgba(6, 182, 212, 0.1)',
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

            {/* Tab 2: Result Triplets */}
            {activeTab === 'triplets' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Quantitative Result Triplets</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Extracted relations formatted as (Method, Dataset, Metric, Value, Source Section).
                </p>

                {result.triplets.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No quantitative result triplets identified in the paper.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '12px' }}>METHOD / MODEL</th>
                          <th style={{ padding: '12px' }}>DATASET</th>
                          <th style={{ padding: '12px' }}>METRIC</th>
                          <th style={{ padding: '12px' }}>REPORTED VALUE</th>
                          <th style={{ padding: '12px' }}>SOURCE CONTEXT</th>
                          <th style={{ padding: '12px' }}>SECTION PROVENANCE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.triplets.map(t => (
                          <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '12px', fontWeight: 600, color: '#93c5fd' }}>{t.method}</td>
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
                            <td style={{ padding: '12px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                              "{t.source_sentence}"
                            </td>
                            <td style={{ padding: '12px' }}>
                              <button
                                onClick={() => jumpToSection(t.source_section)}
                                style={{
                                  background: 'transparent', border: 'none', color: 'var(--cyan-accent)',
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

            {/* Tab 3: Scientific Claims & Hedging */}
            {activeTab === 'claims' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Scientific Claims & Confidence Analysis</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {result.claims.map(c => {
                    let strengthBadge = { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' };
                    if (c.strength === 'strong') strengthBadge = { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' };
                    if (c.strength === 'weak/hedged') strengthBadge = { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' };

                    return (
                      <div key={c.id} style={{
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        borderRadius: '8px', padding: '16px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{
                              background: '#374151', color: '#e5e7eb', fontSize: '11px',
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
                              background: 'transparent', border: 'none', color: 'var(--cyan-accent)',
                              fontSize: '12px', cursor: 'pointer', textDecoration: 'underline'
                            }}>
                            📍 {c.source_section}
                          </button>
                        </div>

                        <p style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '8px' }}>"{c.sentence}"</p>

                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
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

            {/* Tab 4: Reproducibility Quality */}
            {activeTab === 'repro' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Reproducibility & Open Science Audit</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Evaluates presence of code, dataset links, hyperparameters, hardware, and statistical validation.
                    </p>
                  </div>
                  <div style={{
                    fontSize: '24px', fontWeight: 800,
                    color: result.reproducibility.score >= 70 ? 'var(--emerald-accent)' : 'var(--amber-accent)'
                  }}>
                    {result.reproducibility.score} / 100
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.reproducibility.checklist.map(item => (
                    <div key={item.key} style={{
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                      borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: item.status === 'found' ? 'var(--emerald-accent)' : '#64748b'
                          }} />
                          <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{item.label}</h4>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{item.description}</p>
                        {item.evidence_text && (
                          <div style={{
                            fontSize: '12px', background: '#0b0f19', padding: '6px 10px', borderRadius: '4px',
                            color: '#94a3b8', fontStyle: 'italic'
                          }}>
                            "{item.evidence_text}" — <span style={{ color: 'var(--cyan-accent)' }}>{item.source_section}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <span style={{
                          padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                          background: item.status === 'found' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          color: item.status === 'found' ? 'var(--emerald-accent)' : '#94a3b8'
                        }}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 5: Citations */}
            {activeTab === 'citations' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Reference Analysis & Most Cited Works</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.citations.all_references.map(ref => (
                    <div key={ref.id} style={{
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                      borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                          [{ref.citation_marker}] {ref.title || ref.raw_reference}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Authors: {ref.authors || 'Unknown'} | Year: {ref.year || 'N/A'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa',
                          padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600
                        }}>
                          {ref.in_text_count} in-text mentions
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 6: Scientific NER */}
            {activeTab === 'entities' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Scientific Named Entities</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {result.entities.map(ent => (
                    <div key={ent.id} style={{
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                      borderRadius: '6px', padding: '8px 12px', fontSize: '13px'
                    }}>
                      <span style={{
                        fontSize: '10px', textTransform: 'uppercase', fontWeight: 700,
                        marginRight: '6px', color: 'var(--cyan-accent)'
                      }}>
                        {ent.label}:
                      </span>
                      <strong>{ent.normalized_text}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        ({ent.source_section})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 7: Parsed Sections */}
            {activeTab === 'sections' && (
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
                  <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Document Sections ({result.sections.length})
                  </h4>
                  {result.sections.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSection(s)}
                      style={{
                        padding: '10px', borderRadius: '6px', cursor: 'pointer', marginBottom: '6px',
                        background: (selectedSection?.id || result.sections[0].id) === s.id ? 'var(--primary-accent)' : 'transparent',
                        color: (selectedSection?.id || result.sections[0].id) === s.id ? '#fff' : 'var(--text-secondary)',
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{activeSec.title}</h3>
                          <span style={{
                            background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px',
                            fontSize: '11px', color: 'var(--cyan-accent)', textTransform: 'uppercase'
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

            {/* Tab 8: Engine Telemetry */}
            {activeTab === 'telemetry' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Multi-Tier Engine Telemetry & Provenance</h3>
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

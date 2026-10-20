import React, { useState } from 'react';
import CompareModal from './components/CompareModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'triplets', 'claims', 'repro'
  const [status, setStatus] = useState('idle'); // 'idle', 'processing', 'completed', 'failed'
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showCompare, setShowCompare] = useState(false);

  const pollJob = (id) => {
    setStatus('processing');
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

  const handleDemoRun = async () => {
    setStatus('processing');
    setProgress(10);
    setCurrentStage('Loading benchmark paper...');
    setError(null);

    try {
      const res = await fetch('http://localhost:8000/api/sample-demo');
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Demo initiation failed');
      pollJob(data.job_id);
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
    setProgress(10);
    setCurrentStage('Uploading your research paper...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      pollJob(data.job_id);
    } catch (err) {
      setStatus('failed');
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0b0f19', color: '#f3f4f6' }}>
      {/* Top Simple Header */}
      <header style={{
        background: '#111827', borderBottom: '1px solid #1f2937', padding: '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px'
          }}>PL</div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>PaperLens: Research Paper Report Card</h1>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Natural Language Processing & Evidence Extraction</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {result && (
            <>
              <button
                onClick={() => setShowCompare(true)}
                style={{
                  background: 'rgba(99, 102, 241, 0.15)', border: '1px solid #6366f1', color: '#a5b4fc',
                  padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700
                }}>
                ⇄ Compare 2 Papers
              </button>
              <button
                onClick={() => setResult(null)}
                style={{
                  background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb',
                  padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600
                }}>
                ← Test Another Paper
              </button>
            </>
          )}

          <button
            onClick={handleDemoRun}
            style={{
              background: 'var(--primary-gradient)', border: 'none', color: '#fff',
              padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600
            }}>
            ⚡ Try Sample Paper (100% Score)
          </button>
        </div>
      </header>

      {/* Main Single Page Layout */}
      <main style={{ flex: 1, padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* VIEW 1: Simple Upload & Sample Box (When no result) */}
        {!result && (
          <div style={{ maxWidth: '680px', margin: '40px auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '10px' }}>
              Instant Research Paper Report Card
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
              Upload any machine learning or scientific paper (PDF or DOCX). In a few seconds, PaperLens extracts the structured brief, benchmark result triplets, classified claims with hedging analysis, and a reproducibility score.
            </p>

            {/* Action Box */}
            <div className="glass-panel" style={{ padding: '36px', border: '2px dashed #374151', borderRadius: '14px', background: '#111827' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleDemoRun}
                  style={{
                    padding: '12px 26px', background: 'var(--primary-gradient)', border: 'none',
                    borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '15px', color: '#fff'
                  }}>
                  ⚡ Try Sample Paper (100% Score)
                </button>

                <label style={{
                  padding: '12px 24px', background: '#1f2937', border: '1px solid #374151',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: '#f3f4f6'
                }}>
                  Upload PDF or DOCX
                  <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>

              {/* Progress Bar */}
              {status === 'processing' && (
                <div style={{ marginTop: '28px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>{currentStage}</span>
                    <span style={{ fontWeight: 700 }}>{progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#1f2937', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-gradient)', transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  marginTop: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', fontSize: '14px'
                }}>
                  ⚠️ Error: {error}
                </div>
              )}
            </div>

            {/* Helpful explanation of what papers have what reproducibility score */}
            <div style={{ marginTop: '32px', textAlign: 'left', background: '#111827', padding: '20px', borderRadius: '10px', border: '1px solid #1f2937' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#e5e7eb', marginBottom: '8px' }}>
                💡 Why do different papers get different Reproducibility Scores?
              </h4>
              <ul style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.6, paddingLeft: '20px' }}>
                <li><strong>Sample Demo Paper (100% Score)</strong>: Purpose-built benchmark paper containing code repository links, hyperparameters, hardware specs, random seeds, and statistical significance tests.</li>
                <li><strong>BERT Paper (57% Score)</strong>: Found code, hyperparameters, hardware (Cloud TPUs), and baselines, but does not state specific random seeds or statistical significance tests.</li>
                <li><strong>Transformer Paper (28% Score)</strong>: Found baseline comparisons and hardware (8 P100 GPUs), but omitted code links and exact random seeds.</li>
              </ul>
            </div>
          </div>
        )}

        {/* VIEW 2: The Clean 4-Tab Report Card (When result is ready) */}
        {result && (
          <div>
            {/* Top Paper Summary Bar */}
            <div className="glass-panel" style={{
              padding: '20px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827'
            }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8', fontWeight: 700 }}>
                  Report Card For
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>{result.metadata.filename}</h2>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  <span>Pages: {result.metadata.total_pages}</span>
                  <span>Words: {result.metadata.total_words}</span>
                  <span>Sections: {result.sections.length}</span>
                </div>
              </div>

              {/* Reproducibility Badge */}
              <div style={{
                background: '#1f2937', padding: '10px 20px', borderRadius: '8px', border: '1px solid #374151', textAlign: 'center'
              }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' }}>Reproducibility Score</div>
                <div style={{
                  fontSize: '22px', fontWeight: 800,
                  color: result.reproducibility.score >= 70 ? '#10b981' : (result.reproducibility.score >= 40 ? '#f59e0b' : '#ef4444')
                }}>
                  {result.reproducibility.score} / 100 ({result.reproducibility.rating})
                </div>
              </div>
            </div>

            {/* Exactly 4 Clean Tabs Matching Master Prompt */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1f2937', marginBottom: '24px' }}>
              {[
                { id: 'summary', label: '1. Summary (Evidence-Linked)' },
                { id: 'triplets', label: `2. Results Table (${result.triplets.length})` },
                { id: 'claims', label: `3. Claims & Evidence (${result.claims.length})` },
                { id: 'repro', label: `4. Reproducibility Checklist (${result.reproducibility.score}%)` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '12px 20px', background: 'transparent', border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                    color: activeTab === tab.id ? '#fff' : '#9ca3af',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    cursor: 'pointer', fontSize: '14px'
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: Summary (Problem, Approach, Results, Limitations) */}
            {activeTab === 'summary' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                {[
                  { title: 'Problem', icon: '🎯', list: result.summary.problem, color: '#f59e0b' },
                  { title: 'Approach', icon: '⚙️', list: result.summary.approach, color: '#3b82f6' },
                  { title: 'Key Results', icon: '📈', list: result.summary.key_results, color: '#10b981' },
                  { title: 'Limitations', icon: '⚠️', list: result.summary.limitations, color: '#ef4444' }
                ].map((block, i) => (
                  <div key={i} className="glass-panel" style={{ padding: '20px', borderTop: `3px solid ${block.color}`, background: '#111827' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <span style={{ fontSize: '18px' }}>{block.icon}</span>
                      <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{block.title}</h3>
                    </div>
                    {block.list.length === 0 ? (
                      <p style={{ color: '#6b7280', fontSize: '13px' }}>Not explicitly found in document.</p>
                    ) : (
                      block.list.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '14px' }}>
                          <p style={{ fontSize: '13.5px', lineHeight: 1.5, marginBottom: '6px' }}>"{item.sentence}"</p>
                          <span style={{
                            fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)',
                            padding: '2px 8px', borderRadius: '4px', display: 'inline-block'
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

            {/* TAB 2: Results Table (Method, Dataset, Metric, Value, Section) */}
            {activeTab === 'triplets' && (
              <div className="glass-panel" style={{ padding: '24px', background: '#111827' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Normalized Results Table</h3>
                <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '18px' }}>
                  Extracted result rows: (Method, Dataset, Metric, Normalized Value, Source Section).
                </p>

                {result.triplets.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>No quantitative result rows detected in document.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1f2937', color: '#9ca3af' }}>
                          <th style={{ padding: '12px' }}>METHOD</th>
                          <th style={{ padding: '12px' }}>DATASET</th>
                          <th style={{ padding: '12px' }}>METRIC</th>
                          <th style={{ padding: '12px' }}>VALUE</th>
                          <th style={{ padding: '12px' }}>SOURCE SENTENCE</th>
                          <th style={{ padding: '12px' }}>SOURCE SECTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.triplets.map(t => (
                          <tr key={t.id} style={{ borderBottom: '1px solid #1f2937' }}>
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
                            <td style={{ padding: '12px', color: '#9ca3af', maxWidth: '340px' }}>"{t.source_sentence}"</td>
                            <td style={{ padding: '12px', color: '#38bdf8' }}>{t.source_section}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Claims & Hedging */}
            {activeTab === 'claims' && (
              <div className="glass-panel" style={{ padding: '24px', background: '#111827' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Scientific Claims & Wording Strength</h3>
                <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '18px' }}>
                  Claims labeled by type (novelty, performance, comparison, limitation) and wording strength based on hedging cues.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.claims.map(c => {
                    let strengthColor = c.strength === 'strong' ? '#34d399' : (c.strength === 'weak/hedged' ? '#f87171' : '#60a5fa');

                    return (
                      <div key={c.id} style={{ background: '#1f2937', borderRadius: '8px', padding: '16px', border: '1px solid #374151' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{
                              background: '#374151', color: '#f3f4f6', fontSize: '11px',
                              padding: '2px 8px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase'
                            }}>
                              {c.claim_type}
                            </span>
                            <span style={{
                              background: 'rgba(255,255,255,0.06)', color: strengthColor, fontSize: '11px',
                              padding: '2px 8px', borderRadius: '4px', fontWeight: 700
                            }}>
                              STRENGTH: {c.strength.toUpperCase()}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: '#38bdf8' }}>📍 {c.source_section}</span>
                        </div>

                        <p style={{ fontSize: '13.5px', lineHeight: 1.5, marginBottom: '8px' }}>"{c.sentence}"</p>

                        <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', gap: '16px' }}>
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

            {/* TAB 4: Reproducibility Checklist */}
            {activeTab === 'repro' && (
              <div className="glass-panel" style={{ padding: '24px', background: '#111827' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Open Science Reproducibility Checklist</h3>
                    <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                      Based on standard ML reproducibility guidelines (NeurIPS & ACL).
                    </p>
                  </div>
                  <div style={{
                    fontSize: '24px', fontWeight: 800,
                    color: result.reproducibility.score >= 70 ? '#10b981' : (result.reproducibility.score >= 40 ? '#f59e0b' : '#ef4444')
                  }}>
                    {result.reproducibility.score} / 100
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.reproducibility.checklist.map(item => (
                    <div key={item.key} style={{
                      background: '#1f2937', borderRadius: '8px', padding: '14px', border: '1px solid #374151',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: item.status === 'found' ? '#10b981' : '#6b7280'
                          }} />
                          <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{item.label}</h4>
                        </div>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{item.description}</p>
                        {item.evidence_text && (
                          <div style={{
                            fontSize: '12px', background: '#111827', padding: '6px 10px', borderRadius: '4px',
                            color: '#94a3b8', fontStyle: 'italic'
                          }}>
                            "{item.evidence_text}" — <span style={{ color: '#38bdf8' }}>{item.source_section}</span>
                          </div>
                        )}
                      </div>

                      <span style={{
                        padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                        background: item.status === 'found' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                        color: item.status === 'found' ? '#34d399' : '#9ca3af'
                      }}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Side-by-Side Compare Modal */}
      {showCompare && result && (
        <CompareModal onClose={() => setShowCompare(false)} baseResult={result} />
      )}
    </div>
  );
}

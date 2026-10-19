import React, { useState } from 'react';

export default function CompareModal({ onClose, baseResult }) {
  const [compareFile, setCompareFile] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [error, setError] = useState(null);

  const handleCompareUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCompareFile(file);
    setComparing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const uploadJson = await res.json();
      if (!res.ok) throw new Error(uploadJson.detail || 'Upload failed');

      const jobId = uploadJson.job_id;
      // Poll
      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(`http://localhost:8000/api/jobs/${jobId}`);
          const pollJson = await pollRes.json();
          if (pollJson.status === 'completed') {
            clearInterval(pollInterval);
            setCompareData(pollJson.result);
            setComparing(false);
          } else if (pollJson.status === 'failed') {
            clearInterval(pollInterval);
            setError(pollJson.error_message || 'Analysis failed');
            setComparing(false);
          }
        } catch (err) {
          clearInterval(pollInterval);
          setError(err.message);
          setComparing(false);
        }
      }, 500);
    } catch (err) {
      setError(err.message);
      setComparing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 8, 15, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '1100px', maxHeight: '90vh', overflowY: 'auto',
        background: '#111827', padding: '32px', position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6366f1', fontWeight: 700 }}>
              Comparative Evidence Synthesis
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>Side-by-Side Paper Comparison</h2>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer'
          }}>✕</button>
        </div>

        {!compareData && (
          <div style={{
            border: '2px dashed #27354f', borderRadius: '12px', padding: '40px',
            textAlign: 'center', background: 'rgba(24, 34, 52, 0.4)'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Select Second Paper to Compare</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              Compare methods, metrics, benchmark scores, and reproducibility side-by-side with {baseResult.metadata.filename}.
            </p>
            <label style={{
              display: 'inline-block', padding: '10px 24px', background: 'var(--primary-gradient)',
              borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px'
            }}>
              {comparing ? 'Processing Second Paper...' : 'Upload Second Paper (PDF/DOCX)'}
              <input type="file" accept=".pdf,.docx" onChange={handleCompareUpload} disabled={comparing} style={{ display: 'none' }} />
            </label>
            {error && <p style={{ color: '#ef4444', marginTop: '16px', fontSize: '13px' }}>{error}</p>}
          </div>
        )}

        {compareData && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Paper A */}
            <div style={{ background: '#182234', padding: '20px', borderRadius: '12px', border: '1px solid #27354f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ background: '#3b82f6', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>PAPER A</span>
                <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{baseResult.metadata.filename}</h4>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Reproducibility Quality</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: baseResult.reproducibility.score >= 70 ? '#10b981' : '#f59e0b' }}>
                  {baseResult.reproducibility.score}% ({baseResult.reproducibility.rating})
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Key Triplet Results</div>
                {baseResult.triplets.length === 0 ? <p style={{ fontSize: '13px', color: '#64748b' }}>No triplets extracted.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {baseResult.triplets.map((t, idx) => (
                      <div key={idx} style={{ background: '#111827', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                        <strong>{t.method}</strong> on <strong>{t.dataset}</strong>: <span style={{ color: '#38bdf8', fontWeight: 600 }}>{t.metric} = {t.raw_value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Paper B */}
            <div style={{ background: '#182234', padding: '20px', borderRadius: '12px', border: '1px solid #27354f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ background: '#8b5cf6', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>PAPER B</span>
                <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{compareData.metadata.filename}</h4>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Reproducibility Quality</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: compareData.reproducibility.score >= 70 ? '#10b981' : '#f59e0b' }}>
                  {compareData.reproducibility.score}% ({compareData.reproducibility.rating})
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Key Triplet Results</div>
                {compareData.triplets.length === 0 ? <p style={{ fontSize: '13px', color: '#64748b' }}>No triplets extracted.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {compareData.triplets.map((t, idx) => (
                      <div key={idx} style={{ background: '#111827', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                        <strong>{t.method}</strong> on <strong>{t.dataset}</strong>: <span style={{ color: '#a78bfa', fontWeight: 600 }}>{t.metric} = {t.raw_value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

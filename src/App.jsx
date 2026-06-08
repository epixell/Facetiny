// src/App.jsx
import React, { useState, useEffect } from 'react';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { DEFAULT_FORTUNES } from './utils/defaultFortuneData';
import { Sparkles, Settings, Shield, FileText, ExternalLink, X, Award } from 'lucide-react';

function App() {
  const [view, setView] = useState('user'); // 'user' or 'admin'

  // Automatic data migration on mount to inject complete rules if placeholders are detected
  useEffect(() => {
    const savedRules = localStorage.getItem("lookalike_rules");
    if (savedRules) {
      try {
        let parsed = JSON.parse(savedRules);
        
        // Check if there are dummy placeholder texts or if the face aspect ratio rule is missing
        const hasPlaceholders = parsed.some(rule => 
          rule.ranges.some(range => 
            range.love.includes("사랑운 내용") || 
            range.love.includes("연애결혼운 내용") ||
            range.wealth.includes("재물운 내용") ||
            range.love === ""
          )
        );
        
        const isFaceAspectRuleMissing = !parsed.some(r => r.metric === "face_aspect_ratio");

        // If placeholders are present or the core rule is missing, force reset to defaults with complete texts
        if (hasPlaceholders || isFaceAspectRuleMissing) {
          localStorage.setItem("lookalike_rules", JSON.stringify(DEFAULT_FORTUNES));
          // Trigger state reload if we are already in admin view (forces state update)
          window.location.reload();
        }
      } catch (e) {
        console.error("Migration error, resetting to defaults:", e);
        localStorage.setItem("lookalike_rules", JSON.stringify(DEFAULT_FORTUNES));
      }
    } else {
      localStorage.setItem("lookalike_rules", JSON.stringify(DEFAULT_FORTUNES));
    }
  }, []);

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: '30px' }}>
      
      {/* Semantic Header / Navigation Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '16px' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} 
          onClick={() => setView('user')}
        >
          <Sparkles size={24} color="#00f2fe" className="pulse-glow-border" />
          <span style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #00f2fe, #4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Facetiny AI 관상
          </span>
        </div>
        
        <nav>
          {view === 'user' ? (
            <button 
              className="btn-secondary" 
              onClick={() => setView('admin')} 
              style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'inline-flex', gap: '6px', alignItems: 'center' }}
            >
              <Settings size={14} /> 관리자 설정
            </button>
          ) : (
            <button 
              className="btn-secondary" 
              onClick={() => setView('user')} 
              style={{ fontSize: '0.85rem', padding: '8px 16px' }}
            >
              사용자 모드 돌아가기
            </button>
          )}
        </nav>
      </header>

      {/* Semantic Main Content Wrapper */}
      <main style={{ flex: 1 }}>
        {view === 'user' ? (
          <UserDashboard onOpenAdmin={() => setView('admin')} />
        ) : (
          <AdminDashboard onClose={() => setView('user')} />
        )}
      </main>

      {/* Semantic Footer */}
      <footer style={{ marginTop: '80px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '30px', paddingBottom: '30px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Sparkles size={16} color="#00f2fe" />
              <span style={{ fontWeight: '700', color: '#fff' }}>Facetiny (페이스타이니)</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
              &copy; {new Date().getFullYear()} Facetiny. All rights reserved. 100% Client-Side AI Analysis.
            </p>
          </div>

          {/* Footer Navigation Links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <a 
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Shield size={12} /> 개인정보처리방침
            </a>
            <a 
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <FileText size={12} /> 서비스 이용약관
            </a>
            <a 
              href="/adsense-policy.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Award size={12} /> 고품질 서비스 선언
            </a>
            <a 
              href="https://github.com/epixell/Facetiny" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg> GitHub
            </a>
          </div>
        </div>

        {/* References and Policy guidelines compliance notice */}
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '16px', gap: '10px' }}>
          <span>본 서비스는 동양 학술 및 전통 관상 서적(오행학설, 삼정상법, 마의상법)의 기준을 응용하여 재미와 통찰을 주는 AI 시뮬레이터입니다.</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a 
              href="https://support.google.com/webmasters/answer/35769" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
            >
              구글 웹마스터 가이드라인 <ExternalLink size={10} />
            </a>
            <a 
              href="https://support.google.com/adsense/answer/48182" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
            >
              구글 애드센스 프로그램 정책 <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;

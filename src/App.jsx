// src/App.jsx
import React, { useState, useEffect } from 'react';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { DEFAULT_FORTUNES } from './utils/defaultFortuneData';
import { Sparkles, Settings } from 'lucide-react';

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
    <div className="container" style={{ minHeight: '100vh', paddingTop: '30px' }}>
      
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '16px' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} 
          onClick={() => setView('user')}
        >
          <Sparkles size={24} color="#00f2fe" className="pulse-glow-border" />
          <span style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #00f2fe, #4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Facetiny AI 관상
          </span>
        </div>
        
        <div>
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
        </div>
      </div>

      {view === 'user' ? (
        <UserDashboard onOpenAdmin={() => setView('admin')} />
      ) : (
        <AdminDashboard onClose={() => setView('user')} />
      )}
    </div>
  );
}

export default App;

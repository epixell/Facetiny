// src/App.jsx
import React, { useState, useEffect } from 'react';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { DEFAULT_FORTUNES } from './utils/defaultFortuneData';
import { Sparkles, Settings, Shield, FileText, ExternalLink, X, Award } from 'lucide-react';

function App() {
  const [view, setView] = useState('user'); // 'user' or 'admin'
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | 'adsense' | null

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
            <button 
              onClick={() => setActiveModal('privacy')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Shield size={12} /> 개인정보처리방침
            </button>
            <button 
              onClick={() => setActiveModal('terms')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <FileText size={12} /> 서비스 이용약관
            </button>
            <button 
              onClick={() => setActiveModal('adsense')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Award size={12} /> 고품질 서비스 선언
            </button>
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

      {/* Interactive Modal Popups for Footer Links */}
      {activeModal && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="glass-panel" 
            style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', padding: '30px', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveModal(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>

            {activeModal === 'privacy' && (
              <div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Shield size={20} color="#00f2fe" /> 개인정보처리방침 (Privacy Policy)
                </h2>
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p><strong>1. 기본 원칙:</strong> Facetiny는 사용자의 개인정보 및 프라이버시를 최우선으로 보호합니다.</p>
                  <p><strong>2. 민감 정보 (얼굴 이미지 및 카메라 데이터) 비저장:</strong> 본 서비스의 핵심인 AI 관상 스캔 기능은 사용자의 카메라 스트림 또는 업로드된 파일의 원본 픽셀 데이터를 <strong>당사 서버로 단 1바이트도 송신하거나 저장하지 않습니다.</strong></p>
                  <p><strong>3. 로컬 처리 (WebAssembly):</strong> 모든 안면 인식 및 특징점 기하학 연산, 색상 샘플링은 사용자의 모바일 및 PC 브라우저 내에서 Google MediaPipe WebAssembly 모듈을 이용해 <strong>100% 로컬</strong>로만 처리됩니다.</p>
                  <p><strong>4. 로컬 스토리지 이용:</strong> 본 서비스는 관리자의 룰 설정이나 운세 가이드 텍스트 데이터의 영속성을 위해 웹브라우저의 <code>localStorage</code>를 사용합니다. 이 데이터 또한 전적으로 사용자의 로컬 환경 내에만 저장되며, 어떠한 제3자에게 전송되지 않습니다.</p>
                  <p><strong>5. 정보주체의 권리:</strong> 원본 이미지는 분석이 종료되거나 탭을 닫는 즉시 메모리에서 안전하게 소멸됩니다.</p>
                </div>
              </div>
            )}

            {activeModal === 'terms' && (
              <div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <FileText size={20} color="#4facfe" /> 서비스 이용약관 (Terms of Service)
                </h2>
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p><strong>제1조 (목적)</strong> 본 약관은 Facetiny(페이스타이니)가 제공하는 AI 관상 서비스(이하 '서비스')의 이용 조건 및 절차에 관한 기본적인 사항을 규정합니다.</p>
                  <p><strong>제2조 (이용 조건 및 기능 제공)</strong> 사용자는 브라우저의 카메라 권한 허용 또는 정면 얼굴 파일 업로드를 통해 서비스를 무료로 이용할 수 있습니다. 당사는 사용자 경험을 방해하는 다크 패턴이나 불필요한 결제를 요구하지 않습니다.</p>
                  <p><strong>제3조 (재미와 면책 조항)</strong> 본 서비스는 전통 관상 서적의 계측 기하학 원리를 현대적 AI 얼굴 랜드마크 분석에 빗대어 연출한 시뮬레이터입니다. 본 서비스가 해석하는 점괘 결과는 과학적 근거나 미래에 대한 사실을 보증하지 않으며, 재미와 조언을 구하는 엔터테인먼트적 용도로만 활용되어야 합니다. 이용자가 해당 분석 결과를 신뢰하여 결정한 법률적, 금융적, 의학적 판단에 대하여 당사는 책임을 지지 않습니다.</p>
                  <p><strong>제4조 (카메라 사용 안내)</strong> 실시간 카메라 스캔 및 미소 트레이닝을 위해 필요한 카메라 억세스는 오직 웹상에서의 실시간 렌더링에만 사용되며, 저장이나 유출의 위험이 없습니다.</p>
                </div>
              </div>
            )}

            {activeModal === 'adsense' && (
              <div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Award size={20} color="#39ff14" /> 고품질 서비스 준수 선언
                </h2>
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p><strong>1. 구글 애드센스 정책 센터 준수:</strong> 본 사이트는 사용자를 현혹하거나 광고 클릭을 유도하기 위해 고의로 중복 페이지를 개설하지 않으며, 하나의 집중된 단일 인터페이스 환경 내에서 투명하고 풍부한 콘텐츠를 전달합니다.</p>
                  <p><strong>2. 도어웨이 페이지 금지 및 오리지널리티:</strong> 단순히 키워드 상위 노출만을 위해 생성되는 도어웨이(Doorway) 페이지나 속임수 텍스트를 절대 사용하지 않습니다. WebAssembly 얼굴 감지 및 11대 특징점 판정 매칭이라는 독창적인 부가가치 서비스를 설계하여 제공합니다.</p>
                  <p><strong>3. 광고 구현의 균형 유지:</strong> 향후 광고가 도입되더라도 사용자의 콘텐츠 소비와 미소 트레이닝 인터랙션을 과도하게 방해하는 스패머성 배치를 하지 않을 것을 약속하며, 애드센스 네트워크 지침을 엄격히 준수합니다.</p>
                  <p><strong>4. 사용자 초점 원칙:</strong> "사용자에게 초점을 맞추면 나머지는 저절로 따라옵니다"라는 철학 하에, 안전하고 신뢰할 수 있는 사용자 최적화 웹 환경을 고수합니다.</p>
                </div>
              </div>
            )}

            <button 
              className="btn-primary" 
              onClick={() => setActiveModal(null)}
              style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}
            >
              확인 및 닫기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

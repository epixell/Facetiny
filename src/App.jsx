// src/App.jsx
import React, { useState, useEffect } from 'react';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { DEFAULT_FORTUNES } from './utils/defaultFortuneData';
import { Sparkles, Settings, Shield, FileText, ExternalLink, X, Award, Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function App() {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState('user'); // 'user' or 'admin'
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Automatic data migration on mount to inject complete rules if placeholders or missing English fields are detected
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
        
        // Check if English translation fields are missing in stored rules
        const isEnglishMissing = !parsed.some(r => r.name_en);

        // If placeholders are present, the core rule is missing, or English is missing, force reset to defaults with complete texts
        if (hasPlaceholders || isFaceAspectRuleMissing || isEnglishMissing) {
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
            Facetiny
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Sleek Glassmorphism Language Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              style={{
                fontSize: '0.8rem',
                padding: '8px 14px',
                display: 'inline-flex',
                gap: '6px',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.3)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              <Globe size={13} color="#00f2fe" />
              <span>
                {(() => {
                  if (i18n.language.startsWith('ko')) return '한국어';
                  if (i18n.language.startsWith('en')) return 'English';
                  if (i18n.language.startsWith('ja')) return '日本語';
                  if (i18n.language.startsWith('zh')) return '繁體中文';
                  return '한국어';
                })()}
              </span>
              <ChevronDown size={11} style={{ transform: isLangDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {isLangDropdownOpen && (
              <>
                {/* Backdrop to close when clicking outside */}
                <div 
                  onClick={() => setIsLangDropdownOpen(false)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '6px',
                    minWidth: '120px',
                    zIndex: 1000,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <button
                    onClick={() => {
                      i18n.changeLanguage('ko');
                      setIsLangDropdownOpen(false);
                    }}
                    style={{
                      background: i18n.language.startsWith('ko') ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
                      border: 'none',
                      color: i18n.language.startsWith('ko') ? '#00f2fe' : 'var(--text-secondary)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: i18n.language.startsWith('ko') ? '700' : '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!i18n.language.startsWith('ko')) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!i18n.language.startsWith('ko')) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    한국어
                  </button>
                  <button
                    onClick={() => {
                      i18n.changeLanguage('en');
                      setIsLangDropdownOpen(false);
                    }}
                    style={{
                      background: i18n.language.startsWith('en') ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
                      border: 'none',
                      color: i18n.language.startsWith('en') ? '#00f2fe' : 'var(--text-secondary)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: i18n.language.startsWith('en') ? '700' : '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!i18n.language.startsWith('en')) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!i18n.language.startsWith('en')) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    English
                  </button>
                  <button
                    onClick={() => {
                      i18n.changeLanguage('ja');
                      setIsLangDropdownOpen(false);
                    }}
                    style={{
                      background: i18n.language.startsWith('ja') ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
                      border: 'none',
                      color: i18n.language.startsWith('ja') ? '#00f2fe' : 'var(--text-secondary)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: i18n.language.startsWith('ja') ? '700' : '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!i18n.language.startsWith('ja')) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!i18n.language.startsWith('ja')) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    日本語
                  </button>
                  <button
                    onClick={() => {
                      i18n.changeLanguage('zh');
                      setIsLangDropdownOpen(false);
                    }}
                    style={{
                      background: i18n.language.startsWith('zh') ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
                      border: 'none',
                      color: i18n.language.startsWith('zh') ? '#00f2fe' : 'var(--text-secondary)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: i18n.language.startsWith('zh') ? '700' : '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!i18n.language.startsWith('zh')) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!i18n.language.startsWith('zh')) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    繁體中文
                  </button>
                </div>
              </>
            )}
          </div>

          <nav>
            {view === 'user' ? (
              <button 
                className="btn-secondary" 
                onClick={() => setView('admin')} 
                style={{ fontSize: '0.82rem', padding: '8px 16px', display: 'inline-flex', gap: '6px', alignItems: 'center' }}
              >
                <Settings size={14} /> {t('common.admin_settings')}
              </button>
            ) : (
              <button 
                className="btn-secondary" 
                onClick={() => setView('user')} 
                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              >
                {t('common.user_mode')}
              </button>
            )}
          </nav>
        </div>
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
              <span style={{ fontWeight: '700', color: '#fff' }}>Facetiny</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
              &copy; {new Date().getFullYear()} {t('common.copyright')}
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
              <Shield size={12} /> {t('common.privacy_policy')}
            </a>
            <a 
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <FileText size={12} /> {t('common.terms_of_service')}
            </a>
            <a 
              href="/adsense-policy.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Award size={12} /> {t('common.high_quality_declaration')}
            </a>
            <a 
              href="https://github.com/epixell/Facetiny" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg> {t('common.github')}
            </a>
          </div>
        </div>

        {/* References and Policy guidelines compliance notice */}
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '16px', gap: '10px' }}>
          <span>{t('common.disclaimer')}</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a 
              href="https://support.google.com/webmasters/answer/35769" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
            >
              {t('common.webmaster_guidelines')} <ExternalLink size={10} />
            </a>
            <a 
              href="https://support.google.com/adsense/answer/48182" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
            >
              {t('common.adsense_policies')} <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;

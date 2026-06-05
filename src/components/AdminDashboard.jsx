// src/components/AdminDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { initFaceLandmarker, calculateMetrics } from "../utils/mediaPipeHelper";
import { DEFAULT_METRICS, DEFAULT_FORTUNES, METRIC_PRESETS } from "../utils/defaultFortuneData";
import { Shield, Trash2, Edit, Plus, RefreshCw, X, Check, Camera, Upload, AlertTriangle } from "lucide-react";

export default function AdminDashboard({ onClose }) {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState("rules"); // 'rules' or 'test'
  const [rules, setRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  
  // Real-time camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const requestRef = useRef(null);

  // Load rules from localStorage on mount
  useEffect(() => {
    const savedRules = localStorage.getItem("lookalike_rules");
    if (savedRules) {
      setRules(JSON.parse(savedRules));
    } else {
      setRules(DEFAULT_FORTUNES);
      localStorage.setItem("lookalike_rules", JSON.stringify(DEFAULT_FORTUNES));
    }

    // Initialize MediaPipe Face Landmarker
    setLoadingAI(true);
    initFaceLandmarker()
      .then(landmarker => {
        setFaceLandmarker(landmarker);
        setLoadingAI(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingAI(false);
      });
  }, []);

  // Handle password auth
  const handleAuth = (e) => {
    e.preventDefault();
    if (password === "000000") {
      setIsAuthorized(true);
      setAuthError("");
    } else {
      setAuthError("비밀번호가 일치하지 않습니다.");
    }
  };

  const handleResetData = () => {
    if (window.confirm("모든 규칙설정을 초기 기본값으로 리셋하시겠습니까?")) {
      setRules(DEFAULT_FORTUNES);
      localStorage.setItem("lookalike_rules", JSON.stringify(DEFAULT_FORTUNES));
      alert("기본값으로 재설정되었습니다.");
    }
  };

  const handleDeleteRule = (id) => {
    if (window.confirm("이 분석 규칙을 정말 삭제하시겠습니까?")) {
      const updated = rules.filter(r => r.id !== id);
      setRules(updated);
      localStorage.setItem("lookalike_rules", JSON.stringify(updated));
    }
  };

  const handleSaveRule = (e) => {
    e.preventDefault();
    
    // Validate bounds
    let hasOverlap = false;
    // Simple validation could go here, but we keep it flexible
    
    let updatedRules;
    if (rules.some(r => r.id === editingRule.id)) {
      updatedRules = rules.map(r => r.id === editingRule.id ? editingRule : r);
    } else {
      updatedRules = [...rules, editingRule];
    }
    
    setRules(updatedRules);
    localStorage.setItem("lookalike_rules", JSON.stringify(updatedRules));
    setEditingRule(null);
  };

  const handleAddNewRule = () => {
    setEditingRule({
      id: "rule_" + Date.now(),
      name: "새로운 관상 규칙",
      metric: DEFAULT_METRICS[0].id,
      description: "규칙에 대한 설명입니다.",
      ranges: [
        {
          id: "range_" + Date.now() + "_1",
          label: "유형 1 (낮은 수치)",
          min: null,
          max: 0.0,
          love: "사랑운 내용...",
          wealth: "재물운 내용...",
          children: "자녀운 내용...",
          health: "건강운 내용...",
          advice: "개운법 내용..."
        }
      ]
    });
  };

  // Camera handling for AI test
  const startCamera = async () => {
    setIsCameraActive(true);
    setRealtimeMetrics(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        requestRef.current = requestAnimationFrame(detectFaceLoop);
      }
    } catch (err) {
      console.error("카메라 접근 실패:", err);
      alert("카메라를 켤 수 없습니다. 권한을 확인해주세요.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  };

  const detectFaceLoop = () => {
    if (!videoRef.current || !canvasRef.current || !faceLandmarker || videoRef.current.paused) {
      requestRef.current = requestAnimationFrame(detectFaceLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw frame mirrored for natural feel
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Run MediaPipe FaceLandmarker
      // Create a temporary canvas representing the mirrored frame for analysis so landmarks align correctly
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.translate(canvas.width, 0);
      tempCtx.scale(-1, 1);
      tempCtx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const result = faceLandmarker.detect(tempCanvas);
      if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
        const landmarks = result.faceLandmarks[0];
        
        // Draw landmarks
        ctx.fillStyle = "#00f2fe";
        ctx.strokeStyle = "rgba(79, 172, 254, 0.4)";
        ctx.lineWidth = 1;

        // Draw mesh lines for selected connections to look high-tech
        // To be fast, draw dots on critical landmarks
        landmarks.forEach((pt, index) => {
          // Draw every 5th point to keep canvas fast
          if (index % 4 === 0) {
            ctx.beginPath();
            ctx.arc((1 - pt.x) * canvas.width, pt.y * canvas.height, 1.5, 0, 2 * Math.PI);
            ctx.fill();
          }
        });

        // Highlight critical landmarks (Brow center 168, Nose tip 4)
        const drawHighlight = (idx, color) => {
          const pt = landmarks[idx];
          ctx.beginPath();
          ctx.arc((1 - pt.x) * canvas.width, pt.y * canvas.height, 4, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        };

        drawHighlight(168, "#ff007f"); // Brow
        drawHighlight(4, "#39ff14");   // Nose Tip

        // Calculate and set metrics
        const metrics = calculateMetrics(landmarks, canvas.width, canvas.height, tempCtx);
        setRealtimeMetrics(metrics);
      } else {
        setRealtimeMetrics(null);
      }
    }

    requestRef.current = requestAnimationFrame(detectFaceLoop);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !faceLandmarker) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const result = faceLandmarker.detect(canvas);
        if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
          const landmarks = result.faceLandmarks[0];

          // Draw landmarks
          ctx.fillStyle = "#00f2fe";
          landmarks.forEach((pt, idx) => {
            if (idx % 3 === 0) {
              ctx.beginPath();
              ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2, 0, 2 * Math.PI);
              ctx.fill();
            }
          });

          const metrics = calculateMetrics(landmarks, canvas.width, canvas.height, ctx);
          setRealtimeMetrics(metrics);
        } else {
          alert("얼굴을 감지하지 못했습니다. 선명한 정면 인물 사진을 사용해주세요.");
          setRealtimeMetrics(null);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Safe exit
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Passphrase form
  if (!isAuthorized) {
    return (
      <div className="flex-center" style={{ minHeight: "80vh" }}>
        <div className="glass-panel" style={{ padding: "40px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <Shield size={48} color="#4facfe" style={{ marginBottom: "20px" }} />
          <h2 style={{ marginBottom: "12px", fontSize: "1.6rem" }}>관리자 인증</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "24px" }}>
            관상 판정 규칙 및 운세 텍스트 수정을 위해 관리자 비밀번호를 입력해 주세요.
          </p>
          <form onSubmit={handleAuth}>
            <input
              type="password"
              className="glass-input"
              placeholder="비밀번호 입력 (기본: 000000)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "85%", marginBottom: "16px", textAlign: "center", fontSize: "1.1rem", letterSpacing: "4px" }}
              autoFocus
            />
            {authError && <div style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: "16px" }}>{authError}</div>}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>인증하기</button>
              <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: "10px 24px" }}>취소</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: "60px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "20px" }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "2rem", fontWeight: "700" }}>관상 기준 관리자 콘솔</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
            AI의 기하학 분석값과 매칭될 관상 12궁 및 운세 카테고리별 데이터베이스를 편집합니다.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn-secondary" onClick={handleResetData} style={{ color: "#f87171" }}>
            <RefreshCw size={16} /> 기본값 초기화
          </button>
          <button className="btn-secondary" onClick={onClose}>이전으로</button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        <button
          className={`btn-secondary ${activeTab === "rules" ? "pulse-glow-border" : ""}`}
          onClick={() => { stopCamera(); setActiveTab("rules"); }}
          style={{ background: activeTab === "rules" ? "rgba(79, 172, 254, 0.15)" : "" }}
        >
          관상 규칙 편집
        </button>
        <button
          className={`btn-secondary ${activeTab === "test" ? "pulse-glow-border" : ""}`}
          onClick={() => { setActiveTab("test"); }}
          style={{ background: activeTab === "test" ? "rgba(79, 172, 254, 0.15)" : "" }}
        >
          AI 실시간 스캔 테스트
        </button>
        <button
          className={`btn-secondary ${activeTab === "guide" ? "pulse-glow-border" : ""}`}
          onClick={() => { stopCamera(); setActiveTab("guide"); }}
          style={{ background: activeTab === "guide" ? "rgba(79, 172, 254, 0.15)" : "" }}
        >
          오행·기색 핵심 기준표
        </button>
      </div>

      {/* Editing Rule Dialog */}
      {editingRule && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="glass-panel" style={{ padding: "30px", maxWidth: "800px", width: "100%", maxHeight: "90vh", overflowY: "auto", border: "1px solid rgba(0, 242, 254, 0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.4rem" }}>관상 규칙 편집</h2>
              <button className="btn-secondary" onClick={() => setEditingRule(null)} style={{ padding: "6px" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRule}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>규칙 이름</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    style={{ width: "90%" }}
                    required
                  />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>매핑할 물리 지표</label>
                  <select
                    className="glass-input"
                    value={editingRule.metric}
                    onChange={(e) => setEditingRule({ ...editingRule, metric: e.target.value })}
                    style={{ width: "100%", padding: "12px", background: "var(--bg-secondary)", color: "#ffffff" }}
                  >
                    {DEFAULT_METRICS.map(m => (
                      <option key={m.id} value={m.id} style={{ background: "var(--bg-secondary)", color: "#ffffff" }}>{m.label} ({m.unit})</option>
                    ))}
                  </select>
                  {/* Dynamic Help Box for selected metric */}
                  {DEFAULT_METRICS.find(m => m.id === editingRule.metric) && (
                    <div style={{ marginTop: "12px", background: "rgba(0, 242, 254, 0.05)", border: "1px solid rgba(0, 242, 254, 0.15)", borderRadius: "10px", padding: "12px 16px", fontSize: "0.85rem", color: "var(--accent-blue)" }}>
                      <div style={{ fontWeight: "700", marginBottom: "4px", display: "flex", gap: "6px", alignItems: "center" }}>
                        <span>💡 수치 측정 기준:</span>
                        <span style={{ color: "#ffffff", fontWeight: "normal" }}>
                          {DEFAULT_METRICS.find(m => m.id === editingRule.metric).principle}
                        </span>
                      </div>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: "1.4", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "6px", marginTop: "6px" }}>
                        {DEFAULT_METRICS.find(m => m.id === editingRule.metric).description}
                      </div>
                      
                      {/* One-click preset loader button */}
                      {METRIC_PRESETS[editingRule.metric] && (
                        <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("이 지표의 대중적인 표준 임계값 및 기본 판정(3단계)을 불러오시겠습니까? 기존에 수정한 범위 수치와 라벨이 표준값으로 초기화됩니다.")) {
                                const preset = METRIC_PRESETS[editingRule.metric];
                                const newRanges = preset.map((p, idx) => ({
                                  id: "range_" + Date.now() + "_" + idx,
                                  label: p.label,
                                  min: p.min,
                                  max: p.max,
                                  love: editingRule.ranges[idx]?.love || "연애결혼운 내용...",
                                  wealth: editingRule.ranges[idx]?.wealth || "재물금전운 내용...",
                                  children: editingRule.ranges[idx]?.children || "자녀운 내용...",
                                  health: editingRule.ranges[idx]?.health || "건강운 내용...",
                                  advice: editingRule.ranges[idx]?.advice || "개운법 내용..."
                                }));
                                setEditingRule({ ...editingRule, ranges: newRanges });
                              }
                            }}
                            style={{ padding: "6px 12px", fontSize: "0.75rem", background: "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))", color: "#000", fontWeight: "600", border: "none", borderRadius: "8px", cursor: "pointer" }}
                          >
                            ✨ 표준 임계값(Preset) 자동 입력
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>규칙 설명</label>
                <textarea
                  className="glass-input"
                  rows={2}
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  style={{ width: "96%", resize: "none" }}
                />
              </div>

              {/* Range States */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "1.1rem" }}>판정 범위 및 운세 세팅</h3>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      const newRange = {
                        id: "range_" + Date.now(),
                        label: "유형 추가",
                        min: 0,
                        max: 10,
                        love: "", wealth: "", children: "", health: "", advice: ""
                      };
                      setEditingRule({ ...editingRule, ranges: [...editingRule.ranges, newRange] });
                    }}
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                  >
                    <Plus size={12} /> 판정 추가
                  </button>
                </div>

                {editingRule.ranges.map((range, index) => (
                  <div key={range.id} className="glass-panel" style={{ padding: "20px", marginBottom: "16px", borderLeft: "4px solid var(--accent-blue)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="유형 이름 (예: 처진 입꼬리)"
                        value={range.label}
                        onChange={(e) => {
                          const updated = editingRule.ranges.map(rg => rg.id === range.id ? { ...rg, label: e.target.value } : rg);
                          setEditingRule({ ...editingRule, ranges: updated });
                        }}
                        style={{ width: "40%", fontWeight: "600" }}
                      />
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => {
                          const updated = editingRule.ranges.filter(rg => rg.id !== range.id);
                          setEditingRule({ ...editingRule, ranges: updated });
                        }}
                        style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                      >
                        삭제
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>수치 범위:</span>
                      <input
                        type="number"
                        step="0.01"
                        className="glass-input"
                        placeholder="최솟값 (비워두면 음의 무한)"
                        value={range.min === null ? "" : range.min}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : parseFloat(e.target.value);
                          const updated = editingRule.ranges.map(rg => rg.id === range.id ? { ...rg, min: val } : rg);
                          setEditingRule({ ...editingRule, ranges: updated });
                        }}
                        style={{ width: "120px", padding: "6px 10px" }}
                      />
                      <span>~</span>
                      <input
                        type="number"
                        step="0.01"
                        className="glass-input"
                        placeholder="최댓값 (비워두면 양의 무한)"
                        value={range.max === null ? "" : range.max}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : parseFloat(e.target.value);
                          const updated = editingRule.ranges.map(rg => rg.id === range.id ? { ...rg, max: val } : rg);
                          setEditingRule({ ...editingRule, ranges: updated });
                        }}
                        style={{ width: "120px", padding: "6px 10px" }}
                      />
                      <span style={{ fontSize: "0.8rem", color: "var(--accent-blue)" }}>
                        * 선택된 수치의 단위 기준 ({DEFAULT_METRICS.find(m => m.id === editingRule.metric)?.unit || ""})
                      </span>
                    </div>

                    {/* Fortune Textareas */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>💕 연애·결혼운</label>
                        <textarea
                          className="glass-input"
                          rows={2}
                          value={range.love}
                          onChange={(e) => {
                            const updated = editingRule.ranges.map(rg => rg.id === range.id ? { ...rg, love: e.target.value } : rg);
                            setEditingRule({ ...editingRule, ranges: updated });
                          }}
                          style={{ width: "90%", fontSize: "0.8rem", marginTop: "4px" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>💰 재물·금전운</label>
                        <textarea
                          className="glass-input"
                          rows={2}
                          value={range.wealth}
                          onChange={(e) => {
                            const updated = editingRule.ranges.map(rg => rg.id === range.id ? { ...rg, wealth: e.target.value } : rg);
                            setEditingRule({ ...editingRule, ranges: updated });
                          }}
                          style={{ width: "90%", fontSize: "0.8rem", marginTop: "4px" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>👶 자녀운</label>
                        <textarea
                          className="glass-input"
                          rows={2}
                          value={range.children}
                          onChange={(e) => {
                            const updated = editingRule.ranges.map(rg => rg.id === range.id ? { ...rg, children: e.target.value } : rg);
                            setEditingRule({ ...editingRule, ranges: updated });
                          }}
                          style={{ width: "90%", fontSize: "0.8rem", marginTop: "4px" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>🏥 건강운</label>
                        <textarea
                          className="glass-input"
                          rows={2}
                          value={range.health}
                          onChange={(e) => {
                            const updated = editingRule.ranges.map(rg => rg.id === range.id ? { ...rg, health: e.target.value } : rg);
                            setEditingRule({ ...editingRule, ranges: updated });
                          }}
                          style={{ width: "90%", fontSize: "0.8rem", marginTop: "4px" }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>💡 개운법 (행동 지침)</label>
                      <textarea
                        className="glass-input"
                        rows={1}
                        value={range.advice}
                        onChange={(e) => {
                          const updated = editingRule.ranges.map(rg => rg.id === range.id ? { ...rg, advice: e.target.value } : rg);
                          setEditingRule({ ...editingRule, ranges: updated });
                        }}
                        style={{ width: "95%", fontSize: "0.8rem", marginTop: "4px" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setEditingRule(null)}>취소</button>
                <button type="submit" className="btn-primary">저장 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content - Rules List */}
      {activeTab === "rules" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>등록된 관상 분석 목록 ({rules.length})</h2>
            <button className="btn-primary" onClick={handleAddNewRule} style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
              <Plus size={16} /> 분석 규칙 추가
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
            {rules.map((rule) => {
              const matchedMetric = DEFAULT_METRICS.find(m => m.id === rule.metric);
              return (
                <div key={rule.id} className="glass-panel glass-panel-hover" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: "600" }}>{rule.name}</h3>
                      <span style={{ fontSize: "0.8rem", color: "var(--accent-blue)", background: "rgba(0,242,254,0.1)", padding: "2px 8px", borderRadius: "20px", display: "inline-block", marginTop: "4px" }}>
                        물리 지표: {matchedMetric?.label || rule.metric} ({matchedMetric?.unit})
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn-secondary" onClick={() => setEditingRule(JSON.parse(JSON.stringify(rule)))} style={{ padding: "6px 12px", fontSize: "0.85rem" }}>
                        <Edit size={14} /> 수정
                      </button>
                      <button className="btn-danger" onClick={() => handleDeleteRule(rule.id)} style={{ padding: "6px 12px", fontSize: "0.85rem" }}>
                        <Trash2 size={14} /> 삭제
                      </button>
                    </div>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "12px" }}>{rule.description}</p>
                  
                  {/* Miniature range previews */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {rule.ranges.map(rg => (
                      <span key={rg.id} style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", padding: "4px 8px", borderRadius: "6px" }}>
                        {rg.label} : {rg.min === null ? "-∞" : rg.min} ~ {rg.max === null ? "+∞" : rg.max}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content - Live scanning test dashboard */}
      {activeTab === "test" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          
          {/* Camera Scan Panel */}
          <div className="glass-panel" style={{ padding: "20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 style={{ marginBottom: "16px", alignSelf: "flex-start" }}>실시간 AI 데이터 디버거</h3>

            <div style={{ position: "relative", width: "100%", maxWidth: "480px", aspectRatio: "4/3", background: "#000", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--glass-border)" }}>
              {isCameraActive && <div className="scanning-line"></div>}
              
              <video
                ref={videoRef}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "none" }}
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />

              {loadingAI && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <RefreshCw className="pulse-glow-border" size={32} style={{ animation: "spin 2s linear infinite" }} />
                  <span style={{ fontSize: "0.9rem" }}>MediaPipe AI 엔진 시동 중...</span>
                </div>
              )}

              {!isCameraActive && !loadingAI && !realtimeMetrics && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
                  <button className="btn-primary" onClick={startCamera}>
                    <Camera size={18} /> 웹캠 디버거 시작
                  </button>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>또는 정면 사진 업로드:</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                  <button className="btn-secondary" onClick={() => fileInputRef.current.click()}>
                    <Upload size={16} /> 파일 업로드 테스트
                  </button>
                </div>
              )}
            </div>

            {isCameraActive && (
              <button className="btn-secondary" onClick={stopCamera} style={{ marginTop: "16px" }}>
                디버거 카메라 끄기
              </button>
            )}

            {/* If a photo has been uploaded, render the buttons below the image neatly */}
            {!isCameraActive && realtimeMetrics && (
              <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
                <button className="btn-primary" onClick={startCamera} style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                  <Camera size={14} /> 웹캠 켜기
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <button className="btn-secondary" onClick={() => fileInputRef.current.click()} style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                  <Upload size={14} /> 다른 사진 업로드
                </button>
              </div>
            )}
          </div>

          {/* Raw Values Panel */}
          <div className="glass-panel" style={{ padding: "20px", overflowY: "auto", maxHeight: "550px" }}>
            <h3 style={{ marginBottom: "16px" }}>추출된 기하학 및 기색 원시 값</h3>
            
            {realtimeMetrics ? (
              <div>
                {/* 5 Elements & derived values */}
                <div style={{ marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="glass-panel" style={{ padding: "12px", background: "rgba(0, 242, 254, 0.05)" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>삼정 비율 균형</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "700", marginTop: "4px" }}>
                      {Math.round(realtimeMetrics.derived.samjeong.sj)} : {Math.round(realtimeMetrics.derived.samjeong.jj)} : {Math.round(realtimeMetrics.derived.samjeong.hj)}
                    </div>
                  </div>
                  <div className="glass-panel" style={{ padding: "12px", background: "rgba(0, 242, 254, 0.05)" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>오악 깊이차 (평균)</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "700", marginTop: "4px" }}>
                      {realtimeMetrics.derived.peaks.averageZGap.toFixed(4)} ({realtimeMetrics.derived.peaks.status})
                    </div>
                  </div>
                  <div className="glass-panel" style={{ padding: "12px", background: "rgba(0, 242, 254, 0.05)" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>미간(명궁) 기색</div>
                    <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                      밝기: {realtimeMetrics.derived.stars.myeonggung.brightness}%, 붉은기: {realtimeMetrics.derived.stars.myeonggung.redFactor.toFixed(2)}
                    </div>
                  </div>
                  <div className="glass-panel" style={{ padding: "12px", background: "rgba(0, 242, 254, 0.05)" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>코끝(재백궁) 기색</div>
                    <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                      밝기: {realtimeMetrics.derived.stars.jaebaekgung.brightness}%, 붉은기: {realtimeMetrics.derived.stars.jaebaekgung.redFactor.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* 11 metrics values list */}
                <h4 style={{ fontSize: "0.95rem", marginBottom: "10px", color: "var(--accent-blue)" }}>11대 안면 물리 수치 실시간 계측</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {DEFAULT_METRICS.map(m => {
                    const value = realtimeMetrics.raw[m.id];
                    // Check if matched to any rule range
                    const matchingRule = rules.find(r => r.metric === m.id);
                    let matchedLabel = "매칭 상태 없음";
                    if (matchingRule && value !== undefined) {
                      const matchedRange = matchingRule.ranges.find(rg => {
                        return (rg.min === null || value >= rg.min) && (rg.max === null || value < rg.max);
                      });
                      if (matchedRange) matchedLabel = matchedRange.label;
                    }

                    return (
                      <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "6px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: "500" }}>{m.label}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{matchedLabel}</div>
                        </div>
                        <div style={{ fontSize: "1.05rem", fontWeight: "700", fontFamily: "monospace", color: "#39ff14" }}>
                          {value.toFixed(value < 0.2 ? 4 : 2)}{m.unit !== "비율" && m.unit !== "각도지수" ? m.unit : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", color: "var(--text-secondary)", gap: "10px" }}>
                <AlertTriangle size={32} />
                <span>데이터가 없습니다. 스캐너를 켜주세요.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content - Core AI Standards Guide */}
      {activeTab === "guide" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* 오행 및 체질 */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h2 className="text-gradient" style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "12px" }}>🪐 1. 음양오행 체질 감별 기준 (얼굴 윤곽)</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
              얼굴의 전체 가로세로 비율(aspect ratio)과 귀밑 턱 각도 너비(jaw sharpness)를 비교하여 자연계 오행 속성으로 분류합니다.
            </p>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", padding: "16px", borderRadius: "12px" }}>
                <h4 style={{ color: "var(--accent-blue)", marginBottom: "6px" }}>🌲 목(木)형 (지성/명예)</h4>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  <strong>형태:</strong> 세로로 길고 갸름함<br/>
                  <strong>AI 수식 조건:</strong><br/>
                  가로세로 비율 &lt; 0.80 및 턱선이 갸름함
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", padding: "16px", borderRadius: "12px" }}>
                <h4 style={{ color: "var(--accent-purple)", marginBottom: "6px" }}>🔥 화(火)형 (열정/다혈질)</h4>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  <strong>형태:</strong> 역삼각형 또는 삼각형<br/>
                  <strong>AI 수식 조건:</strong><br/>
                  턱 너비 비율 &lt; 0.74 (턱 끝이 매우 뾰족)
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", padding: "16px", borderRadius: "12px" }}>
                <h4 style={{ color: "#eab308", marginBottom: "6px" }}>⛰️ 토(土)형 (신용/묵직함)</h4>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  <strong>형태:</strong> 두툼하고 살집 있는 사각<br/>
                  <strong>AI 수식 조건:</strong><br/>
                  가로세로비 &ge; 0.82 및 턱 넓이 &ge; 0.81
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", padding: "16px", borderRadius: "12px" }}>
                <h4 style={{ color: "#cbd5e1", marginBottom: "6px" }}>⚡ 금(金)형 (결단력/의리)</h4>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  <strong>형태:</strong> 광대/턱뼈가 발달한 사각<br/>
                  <strong>AI 수식 조건:</strong><br/>
                  가로세로 0.77~0.83 사이 및 턱뼈 발달(&ge; 0.83)
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", padding: "16px", borderRadius: "12px" }}>
                <h4 style={{ color: "#39ff14", marginBottom: "6px" }}>💧 수(水)형 (융통성/재물운)</h4>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  <strong>형태:</strong> 둥글둥글하고 통통한 얼굴<br/>
                  <strong>AI 수식 조건:</strong><br/>
                  가로세로 비율 &ge; 0.84 및 부드러운 U자 턱
                </div>
              </div>
            </div>
          </div>

          {/* 삼정과 오악 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            
            {/* 삼정 */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <h3 className="text-gradient" style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "8px" }}>⚖️ 2. 삼정 비율 균형도 (초년·중년·말년)</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "12px" }}>
                얼굴을 세로로 3등분하여 각각의 랜드마크 Y축 거리 비율을 황금비(33.3% 평행)와 비교해 균형 점수를 매깁니다.
              </p>
              <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse", color: "var(--text-secondary)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#fff" }}>구분</th>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#fff" }}>연동 부위 (랜드마크 번호)</th>
                    <th style={{ textAlign: "left", padding: "8px 0", color: "#fff" }}>의미</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "8px 0", color: "var(--accent-pink)" }}>상정 (초년)</td>
                    <td style={{ padding: "8px 0" }}>이마 위 10번 ~ 미간 168번</td>
                    <td style={{ padding: "8px 0" }}>부모복, 지혜, 초년운 (~30세)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "8px 0", color: "var(--accent-blue)" }}>중정 (중년)</td>
                    <td style={{ padding: "8px 0" }}>미간 168번 ~ 코끝 4번</td>
                    <td style={{ padding: "8px 0" }}>자존심, 의지, 청장년운 (31~50세)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", color: "#39ff14" }}>하정 (말년)</td>
                    <td style={{ padding: "8px 0" }}>코끝 4번 ~ 턱끝 152번</td>
                    <td style={{ padding: "8px 0" }}>인덕, 부하복, 말년운 (51세~)</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.02)", padding: "8px", borderRadius: "6px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <strong>점수 연산:</strong> 100 - (절대 오차 합계 &times; 2.5) ➔ 1:1:1 비율에 수렴할수록 대길(大吉) 판정.
              </div>
            </div>

            {/* 오악 */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <h3 className="text-gradient" style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "8px" }}>🏔️ 3. 오악 Z축 균형도 (3D 안면 입체감)</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "12px" }}>
                3D 안면 카메라 깊이 데이터(Z축)를 추출하여, 코(중악)와 사방의 봉우리(이마, 턱, 양 광대)가 서로를 호위하는지 측정합니다.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "4px" }}>
                  <span style={{ color: "#fff" }}>고봉고산 (孤峰孤山)</span>
                  <span>평균 깊이차 &gt; 0.14</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", paddingLeft: "10px", marginBottom: "4px" }}>
                  코만 너무 우뚝 솟아 주변이 꺼진 형상. 명예는 있으나 대인관계가 외롭고 고독할 관상.
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "4px" }}>
                  <span style={{ color: "#fff" }}>오악조화 (호위)</span>
                  <span>평균 깊이차 0.06 ~ 0.14</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", paddingLeft: "10px", marginBottom: "4px" }}>
                  코를 중심으로 이마, 광대, 턱이 조화롭게 감싸주는 형상. 인덕이 많고 재물이 오래 보존됨.
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "4px" }}>
                  <span style={{ color: "#fff" }}>평평함 (입체감 부족)</span>
                  <span>평균 깊이차 &lt; 0.06</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", paddingLeft: "10px" }}>
                  굴곡이 적고 밋밋하여 성실하나 사회적 주도력을 펼치기에는 다소 소극적인 형상.
                </div>
              </div>
            </div>
          </div>

          {/* 오성육요 기색 */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h2 className="text-gradient" style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "12px" }}>✨ 4. 오성육요 안색 기색 분석 (실시간 픽셀 색상 진단)</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
              카메라 스캔 시점의 미간(명궁-168)과 코끝(재백궁-4) 부위의 5x5 픽셀의 평균 색채 밝기(Luminance)와 적색 비율(R/G)을 계산해 운세의 즉각적인 맑고 탁함을 진단합니다.
            </p>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", padding: "16px", borderRadius: "12px" }}>
                <h4 style={{ color: "var(--accent-blue)", marginBottom: "8px" }}>미간 기색 (명궁: 정신과 선천운)</h4>
                <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li><strong>붉은 기색 (적색도 &gt; 1.35)</strong>: 미간에 붉은 화기가 돌아 정신이 혼란스럽거나 번뇌, 질병이 있을 징조.</li>
                  <li><strong>맑고 빛나는 기색 (밝기 &gt; 78%)</strong>: 거울처럼 윤이 나며 맑음. 문서운, 명예운이 급상승해 시험 승진의 경사 징조.</li>
                  <li><strong>평온한 기색 (기본 범위)</strong>: 안색이 안정되어 신체 리듬과 정신이 평온한 상태.</li>
                </ul>
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", padding: "16px", borderRadius: "12px" }}>
                <h4 style={{ color: "#39ff14", marginBottom: "8px" }}>코끝 기색 (재백궁: 금전과 식복)</h4>
                <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li><strong>붉은 기색 (적색도 &gt; 1.35)</strong>: 코끝이 붉음(적비). 투기 실패, 예기치 못한 도난이나 벌금 등 지출 유실 경고.</li>
                  <li><strong>맑고 빛나는 기색 (밝기 &gt; 78%)</strong>: 코끝에 노랗고 뽀얀 황금빛 윤기가 돎. 추진 중인 거래가 성사되고 횡재수가 따름.</li>
                  <li><strong>평온한 기색 (기본 범위)</strong>: 콧날 색상이 깨끗하여 불필요한 과소비가 제어되고 지갑이 굳건한 상태.</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// src/components/UserDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { initFaceLandmarker, calculateMetrics } from "../utils/mediaPipeHelper";
import { DEFAULT_FORTUNES } from "../utils/defaultFortuneData";
import { evaluateRules, generateFortuneReport } from "../utils/similarity";
import { Camera, Upload, RefreshCw, Heart, DollarSign, Users, Activity, Sparkles, Smile, CheckCircle, ArrowRight, Settings, X, Shield, BookOpen } from "lucide-react";
import { BLOG_ARTICLES } from "../utils/blogData";
import { evaluateCompatibility } from "../utils/compatibility";

export default function UserDashboard({ onOpenAdmin }) {
  const [activeTab, setActiveTab] = useState("personal");
  const [coupleSlotA, setCoupleSlotA] = useState(null);
  const [coupleSlotB, setCoupleSlotB] = useState(null);
  const [partnerSlotA, setPartnerSlotA] = useState(null);
  const [partnerSlotB, setPartnerSlotB] = useState(null);
  const [compatStep, setCompatStep] = useState("input"); // 'input', 'loading', 'result'
  const [compatReport, setCompatReport] = useState(null);
  const [activeCameraSlot, setActiveCameraSlot] = useState(null); // 'coupleA', 'coupleB', etc.
  const [selectedArticle, setSelectedArticle] = useState(null);

  const [step, setStep] = useState("init"); // 'init', 'scan', 'loading', 'result'
  const [scanMode, setScanMode] = useState(""); // 'camera' or 'file'
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [loadingEngine, setLoadingEngine] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  
  // Scanned results
  const [finalReport, setFinalReport] = useState(null);
  const [activeFortuneTab, setActiveFortuneTab] = useState("love"); // love, wealth, children, health

  // Interactive Smile Mission State
  const [smileMissionActive, setSmileMissionActive] = useState(false);
  const [smileIntensity, setSmileIntensity] = useState(0);
  const [smileSuccess, setSmileSuccess] = useState(false);
  const [smileHoldCounter, setSmileHoldCounter] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const requestRef = useRef(null);
  const resultCanvasRef = useRef(null);

  // Initialize AI engine
  useEffect(() => {
    setLoadingEngine(true);
    initFaceLandmarker()
      .then(landmarker => {
        setFaceLandmarker(landmarker);
        setLoadingEngine(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingEngine(false);
      });
  }, []);

  const startCamera = async () => {
    setStep("scan");
    setScanMode("camera");
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          requestRef.current = requestAnimationFrame(detectLoop);
        }
      } catch (err) {
        console.error(err);
        alert("카메라 사용 권한이 필요합니다.");
        setStep("init");
      }
    }, 100);
  };

  const handleFileUploadClick = () => {
    setScanMode("file");
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !faceLandmarker) return;

    setStep("loading");
    setLoadingStatus("얼굴 랜드마크 분석 중...");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create matching canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        setLoadingStatus("이목구비 기하학 수치 환산 중...");
        setTimeout(() => {
          const result = faceLandmarker.detect(canvas);
          if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
            const landmarks = result.faceLandmarks[0];
            
            setLoadingStatus("명궁 및 재백궁 피부 기색 샘플링 중...");
            setTimeout(() => {
              const rawMetrics = calculateMetrics(landmarks, canvas.width, canvas.height, ctx);
              
              // Load custom rules from localStorage
              const savedRules = localStorage.getItem("lookalike_rules");
              const activeRules = savedRules ? JSON.parse(savedRules) : DEFAULT_FORTUNES;

              const matchedRules = evaluateRules(rawMetrics.raw, activeRules);
              const report = generateFortuneReport(rawMetrics, matchedRules);
              
              // Keep image thumbnail for results
              const thumbnailCanvas = document.createElement("canvas");
              const thumbCtx = thumbnailCanvas.getContext("2d");
              thumbnailCanvas.width = 180;
              thumbnailCanvas.height = 180;
              // Center crop face roughly
              const p4 = landmarks[4]; // nose tip
              const cropSize = Math.max(img.width, img.height) * 0.45;
              const sx = Math.max(0, p4.x * img.width - cropSize / 2);
              const sy = Math.max(0, p4.y * img.height - cropSize / 2);
              thumbCtx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 180, 180);
              
              setFinalReport({
                ...report,
                imageUrl: thumbnailCanvas.toDataURL()
              });
              setStep("result");
            }, 600);
          } else {
            alert("얼굴 인식을 완료하지 못했습니다. 조명이 밝고 선명한 인물 정면 사진을 이용해주세요.");
            setStep("init");
          }
        }, 500);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const detectLoop = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.paused) {
      requestRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Mirror video for standard selfie feel
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    requestRef.current = requestAnimationFrame(detectLoop);
  };

  const handleCapture = () => {
    if (!videoRef.current || !faceLandmarker) return;

    // Transition to loading
    stopCameraLoop();
    setStep("loading");
    setLoadingStatus("얼굴 랜드마크 분석 중...");

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Mirror image drawing
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setLoadingStatus("이목구비 기하학 수치 환산 중...");
    setTimeout(() => {
      const result = faceLandmarker.detect(canvas);
      if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
        const landmarks = result.faceLandmarks[0];

        setLoadingStatus("명궁 및 재백궁 피부 기색 샘플링 중...");
        setTimeout(() => {
          const rawMetrics = calculateMetrics(landmarks, canvas.width, canvas.height, ctx);
          
          // Load custom rules from localStorage
          const savedRules = localStorage.getItem("lookalike_rules");
          const activeRules = savedRules ? JSON.parse(savedRules) : DEFAULT_FORTUNES;

          const matchedRules = evaluateRules(rawMetrics.raw, activeRules);
          const report = generateFortuneReport(rawMetrics, matchedRules);

          // Get face cropped image
          const thumbnailCanvas = document.createElement("canvas");
          const thumbCtx = thumbnailCanvas.getContext("2d");
          thumbnailCanvas.width = 180;
          thumbnailCanvas.height = 180;
          const p4 = landmarks[4];
          const cropSize = Math.max(canvas.width, canvas.height) * 0.45;
          const sx = Math.max(0, p4.x * canvas.width - cropSize / 2);
          const sy = Math.max(0, p4.y * canvas.height - cropSize / 2);
          thumbCtx.drawImage(canvas, sx, sy, cropSize, cropSize, 0, 0, 180, 180);

          setFinalReport({
            ...report,
            imageUrl: thumbnailCanvas.toDataURL()
          });
          setStep("result");
        }, 600);
      } else {
        alert("얼굴 인식을 실패했습니다. 밝은 조명 아래에서 정면을 응시해 주세요.");
        startCamera();
      }
    }, 500);
  };

  const stopCameraLoop = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  };

  // Safe cleaner
  useEffect(() => {
    return () => {
      stopCameraLoop();
    };
  }, []);

  // --- TWO PERSON COMPATIBILITY HELPERS ---
  const startSlotCamera = async (slotId) => {
    setActiveCameraSlot(slotId);
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          requestRef.current = requestAnimationFrame(detectSlotLoop);
        }
      } catch (err) {
        console.error(err);
        alert("카메라 사용 권한이 필요합니다.");
        setActiveCameraSlot(null);
      }
    }, 100);
  };

  const detectSlotLoop = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.paused) {
      requestRef.current = requestAnimationFrame(detectSlotLoop);
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    requestRef.current = requestAnimationFrame(detectSlotLoop);
  };

  const captureSlotPhoto = () => {
    if (!videoRef.current || !faceLandmarker) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    stopCameraLoop();
    
    const result = faceLandmarker.detect(canvas);
    if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
      const landmarks = result.faceLandmarks[0];
      const rawMetrics = calculateMetrics(landmarks, canvas.width, canvas.height, ctx);
      
      const thumbnailCanvas = document.createElement("canvas");
      const thumbCtx = thumbnailCanvas.getContext("2d");
      thumbnailCanvas.width = 180;
      thumbnailCanvas.height = 180;
      const p4 = landmarks[4];
      const cropSize = Math.max(canvas.width, canvas.height) * 0.45;
      const sx = Math.max(0, p4.x * canvas.width - cropSize / 2);
      const sy = Math.max(0, p4.y * canvas.height - cropSize / 2);
      thumbCtx.drawImage(canvas, sx, sy, cropSize, cropSize, 0, 0, 180, 180);

      const slotData = {
        image: canvas.toDataURL(),
        landmarks: landmarks,
        metrics: rawMetrics.raw,
        thumbnail: thumbnailCanvas.toDataURL()
      };

      updateSlotState(activeCameraSlot, slotData);
      setActiveCameraSlot(null);
    } else {
      alert("얼굴 인식을 완료하지 못했습니다. 얼굴이 정면에 밝게 비치도록 조정한 후 다시 촬영해 주세요.");
      startSlotCamera(activeCameraSlot);
    }
  };

  const handleSlotFileUpload = (slotId, file) => {
    if (!file || !faceLandmarker) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const result = faceLandmarker.detect(canvas);
        if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
          const landmarks = result.faceLandmarks[0];
          const rawMetrics = calculateMetrics(landmarks, canvas.width, canvas.height, ctx);

          const thumbnailCanvas = document.createElement("canvas");
          const thumbCtx = thumbnailCanvas.getContext("2d");
          thumbnailCanvas.width = 180;
          thumbnailCanvas.height = 180;
          const p4 = landmarks[4];
          const cropSize = Math.max(img.width, img.height) * 0.45;
          const sx = Math.max(0, p4.x * img.width - cropSize / 2);
          const sy = Math.max(0, p4.y * img.height - cropSize / 2);
          thumbCtx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 180, 180);

          const slotData = {
            image: canvas.toDataURL(),
            landmarks: landmarks,
            metrics: rawMetrics.raw,
            thumbnail: thumbnailCanvas.toDataURL()
          };
          updateSlotState(slotId, slotData);
        } else {
          alert("사진에서 얼굴을 인식하지 못했습니다. 선명한 얼굴 정면 사진을 이용해주세요.");
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const updateSlotState = (slotId, data) => {
    if (slotId === 'coupleA') setCoupleSlotA(data);
    if (slotId === 'coupleB') setCoupleSlotB(data);
    if (slotId === 'partnerA') setPartnerSlotA(data);
    if (slotId === 'partnerB') setPartnerSlotB(data);
  };

  const runCompatibilityAnalysis = (type) => {
    const slotA = type === 'couple' ? coupleSlotA : partnerSlotA;
    const slotB = type === 'couple' ? coupleSlotB : partnerSlotB;

    if (!slotA || !slotB) return;

    setCompatStep("loading");
    setLoadingStatus("두 사람의 안면 기하학 데이터 결합 중...");

    setTimeout(() => {
      setLoadingStatus("오행 상생상극 체질 융합 매칭 중...");
      setTimeout(() => {
        const report = evaluateCompatibility(slotA.metrics, slotB.metrics, type);
        setCompatReport(report);
        setCompatStep("result");
      }, 800);
    }, 800);
  };

  const resetCompatibility = (type) => {
    if (type === 'couple') {
      setCoupleSlotA(null);
      setCoupleSlotB(null);
    } else {
      setPartnerSlotA(null);
      setPartnerSlotB(null);
    }
    setCompatReport(null);
    setCompatStep("input");
  };

  const isActiveColorRgb = (tabId) => {
    if (tabId === 'personal') return "0, 242, 254";
    if (tabId === 'couple') return "248, 87, 166";
    if (tabId === 'partner') return "57, 255, 20";
    if (tabId === 'blog') return "79, 172, 254";
    return "255, 255, 255";
  };

  // --- INTERACTIVE SMILE MISSION LOOP ---
  const startSmileMission = async () => {
    setSmileMissionActive(true);
    setSmileSuccess(false);
    setSmileIntensity(0);
    setSmileHoldCounter(0);

    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 400, height: 300 }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          requestRef.current = requestAnimationFrame(smileMissionLoop);
        }
      } catch (err) {
        console.error(err);
        alert("미션을 위해 카메라 권한이 필요합니다.");
        setSmileMissionActive(false);
      }
    }, 100);
  };

  const stopSmileMission = () => {
    setSmileMissionActive(false);
    stopCameraLoop();
  };

  const smileMissionLoop = () => {
    if (!videoRef.current || !canvasRef.current || !faceLandmarker || videoRef.current.paused) {
      requestRef.current = requestAnimationFrame(smileMissionLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw mirrored frame
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      const analysisCanvas = document.createElement("canvas");
      analysisCanvas.width = canvas.width;
      analysisCanvas.height = canvas.height;
      const analysisCtx = analysisCanvas.getContext("2d");
      analysisCtx.translate(canvas.width, 0);
      analysisCtx.scale(-1, 1);
      analysisCtx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const result = faceLandmarker.detect(analysisCanvas);
      if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
        const landmarks = result.faceLandmarks[0];
        
        // Calculate metrics focusing on mouth corners
        const rawMetrics = calculateMetrics(landmarks, canvas.width, canvas.height, analysisCtx);
        const slant = rawMetrics.raw.mouth_corner_slant; // Typical ranges: -0.10 to +0.15

        // Scale slant to 0-100 intensity scale
        // -0.02 is 0%, 0.08 is 100%
        let intensity = Math.round(((slant + 0.02) / 0.10) * 100);
        intensity = Math.max(0, Math.min(100, intensity));
        setSmileIntensity(intensity);

        // Draw mouth points
        ctx.fillStyle = "#39ff14";
        // Mouth corners landmarks: 61, 291, 0, 17
        [61, 291, 0, 17].forEach(idx => {
          const pt = landmarks[idx];
          ctx.beginPath();
          ctx.arc((1 - pt.x) * canvas.width, pt.y * canvas.height, 4, 0, 2 * Math.PI);
          ctx.fill();
        });

        // If smile intensity is high enough, increment hold counter
        if (intensity >= 70) {
          setSmileHoldCounter(prev => {
            const next = prev + 1;
            if (next >= 60) { // ~2 seconds at 30fps
              setSmileSuccess(true);
              stopCameraLoop();
            }
            return next;
          });
        } else {
          setSmileHoldCounter(0);
        }
      }
    }

    if (!smileSuccess) {
      requestRef.current = requestAnimationFrame(smileMissionLoop);
    }
  };

  // --- RENDERING VIEWS ---

  const renderPersonalInit = () => {
    return (
      <div className="flex-center" style={{ minHeight: "80vh", flexDirection: "column", padding: "0 10px" }}>
        
        {/* Decorative elements */}
        <div style={{ position: "absolute", top: "15%", left: "10%", width: "250px", height: "250px", background: "var(--accent-purple)", filter: "blur(150px)", opacity: 0.15, borderRadius: "50%", zIndex: -1 }}></div>
        <div style={{ position: "absolute", bottom: "15%", right: "10%", width: "300px", height: "300px", background: "var(--accent-blue)", filter: "blur(180px)", opacity: 0.15, borderRadius: "50%", zIndex: -1 }}></div>

        <div style={{ textAlign: "center", marginBottom: "40px", maxWidth: "600px" }}>
          <div style={{ display: "inline-flex", padding: "6px 16px", background: "rgba(0, 242, 254, 0.1)", border: "1px solid rgba(0, 242, 254, 0.2)", borderRadius: "30px", gap: "8px", alignItems: "center", marginBottom: "16px" }}>
            <Sparkles size={14} color="#00f2fe" />
            <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#00f2fe" }}>최첨단 안면 인식 기술 기반</span>
          </div>
          <h1 style={{ fontSize: "3.2rem", fontWeight: "900", lineHeight: "1.1", marginBottom: "16px" }}>
            AI 신비한 <span className="text-gradient">관상 점보기</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
            얼굴의 468개 특징점 기하학 비율과 미간/코끝의 피부 기색(빛깔)을 분석하여 오행 체질 및 4대 운세를 해석합니다.
          </p>
        </div>

        {loadingEngine ? (
          <div className="glass-panel" style={{ padding: "30px", display: "flex", alignItems: "center", gap: "16px", maxWidth: "360px" }}>
            <RefreshCw size={24} style={{ animation: "spin 2s linear infinite" }} color="#4facfe" />
            <span>초기 AI 스캔 엔진을 가동하는 중...</span>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "580px", width: "100%" }}>
            
            {/* Card 1: Webcam */}
            <div
              className="glass-panel glass-panel-hover"
              onClick={startCamera}
              style={{ padding: "30px", textAlign: "center", cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex-center" style={{ width: "56px", height: "56px", background: "rgba(0, 242, 254, 0.1)", borderRadius: "16px", margin: "0 auto 20px auto" }}>
                <Camera size={26} color="#00f2fe" />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>실시간 카메라 스캔</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                웹캠을 활성화하여 실시간 안면 인식 그물망으로 얼굴 비율을 분석합니다.
              </p>
            </div>

            {/* Card 2: File Upload */}
            <div
              className="glass-panel glass-panel-hover"
              onClick={handleFileUploadClick}
              style={{ padding: "30px", textAlign: "center", cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex-center" style={{ width: "56px", height: "56px", background: "rgba(79, 172, 254, 0.1)", borderRadius: "16px", margin: "0 auto 20px auto" }}>
                <Upload size={26} color="#4facfe" />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>정면 얼굴 사진 올리기</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                저장된 사진 파일(JPG/PNG)을 업로드해 1회 정밀 스캔을 실행합니다.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
          </div>
        )}

        {/* E-E-A-T & Privacy Assurance Section */}
        <div style={{ marginTop: "50px", maxWidth: "680px", width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Privacy / Safety Card */}
          <div className="glass-panel" style={{ padding: "24px", display: "flex", gap: "16px", alignItems: "flex-start", border: "1px solid rgba(0, 242, 254, 0.15)", background: "rgba(0, 242, 254, 0.02)" }}>
            <div className="flex-center" style={{ width: "44px", height: "44px", background: "rgba(0, 242, 254, 0.1)", borderRadius: "50%", flexShrink: 0, marginTop: "2px" }}>
              <Shield size={20} color="#00f2fe" />
            </div>
            <div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#fff", marginBottom: "6px" }}>개인정보 및 생체 데이터 프라이버시 안심 선언</h4>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Facetiny는 사용자의 얼굴 이미지나 비디오 데이터를 <strong>서버로 전송하거나 저장하지 않습니다.</strong> 모든 인공지능 분석은 기기(클라이언트 브라우저) 내부에서 WebAssembly 기반 MediaPipe 엔진을 통해 <strong>100% 로컬</strong>로만 처리되며 분석 즉시 휘발됩니다.
              </p>
            </div>
          </div>

          {/* AI Physiognomy Principles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            
            <div className="glass-panel" style={{ padding: "16px", border: "1px solid rgba(255, 255, 255, 0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Sparkles size={12} color="#f857a6" />
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#fff" }}>오행체질 (五行體質) 진단</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                동양 상학의 《오행학설(五行學說)》에 의거, 얼굴형의 가로세로 비율과 주요 모서리의 곡률을 계측하여 목(木), 화(火), 토(土), 금(金), 수(水) 고유 체질을 판별합니다.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "16px", border: "1px solid rgba(255, 255, 255, 0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Activity size={12} color="#39ff14" />
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#fff" }}>삼정비율 (三停均衡) 계측</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                전통 《삼정상법(三停相法)》에 기술된 상정(이마), 중정(눈썹~코끝), 하정(턱끝)의 Y축 비율 대칭성을 정밀 진단하여 초년·중년·말년의 조화로운 균형을 분석합니다.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "16px", border: "1px solid rgba(255, 255, 255, 0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Sparkles size={12} color="var(--accent-purple)" />
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#fff" }}>오악조응 (五岳) 입체 분석</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                얼굴의 5대 산봉우리인 이마(남악), 턱(북악), 광대(동·서악), 코(중악)의 Z축 깊이 격차(Z-Gap)를 계측하여, 코를 중심으로 주변 뼈대들이 조응하며 호위하는지 입체 판정합니다.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "16px", border: "1px solid rgba(255, 255, 255, 0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Smile size={12} color="#00f2fe" />
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#fff" }}>기색판정 (氣色判定) 샘플링</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                전통 《기색론(氣色論)》에 기반하여 운기가 집중되는 명궁(미간)과 재백궁(코끝) 주위의 HSL 명도 조도를 샘플링하여 현재 안색의 맑음과 운기를 진단합니다.
              </p>
            </div>

          </div>

          {/* FAQ Accordion Section */}
          <div style={{ marginTop: "30px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#fff", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="#00f2fe" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> 자주 묻는 질문 & 학술 가이드 (FAQ)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                {
                  q: "AI 관상은 어떤 방식으로 측정되나요?",
                  a: "Facetiny는 Google의 실시간 안면 인식 머신러닝 엔진(MediaPipe Face Landmarker)을 활용하여 사용자의 얼굴에서 468개의 3D 좌표를 실시간으로 계측합니다. 이를 통해 이마, 코, 턱, 광대의 기하학적 비대칭도 및 깊이(Z값)를 계측하고, 미간과 코끝 픽셀의 평균 HSL 조도와 밝기(기색)를 분석해 오행체질과 4대 운세 텍스트와 매칭합니다."
                },
                {
                  q: "분석을 위한 얼굴 사진은 안전하게 보호되나요?",
                  a: "예, 100% 안전합니다. Facetiny는 사용자의 비디오 프레임이나 업로드된 사진 파일을 외부 서버로 단 1바이트도 전송하지 않습니다. 모든 AI 인식 연산은 사용자의 웹 브라우저 내부(클라이언트사이드)에서 WebAssembly 컴파일 기술로 구동되어 완전히 로컬에서 종결되며, 탭을 닫거나 분석이 끝나면 즉시 메모리에서 영구히 삭제됩니다."
                },
                {
                  q: "오행체질과 삼정비율의 전통학적 근거는 무엇인가요?",
                  a: "본 서비스는 전통 동양 상학의 핵심 경전인 《마의상법(麻衣相法)》, 《오행상설(五行學說)》, 《삼정상법(三停相法)》 등에 기술된 얼굴형 분류 및 대칭 구조 이론을 기반으로 설계되었습니다. 과거 선현들이 누적한 인상학적 지표들을 정량 수치로 환산하여 매칭을 제공합니다."
                },
                {
                  q: "관상 진단 결과를 전적으로 신뢰해야 하나요?",
                  a: "아닙니다. 전통 관상학 및 인상론은 오랜 역사 동안 통계적 관찰로 축적된 지혜이나 과학적 근거를 담보하지 않습니다. 본 서비스의 결과 카드는 인생에 긍정적인 마음가짐을 가지고 건강한 생활 습관을 유지하도록 조언해 드리는 재미 및 조언 용도(Entertainment)로만 받아들이시기 바랍니다."
                }
              ].map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="glass-panel" style={{ overflow: "hidden", border: isOpen ? "1px solid rgba(0, 242, 254, 0.2)" : "1px solid rgba(255, 255, 255, 0.05)", transition: "all 0.2s ease", borderRadius: "12px" }}>
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      style={{ width: "100%", background: "none", border: "none", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", color: "#fff", textAlign: "left" }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{faq.q}</span>
                      <svg 
                        viewBox="0 0 24 24" 
                        width="14" 
                        height="14" 
                        stroke="#00f2fe" 
                        strokeWidth="2.5" 
                        fill="none" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        style={{ transition: "transform 0.2s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0)", flexShrink: 0 }}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 20px 16px 20px", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.6", borderTop: "1px solid rgba(255, 255, 255, 0.02)", paddingTop: "12px" }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings Button */}
        <div style={{ marginTop: "30px", marginBottom: "20px" }}>
          <button 
            onClick={onOpenAdmin} 
            style={{ opacity: 0.5, border: "none", background: "none", cursor: "pointer", display: "inline-flex", gap: "6px", alignItems: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}
          >
            <Settings size={12} /> 관리자 설정
          </button>
        </div>

      </div>
    );
  };

  const renderPersonalScan = () => {
    return (
      <div className="flex-center" style={{ minHeight: "85vh", flexDirection: "column" }}>
        <h2 style={{ marginBottom: "20px" }}>가이드 라인에 맞추어 주십시오</h2>
        
        <div style={{ position: "relative", width: "100%", maxWidth: "560px", aspectRatio: "4/3", borderRadius: "20px", overflow: "hidden", background: "#000", border: "2px solid rgba(0, 242, 254, 0.3)", boxShadow: "0 0 30px rgba(0, 242, 254, 0.2)" }}>
          <div className="scanning-line"></div>
          
          {/* Hologram boundary circle guide */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "240px", height: "300px", border: "2px dashed rgba(0, 242, 254, 0.5)", borderRadius: "50%", zIndex: 8, pointerEvents: "none" }}></div>

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
        </div>

        <div style={{ marginTop: "24px", display: "flex", gap: "16px" }}>
          <button className="btn-primary" onClick={handleCapture} style={{ padding: "14px 40px" }}>
            <Sparkles size={18} /> 관상 스캔 시작 (촬영)
          </button>
          <button className="btn-secondary" onClick={() => { stopCameraLoop(); setStep("init"); }}>
            돌아가기
          </button>
        </div>
      </div>
    );
  };

  const renderPersonalLoading = () => {
    return (
      <div className="flex-center" style={{ minHeight: "80vh", flexDirection: "column", gap: "20px" }}>
        {/* Futuristic glowing radar loader */}
        <div style={{ position: "relative", width: "80px", height: "80px" }}>
          <div className="pulse-glow-border" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: "50%", border: "2px solid var(--accent-blue)", animation: "spin 2s linear infinite" }}></div>
          <div style={{ position: "absolute", top: "10px", left: "10px", right: "10px", bottom: "10px", borderRadius: "50%", border: "2px dashed var(--accent-purple)", animation: "spin 4s linear infinite reverse" }}></div>
        </div>
        <h3 className="text-gradient" style={{ fontSize: "1.4rem", fontWeight: "600" }}>{loadingStatus}</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>잠시만 기다려 주십시오. AI가 오행과 기색 분석을 완료하고 있습니다.</p>
      </div>
    );
  };

  const renderPersonalResult = () => {
    return (
      <div style={{ paddingBottom: "80px" }}>
        
        {/* Result Header */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "center", marginBottom: "32px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", padding: "24px", borderRadius: "20px" }}>
          <img 
            src={finalReport.imageUrl} 
            alt="Scanned Face" 
            style={{ width: "120px", height: "120px", borderRadius: "16px", objectFit: "cover", border: "2px solid var(--accent-blue)" }}
          />
          <div style={{ flex: 1, minWidth: "250px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ background: "var(--accent-purple)", color: "#000", fontWeight: "700", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "20px" }}>진단 완료</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>체질 분류: {finalReport.elements.name}</span>
            </div>
            <h1 style={{ fontSize: "2.2rem", fontWeight: "800", marginTop: "6px" }}>
              당신은 <span className="text-gradient">{finalReport.elements.name}</span> 관상입니다
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>{finalReport.elements.char}</p>
          </div>
          <button className="btn-secondary" onClick={() => setStep("init")}>다시 측정하기</button>
        </div>

        {/* Layout Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          
          {/* Column 1: Five Elements & Samjeong */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* 오행 체질 설명 */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
                <Sparkles size={18} color="#00f2fe" /> 오행 체질 및 인상론
              </h3>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#e2e8f0" }}>{finalReport.elements.description}</p>
            </div>

            {/* 삼정 비율 균형도 */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "1.15rem", display: "flex", gap: "8px", alignItems: "center" }}>
                  <Activity size={18} color="#39ff14" /> 삼정 비율 균형도
                </h3>
                <span style={{ fontSize: "1.3rem", fontWeight: "800", color: "#39ff14" }}>{finalReport.samjeong.score}점</span>
              </div>
              
              {/* Graphic bar */}
              <div style={{ display: "flex", height: "30px", borderRadius: "10px", overflow: "hidden", marginBottom: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)" }}>
                <div style={{ width: `${finalReport.samjeong.sj}%`, background: "linear-gradient(90deg, #f857a6, #ff5858)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "700" }}>
                  상정 {Math.round(finalReport.samjeong.sj)}%
                </div>
                <div style={{ width: `${finalReport.samjeong.jj}%`, background: "linear-gradient(90deg, #00f2fe, #4facfe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "700", borderLeft: "1px solid #111", borderRight: "1px solid #111" }}>
                  중정 {Math.round(finalReport.samjeong.jj)}%
                </div>
                <div style={{ width: `${finalReport.samjeong.hj}%`, background: "linear-gradient(90deg, #39ff14, #00ff7f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "700" }}>
                  하정 {Math.round(finalReport.samjeong.hj)}%
                </div>
              </div>

              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>{finalReport.samjeong.text}</p>
            </div>
          </div>

          {/* Column 2: Stars (Glow) & Advice */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* 오성육요 기색 분석 */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
                <Sparkles size={18} color="#ff007f" /> 오성육요 기색(안색) 판정
              </h3>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#e2e8f0" }}>{finalReport.stars.text}</p>
              
              <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff007f" }}></span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>명궁 광채: {finalReport.stars.myeonggungBrightness}%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#39ff14" }}></span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>재백궁 광채: {finalReport.stars.jaebaekgungBrightness}%</span>
                </div>
              </div>
            </div>

            {/* 오악조응 균형도 */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "1.15rem", display: "flex", gap: "8px", alignItems: "center" }}>
                  <Sparkles size={18} color="var(--accent-purple)" /> 오악조응(五岳) 균형도
                </h3>
                <span style={{ fontSize: "1.3rem", fontWeight: "800", color: finalReport.peaks?.status === "balanced" ? "#39ff14" : (finalReport.peaks?.status === "isolated" ? "#ffea00" : "#ff007f") }}>
                  {finalReport.peaks?.score || 0}점
                </span>
              </div>

              <div style={{ display: "inline-flex", padding: "4px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "700", marginBottom: "14px" }}>
                <span style={{ color: "var(--text-secondary)", marginRight: "4px" }}>진단 분류:</span>
                <span style={{ color: finalReport.peaks?.status === "balanced" ? "#39ff14" : (finalReport.peaks?.status === "isolated" ? "#ffea00" : "#ff9d00") }}>
                  {finalReport.peaks?.name || "분석 대기"}
                </span>
              </div>
              
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#e2e8f0", marginBottom: "16px" }}>
                {finalReport.peaks?.text || "오악 분석 정보가 없습니다."}
              </p>

              {/* Peak metrics details mini-chart */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", padding: "12px", borderRadius: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>중악(코) 대비 주변부(이마/턱/광대) 격차</span>
                  <span style={{ color: "#fff", fontWeight: "600" }}>{((finalReport.peaks?.averageZGap || 0) * 100).toFixed(1)}%</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden", position: "relative" }}>
                  <div style={{ 
                    position: "absolute", 
                    left: `${Math.max(0, Math.min(100, ((finalReport.peaks?.averageZGap || 0) / 0.20) * 100))}%`, 
                    top: 0, 
                    width: "8px", 
                    height: "100%", 
                    background: "var(--accent-purple)", 
                    borderRadius: "3px", 
                    transform: "translateX(-50%)" 
                  }}></div>
                  {/* Highlight the balanced zone (0.06 to 0.14) */}
                  <div style={{ 
                    position: "absolute", 
                    left: "30%", 
                    width: "40%", 
                    height: "100%", 
                    background: "rgba(57, 255, 20, 0.15)", 
                    borderLeft: "1px dashed rgba(57, 255, 20, 0.4)", 
                    borderRight: "1px dashed rgba(57, 255, 20, 0.4)" 
                  }}></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                  <span>낮음 (평평함)</span>
                  <span style={{ color: "#39ff14" }}>적정 (조응형)</span>
                  <span>높음 (고봉고산)</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 액운을 막는 개운 비법 (Remedy) & 미소 훈련 */}
        <div className="glass-panel" style={{ padding: "24px", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
          <h3 style={{ fontSize: "1.15rem", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
            <Smile size={18} color="var(--accent-blue)" /> 액운을 막는 개운 비법 (Remedy)
          </h3>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            {/* Advice List (Left Column) */}
            <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {finalReport.categories.advice.map((ad, idx) => (
                <div key={idx} style={{ fontSize: "0.85rem", background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", padding: "10px 14px", borderRadius: "10px" }}>
                  <div style={{ fontWeight: "600", color: "var(--accent-blue)", marginBottom: "2px" }}>{ad.source} 비법</div>
                  <div style={{ color: "var(--text-secondary)" }}>{ad.text}</div>
                </div>
              ))}
            </div>
            
            {/* Smile training info (Right Column) */}
            <div style={{ 
              flex: smileMissionActive ? "1.2 1 380px" : "1 1 280px", 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "center", 
              alignItems: "stretch", 
              background: "rgba(255,255,255,0.01)", 
              border: smileMissionActive ? "1px solid var(--accent-blue)" : "1px solid var(--glass-border)", 
              padding: "20px", 
              borderRadius: "12px",
              boxShadow: smileMissionActive ? "0 0 15px rgba(0, 242, 254, 0.15)" : "none",
              transition: "all 0.3s ease"
            }}>
              {!smileMissionActive ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "6px" }}>인상 개선을 통한 실시간 개운 트레이닝</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", maxWidth: "300px", margin: "0 auto", lineHeight: "1.4" }}>
                      관상은 마음의 거울입니다. 입꼬리를 올리는 훈련으로 양월구(陽月口) 관상을 가꾸어 복을 불러들이세요.
                    </p>
                  </div>
                  
                  {!smileSuccess ? (
                    <button
                      className="btn-primary"
                      onClick={startSmileMission}
                      style={{ width: "100%", maxWidth: "320px", padding: "12px", fontSize: "0.85rem", display: "inline-flex", gap: "8px", justifyContent: "center" }}
                    >
                      <Smile size={16} /> 실시간 미소 개운법 트레이닝 시작!
                    </button>
                  ) : (
                    <div style={{ color: "#39ff14", fontWeight: "700", display: "flex", gap: "8px", alignItems: "center", fontSize: "0.9rem" }}>
                      <CheckCircle size={18} /> 미소 개운 트레이닝 완료!
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: "700", display: "flex", gap: "6px", alignItems: "center" }}>
                      <Smile size={16} color="#39ff14" /> 실시간 미소 훈련 진행 중
                    </span>
                    <button className="btn-secondary" onClick={stopSmileMission} style={{ padding: "4px 8px", fontSize: "0.75rem", display: "inline-flex", gap: "4px", background: "rgba(255,255,255,0.05)" }}>
                      <X size={12} /> 중단
                    </button>
                  </div>

                  {/* Webcam video container */}
                  <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", borderRadius: "8px", overflow: "hidden", background: "#000", border: "1px solid rgba(0, 242, 254, 0.2)" }}>
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
                  </div>

                  {/* Indicators */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "6px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>미소 강도 (목표 70%)</span>
                      <span style={{ fontWeight: "700", color: smileIntensity >= 70 ? "#39ff14" : "#ff007f" }}>{smileIntensity}%</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: "100%", height: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "5px", overflow: "hidden", border: "1px solid var(--glass-border)", position: "relative" }}>
                      <div style={{ width: `${smileIntensity}%`, height: "100%", background: "linear-gradient(90deg, #ff007f, #39ff14)", transition: "width 0.1s ease" }}></div>
                      <div style={{ position: "absolute", left: "70%", top: 0, width: "2px", height: "100%", background: "#fff", opacity: 0.3 }}></div>
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                    {smileHoldCounter > 0 ? (
                      <div style={{ fontSize: "1rem", fontWeight: "800", color: "#39ff14" }}>
                        유지 중... {Math.round((60 - smileHoldCounter) / 30)}초 남음!
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        카메라를 보며 입꼬리를 당겨 주십시오!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {smileSuccess && (
          <div className="glass-panel flex-center" style={{ padding: "30px", marginBottom: "24px", border: "2px solid #39ff14", gap: "16px", background: "rgba(57, 255, 20, 0.05)" }}>
            <CheckCircle size={40} color="#39ff14" />
            <div>
              <h3 style={{ fontSize: "1.2rem", color: "#39ff14", fontWeight: "700" }}>미소 개운 비법 트레이닝 성공!</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                입을 양월구(입꼬리가 위로 휘는 모양)로 가꾸는 미소 훈련을 완료하셨습니다. 매일 실천하시면 관상이 맑아지고 대인 식복이 충만해집니다!
              </p>
            </div>
          </div>
        )}

        {/* 4 Major Fortunes Tab Control */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "20px" }}>종합 4대 분야별 관상 해석</h3>

          <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "12px", marginBottom: "20px" }}>
            <button
              onClick={() => setActiveFortuneTab("love")}
              className="btn-secondary"
              style={{ flex: 1, padding: "10px", justifyContent: "center", background: activeFortuneTab === "love" ? "rgba(248, 87, 166, 0.12)" : "", borderColor: activeFortuneTab === "love" ? "#f857a6" : "" }}
            >
              <Heart size={16} color="#f857a6" /> 연애·결혼운
            </button>
            <button
              onClick={() => setActiveFortuneTab("wealth")}
              className="btn-secondary"
              style={{ flex: 1, padding: "10px", justifyContent: "center", background: activeFortuneTab === "wealth" ? "rgba(0, 242, 254, 0.12)" : "", borderColor: activeFortuneTab === "wealth" ? "#00f2fe" : "" }}
            >
              <DollarSign size={16} color="#00f2fe" /> 재물·금전운
            </button>
            <button
              onClick={() => setActiveFortuneTab("children")}
              className="btn-secondary"
              style={{ flex: 1, padding: "10px", justifyContent: "center", background: activeFortuneTab === "children" ? "rgba(79, 172, 254, 0.12)" : "", borderColor: activeFortuneTab === "children" ? "#4facfe" : "" }}
            >
              <Users size={16} color="#4facfe" /> 자녀운
            </button>
            <button
              onClick={() => setActiveFortuneTab("health")}
              className="btn-secondary"
              style={{ flex: 1, padding: "10px", justifyContent: "center", background: activeFortuneTab === "health" ? "rgba(57, 255,  সবুজ, 0.12)" : "", borderColor: activeFortuneTab === "health" ? "#39ff14" : "" }}
            >
              <Activity size={16} color="#39ff14" /> 건강운
            </button>
          </div>

          {/* Active Tab Fortune Feed */}
          <div style={{ minHeight: "150px" }}>
            {finalReport.categories[activeFortuneTab] && finalReport.categories[activeFortuneTab].length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {finalReport.categories[activeFortuneTab].map((item, index) => (
                  <div key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "14px" }}>
                    <div style={{ display: "inline-flex", fontSize: "0.75rem", color: "var(--accent-blue)", background: "rgba(0,242,254,0.08)", padding: "2px 8px", borderRadius: "10px", marginBottom: "6px" }}>
                      분석 영역: {item.source}
                    </div>
                    <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#cbd5e1" }}>{item.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "150px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                등록된 관상 매칭 정보가 없습니다. 관리자 룰 설정을 점검해 주세요.
              </div>
            )}
          </div>
        </div>

      </div>
    );
  };

  const renderSlotCard = (slotId, label, slotData, themeColor) => {
    const fileInputRefLocal = useRef(null);
    return (
      <div className="glass-panel" style={{
        padding: "24px",
        textAlign: "center",
        border: slotData ? `2px solid ${themeColor}` : "1px dashed rgba(255,255,255,0.15)",
        background: slotData ? `rgba(${themeColor === '#f857a6' ? '248,87,166' : '57,255,20'}, 0.02)` : "rgba(0,0,0,0.2)",
        borderRadius: "16px",
        transition: "all 0.3s ease",
        position: "relative"
      }}>
        <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "16px", color: slotData ? "#fff" : "var(--text-secondary)" }}>
          {label}
        </h4>

        {slotData ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ position: "relative" }}>
              <img 
                src={slotData.thumbnail} 
                alt="Thumbnail" 
                style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: `3px solid ${themeColor}`, boxShadow: `0 0 15px rgba(${themeColor === '#f857a6' ? '248,87,166' : '57,255,20'}, 0.3)` }} 
              />
              <div style={{
                position: "absolute",
                bottom: "0",
                right: "0",
                background: "#39ff14",
                color: "#000",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 5px rgba(0,0,0,0.5)"
              }}>
                <CheckCircle size={16} strokeWidth={3} />
              </div>
            </div>
            <span style={{ fontSize: "0.8rem", color: "#39ff14", fontWeight: "600" }}>얼굴 분석 완료</span>
            <button 
              className="btn-secondary" 
              onClick={() => updateSlotState(slotId, null)}
              style={{ padding: "6px 12px", fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", border: "none" }}
            >
              <X size={12} style={{ marginRight: "4px" }} /> 삭제
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", minHeight: "158px", justifyContent: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Users size={20} color="var(--text-secondary)" />
            </div>
            
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button 
                className="btn-secondary" 
                onClick={() => fileInputRefLocal.current.click()}
                style={{ flex: 1, padding: "8px 10px", fontSize: "0.8rem", display: "inline-flex", gap: "4px", justifyContent: "center", alignItems: "center" }}
              >
                <Upload size={12} /> 파일 업로드
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => startSlotCamera(slotId)}
                style={{ flex: 1, padding: "8px 10px", fontSize: "0.8rem", display: "inline-flex", gap: "4px", justifyContent: "center", alignItems: "center" }}
              >
                <Camera size={12} /> 촬영하기
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRefLocal}
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleSlotFileUpload(slotId, file);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderTwoPersonInputs = (type) => {
    const themeColor = type === 'couple' ? '#f857a6' : '#39ff14';
    const isReady = type === 'couple' ? (coupleSlotA && coupleSlotB) : (partnerSlotA && partnerSlotB);
    
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "60px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "900", marginBottom: "10px" }}>
            {type === 'couple' ? 'AI 커플 궁합 분석' : 'AI 파트너 케미 분석'}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            {type === 'couple' 
              ? '연인으로서 두 사람의 음양오행 및 외모 대칭 궁합을 과학적 수치와 전통 인상학으로 풀어봅니다.' 
              : '친구, 직장 동료, 동업자와의 오행 상생상극 케미와 시너지 효과를 분석합니다.'}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", width: "100%", maxWidth: "700px", margin: "0 auto 30px auto" }}>
          {renderSlotCard(
            type === 'couple' ? 'coupleA' : 'partnerA', 
            type === 'couple' ? '첫 번째 인물 (남성)' : '파트너 A (본인/협력자)', 
            type === 'couple' ? coupleSlotA : partnerSlotA,
            themeColor
          )}
          {renderSlotCard(
            type === 'couple' ? 'coupleB' : 'partnerB', 
            type === 'couple' ? '두 번째 인물 (여성)' : '파트너 B (상대방)', 
            type === 'couple' ? coupleSlotB : partnerSlotB,
            themeColor
          )}
        </div>

        {isReady && (
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <button 
              className="btn-primary pulse-glow-border" 
              onClick={() => runCompatibilityAnalysis(type)}
              style={{
                padding: "16px 48px",
                fontSize: "1.1rem",
                background: `linear-gradient(135deg, ${themeColor}, #4facfe)`,
                boxShadow: `0 0 25px rgba(${type === 'couple' ? '248,87,166' : '57,255,20'}, 0.4)`,
                border: "none",
                borderRadius: "30px",
                color: "#fff",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              <Sparkles size={18} style={{ marginRight: "8px" }} /> 궁합 매칭 분석 실행
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderCompatibilityResult = (type) => {
    const slotA = type === 'couple' ? coupleSlotA : partnerSlotA;
    const slotB = type === 'couple' ? coupleSlotB : partnerSlotB;
    const themeColor = type === 'couple' ? '#f857a6' : '#39ff14';

    return (
      <div style={{ paddingBottom: "80px", maxWidth: "800px", margin: "0 auto" }}>
        {/* Compatibility Score Header */}
        <div className="glass-panel" style={{
          padding: "35px",
          textAlign: "center",
          borderRadius: "24px",
          border: `2px solid ${themeColor}`,
          background: `linear-gradient(180deg, rgba(${type === 'couple' ? '248, 87, 166' : '57, 25, 20'}, 0.05) 0%, rgba(0,0,0,0.5) 100%)`,
          marginBottom: "30px",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Decorative elements */}
          <div style={{ position: "absolute", top: "-50px", left: "-50px", width: "150px", height: "150px", background: themeColor, filter: "blur(80px)", opacity: 0.15 }}></div>
          <div style={{ position: "absolute", bottom: "-50px", right: "-50px", width: "150px", height: "150px", background: "#4facfe", filter: "blur(80px)", opacity: 0.15 }}></div>

          <div style={{ display: "inline-flex", padding: "6px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "30px", fontSize: "0.85rem", fontWeight: "700", color: themeColor, marginBottom: "16px", gap: "6px", alignItems: "center" }}>
            <Sparkles size={12} /> {compatReport.relationType}
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "40px", margin: "20px 0" }}>
            {/* Thumb A */}
            <div style={{ textAlign: "center" }}>
              <img src={slotA.thumbnail} style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${themeColor}` }} alt="A" />
              <div style={{ fontSize: "0.8rem", color: "#fff", fontWeight: "700", marginTop: "8px" }}>{compatReport.elemA}형</div>
            </div>

            {/* Glowing Score */}
            <div style={{ position: "relative", width: "130px", height: "130px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <div className="pulse-glow-border" style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: `3px solid ${themeColor}`, animation: "spin 6s linear infinite" }}></div>
              <span style={{ fontSize: "3rem", fontWeight: "900", color: "#fff", textShadow: `0 0 10px ${themeColor}` }}>{compatReport.score}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "700" }}>MATCH SCORE</span>
            </div>

            {/* Thumb B */}
            <div style={{ textAlign: "center" }}>
              <img src={slotB.thumbnail} style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${themeColor}` }} alt="B" />
              <div style={{ fontSize: "0.8rem", color: "#fff", fontWeight: "700", marginTop: "8px" }}>{compatReport.elemB}형</div>
            </div>
          </div>

          <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#fff", marginBottom: "10px" }}>
            {type === 'couple' ? '환상의 연인 시너지' : '최강의 파트너 시너지'}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
            {compatReport.description}
          </p>
        </div>

        {/* Two Columns details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "30px" }}>
          {/* Column 1: Feature Match Reasons */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
              <Activity size={16} color="#00f2fe" /> 이목구비 조화성 분석
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {compatReport.reasons.map((reason, idx) => (
                <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "10px", border: "1px solid var(--glass-border)" }}>
                  <span style={{ color: "#00f2fe", fontWeight: "700", fontSize: "0.85rem" }}>✓</span>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>{reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Warnings and Advice */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
              <Smile size={16} color={themeColor} /> 관계 조화 및 개운법 조언
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {compatReport.warnings.map((warn, idx) => (
                <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "10px", border: "1px solid var(--glass-border)" }}>
                  <span style={{ color: themeColor, fontWeight: "700", fontSize: "0.85rem" }}>!</span>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>{warn}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <button className="btn-secondary" onClick={() => resetCompatibility(type)} style={{ padding: "12px 32px" }}>
            <RefreshCw size={14} style={{ marginRight: "6px" }} /> 다른 궁합 보기
          </button>
        </div>
      </div>
    );
  };

  const renderBlogTab = () => {
    if (selectedArticle) {
      return (
        <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "60px" }}>
          <button 
            className="btn-secondary" 
            onClick={() => setSelectedArticle(null)}
            style={{ marginBottom: "24px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            ← 목록으로 돌아가기
          </button>

          <div className="glass-panel" style={{ padding: "40px", borderRadius: "24px", border: "1px solid rgba(0, 242, 254, 0.15)" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ background: "rgba(0, 242, 254, 0.1)", color: "#00f2fe", fontSize: "0.75rem", padding: "4px 10px", borderRadius: "20px", fontWeight: "700" }}>
                {selectedArticle.category}
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {selectedArticle.readTime}
              </span>
            </div>

            <h1 style={{ fontSize: "2.4rem", fontWeight: "900", marginBottom: "24px", lineHeight: "1.2" }}>
              {selectedArticle.title}
            </h1>

            <div style={{ 
              fontSize: "1.05rem", 
              lineHeight: "1.8", 
              color: "#e2e8f0", 
              whiteSpace: "pre-line", 
              letterSpacing: "-0.01em" 
            }}>
              {selectedArticle.content}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "60px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "900", marginBottom: "10px" }}>
            AI 관상 <span className="text-gradient">학술 백과</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            마의상법의 지혜부터 현대 AI 얼굴 계측 알고리즘의 과학적 원리까지 깊이 알아봅니다.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
          {BLOG_ARTICLES.map(art => (
            <div 
              key={art.id} 
              className="glass-panel glass-panel-hover"
              onClick={() => setSelectedArticle(art)}
              style={{ 
                padding: "24px", 
                cursor: "pointer", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between", 
                minHeight: "220px",
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.3s ease"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ background: "rgba(79, 172, 254, 0.1)", color: "#4facfe", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>
                    {art.category}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                    {art.readTime}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "10px", lineHeight: "1.3", color: "#fff" }}>
                  {art.title}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
                  {art.summary}
                </p>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#00f2fe", fontSize: "0.85rem", fontWeight: "700", marginTop: "16px" }}>
                자세히 보기 <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCameraModal = () => {
    if (!activeCameraSlot) return null;

    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "20px"
      }}>
        <div className="glass-panel" style={{
          width: "100%",
          maxWidth: "560px",
          padding: "24px",
          textAlign: "center",
          border: "1px solid rgba(0, 242, 254, 0.3)",
          boxShadow: "0 0 30px rgba(0, 242, 254, 0.2)"
        }}>
          <h3 style={{ marginBottom: "16px", fontSize: "1.2rem", fontWeight: "700" }}>얼굴 촬영 가이드</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "20px" }}>
            가이드 타원 안에 정면 얼굴이 꽉 차도록 맞추어 카메라 촬영 버튼을 눌러 주십시오.
          </p>

          <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", borderRadius: "12px", overflow: "hidden", background: "#000", marginBottom: "20px" }}>
            <div className="scanning-line"></div>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "220px", height: "280px", border: "2px dashed rgba(0, 242, 254, 0.5)", borderRadius: "50%", zIndex: 8, pointerEvents: "none" }}></div>

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
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button className="btn-primary" onClick={captureSlotPhoto} style={{ padding: "12px 30px" }}>
              <Sparkles size={16} /> 촬영하기
            </button>
            <button className="btn-secondary" onClick={() => { stopCameraLoop(); setActiveCameraSlot(null); }}>
              취소
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "relative", minHeight: "80vh" }}>
      {renderCameraModal()}

      {step !== "scan" && step !== "loading" && compatStep !== "loading" && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "36px",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          padding: "6px",
          borderRadius: "30px",
          maxWidth: "600px",
          margin: "0 auto 36px auto",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
        }}>
          {[
            { id: 'personal', label: '개인 관상', color: '#00f2fe', icon: <Sparkles size={15} /> },
            { id: 'couple', label: '커플 궁합', color: '#f857a6', icon: <Heart size={15} /> },
            { id: 'partner', label: '파트너 케미', color: '#39ff14', icon: <Users size={15} /> },
            { id: 'blog', label: '관상 백과', color: '#4facfe', icon: <BookOpen size={15} /> }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const rgb = isActiveColorRgb(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => {
                  stopCameraLoop();
                  setActiveTab(tab.id);
                  setCompatReport(null);
                  setCompatStep("input");
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 14px",
                  borderRadius: "20px",
                  border: "none",
                  background: isActive ? `rgba(${rgb}, 0.12)` : "transparent",
                  color: isActive ? tab.color : "var(--text-secondary)",
                  fontWeight: isActive ? "700" : "500",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  border: isActive ? `1px solid rgba(${rgb}, 0.25)` : "1px solid transparent",
                  boxShadow: isActive ? `0 2px 10px rgba(${rgb}, 0.1)` : "none"
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'personal' && (
        <>
          {step === "init" && renderPersonalInit()}
          {step === "scan" && renderPersonalScan()}
          {step === "loading" && renderPersonalLoading()}
          {step === "result" && finalReport && renderPersonalResult()}
        </>
      )}

      {activeTab === 'couple' && (
        <>
          {compatStep === "input" && renderTwoPersonInputs('couple')}
          {compatStep === "loading" && renderPersonalLoading()}
          {compatStep === "result" && compatReport && renderCompatibilityResult('couple')}
        </>
      )}

      {activeTab === 'partner' && (
        <>
          {compatStep === "input" && renderTwoPersonInputs('partner')}
          {compatStep === "loading" && renderPersonalLoading()}
          {compatStep === "result" && compatReport && renderCompatibilityResult('partner')}
        </>
      )}

      {activeTab === 'blog' && renderBlogTab()}
    </div>
  );
}

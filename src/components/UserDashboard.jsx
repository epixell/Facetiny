// src/components/UserDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { initFaceLandmarker, calculateMetrics } from "../utils/mediaPipeHelper";
import { DEFAULT_FORTUNES } from "../utils/defaultFortuneData";
import { evaluateRules, generateFortuneReport } from "../utils/similarity";
import { Camera, Upload, RefreshCw, Heart, DollarSign, Users, Activity, Sparkles, Smile, CheckCircle, ArrowRight, Settings, X, Shield, BookOpen } from "lucide-react";
import { BLOG_ARTICLES, getBlogArticles } from "../utils/blogData";
import { evaluateCompatibility } from "../utils/compatibility";
import { useTranslation } from "react-i18next";

export default function UserDashboard({ onOpenAdmin }) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const [activeTab, setActiveTab] = useState("personal");
  const [coupleSlotA, setCoupleSlotA] = useState(null);
  const [coupleSlotB, setCoupleSlotB] = useState(null);
  const [partnerSlotA, setPartnerSlotA] = useState(null);
  const [partnerSlotB, setPartnerSlotB] = useState(null);
  const [compatStep, setCompatStep] = useState("input"); // 'input', 'loading', 'result'
  const [compatReport, setCompatReport] = useState(null);
  const [activeCameraSlot, setActiveCameraSlot] = useState(null); // 'coupleA', 'coupleB', etc.
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Drag-and-drop state variables
  const [isDragOverPersonal, setIsDragOverPersonal] = useState(false);
  const [dragOverSlotId, setDragOverSlotId] = useState(null);

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

  // File input refs defined at top-level to prevent Rules of Hooks violations
  const coupleFileRefA = useRef(null);
  const coupleFileRefB = useRef(null);
  const partnerFileRefA = useRef(null);
  const partnerFileRefB = useRef(null);

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

  const processPersonalFile = (file) => {
    if (!file || !faceLandmarker) return;

    setStep("loading");
    setLoadingStatus(t('personal.loading_landmark'));

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

        setLoadingStatus(t('personal.loading_geometry'));
        setTimeout(() => {
          const result = faceLandmarker.detect(canvas);
          if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
            const landmarks = result.faceLandmarks[0];
            
            setLoadingStatus(t('personal.loading_colors'));
            setTimeout(() => {
              const rawMetrics = calculateMetrics(landmarks, canvas.width, canvas.height, ctx);
              
              // Load custom rules from localStorage
              const savedRules = localStorage.getItem("lookalike_rules");
              const activeRules = savedRules ? JSON.parse(savedRules) : DEFAULT_FORTUNES;

              const matchedRules = evaluateRules(rawMetrics.raw, activeRules);
              const report = generateFortuneReport(rawMetrics, matchedRules, i18n.language);
              
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
                imageUrl: thumbnailCanvas.toDataURL(),
                rawMetrics,
                matchedRules
              });
              setStep("result");
            }, 600);
          } else {
            alert(t('personal.face_detection_error'));
            setStep("init");
          }
        }, 500);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processPersonalFile(file);
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
    setLoadingStatus(t('personal.loading_landmark'));

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Mirror image drawing
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setLoadingStatus(t('personal.loading_geometry'));
    setTimeout(() => {
      const result = faceLandmarker.detect(canvas);
      if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
        const landmarks = result.faceLandmarks[0];

        setLoadingStatus(t('personal.loading_colors'));
        setTimeout(() => {
          const rawMetrics = calculateMetrics(landmarks, canvas.width, canvas.height, ctx);
          
          // Load custom rules from localStorage
          const savedRules = localStorage.getItem("lookalike_rules");
          const activeRules = savedRules ? JSON.parse(savedRules) : DEFAULT_FORTUNES;

          const matchedRules = evaluateRules(rawMetrics.raw, activeRules);
          const report = generateFortuneReport(rawMetrics, matchedRules, i18n.language);

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
            imageUrl: thumbnailCanvas.toDataURL(),
            rawMetrics,
            matchedRules
          });
          setStep("result");
        }, 600);
      } else {
        alert(t('personal.face_detection_error'));
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

      // Precompute individual fortune report
      const savedRules = localStorage.getItem("lookalike_rules");
      const activeRules = savedRules ? JSON.parse(savedRules) : DEFAULT_FORTUNES;
      const matchedRules = evaluateRules(rawMetrics.raw, activeRules);
      const report = generateFortuneReport(rawMetrics, matchedRules, i18n.language);

      const slotData = {
        image: canvas.toDataURL(),
        landmarks: landmarks,
        metrics: rawMetrics.raw,
        derived: rawMetrics.derived,
        rawMetrics: rawMetrics,
        matchedRules: matchedRules,
        report: report,
        thumbnail: thumbnailCanvas.toDataURL()
      };

      updateSlotState(activeCameraSlot, slotData);
      setActiveCameraSlot(null);
    } else {
      alert(t('personal.face_detection_error'));
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

          // Precompute individual fortune report
          const savedRules = localStorage.getItem("lookalike_rules");
          const activeRules = savedRules ? JSON.parse(savedRules) : DEFAULT_FORTUNES;
          const matchedRules = evaluateRules(rawMetrics.raw, activeRules);
          const report = generateFortuneReport(rawMetrics, matchedRules, i18n.language);

          const slotData = {
            image: canvas.toDataURL(),
            landmarks: landmarks,
            metrics: rawMetrics.raw,
            derived: rawMetrics.derived,
            rawMetrics: rawMetrics,
            matchedRules: matchedRules,
            report: report,
            thumbnail: thumbnailCanvas.toDataURL()
          };
          updateSlotState(slotId, slotData);
        } else {
          alert(t('personal.face_detection_error'));
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
    setLoadingStatus(isEn ? "Merging facial geometry data..." : "두 사람의 안면 기하학 데이터 결합 중...");

    setTimeout(() => {
      setLoadingStatus(isEn ? "Matching Five Elements constitutions..." : "오행 상생상극 체질 융합 매칭 중...");
      setTimeout(() => {
        const report = evaluateCompatibility(slotA.metrics, slotB.metrics, type, i18n.language);
        setCompatReport({
          ...report,
          metricsA: slotA.metrics,
          metricsB: slotB.metrics
        });
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
    const faqItems = [
      { q: t('faq.q1'), a: t('faq.a1') },
      { q: t('faq.q2'), a: t('faq.a2') },
      { q: t('faq.q3'), a: t('faq.a3') },
      { q: t('faq.q4'), a: t('faq.a4') }
    ];

    return (
      <div className="flex-center" style={{ minHeight: "80vh", flexDirection: "column", padding: "0 10px" }}>
        
        {/* Decorative elements */}
        <div style={{ position: "absolute", top: "15%", left: "10%", width: "250px", height: "250px", background: "var(--accent-purple)", filter: "blur(150px)", opacity: 0.15, borderRadius: "50%", zIndex: -1 }}></div>
        <div style={{ position: "absolute", bottom: "15%", right: "10%", width: "300px", height: "300px", background: "var(--accent-blue)", filter: "blur(180px)", opacity: 0.15, borderRadius: "50%", zIndex: -1 }}></div>

        <div style={{ textAlign: "center", marginBottom: "40px", maxWidth: "600px" }}>
          <div style={{ display: "inline-flex", padding: "6px 16px", background: "rgba(0, 242, 254, 0.1)", border: "1px solid rgba(0, 242, 254, 0.2)", borderRadius: "30px", gap: "8px", alignItems: "center", marginBottom: "16px" }}>
            <Sparkles size={14} color="#00f2fe" />
            <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#00f2fe" }}>{t('personal.badge')}</span>
          </div>
          <h1 style={{ fontSize: "3.2rem", fontWeight: "900", lineHeight: "1.1", marginBottom: "16px" }}>
            {t('personal.title').split(" ").map((w, idx) => {
              if (idx === t('personal.title').split(" ").length - 1) {
                return <span key={idx} className="text-gradient"> {w}</span>;
              }
              return (idx === 0 ? "" : " ") + w;
            })}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
            {t('personal.desc')}
          </p>
        </div>

        {loadingEngine ? (
          <div className="glass-panel" style={{ padding: "30px", display: "flex", alignItems: "center", gap: "16px", maxWidth: "360px" }}>
            <RefreshCw size={24} style={{ animation: "spin 2s linear infinite" }} color="#4facfe" />
            <span>{t('personal.loading_engine')}</span>
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
              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>{t('personal.camera_scan_title')}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                {t('personal.camera_scan_desc')}
              </p>
            </div>

            {/* Card 2: File Upload */}
            <div
              className="glass-panel glass-panel-hover"
              onClick={handleFileUploadClick}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOverPersonal(true);
              }}
              onDragLeave={() => setIsDragOverPersonal(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOverPersonal(false);
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                  processPersonalFile(file);
                } else {
                  alert(t('personal.image_only_error'));
                }
              }}
              style={{ 
                padding: "30px", 
                textAlign: "center", 
                cursor: "pointer", 
                border: isDragOverPersonal ? "2px solid #00f2fe" : "1px solid rgba(255,255,255,0.06)",
                boxShadow: isDragOverPersonal ? "0 0 15px rgba(0, 242, 254, 0.2)" : "none",
                background: isDragOverPersonal ? "rgba(0, 242, 254, 0.05)" : "",
                transition: "all 0.2s ease"
              }}
            >
              <div className="flex-center" style={{ width: "56px", height: "56px", background: "rgba(79, 172, 254, 0.1)", borderRadius: "16px", margin: "0 auto 20px auto" }}>
                <Upload size={26} color="#4facfe" />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
                {isDragOverPersonal ? t('personal.upload_drag_title') : t('personal.upload_title')}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                {isDragOverPersonal ? t('personal.upload_drag_desc') : t('personal.upload_desc')}
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
              <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#fff", marginBottom: "6px" }}>{t('personal.privacy_title')}</h4>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                {t('personal.privacy_desc')}
              </p>
            </div>
          </div>

          {/* AI Physiognomy Principles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            
            <div className="glass-panel" style={{ padding: "16px", border: "1px solid rgba(255, 255, 255, 0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Sparkles size={12} color="#f857a6" />
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#fff" }}>{t('personal.five_elem_title')}</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                {t('personal.five_elem_desc')}
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "16px", border: "1px solid rgba(255, 255, 255, 0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Activity size={12} color="#39ff14" />
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#fff" }}>{t('personal.samjeong_ratio_title')}</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                {t('personal.samjeong_ratio_desc')}
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "16px", border: "1px solid rgba(255, 255, 255, 0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Sparkles size={12} color="var(--accent-purple)" />
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#fff" }}>{t('personal.five_peaks_title')}</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                {t('personal.five_peaks_desc')}
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "16px", border: "1px solid rgba(255, 255, 255, 0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Smile size={12} color="#00f2fe" />
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#fff" }}>{t('personal.color_aura_title')}</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                {t('personal.color_aura_desc')}
              </p>
            </div>

          </div>

          {/* FAQ Accordion Section */}
          <div style={{ marginTop: "30px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#fff", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="#00f2fe" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> {t('faq.title')}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {faqItems.map((faq, idx) => {
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
        <h2 style={{ marginBottom: "20px" }}>{t('personal.camera_guide')}</h2>
        
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
            <Sparkles size={18} /> {t('personal.camera_scan_btn')}
          </button>
          <button className="btn-secondary" onClick={() => { stopCameraLoop(); setStep("init"); }}>
            {t('personal.back_btn')}
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
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{t('personal.loading_desc')}</p>
      </div>
    );
  };

  const renderPersonalResult = () => {
    // Dynamically calculate localized report on-the-fly when language changes
    const report = finalReport.rawMetrics && finalReport.matchedRules
      ? { ...generateFortuneReport(finalReport.rawMetrics, finalReport.matchedRules, i18n.language), imageUrl: finalReport.imageUrl }
      : finalReport;

    return (
      <div style={{ paddingBottom: "80px" }}>
        
        {/* Result Header */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "center", marginBottom: "32px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", padding: "24px", borderRadius: "20px" }}>
          <img 
            src={report.imageUrl} 
            alt="Scanned Face" 
            style={{ width: "120px", height: "120px", borderRadius: "16px", objectFit: "cover", border: "2px solid var(--accent-blue)" }}
          />
          <div style={{ flex: 1, minWidth: "250px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ background: "var(--accent-purple)", color: "#000", fontWeight: "700", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "20px" }}>{t('personal.scan_complete')}</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{t('personal.type_label')}: {report.elements.name}</span>
            </div>
            <h1 style={{ fontSize: "2.2rem", fontWeight: "800", marginTop: "6px" }}>
              {t('personal.you_are')} <span className="text-gradient">{report.elements.name}</span> {t('personal.type_suffix')}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>{report.elements.char}</p>
          </div>
          <button className="btn-secondary" onClick={() => setStep("init")}>{t('personal.reanalyze_btn')}</button>
        </div>

        {/* Layout Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          
          {/* Column 1: Five Elements & Samjeong */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* 오행 체질 설명 */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
                <Sparkles size={18} color="#00f2fe" /> {t('personal.five_elem_header')}
              </h3>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#e2e8f0" }}>{report.elements.description}</p>
            </div>

            {/* 삼정 비율 균형도 */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "1.15rem", display: "flex", gap: "8px", alignItems: "center" }}>
                  <Activity size={18} color="#39ff14" /> {t('personal.samjeong_header')}
                </h3>
                <span style={{ fontSize: "1.3rem", fontWeight: "800", color: "#39ff14" }}>{report.samjeong.score}{t('personal.score_suffix')}</span>
              </div>
              
              {/* Graphic bar */}
              <div style={{ display: "flex", height: "30px", borderRadius: "10px", overflow: "hidden", marginBottom: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)" }}>
                <div style={{ width: `${report.samjeong.sj}%`, background: "linear-gradient(90deg, #f857a6, #ff5858)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "700" }}>
                  {t('personal.ratio_top')} {Math.round(report.samjeong.sj)}%
                </div>
                <div style={{ width: `${report.samjeong.jj}%`, background: "linear-gradient(90deg, #00f2fe, #4facfe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "700", borderLeft: "1px solid #111", borderRight: "1px solid #111" }}>
                  {t('personal.ratio_mid')} {Math.round(report.samjeong.jj)}%
                </div>
                <div style={{ width: `${report.samjeong.hj}%`, background: "linear-gradient(90deg, #39ff14, #00ff7f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "700" }}>
                  {t('personal.ratio_bot')} {Math.round(report.samjeong.hj)}%
                </div>
              </div>

              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>{report.samjeong.text}</p>
            </div>
          </div>

          {/* Column 2: Stars (Glow) & Advice */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* 오성육요 기색 분석 */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
                <Sparkles size={18} color="#ff007f" /> {t('personal.stars_header')}
              </h3>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#e2e8f0" }}>{report.stars.text}</p>
              
              <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff007f" }}></span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{t('personal.myeonggung_glow')}: {report.stars.myeonggungBrightness}%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#39ff14" }}></span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{t('personal.jaebaekgung_glow')}: {report.stars.jaebaekgungBrightness}%</span>
                </div>
              </div>
            </div>

            {/* 오악조응 균형도 */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "1.15rem", display: "flex", gap: "8px", alignItems: "center" }}>
                  <Sparkles size={18} color="var(--accent-purple)" /> {t('personal.peaks_header')}
                </h3>
                <span style={{ fontSize: "1.3rem", fontWeight: "800", color: report.peaks?.status === "balanced" ? "#39ff14" : (report.peaks?.status === "isolated" ? "#ffea00" : "#ff007f") }}>
                  {report.peaks?.score || 0}{t('personal.score_suffix')}
                </span>
              </div>

              <div style={{ display: "inline-flex", padding: "4px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "700", marginBottom: "14px" }}>
                <span style={{ color: "var(--text-secondary)", marginRight: "4px" }}>{t('personal.peaks_diagnosis')}:</span>
                <span style={{ color: report.peaks?.status === "balanced" ? "#39ff14" : (report.peaks?.status === "isolated" ? "#ffea00" : "#ff9d00") }}>
                  {report.peaks?.name || t('personal.analyzing')}
                </span>
              </div>
              
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#e2e8f0", marginBottom: "16px" }}>
                {report.peaks?.text || t('personal.peaks_no_data')}
              </p>

              {/* Peak metrics details mini-chart */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", padding: "12px", borderRadius: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{t('personal.peaks_zgap_label')}</span>
                  <span style={{ color: "#fff", fontWeight: "600" }}>{((report.peaks?.averageZGap || 0) * 100).toFixed(1)}%</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden", position: "relative" }}>
                  <div style={{ 
                    position: "absolute", 
                    left: `${Math.max(0, Math.min(100, ((report.peaks?.averageZGap || 0) / 0.20) * 100))}%`, 
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
                  <span>{t('personal.peaks_low')}</span>
                  <span style={{ color: "#39ff14" }}>{t('personal.peaks_mid')}</span>
                  <span>{t('personal.peaks_high')}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 액운을 막는 개운 비법 (Remedy) & 미소 훈련 */}
        <div className="glass-panel" style={{ padding: "24px", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
          <h3 style={{ fontSize: "1.15rem", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
            <Smile size={18} color="var(--accent-blue)" /> {t('personal.remedy_title')}
          </h3>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            {/* Advice List (Left Column) */}
            <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {report.categories.advice.map((ad, idx) => (
                <div key={idx} style={{ fontSize: "0.85rem", background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", padding: "10px 14px", borderRadius: "10px" }}>
                  <div style={{ fontWeight: "600", color: "var(--accent-blue)", marginBottom: "2px" }}>{ad.source} {t('personal.remedy_source')}</div>
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
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "6px" }}>{t('personal.smile_title')}</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", maxWidth: "300px", margin: "0 auto", lineHeight: "1.4" }}>
                      {t('personal.smile_desc')}
                    </p>
                  </div>
                  
                  {!smileSuccess ? (
                    <button
                      className="btn-primary"
                      onClick={startSmileMission}
                      style={{ width: "100%", maxWidth: "320px", padding: "12px", fontSize: "0.85rem", display: "inline-flex", gap: "8px", justifyContent: "center" }}
                    >
                      <Smile size={16} /> {t('personal.smile_start')}
                    </button>
                  ) : (
                    <div style={{ color: "#39ff14", fontWeight: "700", display: "flex", gap: "8px", alignItems: "center", fontSize: "0.9rem" }}>
                      <CheckCircle size={18} /> {t('personal.smile_success_title')}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: "700", display: "flex", gap: "6px", alignItems: "center" }}>
                      <Smile size={16} color="#39ff14" /> {t('personal.smile_in_progress')}
                    </span>
                    <button className="btn-secondary" onClick={stopSmileMission} style={{ padding: "4px 8px", fontSize: "0.75rem", display: "inline-flex", gap: "4px", background: "rgba(255,255,255,0.05)" }}>
                      <X size={12} /> {t('personal.smile_stop')}
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
                      <span style={{ color: "var(--text-secondary)" }}>{t('personal.smile_intensity_label')}</span>
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
                        {t('personal.smile_holding').replace('{count}', Math.round((60 - smileHoldCounter) / 30))}
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {t('personal.smile_guide')}
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
              <h3 style={{ fontSize: "1.2rem", color: "#39ff14", fontWeight: "700" }}>{t('personal.smile_success_alert')}</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                {t('personal.smile_success_desc')}
              </p>
            </div>
          </div>
        )}

        {/* 4 Major Fortunes Tab Control */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "20px" }}>{t('personal.fortunes_title')}</h3>

          <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "12px", marginBottom: "20px" }}>
            <button
              onClick={() => setActiveFortuneTab("love")}
              className="btn-secondary"
              style={{ flex: 1, padding: "10px", justifyContent: "center", background: activeFortuneTab === "love" ? "rgba(248, 87, 166, 0.12)" : "", borderColor: activeFortuneTab === "love" ? "#f857a6" : "" }}
            >
              <Heart size={16} color="#f857a6" /> {t('personal.fortune_love')}
            </button>
            <button
              onClick={() => setActiveFortuneTab("wealth")}
              className="btn-secondary"
              style={{ flex: 1, padding: "10px", justifyContent: "center", background: activeFortuneTab === "wealth" ? "rgba(0, 242, 254, 0.12)" : "", borderColor: activeFortuneTab === "wealth" ? "#00f2fe" : "" }}
            >
              <DollarSign size={16} color="#00f2fe" /> {t('personal.fortune_wealth')}
            </button>
            <button
              onClick={() => setActiveFortuneTab("children")}
              className="btn-secondary"
              style={{ flex: 1, padding: "10px", justifyContent: "center", background: activeFortuneTab === "children" ? "rgba(79, 172, 254, 0.12)" : "", borderColor: activeFortuneTab === "children" ? "#4facfe" : "" }}
            >
              <Users size={16} color="#4facfe" /> {t('personal.fortune_children')}
            </button>
            <button
              onClick={() => setActiveFortuneTab("health")}
              className="btn-secondary"
              style={{ flex: 1, padding: "10px", justifyContent: "center", background: activeFortuneTab === "health" ? "rgba(57, 255, 20, 0.12)" : "", borderColor: activeFortuneTab === "health" ? "#39ff14" : "" }}
            >
              <Activity size={16} color="#39ff14" /> {t('personal.fortune_health')}
            </button>
          </div>

          {/* Active Tab Fortune Feed */}
          <div style={{ minHeight: "150px" }}>
            {report.categories[activeFortuneTab] && report.categories[activeFortuneTab].length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {report.categories[activeFortuneTab].map((item, index) => (
                  <div key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "14px" }}>
                    <div style={{ display: "inline-flex", fontSize: "0.75rem", color: "var(--accent-blue)", background: "rgba(0,242,254,0.08)", padding: "2px 8px", borderRadius: "10px", marginBottom: "6px" }}>
                      {t('personal.fortune_source')}: {item.source}
                    </div>
                    <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#cbd5e1" }}>{item.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "150px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                {t('personal.fortune_no_rules')}
              </div>
            )}
          </div>
        </div>

      </div>
    );
  };

  const renderSlotCard = (slotId, label, slotData, themeColor) => {
    let fileInputRefLocal = null;
    if (slotId === 'coupleA') fileInputRefLocal = coupleFileRefA;
    else if (slotId === 'coupleB') fileInputRefLocal = coupleFileRefB;
    else if (slotId === 'partnerA') fileInputRefLocal = partnerFileRefA;
    else if (slotId === 'partnerB') fileInputRefLocal = partnerFileRefB;

    const isDragOver = dragOverSlotId === slotId;

    return (
      <div 
        className="glass-panel" 
        onDragOver={(e) => {
          if (!slotData) {
            e.preventDefault();
            setDragOverSlotId(slotId);
          }
        }}
        onDragLeave={() => setDragOverSlotId(null)}
        onDrop={(e) => {
          if (!slotData) {
            e.preventDefault();
            setDragOverSlotId(null);
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
              handleSlotFileUpload(slotId, file);
            } else {
              alert(t('compat.image_only_error'));
            }
          }
        }}
        style={{
          padding: "24px",
          textAlign: "center",
          border: isDragOver 
            ? `2px solid ${themeColor}` 
            : (slotData ? `2px solid ${themeColor}` : "1px dashed rgba(255,255,255,0.15)"),
          background: isDragOver
            ? `rgba(${themeColor === '#f857a6' ? '248,87,166' : '57,255,20'}, 0.08)`
            : (slotData ? `rgba(${themeColor === '#f857a6' ? '248,87,166' : '57,255,20'}, 0.02)` : "rgba(0,0,0,0.2)"),
          boxShadow: isDragOver ? `0 0 15px rgba(${themeColor === '#f857a6' ? '248,87,166' : '57,255,20'}, 0.2)` : "none",
          borderRadius: "16px",
          transition: "all 0.3s ease",
          position: "relative"
        }}
      >
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
            <span style={{ fontSize: "0.8rem", color: "#39ff14", fontWeight: "600" }}>{t('compat.face_analyzed')}</span>
            <button 
              className="btn-secondary" 
              onClick={() => updateSlotState(slotId, null)}
              style={{ padding: "6px 12px", fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", border: "none" }}
            >
              <X size={12} style={{ marginRight: "4px" }} /> {t('compat.delete_btn')}
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
                <Upload size={12} /> {t('compat.upload_btn')}
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => startSlotCamera(slotId)}
                style={{ flex: 1, padding: "8px 10px", fontSize: "0.8rem", display: "inline-flex", gap: "4px", justifyContent: "center", alignItems: "center" }}
              >
                <Camera size={12} /> {t('compat.camera_btn')}
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
            {type === 'couple' ? t('compat.couple_title_analysis') : t('compat.partner_title_analysis')}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            {type === 'couple' 
              ? t('compat.couple_subtitle_analysis') 
              : t('compat.partner_subtitle_analysis')}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", width: "100%", maxWidth: "700px", margin: "0 auto 30px auto" }}>
          {renderSlotCard(
            type === 'couple' ? 'coupleA' : 'partnerA', 
            type === 'couple' ? t('compat.person_a_label') : t('compat.partner_a_label'), 
            type === 'couple' ? coupleSlotA : partnerSlotA,
            themeColor
          )}
          {renderSlotCard(
            type === 'couple' ? 'coupleB' : 'partnerB', 
            type === 'couple' ? t('compat.person_b_label') : t('compat.partner_b_label'), 
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
              <Sparkles size={18} style={{ marginRight: "8px" }} /> {type === 'couple' ? t('compat.run_analyze_btn') : t('compat.run_partner_analyze_btn')}
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

    // Dynamically calculate localized compatibility report when language changes
    const report = compatReport && compatReport.metricsA && compatReport.metricsB
      ? evaluateCompatibility(compatReport.metricsA, compatReport.metricsB, type, i18n.language)
      : compatReport;

    // Dynamically calculate localized individual summaries
    const reportA = slotA && slotA.rawMetrics && slotA.matchedRules
      ? generateFortuneReport(slotA.rawMetrics, slotA.matchedRules, i18n.language)
      : (slotA ? slotA.report : null);

    const reportB = slotB && slotB.rawMetrics && slotB.matchedRules
      ? generateFortuneReport(slotB.rawMetrics, slotB.matchedRules, i18n.language)
      : (slotB ? slotB.report : null);

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
            <Sparkles size={12} /> {report.relationType}
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "40px", margin: "20px 0" }}>
            {/* Thumb A */}
            <div style={{ textAlign: "center", width: "160px" }}>
              <img src={slotA.thumbnail} style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${themeColor}` }} alt="A" />
              <div style={{ fontSize: "0.95rem", color: "#fff", fontWeight: "700", marginTop: "8px" }}>{report.elemA}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.3" }}>{report.charA}</div>
            </div>

            {/* Glowing Score */}
            <div style={{ position: "relative", width: "130px", height: "130px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
              <div className="pulse-glow-border" style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: `3px solid ${themeColor}`, animation: "spin 6s linear infinite" }}></div>
              <span style={{ fontSize: "3rem", fontWeight: "900", color: "#fff", textShadow: `0 0 10px ${themeColor}` }}>{report.score}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "700" }}>MATCH SCORE</span>
            </div>

            {/* Thumb B */}
            <div style={{ textAlign: "center", width: "160px" }}>
              <img src={slotB.thumbnail} style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${themeColor}` }} alt="B" />
              <div style={{ fontSize: "0.95rem", color: "#fff", fontWeight: "700", marginTop: "8px" }}>{report.elemB}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.3" }}>{report.charB}</div>
            </div>
          </div>

          <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#fff", marginBottom: "10px" }}>
            {type === 'couple' ? t('compat.couple_result_title') : t('compat.partner_result_title')}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
            {report.description}
          </p>
        </div>

        {/* Two Columns details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "30px" }}>
          {/* Column 1: Feature Match Reasons */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
              <Activity size={16} color="#00f2fe" /> {t('compat.harmony_analysis')}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {report.reasons.map((reason, idx) => (
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
              <Smile size={16} color={themeColor} /> {t('compat.advice_analysis')}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {report.warnings.map((warn, idx) => (
                <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "10px", border: "1px solid var(--glass-border)" }}>
                  <span style={{ color: themeColor, fontWeight: "700", fontSize: "0.85rem" }}>!</span>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>{warn}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 두 사람의 개별 관상 요약 (Summary Readings) */}
        {reportA && reportB && (
          <div style={{ marginBottom: "40px" }}>
            <h3 style={{ 
              fontSize: "1.25rem", 
              fontWeight: "800", 
              color: "#fff", 
              marginBottom: "20px", 
              textAlign: "center", 
              display: "flex", 
              gap: "8px", 
              alignItems: "center", 
              justifyContent: "center" 
            }}>
              <Sparkles size={18} color={themeColor} /> {t('compat.summary_title')}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              
              {/* Person A Summary */}
              <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", border: `1px solid rgba(255,255,255,0.06)`, textAlign: "left" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <img src={slotA.thumbnail} style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${themeColor}` }} alt="A" />
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#fff", margin: 0 }}>
                      {type === 'couple' ? t('compat.person_a') : t('compat.partner_a')}
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: themeColor, fontWeight: "600" }}>
                      {reportA.elements?.name || t('personal.analyzing')}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.8rem", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "12px" }}>
                  <div>
                    <div style={{ color: "var(--text-secondary)", fontWeight: "600", marginBottom: "4px" }}>{t('compat.elem_desc')}</div>
                    <div style={{ color: "#cbd5e1", lineHeight: "1.4" }}>{reportA.elements?.char || t('personal.fortune_no_rules')}</div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", color: "var(--text-secondary)" }}>
                      <span>{t('compat.samjeong_balance')}</span>
                      <span style={{ color: "#39ff14" }}>{reportA.samjeong?.score || 0}{t('personal.score_suffix')}</span>
                    </div>
                    {reportA.samjeong && (
                      <div style={{ display: "flex", height: "14px", borderRadius: "7px", overflow: "hidden", margin: "6px 0", background: "rgba(255,255,255,0.05)" }}>
                        <div style={{ width: `${reportA.samjeong.sj}%`, background: "linear-gradient(90deg, #f857a6, #ff5858)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: "700" }}>{t('personal.ratio_top')} {Math.round(reportA.samjeong.sj)}%</div>
                        <div style={{ width: `${reportA.samjeong.jj}%`, background: "linear-gradient(90deg, #00f2fe, #4facfe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: "700", borderLeft: "1px solid #111", borderRight: "1px solid #111" }}>{t('personal.ratio_mid')} {Math.round(reportA.samjeong.jj)}%</div>
                        <div style={{ width: `${reportA.samjeong.hj}%`, background: "linear-gradient(90deg, #39ff14, #00ff7f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: "700" }}>{t('personal.ratio_bot')} {Math.round(reportA.samjeong.hj)}%</div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", color: "var(--text-secondary)" }}>
                      <span>{t('compat.peaks_balance')}</span>
                      <span style={{ color: "var(--accent-purple)" }}>{reportA.peaks?.score || 0}{t('personal.score_suffix')}</span>
                    </div>
                    <div style={{ color: "#cbd5e1", lineHeight: "1.4", marginTop: "2px" }}>{reportA.peaks?.name || t('personal.analyzing')}</div>
                  </div>

                  <div>
                    <div style={{ color: "var(--text-secondary)", fontWeight: "600", marginBottom: "2px" }}>{t('compat.stars_color')}</div>
                    <div style={{ color: "var(--text-secondary)", lineHeight: "1.4" }}>{reportA.stars?.text || t('personal.fortune_no_rules')}</div>
                  </div>
                </div>
              </div>

              {/* Person B Summary */}
              <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", border: `1px solid rgba(255,255,255,0.06)`, textAlign: "left" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <img src={slotB.thumbnail} style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${themeColor}` }} alt="B" />
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#fff", margin: 0 }}>
                      {type === 'couple' ? t('compat.person_b') : t('compat.partner_b')}
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: themeColor, fontWeight: "600" }}>
                      {reportB.elements?.name || t('personal.analyzing')}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.8rem", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "12px" }}>
                  <div>
                    <div style={{ color: "var(--text-secondary)", fontWeight: "600", marginBottom: "4px" }}>{t('compat.elem_desc')}</div>
                    <div style={{ color: "#cbd5e1", lineHeight: "1.4" }}>{reportB.elements?.char || t('personal.fortune_no_rules')}</div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", color: "var(--text-secondary)" }}>
                      <span>{t('compat.samjeong_balance')}</span>
                      <span style={{ color: "#39ff14" }}>{reportB.samjeong?.score || 0}{t('personal.score_suffix')}</span>
                    </div>
                    {reportB.samjeong && (
                      <div style={{ display: "flex", height: "14px", borderRadius: "7px", overflow: "hidden", margin: "6px 0", background: "rgba(255,255,255,0.05)" }}>
                        <div style={{ width: `${reportB.samjeong.sj}%`, background: "linear-gradient(90deg, #f857a6, #ff5858)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: "700" }}>{t('personal.ratio_top')} {Math.round(reportB.samjeong.sj)}%</div>
                        <div style={{ width: `${reportB.samjeong.jj}%`, background: "linear-gradient(90deg, #00f2fe, #4facfe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: "700", borderLeft: "1px solid #111", borderRight: "1px solid #111" }}>{t('personal.ratio_mid')} {Math.round(reportB.samjeong.jj)}%</div>
                        <div style={{ width: `${reportB.samjeong.hj}%`, background: "linear-gradient(90deg, #39ff14, #00ff7f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: "700" }}>{t('personal.ratio_bot')} {Math.round(reportB.samjeong.hj)}%</div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", color: "var(--text-secondary)" }}>
                      <span>{t('compat.peaks_balance')}</span>
                      <span style={{ color: "var(--accent-purple)" }}>{reportB.peaks?.score || 0}{t('personal.score_suffix')}</span>
                    </div>
                    <div style={{ color: "#cbd5e1", lineHeight: "1.4", marginTop: "2px" }}>{reportB.peaks?.name || t('personal.analyzing')}</div>
                  </div>

                  <div>
                    <div style={{ color: "var(--text-secondary)", fontWeight: "600", marginBottom: "2px" }}>{t('compat.stars_color')}</div>
                    <div style={{ color: "var(--text-secondary)", lineHeight: "1.4" }}>{reportB.stars?.text || t('personal.fortune_no_rules')}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <button className="btn-secondary" onClick={() => resetCompatibility(type)} style={{ padding: "12px 32px" }}>
            <RefreshCw size={14} style={{ marginRight: "6px" }} /> {t('compat.other_match_btn')}
          </button>
        </div>
      </div>
    );
  };



  // Helper to parse links and inline bold text in article content
  const parseInlineStyles = (text, isCta = false) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const linkText = match[1];
      const targetId = match[2];
      
      const targetArt = getBlogArticles(i18n.language).find(a => a.id === targetId);
      if (targetArt) {
        parts.push(
          <button
            key={match.index}
            onClick={() => setSelectedArticle(targetArt)}
            style={{
              background: 'none',
              border: 'none',
              color: '#00f2fe',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              fontSize: 'inherit',
              fontWeight: '600',
              fontFamily: 'inherit',
              display: 'inline'
            }}
          >
            {linkText}
          </button>
        );
      } else {
        parts.push(linkText);
      }
      
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    if (isCta) {
      return <span style={{ color: '#00f2fe', fontWeight: '700', fontSize: '1.05rem' }}>{parts.length > 0 ? parts : text}</span>;
    }

    return parts.length > 0 ? parts : text;
  };

  // Main custom parser to structure the article text dynamically
  const parseContent = (text, currentArticleId) => {
    if (!text) return null;
    const lines = text.split('\n');
    const renderedElements = [];
    let currentList = [];
    let listType = null; // 'ul' or 'ol'
    const isEn = i18n.language === 'en';
    
    const flushList = (key) => {
      if (currentList.length > 0) {
        if (listType === 'ul') {
          renderedElements.push(
            <ul key={`ul-${key}`} style={{ paddingLeft: '24px', marginBottom: '20px', listStyleType: 'disc', color: '#cbd5e1' }}>
              {currentList.map((item, i) => (
                <li key={i} style={{ marginBottom: '6px', lineHeight: '1.7' }}>{item}</li>
              ))}
            </ul>
          );
        } else if (listType === 'ol') {
          renderedElements.push(
            <ol key={`ol-${key}`} style={{ paddingLeft: '24px', marginBottom: '20px', listStyleType: 'decimal', color: '#cbd5e1' }}>
              {currentList.map((item, i) => (
                <li key={i} style={{ marginBottom: '6px', lineHeight: '1.7' }}>{item}</li>
              ))}
            </ol>
          );
        }
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // 1. Heading 2 (##)
      if (trimmed.startsWith('## ')) {
        flushList(index);
        const headerText = trimmed.replace('## ', '');
        renderedElements.push(
          <h2 key={index} style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginTop: '36px', marginBottom: '16px', borderLeft: '4px solid #00f2fe', paddingLeft: '12px', lineHeight: '1.4' }}>
            {headerText}
          </h2>
        );

        return;
      }

      // 2. Heading 3 (###)
      if (trimmed.startsWith('### ')) {
        flushList(index);
        const headerText = trimmed.replace('### ', '');
        renderedElements.push(
          <h3 key={index} style={{ fontSize: '1.15rem', fontWeight: '700', color: '#00f2fe', marginTop: '24px', marginBottom: '12px', lineHeight: '1.4' }}>
            {headerText}
          </h3>
        );
        return;
      }

      // 3. Unordered list (*, -, •)
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        if (listType !== 'ul') {
          flushList(index);
          listType = 'ul';
        }
        const itemText = trimmed.replace(/^(\*\s|-\s|•\s)/, '');
        currentList.push(parseInlineStyles(itemText));
        return;
      }

      // 4. Ordered list (1., 2., 3., etc.)
      if (/^\d+\.\s/.test(trimmed)) {
        if (listType !== 'ol') {
          flushList(index);
          listType = 'ol';
        }
        const itemText = trimmed.replace(/^\d+\.\s/, '');
        currentList.push(parseInlineStyles(itemText));
        return;
      }

      // 5. Empty line
      if (trimmed === '') {
        flushList(index);
        return;
      }

      // 6. Regular paragraph
      flushList(index);
      
      if (trimmed.startsWith('👉') || trimmed.includes('](')) {
        renderedElements.push(
          <div key={index} style={{ marginTop: '24px', marginBottom: '24px' }}>
            {parseInlineStyles(trimmed, true)}
          </div>
        );
      } else {
        renderedElements.push(
          <p key={index} style={{ marginBottom: '18px', color: '#cbd5e1', lineHeight: '1.8', fontSize: '1.02rem' }}>
            {parseInlineStyles(trimmed)}
          </p>
        );
      }
    });

    flushList('final');
    
    // Bottom banner ad
    
    // Bottom CTA to check other articles
    renderedElements.push(
      <div key="cta-section" style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#00f2fe" />
          {isEn ? 'Recommended Encyclopedia' : '📖 함께 읽으면 유익한 관상 학술 정보'}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {getBlogArticles(i18n.language).filter(art => art.id !== currentArticleId).slice(0, 2).map((art, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedArticle(art);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                padding: '16px 20px',
                textAlign: 'left',
                color: '#00f2fe',
                fontWeight: '700',
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 242, 254, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.25)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span>👉 {art.title}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>
                {art.category}
              </span>
            </button>
          ))}
        </div>
      </div>
    );

    return renderedElements;
  };

  const renderBlogTab = () => {
    if (selectedArticle) {
      const currentArt = getBlogArticles(i18n.language).find(a => a.id === selectedArticle.id) || selectedArticle;
      const title = currentArt.title;
      const category = currentArt.category;
      const readTime = currentArt.readTime;
      const content = currentArt.content;

      return (
        <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "60px" }}>
          <button 
            className="btn-secondary" 
            onClick={() => setSelectedArticle(null)}
            style={{ marginBottom: "24px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            {t('common.back_to_list')}
          </button>

          <div className="glass-panel" style={{ padding: "40px", borderRadius: "24px", border: "1px solid rgba(0, 242, 254, 0.15)" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ background: "rgba(0, 242, 254, 0.1)", color: "#00f2fe", fontSize: "0.75rem", padding: "4px 10px", borderRadius: "20px", fontWeight: "700" }}>
                {category}
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {readTime}
              </span>
            </div>

            <h1 style={{ fontSize: "2.4rem", fontWeight: "900", marginBottom: "24px", lineHeight: "1.2" }}>
              {title}
            </h1>

            <div style={{ 
              fontSize: "1.05rem", 
              lineHeight: "1.8", 
              color: "#e2e8f0", 
              letterSpacing: "-0.01em" 
            }}>
              {parseContent(content, selectedArticle.id)}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "60px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "900", marginBottom: "10px" }}>
            {isEn ? <>AI Physiognomy <span className="text-gradient">Encyclopedia</span></> : <>AI 관상 <span className="text-gradient">학술 백과</span></>}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            {isEn 
              ? "Explore traditional physiognomy wisdom and modern AI face geometry algorithms."
              : "마의상법의 지혜부터 현대 AI 얼굴 계측 알고리즘의 과학적 원리까지 깊이 알아봅니다."}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
          {getBlogArticles(i18n.language).map(art => {
            const artTitle = art.title;
            const artSummary = art.summary;
            const artCategory = art.category;
            const artReadTime = art.readTime;
            return (
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
                      {artCategory}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                      {artReadTime}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "10px", lineHeight: "1.3", color: "#fff" }}>
                    {artTitle}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
                    {artSummary}
                  </p>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#00f2fe", fontSize: "0.85rem", fontWeight: "700", marginTop: "16px" }}>
                  {t('common.read_more')} <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
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
          <h3 style={{ marginBottom: "16px", fontSize: "1.2rem", fontWeight: "700" }}>{t('personal.guide_title')}</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "20px" }}>
            {t('personal.guide_desc')}
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
              <Sparkles size={16} /> {t('personal.capture_btn')}
            </button>
            <button className="btn-secondary" onClick={() => { stopCameraLoop(); setActiveCameraSlot(null); }}>
              {t('personal.cancel_btn')}
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
            { id: 'personal', label: t('common.personal'), color: '#00f2fe', icon: <Sparkles size={15} /> },
            { id: 'couple', label: t('common.couple'), color: '#f857a6', icon: <Heart size={15} /> },
            { id: 'partner', label: t('common.partner'), color: '#39ff14', icon: <Users size={15} /> },
            { id: 'blog', label: t('common.blog'), color: '#4facfe', icon: <BookOpen size={15} /> }
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

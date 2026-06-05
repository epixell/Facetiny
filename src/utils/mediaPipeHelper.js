// src/utils/mediaPipeHelper.js
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

let faceLandmarkerInstance = null;

// Initialize MediaPipe Face Landmarker
export async function initFaceLandmarker() {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;

  try {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
    );
    
    faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU"
      },
      outputFaceBlendshapes: false,
      runningMode: "IMAGE"
    });
    
    return faceLandmarkerInstance;
  } catch (error) {
    console.error("MediaPipe 초기화 실패:", error);
    throw error;
  }
}

// Calculate the 11 raw facial metrics from landmarks
export function calculateMetrics(landmarks, canvasWidth, canvasHeight, ctx) {
  // landmarks is an array of {x, y, z} objects (normalized 0 to 1)
  
  // Helper to convert normalized coordinate to pixel coordinate
  const getPixel = (idx) => {
    const p = landmarks[idx];
    return {
      x: p.x * canvasWidth,
      y: p.y * canvasHeight,
      z: p.z // z is usually normalized differently, but we can use it for relative depth
    };
  };

  // Extract key landmark points
  const p10 = getPixel(10);   // Forehead top center (hairline)
  const p152 = getPixel(152); // Chin bottom
  const p168 = getPixel(168); // Between brows (Myeonggung / 인당)
  const p6 = getPixel(6);     // Nose bridge center (San-geun)
  const p4 = getPixel(4);     // Nose tip (Jaebaekgung)
  
  // Eyes
  const p133 = getPixel(133); // Left eye inner
  const p33 = getPixel(33);   // Left eye outer
  const p159 = getPixel(159); // Left eye top
  const p145 = getPixel(145); // Left eye bottom
  
  const p362 = getPixel(362); // Right eye inner
  const p263 = getPixel(263); // Right eye outer
  const p386 = getPixel(386); // Right eye top
  const p374 = getPixel(374); // Right eye bottom
  
  // Eyebrows
  const p55 = getPixel(55);   // Left eyebrow inner
  const p105 = getPixel(105); // Left eyebrow outer
  const p285 = getPixel(285); // Right eyebrow inner
  const p334 = getPixel(334); // Right eyebrow outer
  
  // Cheekbones & Jaw
  const p234 = getPixel(234); // Left cheekbone outer
  const p454 = getPixel(454); // Right cheekbone outer
  const p172 = getPixel(172); // Left jaw angle
  const p397 = getPixel(397); // Right jaw angle

  // Nose base
  const p64 = getPixel(64);   // Nose left
  const p294 = getPixel(294); // Nose right
  
  // Mouth
  const p61 = getPixel(61);   // Mouth left corner
  const p291 = getPixel(291); // Mouth right corner
  const p0 = getPixel(0);     // Mouth top center
  const p17 = getPixel(17);   // Mouth bottom center

  // 1. General face width and height
  const faceWidth = Math.sqrt(Math.pow(p454.x - p234.x, 2) + Math.pow(p454.y - p234.y, 2));
  const faceHeight = Math.sqrt(Math.pow(p152.x - p10.x, 2) + Math.pow(p152.y - p10.y, 2));

  // --- CALCULATION FORMULAS ---

  // 1. face_aspect_ratio (Width/Height)
  const face_aspect_ratio = faceWidth / faceHeight;

  // 2. jaw_sharpness (Jaw Width/Cheek Width)
  const jawWidth = Math.sqrt(Math.pow(p397.x - p172.x, 2) + Math.pow(p397.y - p172.y, 2));
  const jaw_sharpness = jawWidth / faceWidth;

  // 3. forehead_height (Forehead / FaceHeight %)
  const foreheadHeightY = Math.abs(p168.y - p10.y);
  const forehead_height = (foreheadHeightY / faceHeight) * 100;

  // 4. eyebrow_slant (Average slant in degrees)
  // Left side screen outer is p105, inner is p55.
  const leftEyebrowAngle = Math.atan2(p55.y - p105.y, Math.abs(p55.x - p105.x)) * (180 / Math.PI);
  // Right side screen outer is p334, inner is p285.
  const rightEyebrowAngle = Math.atan2(p285.y - p334.y, Math.abs(p285.x - p334.x)) * (180 / Math.PI);
  const eyebrow_slant = (leftEyebrowAngle + rightEyebrowAngle) / 2;

  // 5. eyebrow_distance (Relative to eye width)
  const leftEyeWidth = Math.abs(p133.x - p33.x);
  const rightEyeWidth = Math.abs(p263.x - p362.x);
  const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2;
  const eyebrowDist = Math.sqrt(Math.pow(p285.x - p55.x, 2) + Math.pow(p285.y - p55.y, 2));
  const eyebrow_distance = eyebrowDist / avgEyeWidth;

  // 6. eye_slant (Average angle of eyes in degrees)
  // Left eye outer 33, inner 133
  const leftEyeAngle = Math.atan2(p133.y - p33.y, Math.abs(p133.x - p33.x)) * (180 / Math.PI);
  // Right eye outer 263, inner 362
  const rightEyeAngle = Math.atan2(p285.y - p334.y, Math.abs(p285.x - p334.x)) * (180 / Math.PI); // Let's use 362 & 263
  const rightEyeAngleReal = Math.atan2(p362.y - p263.y, Math.abs(p362.x - p263.x)) * (180 / Math.PI);
  const eye_slant = (leftEyeAngle + rightEyeAngleReal) / 2;

  // 7. eye_openness (Height / Width ratio)
  const leftEyeHeight = Math.abs(p145.y - p159.y);
  const rightEyeHeight = Math.abs(p374.y - p386.y);
  const eye_openness = ((leftEyeHeight / leftEyeWidth) + (rightEyeHeight / rightEyeWidth)) / 2;

  // 8. nose_length (Nose length / FaceHeight %)
  const noseLengthY = Math.abs(p4.y - p168.y);
  const nose_length = (noseLengthY / faceHeight) * 100;

  // 9. nose_width (Nose base width / FaceWidth %)
  const noseWidthX = Math.sqrt(Math.pow(p294.x - p64.x, 2) + Math.pow(p294.y - p64.y, 2));
  const nose_width = (noseWidthX / faceWidth) * 100;

  // 10. mouth_corner_slant (Upturn ratio)
  const mouthCenterY = (p0.y + p17.y) / 2;
  const mouthWidthX = Math.sqrt(Math.pow(p291.x - p61.x, 2) + Math.pow(p291.y - p61.y, 2));
  const leftCornerSlant = (mouthCenterY - p61.y) / mouthWidthX;
  const rightCornerSlant = (mouthCenterY - p291.y) / mouthWidthX;
  const mouth_corner_slant = (leftCornerSlant + rightCornerSlant) / 2;

  // 11. mouth_width (Mouth Width / FaceWidth %)
  const mouth_width = (mouthWidthX / faceWidth) * 100;

  // --- 3D PEAK & DETECT VOLUME (오악 균형) ---
  // Compare Z-depths relative to nose tip. Note: MediaPipe Z is normalized, negative is closer to camera.
  // We want to calculate the relative volume.
  const noseZ = landmarks[4].z;
  const foreheadZ = landmarks[10].z;
  const chinZ = landmarks[152].z;
  const leftCheekZ = landmarks[234].z;
  const rightCheekZ = landmarks[454].z;
  
  // Z-depth gap (positive if nose stands out more)
  const foreheadGap = foreheadZ - noseZ; // e.g. -0.05 - (-0.12) = 0.07
  const chinGap = chinZ - noseZ;
  const leftCheekGap = leftCheekZ - noseZ;
  const rightCheekGap = rightCheekZ - noseZ;
  const avgSurroundingGap = (foreheadGap + chinGap + leftCheekGap + rightCheekGap) / 4;
  
  // Peak score (0 to 100): High gap means sharp isolated nose (고봉고산), low gap means flat.
  // Balanced nose score is around 0.05 to 0.12 of normalized Z scale.
  let peakStatus = "balanced"; // balanced, isolated (고봉고산), flat (평평함)
  if (avgSurroundingGap > 0.14) {
    peakStatus = "isolated"; // 고봉고산
  } else if (avgSurroundingGap < 0.06) {
    peakStatus = "flat";
  }

  // --- PIXEL COLOR & BRIGHTNESS ANALYSIS (기색 분석) ---
  let myeonggungColor = { r: 200, g: 200, b: 200, brightness: 75, redFactor: 1.0 };
  let jaebaekgungColor = { r: 200, g: 200, b: 200, brightness: 75, redFactor: 1.0 };

  if (ctx) {
    myeonggungColor = samplePixelColor(ctx, p168.x, p168.y);
    jaebaekgungColor = samplePixelColor(ctx, p4.x, p4.y);
  }

  return {
    raw: {
      face_aspect_ratio,
      jaw_sharpness,
      forehead_height,
      eyebrow_slant,
      eyebrow_distance,
      eye_slant,
      eye_openness,
      nose_length,
      nose_width,
      mouth_corner_slant,
      mouth_width
    },
    derived: {
      samjeong: {
        sj: (foreheadHeightY / (foreheadHeightY + noseLengthY + Math.abs(p152.y - p4.y))) * 100,
        jj: (noseLengthY / (foreheadHeightY + noseLengthY + Math.abs(p152.y - p4.y))) * 100,
        hj: (Math.abs(p152.y - p4.y) / (foreheadHeightY + noseLengthY + Math.abs(p152.y - p4.y))) * 100
      },
      peaks: {
        averageZGap: avgSurroundingGap,
        status: peakStatus
      },
      stars: {
        myeonggung: myeonggungColor,
        jaebaekgung: jaebaekgungColor
      }
    }
  };
}

// Sample average color in a 7x7 grid and return HSL & brightness properties
function samplePixelColor(ctx, x, y) {
  try {
    const size = 5;
    const startX = Math.max(0, Math.round(x - size / 2));
    const startY = Math.max(0, Math.round(y - size / 2));
    const imgData = ctx.getImageData(startX, startY, size, size);
    const data = imgData.data;

    let rSum = 0, gSum = 0, bSum = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i];
      gSum += data[i+1];
      bSum += data[i+2];
      count++;
    }

    const r = Math.round(rSum / count);
    const g = Math.round(gSum / count);
    const b = Math.round(bSum / count);

    // Calculate relative luminance (brightness) 0 to 100
    const brightness = Math.round((0.299 * r + 0.587 * g + 0.114 * b) / 2.55);

    // Calculate redness factor (R/G ratio) - if high, it signifies congestion/redness
    const redFactor = g > 0 ? r / g : 1;

    return { r, g, b, brightness, redFactor };
  } catch (e) {
    console.warn("Pixel sampling failed:", e);
    return { r: 220, g: 200, b: 190, brightness: 75, redFactor: 1.1 };
  }
}

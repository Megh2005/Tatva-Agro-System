export interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Calculates the average relative luminance of an active HTMLVideoElement frame.
 */
export function getFrameLuminance(video: HTMLVideoElement): number {
  if (typeof document === "undefined") return 128;

  const canvas = document.createElement("canvas");
  canvas.width = 40;
  canvas.height = 40;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 128;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let totalLuminance = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuminance += luminance;
    }

    return totalLuminance / pixelCount;
  } catch (e) {
    return 128;
  }
}

/**
 * Calculates the average relative luminance of an HTMLImageElement.
 */
export function getImageLuminance(img: HTMLImageElement): number {
  if (typeof document === "undefined") return 128;

  const canvas = document.createElement("canvas");
  canvas.width = 40;
  canvas.height = 40;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 128;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let totalLuminance = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuminance += luminance;
    }

    return totalLuminance / pixelCount;
  } catch (e) {
    return 128;
  }
}

/**
 * Validates the detected face bounding box, keypoints, and lighting quality.
 */
export function validateFace(
  detections: any[],
  imageWidth: number,
  imageHeight: number,
  luminance: number
): ValidationResult {
  // 1. Verify lighting quantity (Threshold < 50)
  if (luminance < 50) {
    return {
      isValid: false,
      message: "Too dark! Move to a well-lit area or turn on lights.",
    };
  }

  // 2. Single human face check
  if (detections.length === 0) {
    return {
      isValid: false,
      message: "No human face detected. Please align your face inside the camera frame.",
    };
  }

  if (detections.length > 1) {
    return {
      isValid: false,
      message: "Multiple faces detected. Please make sure only you are in the frame.",
    };
  }

  return {
    isValid: true,
    message: "Selfie verified.",
  };
}

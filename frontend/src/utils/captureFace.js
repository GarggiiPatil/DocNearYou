import * as faceapi from 'face-api.js';

export const captureFaceDescriptor = async (videoRef) => {
  const detection = await faceapi
    .detectSingleFace(videoRef, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error('No face detected. Please ensure good lighting.');
  }

  return Array.from(detection.descriptor);
};

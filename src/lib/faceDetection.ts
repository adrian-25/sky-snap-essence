// faceDetection.ts — Face detection and embedding extraction using face-api.js
// This file isolates all face-api.js browser logic.
import * as faceapi from 'face-api.js';

/**
 * Load required face-api models. Must be called once before any detection. 
 * Returns a promise.
 */
export async function loadFaceModels(modelUrl: string) {
  // Models: TinyFaceDetector for speed, FaceLandmark68Net + FaceRecognitionNet for embeddings.
  await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
  await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
  await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
}

/**
 * Given an HTMLImageElement, canvas, or video, detect faces and return embedding descriptors.
 * Returns: Array of { embedding: number[], box: box coordinates }.
 */
export async function detectFacesAndEmbeddings(image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement) {
  const detections = await faceapi.detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();
  return detections.map(det => ({
    embedding: Array.from(det.descriptor), // Float32Array → number[]
    box: det.detection.box // { x, y, width, height }
  }));
}

/**
 * Optional: Utility for comparing embeddings (e.g., Euclidean distance)
 */
export function embeddingDistance(e1: number[], e2: number[]) {
  return Math.sqrt(e1.reduce((sum, val, i) => sum + (val - e2[i]) ** 2, 0));
}

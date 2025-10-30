import { embeddingDistance } from './faceDetection';

/**
 * Compare two face embeddings. Cosine similarity (1 = identical, 0 = orthogonal, -1 = opposite).
 */
export function compareEmbeddingCosine(e1: number[], e2: number[]): number {
  const dot = e1.reduce((acc, v, i) => acc + v * e2[i], 0);
  const norm1 = Math.sqrt(e1.reduce((acc, v) => acc + v * v, 0));
  const norm2 = Math.sqrt(e2.reduce((acc, v) => acc + v * v, 0));
  return dot / (norm1 * norm2);
}

/**
 * Given an embedding and an array of cluster centers ({id, embedding}), find best match if similarity > threshold.
 * Returns: clusterId or null
 */
export function findBestCluster(
  newEmbedding: number[],
  clusters: {id: string, embedding: number[]}[],
  threshold = 0.8
): string | null {
  let best = null;
  let bestScore = -1;
  for (const group of clusters) {
    const sim = compareEmbeddingCosine(newEmbedding, group.embedding);
    if (sim > bestScore && sim >= threshold) {
      best = group.id;
      bestScore = sim;
    }
  }
  return best;
}

/**
 * Generate a new cluster/album ID (use random UUID, placeholder for demo)
 */
export function createNewClusterId() {
  return crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now());
}

export interface ClusteringResult {
  clusters: number[][];
  centroids: number[][];
  labels: number[];
  inertia: number;
  steps?: ClusteringStep[];
  method?: string;
  dendrogramData?: DendrogramNode;
  initialDistanceMatrix?: number[][];
  finalDistance?: number;
}

export interface ClusteringStep {
  step: number;
  action: string;
  clusters: number[][];
  clusterLabels?: string[];
  distances: number[][];
  mergedClusters?: [number, number];
  minDistance?: number;
  minDistanceIndices?: [number, number];
  newCentroid?: number[];
  description: string;
  detailedDescription?: string;
  remainingClusters?: number;
}

export interface DendrogramNode {
  name: string;
  children?: DendrogramNode[];
  distance?: number;
  height?: number;
}


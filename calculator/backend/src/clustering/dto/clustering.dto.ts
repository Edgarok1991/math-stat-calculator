export class ClusteringDto {
  points: number[][];
  k: number;
  method: 'kmeans' | 'hierarchical' | 'single' | 'complete' | 'average';
}


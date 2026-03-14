import { Injectable } from '@nestjs/common';
import { ClusteringDto } from './dto/clustering.dto';
import { ClusteringResult, ClusteringStep } from './interfaces/clustering-result.interface';

@Injectable()
export class ClusteringService {
  calculateClustering(data: ClusteringDto): ClusteringResult {
    const { points, k, method } = data;

    if (points.length < k) {
      throw new Error('Количество точек должно быть больше количества кластеров');
    }

    switch (method) {
      case 'kmeans':
        return this.kMeansClustering(points, k);
      case 'hierarchical':
        return this.hierarchicalClustering(points, k, 'single');
      case 'single':
        return this.hierarchicalClustering(points, k, 'single');
      case 'complete':
        return this.hierarchicalClustering(points, k, 'complete');
      case 'average':
        return this.hierarchicalClustering(points, k, 'average');
      default:
        throw new Error('Неподдерживаемый метод кластеризации');
    }
  }

  private kMeansClustering(points: number[][], k: number): ClusteringResult {
    const n = points.length;
    const dimensions = points[0].length;
    
    // Инициализация центроидов случайным образом
    let centroids = this.initializeCentroids(points, k);
    let labels = new Array(n).fill(0);
    let prevLabels = new Array(n).fill(-1);
    let iterations = 0;
    const maxIterations = 100;

    while (!this.arraysEqual(labels, prevLabels) && iterations < maxIterations) {
      prevLabels = [...labels];
      
      // Назначение точек к ближайшим центроидам
      for (let i = 0; i < n; i++) {
        let minDistance = Infinity;
        let closestCentroid = 0;
        
        for (let j = 0; j < k; j++) {
          const distance = this.euclideanDistance(points[i], centroids[j]);
          if (distance < minDistance) {
            minDistance = distance;
            closestCentroid = j;
          }
        }
        labels[i] = closestCentroid;
      }
      
      // Обновление центроидов
      for (let j = 0; j < k; j++) {
        const clusterPoints = points.filter((_, i) => labels[i] === j);
        if (clusterPoints.length > 0) {
          centroids[j] = this.calculateCentroid(clusterPoints);
        }
      }
      
      iterations++;
    }

    // Группировка точек по кластерам
    const clusters: number[][] = Array(k).fill(null).map(() => []);
    for (let i = 0; i < n; i++) {
      clusters[labels[i]].push(i);
    }

    // Вычисление инерции
    const inertia = this.calculateInertia(points, centroids, labels);

    return {
      clusters,
      centroids,
      labels,
      inertia,
    };
  }

  private hierarchicalClustering(points: number[][], k: number, linkage: 'single' | 'complete' | 'average'): ClusteringResult {
    const n = points.length;
    const steps: ClusteringStep[] = [];
    const clusters = points.map((_, i) => [i]);
    const clusterCentroids = [...points];
    let stepNumber = 0;
    const mergeHistory: Array<{ cluster1: number, cluster2: number, distance: number, height: number }> = [];

    const initialDistanceMatrix = this.calculateDistanceMatrix(points);
    
    // Начальное состояние
    const clusterLabels = clusters.map((c, i) => `S(${c.map(idx => idx + 1).join(',')})`);
    steps.push({
      step: stepNumber++,
      action: 'initialization',
      clusters: clusters.map(c => [...c]),
      clusterLabels: [...clusterLabels],
      distances: initialDistanceMatrix,
      description: `Инициализация`,
      detailedDescription: `Создана начальная матрица расстояний для ${n} объектов. Каждый объект является отдельным кластером.`,
      remainingClusters: clusters.length
    });

    let currentHeight = 0;

    while (clusters.length > k) {
      // Вычисление текущей матрицы расстояний
      const currentDistances = this.calculateClusterDistanceMatrix(clusters, points, linkage);
      
      // Поиск ближайших кластеров
      let minDistance = Infinity;
      let cluster1 = 0;
      let cluster2 = 0;

      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const distance = currentDistances[i][j];
          if (distance < minDistance && distance > 0) {
            minDistance = distance;
            cluster1 = i;
            cluster2 = j;
          }
        }
      }

      // Сохранение информации для дендрограммы
      currentHeight += minDistance;
      mergeHistory.push({
        cluster1,
        cluster2,
        distance: minDistance,
        height: currentHeight
      });

      const oldClusterLabels = [...clusterLabels];
      const oldCluster1 = [...clusters[cluster1]];
      const oldCluster2 = [...clusters[cluster2]];

      // Объединение кластеров
      const mergedCluster = [...clusters[cluster1], ...clusters[cluster2]];
      clusters[cluster1] = mergedCluster;
      clusters.splice(cluster2, 1);
      
      // Обновление меток кластеров
      clusterLabels[cluster1] = `S(${mergedCluster.map(idx => idx + 1).join(',')})`;
      clusterLabels.splice(cluster2, 1);
      
      // Обновление центроида
      const newCentroid = this.calculateCentroid(mergedCluster.map(i => points[i]));
      clusterCentroids[cluster1] = newCentroid;
      clusterCentroids.splice(cluster2, 1);

      // Добавление шага
      const methodName = linkage === 'single' ? 'ближнего соседа' : 
                        linkage === 'complete' ? 'дальнего соседа' : 'среднего';
      
      const detailedDescription = this.generateDetailedDescription(
        oldCluster1, 
        oldCluster2, 
        minDistance, 
        methodName, 
        clusters.length,
        oldClusterLabels[cluster1],
        oldClusterLabels[cluster2]
      );
      
      steps.push({
        step: stepNumber++,
        action: 'merge',
        clusters: clusters.map(c => [...c]),
        clusterLabels: [...clusterLabels],
        distances: this.calculateClusterDistanceMatrix(clusters, points, linkage),
        mergedClusters: [cluster1, cluster2],
        minDistance: minDistance,
        minDistanceIndices: [cluster1, cluster2],
        newCentroid: [...newCentroid],
        description: `Объединение кластеров методом ${methodName}`,
        detailedDescription: detailedDescription,
        remainingClusters: clusters.length
      });
    }

    // Создание массива меток
    const labels = new Array(n);
    for (let i = 0; i < clusters.length; i++) {
      for (const pointIndex of clusters[i]) {
        labels[pointIndex] = i;
      }
    }

    // Пересчёт центроидов для финальных кластеров
    const centroids: number[][] = [];
    for (let i = 0; i < clusters.length; i++) {
      const clusterPoints = clusters[i].map(idx => points[idx]);
      centroids.push(this.calculateCentroid(clusterPoints));
    }
    
    const inertia = this.calculateInertia(points, centroids, labels);

    // Построение дендрограммы
    const dendrogramData = this.buildDendrogram(points, mergeHistory);

    // Вычисление финального расстояния между кластерами
    let finalDistance = 0;
    if (clusters.length === k && k > 1) {
      // Расстояние между финальными кластерами
      finalDistance = this.calculateClusterDistance(clusters[0], clusters[1], points, linkage);
    } else if (mergeHistory.length > 0) {
      finalDistance = mergeHistory[mergeHistory.length - 1].distance;
    }

    return {
      clusters,
      centroids,
      labels,
      inertia,
      steps,
      method: linkage,
      dendrogramData,
      initialDistanceMatrix,
      finalDistance
    };
  }

  private generateDetailedDescription(
    cluster1: number[], 
    cluster2: number[], 
    distance: number, 
    methodName: string,
    remainingClusters: number,
    label1: string,
    label2: string
  ): string {
    const cluster1Str = cluster1.map(i => i + 1).join(', ');
    const cluster2Str = cluster2.map(i => i + 1).join(', ');
    
    return `Из матрицы расстояний следует, что объекты ${label1} и ${label2} наиболее близки (P = ${distance.toFixed(2)}) и поэтому объединяются в один кластер. При формировании новой матрицы расстояний методом ${methodName}, выбираем соответствующее значение расстояния. В результате имеем ${remainingClusters} кластера.`;
  }

  private buildDendrogram(points: number[][], mergeHistory: Array<{ cluster1: number, cluster2: number, distance: number, height: number }>): any {
    const nodes: any[] = points.map((_, i) => ({
      name: `Объект ${i + 1}`,
      height: 0
    }));

    for (const merge of mergeHistory) {
      const newNode = {
        name: `Кластер`,
        children: [nodes[merge.cluster1], nodes[merge.cluster2]],
        distance: merge.distance,
        height: merge.height
      };
      nodes[merge.cluster1] = newNode;
      nodes.splice(merge.cluster2, 1);
    }

    return nodes[0];
  }

  private initializeCentroids(points: number[][], k: number): number[][] {
    const centroids: number[][] = [];
    const used = new Set<number>();
    
    for (let i = 0; i < k; i++) {
      let randomIndex: number;
      do {
        randomIndex = Math.floor(Math.random() * points.length);
      } while (used.has(randomIndex));
      
      used.add(randomIndex);
      centroids.push([...points[randomIndex]]);
    }
    
    return centroids;
  }

  private euclideanDistance(point1: number[], point2: number[]): number {
    if (!point1 || !point2 || point1.length === 0 || point2.length === 0) {
      return 0;
    }
    let sum = 0;
    const minLength = Math.min(point1.length, point2.length);
    for (let i = 0; i < minLength; i++) {
      sum += Math.pow(point1[i] - point2[i], 2);
    }
    return Math.sqrt(sum);
  }

  private calculateCentroid(points: number[][]): number[] {
    const dimensions = points[0].length;
    const centroid = new Array(dimensions).fill(0);
    
    for (const point of points) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += point[i];
      }
    }
    
    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= points.length;
    }
    
    return centroid;
  }

  private calculateDistanceMatrix(points: number[][]): number[][] {
    const n = points.length;
    const distances = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const distance = this.euclideanDistance(points[i], points[j]);
        distances[i][j] = distance;
        distances[j][i] = distance;
      }
    }
    
    return distances;
  }

  private calculateInertia(points: number[][], centroids: number[][], labels: number[]): number {
    let inertia = 0;
    for (let i = 0; i < points.length; i++) {
      const centroid = centroids[labels[i]];
      if (centroid && points[i]) {
        const distance = this.euclideanDistance(points[i], centroid);
        inertia += distance * distance;
      }
    }
    return inertia;
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  private calculateClusterDistance(
    cluster1: number[], 
    cluster2: number[], 
    points: number[][], 
    linkage: 'single' | 'complete' | 'average'
  ): number {
    const distances: number[] = [];
    
    for (const point1 of cluster1) {
      for (const point2 of cluster2) {
        distances.push(this.euclideanDistance(points[point1], points[point2]));
      }
    }

    switch (linkage) {
      case 'single':
        return Math.min(...distances);
      case 'complete':
        return Math.max(...distances);
      case 'average':
        return distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
      default:
        return Math.min(...distances);
    }
  }

  private calculateClusterDistanceMatrix(
    clusters: number[][], 
    points: number[][], 
    linkage: 'single' | 'complete' | 'average'
  ): number[][] {
    const n = clusters.length;
    const distances = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const distance = this.calculateClusterDistance(clusters[i], clusters[j], points, linkage);
        distances[i][j] = distance;
        distances[j][i] = distance;
      }
    }
    
    return distances;
  }
}


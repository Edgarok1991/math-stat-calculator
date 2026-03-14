import { makeAutoObservable } from 'mobx';

export interface CalculationResult {
  id: string;
  type: string;
  input: unknown;
  result: unknown;
  timestamp: Date;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

class CalculatorStore {
  calculations: CalculationResult[] = [];
  currentCalculation: CalculationResult | null = null;
  isLoading = false;
  error: string | null = null;
  pagination: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
  };

  constructor() {
    makeAutoObservable(this);
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  addCalculation(calculation: Omit<CalculationResult, 'id' | 'timestamp'>) {
    const newCalculation: CalculationResult = {
      ...calculation,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    this.calculations.unshift(newCalculation);
    this.pagination.totalItems = this.calculations.length;
  }

  setCurrentCalculation(calculation: CalculationResult | null) {
    this.currentCalculation = calculation;
  }

  setPagination(pagination: Partial<PaginationState>) {
    this.pagination = { ...this.pagination, ...pagination };
  }

  get paginatedCalculations() {
    const start = (this.pagination.currentPage - 1) * this.pagination.pageSize;
    const end = start + this.pagination.pageSize;
    return this.calculations.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.pagination.totalItems / this.pagination.pageSize);
  }

  clearCalculations() {
    this.calculations = [];
    this.pagination.totalItems = 0;
    this.pagination.currentPage = 1;
  }
}

export const calculatorStore = new CalculatorStore();


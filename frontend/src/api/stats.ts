import api from './client';
import type { Question } from '../types';

export const statsApi = {
  getHeatmap(year?: number): Promise<{ data: Record<string, number> }> {
    return api.get('/stats/heatmap', { params: year ? { year } : {} });
  },

  getDailyQuestions(date: string): Promise<{ data: Question[] }> {
    return api.get('/stats/daily', { params: { date } });
  },
};

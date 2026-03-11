import api from './client';
import type { Question } from '../types';

export interface DailyActivity {
  created: Question[];
  resolved: Question[];
}

export const statsApi = {
  getHeatmap(year?: number): Promise<{ data: Record<string, number> }> {
    return api.get('/stats/heatmap', { params: year ? { year } : {} });
  },

  getDailyActivity(date: string): Promise<{ data: DailyActivity }> {
    return api.get('/stats/daily', { params: { date } });
  },
};

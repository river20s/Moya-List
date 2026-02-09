import api from './client';
import type { Question, QuestionRequest, Page } from '../types';

export interface QuestionSearchParams {
  keyword?: string;
  tagId?: number;
  isResolved?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const questionApi = {
  getAll(params?: QuestionSearchParams) {
    return api.get<Page<Question>>('/questions', { params });
  },

  getById(id: number) {
    return api.get<Question>(`/questions/${id}`);
  },

  create(data: QuestionRequest) {
    return api.post<Question>('/questions', data);
  },

  update(id: number, data: QuestionRequest) {
    return api.put<Question>(`/questions/${id}`, data);
  },

  toggleResolve(id: number) {
    return api.patch<Question>(`/questions/${id}/resolve`);
  },

  delete(id: number) {
    return api.delete(`/questions/${id}`);
  },
};

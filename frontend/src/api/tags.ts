import api from './client';
import type { Tag, TagRequest, Question } from '../types';

export const tagApi = {
  getAll() {
    return api.get<Tag[]>('/tags');
  },

  getById(id: number) {
    return api.get<Tag>(`/tags/${id}`);
  },

  create(data: TagRequest) {
    return api.post<Tag>('/tags', data);
  },

  update(id: number, data: { name?: string; color?: string }) {
    return api.put<Tag>(`/tags/${id}`, data);
  },

  delete(id: number) {
    return api.delete(`/tags/${id}`);
  },

  getQuestions(id: number) {
    return api.get<Question[]>(`/tags/${id}/questions`);
  },
};

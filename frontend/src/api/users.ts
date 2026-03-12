import api from './client';
import type { User } from '../types';

export interface UserUpdatePayload {
  name: string;
}

export const userApi = {
  getById(id: number) {
    return api.get<User>(`/users/${id}`);
  },

  update(id: number, data: UserUpdatePayload) {
    return api.put<User>(`/users/${id}`, data);
  },

  delete(id: number) {
    return api.delete(`/users/${id}`);
  },
};

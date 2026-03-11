export interface GuestQuestion {
  id: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  isResolved: boolean;
  createdAt: string;
}

const KEY = 'guest_questions';

export const guestStorage = {
  getAll(): GuestQuestion[] {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  },

  add(data: Pick<GuestQuestion, 'title' | 'description' | 'sourceUrl'>): GuestQuestion {
    const all = guestStorage.getAll();
    const q: GuestQuestion = {
      id: `guest_${Date.now()}`,
      title: data.title,
      description: data.description,
      sourceUrl: data.sourceUrl,
      isResolved: false,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify([q, ...all]));
    return q;
  },

  toggleResolve(id: string): GuestQuestion | null {
    const all = guestStorage.getAll();
    const idx = all.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], isResolved: !all[idx].isResolved };
    localStorage.setItem(KEY, JSON.stringify(all));
    return all[idx];
  },

  delete(id: string): void {
    localStorage.setItem(KEY, JSON.stringify(guestStorage.getAll().filter((q) => q.id !== id)));
  },

  clear(): void {
    localStorage.removeItem(KEY);
  },
};

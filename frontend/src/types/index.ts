// Tag 관련 타입
export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface TagRequest {
  name: string;
  color?: string;
}

// Question 관련 타입
export interface Question {
  id: number;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string | null;
  tags: Tag[];
}

export interface QuestionRequest {
  title: string;
  description?: string;
  sourceUrl?: string;
  tagIds?: number[];
}

// User 관련 타입
export interface User {
  id: number;
  name: string;
  email: string;
  profileUrl: string | null;
}

// 페이지네이션 응답 타입
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// 통계 타입
export interface TagStats {
  tagId: number;
  tagName: string;
  count: number;
}

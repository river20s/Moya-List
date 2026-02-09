import { useState } from 'react';
import { Plus } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import QuestionCard from '../components/QuestionCard';
import type { Question } from '../types';

// TODO: 실제 API 연동
const mockQuestions: Question[] = [
  {
    id: 1,
    title: 'Spring Security에서 JWT 토큰 검증은 어떻게 하지?',
    description: 'JWT 토큰을 사용한 인증 방식에서 토큰 검증 로직을 어디에 넣어야 할지 모르겠다.',
    sourceUrl: null,
    isResolved: false,
    createdAt: '2024-01-25T10:00:00',
    updatedAt: null,
    tags: [
      { id: 1, name: 'Spring', color: '#CAD3C0' },
      { id: 4, name: 'Security', color: '#EBD8DC' },
    ],
  },
  {
    id: 2,
    title: 'React에서 useEffect 의존성 배열이 뭐야?',
    description: null,
    sourceUrl: 'https://react.dev/reference/react/useEffect',
    isResolved: true,
    createdAt: '2024-01-24T15:30:00',
    updatedAt: '2024-01-25T09:00:00',
    tags: [
      { id: 2, name: 'React', color: '#D4E4F1' },
    ],
  },
  {
    id: 3,
    title: 'JPA N+1 문제 해결 방법',
    description: '연관관계 조회 시 N+1 쿼리가 발생하는데, fetch join이나 EntityGraph로 해결할 수 있다고 한다.',
    sourceUrl: null,
    isResolved: false,
    createdAt: '2024-01-23T11:20:00',
    updatedAt: null,
    tags: [
      { id: 3, name: 'Database', color: '#F5EBC8' },
      { id: 1, name: 'Spring', color: '#CAD3C0' },
    ],
  },
];

function QuestionListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved'>('all');

  // 필터링 로직
  const filteredQuestions = mockQuestions.filter((q) => {
    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = q.title.toLowerCase().includes(query);
      const matchDesc = q.description?.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc) return false;
    }

    // 상태 필터
    if (statusFilter === 'solved' && !q.isResolved) return false;
    if (statusFilter === 'unsolved' && q.isResolved) return false;

    return true;
  });

  const handleToggleResolved = (id: number) => {
    // TODO: API 연동
    console.log('Toggle resolved:', id);
  };

  const handleDelete = (id: number) => {
    // TODO: API 연동
    console.log('Delete:', id);
  };

  const handleQuestionClick = (question: Question) => {
    // TODO: 상세 모달 또는 페이지 이동
    console.log('Click:', question);
  };

  return (
    <div className="min-h-screen">
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        totalCount={filteredQuestions.length}
      />

      <div className="px-4 md:px-8 py-6">
        {filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] opacity-40">
            <Plus size={48} className="text-slate-400 mb-4" />
            <h2 className="text-2xl font-bold text-slate-400">
              {mockQuestions.length === 0 ? '첫 궁금증을 등록해보세요' : '검색 결과가 없습니다'}
            </h2>
            <p className="text-slate-400 mt-2">
              {mockQuestions.length === 0 ? '위 입력창에 입력 후 Enter를 누르세요' : '다른 검색어나 필터를 시도해보세요'}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {filteredQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onToggleResolved={handleToggleResolved}
                onDelete={handleDelete}
                onClick={handleQuestionClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* 플로팅 추가 버튼 */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-slate-700 text-white rounded-full shadow-lg hover:bg-slate-600 transition-colors flex items-center justify-center">
        <Plus size={24} />
      </button>
    </div>
  );
}

export default QuestionListPage;

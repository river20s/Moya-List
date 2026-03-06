import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import QuestionCard from '../components/QuestionCard';
import QuestionCreateModal from '../components/QuestionCreateModal';
import { questionApi } from '../api/questions';
import { tagApi } from '../api/tags';
import type { Question, Tag } from '../types';
import { useAuth } from '../context/AuthContext';

function QuestionListPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // URL 쿼리 파라미터에서 필터 상태 읽기
  const searchQuery = searchParams.get('keyword') || '';
  const statusParam = searchParams.get('status');
  const statusFilter: 'all' | 'solved' | 'unsolved' =
    statusParam === 'solved' || statusParam === 'unsolved' ? statusParam : 'all';
  const selectedTagId = searchParams.get('tagId') ? Number(searchParams.get('tagId')) : null;

  // 페이지네이션
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, unknown> = {
        page,
        size: 10,
        sort: 'createdAt,desc',
      };

      if (searchQuery.trim()) params.keyword = searchQuery.trim();
      if (statusFilter === 'solved') params.isResolved = true;
      if (statusFilter === 'unsolved') params.isResolved = false;
      if (selectedTagId) params.tagId = selectedTagId;

      const res = await questionApi.getAll(params);
      setQuestions(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch (err) {
      console.error('질문 목록 조회 실패:', err);
      setError('질문 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, selectedTagId]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await tagApi.getAll();
      setTags(res.data);
    } catch (err) {
      console.error('태그 목록 조회 실패:', err);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // 필터 변경 시 URL 쿼리 파라미터 업데이트
  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('page'); // 필터 변경 시 페이지 초기화
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    }
    setSearchParams(newParams);
    setPage(0);
  };

  const handleSearchChange = (query: string) => {
    updateParams({ keyword: query || null });
  };

  const handleStatusChange = (status: 'all' | 'solved' | 'unsolved') => {
    updateParams({ status: status === 'all' ? null : status });
  };

  const handleTagFilter = (tagId: number | null) => {
    updateParams({ tagId: tagId ? String(tagId) : null });
  };

  const handleToggleResolved = async (id: number) => {
    try {
      const res = await questionApi.toggleResolve(id);
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? res.data : q))
      );
    } catch (err) {
      console.error('해결 상태 변경 실패:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await questionApi.delete(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setTotalElements((prev) => prev - 1);
    } catch (err) {
      console.error('질문 삭제 실패:', err);
    }
  };

  const handleQuestionClick = (question: Question) => {
    // TODO: 상세 모달 또는 페이지 이동
    console.log('Click:', question);
  };

  const handleQuickAdd = async (quickTitle: string) => {
    if (!quickTitle.trim()) return;
    try {
      await questionApi.create({
        userId: user!.id,
        title: quickTitle.trim(),
      });
      fetchQuestions();
      fetchTags();
    } catch (err) {
      console.error('질문 등록 실패:', err);
    }
  };

  return (
    <div className="min-h-screen">
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        totalCount={totalElements}
        tags={tags}
        selectedTagId={selectedTagId}
        onTagFilter={handleTagFilter}
      />

      {/* 빠른 입력 창 */}
      <div className="px-4 md:px-8 pt-6">
        <div className="max-w-3xl mx-auto">
          <QuickInput onSubmit={handleQuickAdd} onDetailClick={() => setIsCreateModalOpen(true)} />
        </div>
      </div>

      <div className="px-4 md:px-8 py-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-slate-400 text-sm">불러오는 중...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={fetchQuestions}
              className="px-4 py-2 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] opacity-40">
            <Plus size={48} className="text-slate-400 mb-4" />
            <h2 className="text-2xl font-bold text-slate-400">
              {searchQuery || statusFilter !== 'all' || selectedTagId
                ? '검색 결과가 없습니다'
                : '첫 궁금증을 등록해보세요'}
            </h2>
            <p className="text-slate-400 mt-2">
              {searchQuery || statusFilter !== 'all' || selectedTagId
                ? '다른 검색어나 필터를 시도해보세요'
                : '아래 + 버튼을 눌러 시작하세요'}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onToggleResolved={handleToggleResolved}
                onDelete={handleDelete}
                onClick={handleQuestionClick}
              />
            ))}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-6">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-300/50 disabled:opacity-30 hover:bg-slate-200/50 transition-colors"
                >
                  이전
                </button>
                <span className="text-sm text-slate-500">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-300/50 disabled:opacity-30 hover:bg-slate-200/50 transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 플로팅 추가 버튼 */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-slate-700 text-white rounded-full shadow-lg hover:bg-slate-600 transition-colors flex items-center justify-center"
      >
        <Plus size={24} />
      </button>

      {/* 질문 등록 모달 */}
      <QuestionCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          fetchQuestions();
          fetchTags();
        }}
      />
    </div>
  );
}

// 빠른 입력 컴포넌트
function QuickInput({ onSubmit, onDetailClick }: { onSubmit: (title: string) => void; onDetailClick: () => void }) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value);
    setValue('');
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
        }}
        placeholder="궁금한 것을 빠르게 입력하세요..."
        className="flex-1 px-4 py-3 bg-white/50 border border-slate-300/50 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
      />
      <button
        onClick={onDetailClick}
        className="px-3 py-3 text-xs text-slate-500 hover:bg-slate-200/50 rounded-xl border border-slate-300/50 transition-colors whitespace-nowrap"
        title="상세 입력"
      >
        상세
      </button>
    </div>
  );
}

export default QuestionListPage;

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import QuestionCard from '../components/QuestionCard';
import { questionApi } from '../api/questions';
import { tagApi } from '../api/tags';
import type { Question, Tag } from '../types';

// TODO: 로그인 구현 후 실제 userId로 교체
const TEMP_USER_ID = 1;

function QuestionListPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

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

  // 검색어 변경 시 페이지 초기화
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleStatusChange = (status: 'all' | 'solved' | 'unsolved') => {
    setStatusFilter(status);
    setPage(0);
  };

  const handleTagFilter = (tagId: number | null) => {
    setSelectedTagId(tagId);
    setPage(0);
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

      <div className="px-4 md:px-8 py-6">
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
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-slate-700 text-white rounded-full shadow-lg hover:bg-slate-600 transition-colors flex items-center justify-center">
        <Plus size={24} />
      </button>
    </div>
  );
}

export default QuestionListPage;

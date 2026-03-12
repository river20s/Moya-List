import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Lightbulb, Trash2, Download, X } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import QuestionCard from '../components/QuestionCard';
import QuestionCreateModal from '../components/QuestionCreateModal';
import HashtagInput from '../components/HashtagInput';
import { questionApi } from '../api/questions';
import { tagApi } from '../api/tags';
import type { Question, Tag } from '../types';
import { useAuth } from '../context/AuthContext';
import { guestStorage, type GuestQuestion } from '../utils/guestStorage';
import { parseHashtags } from '../utils/parseHashtags';

// ─── 로그인 사용자용 ─────────────────────────────────────────────────────────

function AuthenticatedQuestionList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 게스트 이관 배너
  const [guestQuestions, setGuestQuestions] = useState<GuestQuestion[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [migrateError, setMigrateError] = useState(false);

  useEffect(() => {
    const saved = guestStorage.getAll();
    if (saved.length > 0) setGuestQuestions(saved);
  }, []);

  const searchQuery = searchParams.get('keyword') || '';
  const statusParam = searchParams.get('status');
  const statusFilter: 'all' | 'solved' | 'unsolved' =
    statusParam === 'solved' || statusParam === 'unsolved' ? statusParam : 'all';
  const selectedTagId = searchParams.get('tagId') ? Number(searchParams.get('tagId')) : null;

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = { page, size: 10, sort: 'createdAt,desc' };
      if (searchQuery.trim()) params.keyword = searchQuery.trim();
      if (statusFilter === 'solved') params.isResolved = true;
      if (statusFilter === 'unsolved') params.isResolved = false;
      if (selectedTagId) params.tagId = selectedTagId;

      const res = await questionApi.getAll(params);
      setQuestions(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch {
      setError('질문 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, selectedTagId]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await tagApi.getAll();
      setTags(res.data);
    } catch {
      // 태그 조회 실패는 조용히 처리
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);
  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrateError(false);
    try {
      await questionApi.migrateGuest(
        guestQuestions.map((q) => ({ title: q.title, description: q.description, sourceUrl: q.sourceUrl }))
      );
      guestStorage.clear();
      setGuestQuestions([]);
      fetchQuestions();
    } catch (err) {
      console.error('게스트 질문 이관 실패:', err);
      setMigrateError(true);
      // 배너는 유지 — 사용자가 재시도하거나 무시 선택 가능
    } finally {
      setMigrating(false);
    }
  };

  const handleDismiss = () => {
    guestStorage.clear();
    setGuestQuestions([]);
    setMigrateError(false);
  };

  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('page');
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) newParams.delete(key);
      else newParams.set(key, value);
    }
    setSearchParams(newParams);
    setPage(0);
  };

  const handleToggleResolved = async (id: number) => {
    try {
      const res = await questionApi.toggleResolve(id);
      setQuestions((prev) => prev.map((q) => (q.id === id ? res.data : q)));
    } catch {
      // 실패 시 조용히 처리
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await questionApi.delete(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setTotalElements((prev) => prev - 1);
    } catch {
      // 실패 시 조용히 처리
    }
  };

  const handleQuickAdd = async (title: string, tagNames: string[]) => {
    if (!title.trim()) return;
    try {
      // 태그명 → ID 변환 (없으면 자동 생성)
      const tagIds: number[] = [];
      for (const name of tagNames) {
        const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          tagIds.push(existing.id);
        } else {
          const res = await tagApi.create({ name });
          tagIds.push(res.data.id);
          setTags((prev) => [...prev, res.data]);
        }
      }
      await questionApi.create({ title: title.trim(), tagIds: tagIds.length > 0 ? tagIds : undefined });
      fetchQuestions();
    } catch {
      // 실패 시 조용히 처리
    }
  };

  return (
    <div className="min-h-screen">
      {/* 게스트 질문 이관 배너 */}
      {guestQuestions.length > 0 && (
        <div className={`px-4 md:px-8 py-3 border-b ${migrateError ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <p className={`text-sm ${migrateError ? 'text-red-700' : 'text-blue-700'}`}>
              {migrateError
                ? '불러오기에 실패했습니다. 다시 시도해 주세요.'
                : <>게스트 상태에서 작성한 질문이 <strong>{guestQuestions.length}개</strong> 있습니다. 계정으로 불러올까요?</>
              }
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-white text-xs rounded-lg disabled:opacity-50 transition-colors ${migrateError ? 'bg-red-500 hover:bg-red-400' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                <Download size={13} />
                {migrating ? '불러오는 중...' : (migrateError ? '다시 시도' : '불러오기')}
              </button>
              <button
                onClick={handleDismiss}
                className={`p-1.5 rounded-lg transition-colors ${migrateError ? 'text-red-400 hover:text-red-600 hover:bg-red-100' : 'text-blue-400 hover:text-blue-600 hover:bg-blue-100'}`}
                title="무시"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => updateParams({ keyword: q || null })}
        statusFilter={statusFilter}
        onStatusChange={(s) => updateParams({ status: s === 'all' ? null : s })}
        totalCount={totalElements}
        tags={tags}
        selectedTagId={selectedTagId}
        onTagFilter={(id) => updateParams({ tagId: id ? String(id) : null })}
      />

      <div className="px-4 md:px-8 pt-6">
        <div className="max-w-3xl mx-auto">
          <QuickInput onSubmit={handleQuickAdd} onDetailClick={() => setIsCreateModalOpen(true)} />
        </div>
      </div>

      <div className="px-4 md:px-8 py-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-slate-400 text-sm">불러오는 중...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button onClick={fetchQuestions} className="px-4 py-2 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
              다시 시도
            </button>
          </div>
        ) : questions.length === 0 ? (
          <EmptyState filtered={!!(searchQuery || statusFilter !== 'all' || selectedTagId)} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} onToggleResolved={handleToggleResolved} onDelete={handleDelete} onClick={(q) => navigate(`/questions/${q.id}`)} />
            ))}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-6">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 text-sm rounded-lg border border-slate-300/50 disabled:opacity-30 hover:bg-slate-200/50 transition-colors">이전</button>
                <span className="text-sm text-slate-500">{page + 1} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 text-sm rounded-lg border border-slate-300/50 disabled:opacity-30 hover:bg-slate-200/50 transition-colors">다음</button>
              </div>
            )}
          </div>
        )}
      </div>

      <button onClick={() => setIsCreateModalOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-slate-700 text-white rounded-full shadow-lg hover:bg-slate-600 transition-colors flex items-center justify-center">
        <Plus size={24} />
      </button>

      <QuestionCreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreated={() => { fetchQuestions(); fetchTags(); }} />
    </div>
  );
}

// ─── 게스트용 ─────────────────────────────────────────────────────────────────

function GuestQuestionList() {
  const [questions, setQuestions] = useState<GuestQuestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved'>('all');

  useEffect(() => {
    setQuestions(guestStorage.getAll());
  }, []);

  const handleQuickAdd = (title: string) => {
    if (!title.trim()) return;
    const q = guestStorage.add({ title: title.trim() });
    setQuestions((prev) => [q, ...prev]);
  };

  const handleToggle = (id: string) => {
    guestStorage.toggleResolve(id);
    setQuestions(guestStorage.getAll());
  };

  const handleDelete = (id: string) => {
    guestStorage.delete(id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const filtered = questions.filter((q) => {
    const matchKeyword = searchQuery.trim()
      ? q.title.includes(searchQuery) || (q.description ?? '').includes(searchQuery)
      : true;
    const matchStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'solved' ? q.isResolved :
      !q.isResolved;
    return matchKeyword && matchStatus;
  });

  return (
    <div className="min-h-screen">
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        totalCount={filtered.length}
        tags={[]}
        selectedTagId={null}
        onTagFilter={() => {}}
      />

      <div className="px-4 md:px-8 pt-6">
        <div className="max-w-3xl mx-auto">
          <QuickInput onSubmit={handleQuickAdd} />
        </div>
      </div>

      <div className="px-4 md:px-8 py-4">
        {filtered.length === 0 ? (
          <EmptyState filtered={!!(searchQuery || statusFilter !== 'all')} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {filtered.map((q) => (
              <GuestQuestionCard key={q.id} question={q} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 게스트 카드 ──────────────────────────────────────────────────────────────

function GuestQuestionCard({
  question,
  onToggle,
  onDelete,
}: {
  question: GuestQuestion;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 질문을 삭제하시겠습니까?')) onDelete(question.id);
  };

  return (
    <div className={`p-5 rounded-xl border transition-all ${question.isResolved ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' : 'bg-white/50 border-slate-300/50'}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-500">미분류</span>
        <button
          onClick={() => onToggle(question.id)}
          className={`transition-all ${question.isResolved ? 'text-yellow-500 hover:text-yellow-600' : 'text-slate-300 hover:text-slate-400'}`}
          title={question.isResolved ? '해결됨' : '미해결'}
        >
          <Lightbulb size={28} className={question.isResolved ? 'fill-yellow-500' : 'opacity-20 hover:opacity-40'} />
        </button>
      </div>
      <h3 className="font-medium text-slate-800 mb-2">{question.title}</h3>
      {question.description && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{question.description}</p>}
      <div className="flex justify-between items-end">
        <span className="text-[10px] text-slate-400">
          {new Date(question.createdAt).toLocaleDateString('ko-KR')}
        </span>
        <button onClick={handleDelete} className="text-slate-300 hover:text-red-400 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── 공통 컴포넌트 ────────────────────────────────────────────────────────────

function QuickInput({ onSubmit, onDetailClick }: { onSubmit: (title: string, tagNames: string[]) => void; onDetailClick?: () => void }) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!value.trim()) return;
    const { cleanTitle, tagNames } = parseHashtags(value);
    if (!cleanTitle) return;
    onSubmit(cleanTitle, tagNames);
    setValue('');
  };

  return (
    <div className="flex gap-2">
      <HashtagInput
        value={value}
        onChange={setValue}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        placeholder="궁금한 것을 빠르게 입력하세요... (#태그 로 태그 추가)"
        className="flex-1 bg-white/50 focus-within:bg-white transition-all"
        autoFocus
      />
      {onDetailClick && (
        <button onClick={onDetailClick} className="px-3 py-3 text-xs text-slate-500 hover:bg-slate-200/50 rounded-xl border border-slate-300/50 transition-colors whitespace-nowrap">
          상세
        </button>
      )}
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] opacity-40">
      <Plus size={48} className="text-slate-400 mb-4" />
      <h2 className="text-2xl font-bold text-slate-400">
        {filtered ? '검색 결과가 없습니다' : '첫 궁금증을 등록해보세요'}
      </h2>
      <p className="text-slate-400 mt-2">
        {filtered ? '다른 검색어나 필터를 시도해보세요' : '위 입력창에 궁금한 것을 입력하세요'}
      </p>
    </div>
  );
}

// ─── 진입점: 로그인 여부에 따라 분기 ─────────────────────────────────────────

function QuestionListPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <AuthenticatedQuestionList /> : <GuestQuestionList />;
}

export default QuestionListPage;

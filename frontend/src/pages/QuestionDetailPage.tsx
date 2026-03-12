import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb, Trash2, Pencil, Check, X, ExternalLink } from 'lucide-react';
import { questionApi } from '../api/questions';
import { tagApi } from '../api/tags';
import type { Question, Tag } from '../types';

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<Question | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 수정 모드
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  const [editTagIds, setEditTagIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // 태그 패널 열림 여부 (수정 모드에서 태그 선택)
  const [tagPanelOpen, setTagPanelOpen] = useState(false);

  useEffect(() => {
    const questionId = Number(id);
    if (!id || isNaN(questionId)) {
      setError('잘못된 접근입니다.');
      setLoading(false);
      return;
    }

    Promise.all([
      questionApi.getById(questionId),
      tagApi.getAll(),
    ])
      .then(([qRes, tRes]) => {
        setQuestion(qRes.data);
        setAllTags(tRes.data);
      })
      .catch(() => setError('질문을 불러오는데 실패했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEdit = () => {
    if (!question) return;
    setEditTitle(question.title);
    setEditDescription(question.description ?? '');
    setEditSourceUrl(question.sourceUrl ?? '');
    setEditTagIds(question.tags.map((t) => t.id));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTagPanelOpen(false);
  };

  const handleSave = async () => {
    if (!question || !editTitle.trim()) return;
    setSaving(true);
    try {
      const res = await questionApi.update(question.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        sourceUrl: editSourceUrl.trim() || undefined,
        tagIds: editTagIds,
      });
      setQuestion(res.data);
      setIsEditing(false);
      setTagPanelOpen(false);
    } catch {
      // 실패 시 조용히 유지
    } finally {
      setSaving(false);
    }
  };

  const handleToggleResolved = async () => {
    if (!question) return;
    try {
      const res = await questionApi.toggleResolve(question.id);
      setQuestion(res.data);
    } catch {
      // 실패 시 조용히 처리
    }
  };

  const handleDelete = async () => {
    if (!question) return;
    if (!window.confirm('이 질문을 삭제하시겠습니까?')) return;
    try {
      await questionApi.delete(question.id);
      navigate('/questions');
    } catch {
      // 실패 시 조용히 처리
    }
  };

  const toggleTagInEdit = (tagId: number) => {
    setEditTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-400 text-sm">{error ?? '질문을 찾을 수 없습니다.'}</p>
        <button
          onClick={() => navigate('/questions')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={15} /> 목록으로
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-8 py-8">
      <div className="max-w-2xl mx-auto">

        {/* 상단 네비게이션 */}
        <button
          onClick={() => navigate('/questions')}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-8"
        >
          <ArrowLeft size={15} /> 목록으로
        </button>

        {/* 카드 */}
        <div className={`rounded-2xl border p-8 ${question.isResolved ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' : 'bg-white border-slate-200'}`}>

          {/* 상단 액션 버튼들 */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handleToggleResolved}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                question.isResolved
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <Lightbulb size={16} className={question.isResolved ? 'fill-yellow-500' : ''} />
              {question.isResolved ? '해결됨' : '미해결'}
            </button>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editTitle.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 disabled:opacity-40 transition-colors"
                  >
                    <Check size={14} /> {saving ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={14} /> 취소
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Pencil size={14} /> 수정
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} /> 삭제
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 제목 */}
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-xl font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-slate-500"
              placeholder="제목을 입력하세요"
            />
          ) : (
            <h1 className="text-xl font-bold text-slate-800 mb-4">{question.title}</h1>
          )}

          {/* 설명 */}
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={4}
              className="w-full text-sm text-slate-600 bg-white border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-slate-500 resize-none"
              placeholder="설명을 입력하세요 (선택)"
            />
          ) : question.description ? (
            <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap">{question.description}</p>
          ) : null}

          {/* 출처 URL */}
          {isEditing ? (
            <input
              type="url"
              value={editSourceUrl}
              onChange={(e) => setEditSourceUrl(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-slate-500"
              placeholder="출처 URL (선택)"
            />
          ) : question.sourceUrl ? (
            <a
              href={question.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-700 mb-4 truncate"
            >
              <ExternalLink size={13} />
              {question.sourceUrl}
            </a>
          ) : null}

          {/* 태그 */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <>
                  {allTags.map((tag) => {
                    const selected = editTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTagInEdit(tag.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                          selected
                            ? 'border-transparent opacity-100'
                            : 'border-slate-300 opacity-40 bg-transparent'
                        }`}
                        style={selected ? { backgroundColor: tag.color } : {}}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                  {allTags.length === 0 && (
                    <span className="text-xs text-slate-400">등록된 태그가 없습니다</span>
                  )}
                </>
              ) : (
                <>
                  {question.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {question.tags.length === 0 && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-400">미분류</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 메타 정보 */}
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-1">
            <span className="text-xs text-slate-400">
              등록일: {new Date(question.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {question.resolvedAt && (
              <span className="text-xs text-slate-400">
                해결일: {new Date(question.resolvedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

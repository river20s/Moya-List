import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { questionApi } from '../api/questions';
import { tagApi } from '../api/tags';
import { getTagColor } from '../constants/colors';
import type { Tag } from '../types';

interface QuestionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function QuestionCreateModal({ isOpen, onClose, onCreated }: QuestionCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      tagApi.getAll().then((res) => setTags(res.data)).catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      await questionApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      });
      // 초기화 후 닫기
      setTitle('');
      setDescription('');
      setSourceUrl('');
      setSelectedTagIds([]);
      onCreated();
      onClose();
    } catch (err) {
      console.error('질문 등록 실패:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-[#F0EFEB] rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-slate-300/50">
          <h2 className="text-lg font-bold text-slate-800">새 궁금증 등록</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-5 space-y-4">
          {/* 제목 (필수) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              궁금한 것 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && title.trim()) {
                  handleSubmit();
                }
              }}
              placeholder="이게 뭐야? 하는 궁금증을 적어보세요"
              className="w-full px-3 py-2.5 bg-white/50 border border-slate-300/50 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
              autoFocus
            />
          </div>

          {/* 설명 (선택) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              메모
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="추가로 적어둘 내용이 있으면..."
              rows={3}
              className="w-full px-3 py-2.5 bg-white/50 border border-slate-300/50 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* 출처 URL (선택) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              출처 URL
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 bg-white/50 border border-slate-300/50 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
            />
          </div>

          {/* 태그 선택 */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                태그
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedTagIds.includes(tag.id)
                        ? 'ring-2 ring-slate-500'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: tag.color || getTagColor(tag.name) }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 p-5 border-t border-slate-300/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className="flex items-center gap-1 px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 disabled:opacity-40 transition-colors"
          >
            <Plus size={16} />
            {submitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuestionCreateModal;

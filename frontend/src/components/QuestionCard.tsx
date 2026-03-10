import { Lightbulb, Trash2, MessageSquare } from 'lucide-react';
import type { Question } from '../types';
import { getTagColor } from '../constants/colors';

interface QuestionCardProps {
  question: Question;
  onToggleResolved?: (id: number) => void;
  onDelete?: (id: number) => void;
  onClick?: (question: Question) => void;
}

function QuestionCard({ question, onToggleResolved, onDelete, onClick }: QuestionCardProps) {
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleResolved?.(question.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 질문을 삭제하시겠습니까?')) {
      onDelete?.(question.id);
    }
  };

  return (
    <div
      onClick={() => onClick?.(question)}
      className={`
        p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md
        ${question.isResolved
          ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'
          : 'bg-white/50 border-slate-300/50'
        }
      `}
    >
      {/* 상단: 태그 + 해결 버튼 */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2 flex-wrap">
          {question.tags.map((tag) => (
            <span
              key={tag.id}
              className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ backgroundColor: tag.color || getTagColor(tag.name) }}
            >
              {tag.name}
            </span>
          ))}
          {question.tags.length === 0 && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-200">
              미분류
            </span>
          )}
        </div>

        <button
          onClick={handleToggle}
          className={`transition-all ${
            question.isResolved
              ? 'text-yellow-500 hover:text-yellow-600'
              : 'text-slate-300 hover:text-slate-400'
          }`}
          title={question.isResolved ? '해결됨 - 클릭하여 미해결로 변경' : '미해결 - 클릭하여 해결됨으로 변경'}
        >
          <Lightbulb
            size={28}
            className={question.isResolved ? 'fill-yellow-500 lightbulb-solved' : 'opacity-20 hover:opacity-40'}
          />
        </button>
      </div>

      {/* 제목 */}
      <h3 className="font-medium text-slate-800 mb-2">{question.title}</h3>

      {/* 설명 (있으면) */}
      {question.description && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
          {question.description}
        </p>
      )}

      {/* 하단: 날짜 + 삭제 */}
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2 text-slate-400">
          {question.description && (
            <MessageSquare size={12} aria-label="설명이 있습니다" />
          )}
          <span className="text-[10px]">
            {new Date(question.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
        <button
          onClick={handleDelete}
          className="text-slate-300 hover:text-red-400 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default QuestionCard;

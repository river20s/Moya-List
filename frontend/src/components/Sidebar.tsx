import { useState, useEffect, useCallback } from 'react';
import { X, LayoutGrid, Circle, CheckCircle2, Edit2 } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getTagColor } from '../constants/colors';
import { tagApi } from '../api/tags';
import type { Tag } from '../types';
import ActivityHeatmap from './ActivityHeatmap';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tags, setTags] = useState<Tag[]>([]);

  const currentStatus = searchParams.get('status');
  const currentTagId = searchParams.get('tagId');

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

  const handleStatusFilter = (status: string | null) => {
    if (status) {
      navigate(`/questions?status=${status}`);
    } else {
      navigate('/questions');
    }
  };

  const handleTagFilter = (tagId: number | null) => {
    if (tagId) {
      navigate(`/questions?tagId=${tagId}`);
    } else {
      navigate('/questions');
    }
  };

  const isQuestions = location.pathname === '/questions';

  return (
    <aside
      className={`
        ${isOpen ? 'w-64' : 'w-0'}
        bg-[#F0EFEB] border-r border-slate-300/50
        transition-all duration-300
        flex flex-col z-20
        absolute md:relative h-full overflow-hidden
      `}
    >
      {/* 로고 영역 */}
      <div className="p-6 border-b border-slate-300/50 flex justify-between items-center">
        <span className="logo-font text-lg text-slate-700 font-semibold">
          Moya List
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 상태 필터 */}
        <div className="space-y-1">
          <button
            onClick={() => handleStatusFilter(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
              ${isQuestions && !currentStatus && !currentTagId ? 'bg-[#D4E4F1] text-slate-700' : 'text-slate-600 hover:bg-slate-300/20'}`}
          >
            <LayoutGrid size={16} />
            전체 보기
          </button>
          <button
            onClick={() => handleStatusFilter('unsolved')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
              ${currentStatus === 'unsolved' ? 'bg-[#D4E4F1] text-slate-700' : 'text-slate-600 hover:bg-slate-300/20'}`}
          >
            <Circle size={16} className="text-slate-500" />
            미해결
          </button>
          <button
            onClick={() => handleStatusFilter('solved')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
              ${currentStatus === 'solved' ? 'bg-[#D4E4F1] text-slate-700' : 'text-slate-600 hover:bg-slate-300/20'}`}
          >
            <CheckCircle2 size={16} className="text-slate-500" />
            해결됨
          </button>
        </div>

        {/* 태그 목록 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tags
            </h3>
            <Link
              to="/tags"
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
            >
              <Edit2 size={12} />
              관리
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 px-1">
            <button
              onClick={() => handleTagFilter(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                !currentTagId ? 'bg-[#D5D5D7] ring-2 ring-slate-400' : 'bg-[#D5D5D7] opacity-60 hover:opacity-100'
              }`}
            >
              전체
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagFilter(tag.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  currentTagId === String(tag.id) ? 'ring-2 ring-slate-400' : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: tag.color || getTagColor(tag.name) }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        <ActivityHeatmap />
      </div>
    </aside>
  );
}

export default Sidebar;

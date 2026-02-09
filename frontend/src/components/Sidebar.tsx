import { X, LayoutGrid, Circle, CheckCircle2, Tag, Edit2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getTagColor } from '../constants/colors';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// TODO: 실제 데이터 연동
const mockTags = [
  { id: 1, name: 'Spring', color: '#CAD3C0' },
  { id: 2, name: 'React', color: '#D4E4F1' },
  { id: 3, name: 'Database', color: '#F5EBC8' },
];

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

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
          <Link
            to="/"
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
              ${location.pathname === '/' ? 'bg-[#D4E4F1] text-slate-700' : 'text-slate-600 hover:bg-slate-300/20'}`}
          >
            <LayoutGrid size={16} />
            전체 보기
          </Link>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-300/20 transition-colors"
          >
            <Circle size={16} className="text-slate-500" />
            미해결
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-300/20 transition-colors"
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
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#D5D5D7] ring-2 ring-slate-400"
            >
              전체
            </button>
            {mockTags.map((tag) => (
              <button
                key={tag.id}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:ring-2 hover:ring-slate-400"
                style={{ backgroundColor: tag.color || getTagColor(tag.name) }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* 활동 히트맵 (플레이스홀더) */}
        <div className="space-y-2 border-t border-slate-300/50 pt-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Activity
          </h3>
          <div className="px-1">
            <div className="bg-white/30 rounded-lg p-3">
              <div className="grid grid-cols-12 gap-1">
                {Array.from({ length: 84 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-sm bg-slate-200"
                  />
                ))}
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                <span>12주 전</span>
                <span>오늘</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

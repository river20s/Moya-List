import { Search, X, Circle, CheckCircle2, LayoutGrid, Calendar, Filter, Tag } from 'lucide-react';
import { getTagColor } from '../constants/colors';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'solved' | 'unsolved';
  onStatusChange: (status: 'all' | 'solved' | 'unsolved') => void;
  totalCount: number;
}

// TODO: 실제 데이터 연동
const mockTags = [
  { id: 1, name: 'Spring', color: '#CAD3C0' },
  { id: 2, name: 'React', color: '#D4E4F1' },
  { id: 3, name: 'Database', color: '#F5EBC8' },
];

function FilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  totalCount,
}: FilterBarProps) {
  return (
    <div className="px-4 md:px-8 py-4 bg-[#F0EFEB] border-b border-slate-300/50">
      <div className="max-w-3xl mx-auto space-y-3">
        {/* 검색바 */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="질문 또는 설명에서 검색..."
            className="w-full pl-10 pr-4 py-2 bg-white/50 border border-slate-300/50 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* 필터 옵션 */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* 상태 필터 */}
          <div className="flex items-center gap-1 bg-white/50 rounded-lg p-1 border border-slate-300/50">
            <button
              onClick={() => onStatusChange('all')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => onStatusChange('unsolved')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                statusFilter === 'unsolved' ? 'bg-yellow-500 text-white' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <Circle size={12} />
              미해결
            </button>
            <button
              onClick={() => onStatusChange('solved')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                statusFilter === 'solved' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <CheckCircle2 size={12} />
              해결됨
            </button>
          </div>

          {/* 날짜 선택 */}
          <button className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-white/50 text-slate-600 border border-slate-300/50 hover:bg-slate-200/50 transition-all">
            <Calendar size={12} />
            날짜 선택
          </button>

          {/* 결과 수 */}
          <span className="text-xs text-slate-500 ml-auto">
            {totalCount}개 항목
          </span>
        </div>

        {/* 태그 필터 */}
        <div className="flex flex-wrap gap-2 items-center">
          <Tag size={14} className="text-slate-400" />
          {mockTags.map((tag) => (
            <button
              key={tag.id}
              className="px-2.5 py-1 rounded-lg text-xs font-medium opacity-60 hover:opacity-100 transition-all"
              style={{ backgroundColor: tag.color || getTagColor(tag.name) }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FilterBar;

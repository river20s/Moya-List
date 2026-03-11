import { useState, useEffect } from 'react';
import { statsApi } from '../api/stats';
import { useAuth } from '../context/AuthContext';
import type { Question } from '../types';

function getColor(count: number): string {
  if (count === 0) return 'bg-slate-200';
  if (count <= 2) return 'bg-green-200';
  if (count <= 4) return 'bg-green-400';
  return 'bg-green-600';
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 오늘 기준 최근 N주의 날짜를 주 단위 2D 배열로 반환 (열=주, 행=요일 0~6)
function buildRollingGrid(weeks: number): (Date | null)[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 그리드 끝 날짜: 이번 주 토요일 (오늘이 속한 주의 마지막 날)
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - today.getDay()));

  // 그리드 시작 날짜: 끝에서 weeks주 * 7일 전
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - weeks * 7 + 1);

  const grid: (Date | null)[][] = [];
  const cursor = new Date(startDate);

  for (let w = 0; w < weeks; w++) {
    const week: (Date | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(cursor);
      // 미래 날짜는 null
      week.push(cell <= today ? cell : null);
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }
  return grid;
}

interface DayDetailModalProps {
  date: string;
  questions: Question[];
  loading: boolean;
  onClose: () => void;
}

function DayDetailModal({ date, questions, loading, onClose }: DayDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="relative bg-white rounded-2xl shadow-lg w-full max-w-md max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-slate-700">{date} 활동</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-6">불러오는 중...</p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">활동 내역이 없습니다.</p>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-start gap-2">
                  <span className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${q.isResolved ? 'bg-green-400' : 'bg-slate-300'}`} />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 leading-snug">{q.title}</p>
                    <div className="flex gap-2 mt-1 text-[11px] text-slate-400">
                      <span>등록 {q.createdAt.slice(0, 10)}</span>
                      {q.resolvedAt && <span>· 해결 {q.resolvedAt.slice(0, 10)}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const WEEKS = 12;

export default function ActivityHeatmap() {
  const { user } = useAuth();
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dailyQuestions, setDailyQuestions] = useState<Question[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const currentYear = new Date().getFullYear();
    // 연도 경계 처리: 1월이면 작년 데이터도 필요할 수 있음
    const promises = [statsApi.getHeatmap(currentYear)];
    if (new Date().getMonth() === 0) {
      promises.push(statsApi.getHeatmap(currentYear - 1));
    }
    Promise.all(promises).then((results) => {
      const merged: Record<string, number> = {};
      results.forEach((res) => Object.assign(merged, res.data));
      setHeatmapData(merged);
    });
  }, [user]);

  const grid = buildRollingGrid(WEEKS); // 12주 × 7일

  const handleCellClick = async (date: Date) => {
    const dateStr = toDateStr(date);
    setSelectedDate(dateStr);
    setDailyLoading(true);
    setDailyQuestions([]);
    try {
      const res = await statsApi.getDailyQuestions(dateStr);
      setDailyQuestions(res.data);
    } finally {
      setDailyLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="space-y-2 border-t border-slate-300/50 pt-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Activity
        </h3>
        <div className="px-1">
          <div className="bg-white/30 rounded-lg p-3">
            {/* 셀 그리드: 열=주, 행=요일 */}
            <div className="flex gap-0.5">
              {grid.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((date, di) => {
                    if (!date) return <div key={di} className="w-2.5 h-2.5" />;
                    const dateStr = toDateStr(date);
                    const count = heatmapData[dateStr] ?? 0;
                    return (
                      <button
                        key={di}
                        onClick={() => handleCellClick(date)}
                        title={`${dateStr} · ${count}개 활동`}
                        className={`w-2.5 h-2.5 rounded-sm ${getColor(count)} hover:ring-1 hover:ring-slate-400 transition-all cursor-pointer`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
              <span>{WEEKS}주 전</span>
              <span>오늘</span>
            </div>
          </div>
        </div>
      </div>

      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          questions={dailyQuestions}
          loading={dailyLoading}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  );
}

import { useState, useEffect } from 'react';
import { statsApi, type DailyActivity } from '../api/stats';
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

function buildRollingGrid(weeks: number): (Date | null)[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - today.getDay()));

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - weeks * 7 + 1);

  const grid: (Date | null)[][] = [];
  const cursor = new Date(startDate);

  for (let w = 0; w < weeks; w++) {
    const week: (Date | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(cursor);
      week.push(cell <= today ? cell : null);
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }
  return grid;
}

function QuestionItem({ q }: { q: Question }) {
  return (
    <div className="py-2 px-1">
      <p className="text-xs text-slate-700 leading-snug">{q.title}</p>
      {q.sourceUrl && (
        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{q.sourceUrl}</p>
      )}
    </div>
  );
}

interface DayDetailModalProps {
  date: string;
  activity: DailyActivity | null;
  loading: boolean;
  onClose: () => void;
}

function DayDetailModal({ date, activity, loading, onClose }: DayDetailModalProps) {
  const isEmpty = activity && activity.created.length === 0 && activity.resolved.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="relative bg-white rounded-2xl shadow-lg w-full max-w-md max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-slate-700">{date}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-6">불러오는 중...</p>
          ) : isEmpty ? (
            <p className="text-sm text-slate-400 text-center py-6">활동 내역이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {activity!.created.length > 0 && (
                <section>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    궁금해한 것 · {activity!.created.length}
                  </h4>
                  <div className="divide-y divide-slate-100">
                    {activity!.created.map((q) => <QuestionItem key={q.id} q={q} />)}
                  </div>
                </section>
              )}
              {activity!.resolved.length > 0 && (
                <section>
                  <h4 className="text-[11px] font-semibold text-green-500 uppercase tracking-wider mb-2">
                    해결한 것 · {activity!.resolved.length}
                  </h4>
                  <div className="divide-y divide-slate-100">
                    {activity!.resolved.map((q) => <QuestionItem key={q.id} q={q} />)}
                  </div>
                </section>
              )}
            </div>
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
  const [dailyActivity, setDailyActivity] = useState<DailyActivity | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const currentYear = new Date().getFullYear();
    const years = [currentYear];
    if (new Date().getMonth() === 0) years.push(currentYear - 1);

    Promise.all(years.map((y) => statsApi.getHeatmap(y)))
      .then((results) => {
        const merged: Record<string, number> = {};
        results.forEach((res) => Object.assign(merged, res.data));
        setHeatmapData(merged);
      })
      .catch(() => {
        // 히트맵 로드 실패 시 빈 데이터 유지
      });
  }, [user]);

  const grid = buildRollingGrid(WEEKS);

  const handleCellClick = async (date: Date) => {
    const dateStr = toDateStr(date);
    setSelectedDate(dateStr);
    setDailyLoading(true);
    setDailyActivity(null);
    try {
      const res = await statsApi.getDailyActivity(dateStr);
      setDailyActivity(res.data);
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
          activity={dailyActivity}
          loading={dailyLoading}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  );
}

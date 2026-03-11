import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { guestStorage } from '../utils/guestStorage';
import { questionApi } from '../api/questions';
import Header from '../components/Header';

export default function MainPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollLocked = useRef(false);

  // 화면 아무 곳 클릭 → input 포커스
  const handleScreenClick = useCallback(() => {
    inputRef.current?.focus();
    setIsTyping(true);
  }, []);

  // Enter로 빠르게 등록 후 /questions 이동
  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        try {
          if (user) {
            await questionApi.create({ title: inputValue.trim() });
          } else {
            guestStorage.add({ title: inputValue.trim() });
          }
        } catch {
          // 실패해도 질문 목록으로 이동
        }
        navigate('/questions');
      }
    },
    [inputValue, user, navigate],
  );

  // 스크롤(wheel) 감지 → /questions 이동
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 30 && !scrollLocked.current) {
        scrollLocked.current = true;
        navigate('/questions');
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = touchStartY - e.touches[0].clientY;
      if (deltaY > 50 && !scrollLocked.current) {
        scrollLocked.current = true;
        navigate('/questions');
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [navigate]);

  if (loading) return null;

  return (
    <div
      className="relative flex flex-col h-screen bg-[#F0EFEB] text-slate-800 overflow-hidden select-none"
      onClick={handleScreenClick}
    >
      {/* ── 상단 헤더: Header 컴포넌트 재사용 (로고 가운데, 사이드바 없음) ── */}
      <div onClick={(e) => e.stopPropagation()}>
        <Header logoCenter />
      </div>

      {/* ── 중앙 콘텐츠 ── */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-16">
        {/* 입력 영역 */}
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            {isTyping && inputValue ? (
              <>
                {inputValue}
                <span className="landing-cursor">_</span>
              </>
            ) : (
              <>
                무엇이 궁금한가요?
                <span className="landing-cursor">_</span>
              </>
            )}
          </h1>
          {/* 숨겨진 input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsTyping(true);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!inputValue) setIsTyping(false);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-default"
            autoComplete="off"
          />
        </div>
      </div>

      {/* ── 하단 스크롤 유도 ── */}
      <div className="flex flex-col items-center pb-12 gap-2">
        <ChevronDown size={28} className="text-slate-400 scroll-bounce" />
        <span className="text-sm text-slate-400 font-medium">아래로 스크롤</span>
      </div>
    </div>
  );
}

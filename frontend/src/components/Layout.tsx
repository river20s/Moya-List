import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const scrollLocked = useRef(false);

  // 스크롤 위치 감지 → 상단 이동 버튼 표시 여부
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => setShowTopButton(el.scrollTop > 10);
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // /questions 최상단에서 위로 스크롤 → 메인 페이지로 이동
  useEffect(() => {
    if (location.pathname !== '/questions') return;
    scrollLocked.current = false;

    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (el.scrollTop === 0 && e.deltaY < -30 && !scrollLocked.current) {
        scrollLocked.current = true;
        navigate('/');
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const delta = e.touches[0].clientY - touchStartY;
      if (el.scrollTop === 0 && delta > 50 && !scrollLocked.current) {
        scrollLocked.current = true;
        navigate('/');
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: true });
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [location.pathname, navigate]);

  return (
    <div className="flex h-screen bg-[#F0EFEB] text-slate-800 overflow-hidden">
      {/* 사이드바 */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 오버레이 (모바일) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* 상단(메인 페이지)으로 이동 버튼 */}
      {location.pathname === '/questions' && (
        <button
          onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed bottom-24 right-6 z-40 w-14 h-14 bg-slate-700 text-white rounded-full shadow-lg hover:bg-slate-600 transition-all duration-500 ease-in-out flex items-center justify-center ${
            showTopButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          title="메인으로"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  );
}

export default Layout;

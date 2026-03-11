import { Menu, LogIn, User, LogOut, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onMenuClick?: () => void;
  logoCenter?: boolean;
}

function Header({ onMenuClick, logoCenter = false }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="relative flex items-center justify-between px-4 md:px-8 py-4 bg-[#F0EFEB]/80 backdrop-blur-sm border-b border-slate-300/50">
      {/* 왼쪽: 사이드바 버튼 + 로고 (기본) / 빈 공간 (logoCenter) */}
      <div className="flex items-center gap-3">
        {!logoCenter && (
          <>
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-slate-300/20 rounded-lg transition-colors"
            >
              <Menu size={20} className="text-slate-600" />
            </button>
            <span className="logo-font text-xl text-slate-700 font-semibold">
              Moya List
            </span>
          </>
        )}
      </div>

      {/* 가운데 로고 (logoCenter 모드에서만) */}
      {logoCenter && (
        <span className="absolute left-1/2 -translate-x-1/2 logo-font text-xl text-slate-700 font-semibold">
          Moya List
        </span>
      )}

      {/* 오른쪽: 사용자 정보 + 로그인/로그아웃 */}
      <div className="flex items-center gap-2">
        {!user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-slate-400">게스트 모드</span>
              <div className="relative group">
                <Info size={13} className="text-slate-400 cursor-help" />
                <div className="absolute right-0 top-6 z-50 hidden group-hover:block w-64 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-lg leading-relaxed">
                  현재 질문은 이 브라우저에만 저장됩니다.
                  <br /><br />
                  다른 기기에서 이어보거나 영구적으로 저장하려면 로그인하세요. 로그인 시 입력한 질문이 자동으로 계정에 저장됩니다.
                  <div className="absolute -top-1.5 right-3 w-3 h-3 bg-slate-800 rotate-45" />
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-white text-xs rounded-lg hover:bg-slate-600 transition-colors"
            >
              <LogIn size={13} />
              로그인
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
              <User size={16} className="text-slate-600" />
              <span className="text-xs text-slate-600">{user.name}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1 px-3 py-1.5 hover:bg-slate-200/50 rounded-lg transition-colors text-slate-500"
              title="로그아웃"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;

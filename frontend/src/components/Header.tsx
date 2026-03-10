import { Menu, LogIn, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-[#F0EFEB]/80 backdrop-blur-sm border-b border-slate-300/50">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-slate-300/20 rounded-lg transition-colors"
        >
          <Menu size={20} className="text-slate-600" />
        </button>
        <span className="logo-font text-xl text-slate-700 font-semibold">
          Moya List
        </span>
      </div>

      <div className="flex items-center gap-2">
        {!user ? (
          <button
            onClick={() => window.location.href = '/login'}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-white text-xs rounded-lg hover:bg-slate-600 transition-colors"
          >
            <LogIn size={14} />
            로그인
          </button>
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

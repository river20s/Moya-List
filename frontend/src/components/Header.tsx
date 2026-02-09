import { Menu, LogIn, User } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  // TODO: 실제 인증 연동 시 변경
  const user = null;

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
          <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-white text-xs rounded-lg hover:bg-slate-600 transition-colors">
            <LogIn size={14} />
            로그인
          </button>
        ) : (
          <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-200/50 rounded-lg transition-colors">
            <User size={16} className="text-slate-600" />
            <span className="text-xs text-slate-600">사용자</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;

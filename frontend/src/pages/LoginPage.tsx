import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0EFEB] px-4">
      <h1 className="logo-font text-4xl text-slate-700 font-semibold mb-2">Moya List</h1>
      <p className="text-slate-400 text-sm mb-12">이게 뭐야? 하는 궁금증을 빠르게 캡처하세요</p>

      <div className="w-full max-w-sm bg-white/70 rounded-2xl p-8 shadow-sm border border-slate-200/50 space-y-3">
        <h2 className="text-lg font-medium text-slate-700 mb-6 text-center">시작하기</h2>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 text-sm font-medium shadow-sm"
        >
          <GoogleIcon />
          Google로 로그인
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">또는</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          onClick={() => navigate('/questions')}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors"
        >
          게스트로 시작
        </button>

        <p className="text-center text-[11px] text-slate-400 pt-1 leading-relaxed">
          게스트 모드는 이 브라우저에만 저장됩니다.
          <br />로그인 시 작성한 내용이 계정으로 이관됩니다.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
    </svg>
  );
}

export default LoginPage;

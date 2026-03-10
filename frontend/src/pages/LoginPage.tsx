function LoginPage() {
  const handleGoogleLogin = () => {
    // 백엔드의 Spring Security OAuth2 엔드포인트로 이동
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0EFEB] px-4">
      <h1 className="logo-font text-4xl text-slate-700 font-semibold mb-2">Moya List</h1>
      <p className="text-slate-400 text-sm mb-12">이게 뭐야? 하는 궁금증을 빠르게 캡처하세요</p>

      <div className="w-full max-w-sm bg-white/70 rounded-2xl p-8 shadow-sm border border-slate-200/50">
        <h2 className="text-lg font-medium text-slate-700 mb-6 text-center">로그인</h2>
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 text-sm font-medium shadow-sm"
        >
          <GoogleIcon />
          Google로 계속하기
        </button>
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

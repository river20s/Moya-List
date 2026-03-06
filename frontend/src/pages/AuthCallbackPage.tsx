import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * OAuth2 로그인 완료 후 리다이렉트되는 페이지.
 *
 * 백엔드 OAuth2SuccessHandler가 이 URL로 리다이렉트한다:
 *   /auth/callback?token=eyJhbGci...
 *
 * 이 페이지에서:
 * 1. URL의 token 쿼리 파라미터를 꺼냄
 * 2. localStorage에 저장
 * 3. 메인 페이지로 이동
 */
function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
    }
    navigate('/questions', { replace: true });
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F0EFEB]">
      <p className="text-slate-400 text-sm">로그인 처리 중...</p>
    </div>
  );
}

export default AuthCallbackPage;

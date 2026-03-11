import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * OAuth2 로그인 완료 후 리다이렉트되는 페이지.
 *
 * 1. URL의 token을 localStorage에 저장
 * 2. /questions으로 이동 (게스트 질문 이관은 QuestionListPage에서 사용자에게 확인 후 진행)
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

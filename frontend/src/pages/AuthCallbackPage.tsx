import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { questionApi } from '../api/questions';
import { guestStorage } from '../utils/guestStorage';

/**
 * OAuth2 로그인 완료 후 리다이렉트되는 페이지.
 *
 * 1. URL의 token을 localStorage에 저장
 * 2. 게스트 질문이 있으면 서버로 이관
 * 3. /questions으로 이동
 */
function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/questions', { replace: true });
      return;
    }

    localStorage.setItem('token', token);

    const guestQuestions = guestStorage.getAll();

    if (guestQuestions.length === 0) {
      navigate('/questions', { replace: true });
      return;
    }

    // 게스트 질문을 서버로 이관
    questionApi
      .migrateGuest(guestQuestions.map((q) => ({
        title: q.title,
        description: q.description,
        sourceUrl: q.sourceUrl,
      })))
      .then(() => {
        guestStorage.clear();
      })
      .catch(() => {
        // 이관 실패해도 로그인은 성공 처리
      })
      .finally(() => {
        navigate('/questions', { replace: true });
      });
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F0EFEB]">
      <p className="text-slate-400 text-sm">로그인 처리 중...</p>
    </div>
  );
}

export default AuthCallbackPage;

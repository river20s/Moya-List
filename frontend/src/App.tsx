import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import MainPage from './pages/MainPage';
import QuestionListPage from './pages/QuestionListPage';
import TagListPage from './pages/TagListPage';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

/** 로그인이 필요한 페이지 — 미인증 시 /login으로 이동 */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* 메인 랜딩 (사이드바 없음) */}
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      {/* 게스트·로그인 모두 접근 가능 */}
      <Route element={<Layout />}>
        <Route path="questions" element={<QuestionListPage />} />
        {/* 태그는 서버 데이터 → 로그인 필요 */}
        <Route path="tags" element={<PrivateRoute><TagListPage /></PrivateRoute>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

import { Navigate } from 'react-router-dom';

// 홈은 /questions으로 리다이렉트
export default function HomePage() {
  return <Navigate to="/questions" replace />;
}

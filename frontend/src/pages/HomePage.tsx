import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionApi } from '../api/questions';
import { useAuth } from '../context/AuthContext';

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim() || submitting || !user) return;

    try {
      setSubmitting(true);
      await questionApi.create({
        userId: user.id,
        title: value.trim(),
      });
      navigate('/questions');
    } catch (err) {
      console.error('질문 등록 실패:', err);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0EFEB] px-4">
      <h1 className="logo-font text-4xl md:text-5xl text-slate-700 font-semibold mb-2">
        Moya List
      </h1>
      <p className="text-slate-400 text-sm mb-10">
        이게 뭐야? 하는 궁금증을 빠르게 캡처하세요
      </p>

      <div className="w-full max-w-xl">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder="궁금한 것을 입력하세요..."
          className="w-full px-6 py-4 bg-white/60 border border-slate-300/50 rounded-2xl text-base focus:outline-none focus:border-slate-400 focus:bg-white shadow-sm transition-all"
          autoFocus
          disabled={submitting}
        />
      </div>

      <button
        onClick={() => navigate('/questions')}
        className="mt-8 text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        내 질문 목록 보기 →
      </button>
    </div>
  );
}

export default HomePage;

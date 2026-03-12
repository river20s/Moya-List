import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Check, X, LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/users';

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  kakao: 'Kakao',
  local: '이메일',
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  if (!user) return null;

  const handleEditStart = () => {
    setEditName(user.name);
    setNameError('');
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setNameError('');
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      setNameError('닉네임을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      await userApi.update(user.id, { name: editName.trim() });
      // AuthContext의 user를 갱신하려면 페이지를 새로고침하는 게 가장 단순
      window.location.reload();
    } catch {
      setNameError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      '정말 탈퇴하시겠습니까?\n작성한 질문과 태그가 모두 삭제되며 복구할 수 없습니다.'
    );
    if (!confirmed) return;

    try {
      await userApi.delete(user.id);
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch {
      alert('탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-screen px-4 md:px-8 py-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-slate-800 mb-8">프로필</h1>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6">

          {/* 닉네임 */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">닉네임</label>
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => { setEditName(e.target.value); setNameError(''); }}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-slate-500"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleEditCancel(); }}
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 disabled:opacity-40 transition-colors"
                >
                  <Check size={14} /> {saving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={handleEditCancel}
                  className="px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-800">{user.name}</span>
                <button
                  onClick={handleEditStart}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Pencil size={12} /> 수정
                </button>
              </div>
            )}
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">이메일</label>
            <span className="text-sm text-slate-800">{user.email}</span>
          </div>

          {/* 연동 계정 */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">연동 계정</label>
            <span className="text-sm text-slate-800">
              {PROVIDER_LABEL[user.provider] ?? user.provider}
            </span>
          </div>

          {/* 가입일 */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">가입일</label>
            <span className="text-sm text-slate-800">
              {new Date(user.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <LogOut size={15} /> 로그아웃
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={15} /> 회원 탈퇴
          </button>
        </div>
      </div>
    </div>
  );
}

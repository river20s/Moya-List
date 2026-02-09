import { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import type { Tag } from '../types';
import { getTagColor, TAG_COLORS } from '../constants/colors';

// TODO: 실제 API 연동
const initialTags: Tag[] = [
  { id: 1, name: 'Spring', color: '#CAD3C0' },
  { id: 2, name: 'React', color: '#D4E4F1' },
  { id: 3, name: 'Database', color: '#F5EBC8' },
  { id: 4, name: 'Security', color: '#EBD8DC' },
];

function TagListPage() {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAddTag = () => {
    if (!newTagName.trim()) return;

    const newTag: Tag = {
      id: Date.now(),
      name: newTagName.trim(),
      color: newTagColor,
    };

    setTags([...tags, newTag]);
    setNewTagName('');
    setNewTagColor(TAG_COLORS[0]);
  };

  const handleStartEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
  };

  const handleSaveEdit = (id: number) => {
    if (!editingName.trim()) return;

    setTags(tags.map((tag) =>
      tag.id === id ? { ...tag, name: editingName.trim() } : tag
    ));
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('이 태그를 삭제하시겠습니까?')) return;
    setTags(tags.filter((tag) => tag.id !== id));
  };

  const handleColorChange = (id: number, color: string) => {
    setTags(tags.map((tag) =>
      tag.id === id ? { ...tag, color } : tag
    ));
  };

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">태그 관리</h1>

        {/* 태그 목록 */}
        <div className="bg-white/50 rounded-xl border border-slate-300/50 p-4 mb-6">
          <div className="space-y-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-3 p-3 bg-white/50 rounded-lg"
              >
                {editingId === tag.id ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(tag.id)}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(tag.id)}
                      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <Check size={16} className="text-green-600" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X size={16} className="text-slate-500" />
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="px-3 py-1.5 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: tag.color || getTagColor(tag.name) }}
                    >
                      {tag.name}
                    </span>
                    <div className="flex-1" />

                    {/* 색상 선택 */}
                    <div className="flex gap-1">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorChange(tag.id, color)}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${
                            tag.color === color ? 'border-slate-700 scale-110' : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => handleStartEdit(tag)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} className="text-slate-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </>
                )}
              </div>
            ))}

            {tags.length === 0 && (
              <p className="text-center text-slate-400 py-8">
                등록된 태그가 없습니다
              </p>
            )}
          </div>
        </div>

        {/* 새 태그 추가 */}
        <div className="bg-white/50 rounded-xl border border-slate-300/50 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">새 태그 추가</h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="태그 이름 입력..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-slate-400"
            />

            {/* 색상 선택 */}
            <div className="flex gap-1">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    newTagColor === color ? 'border-slate-700 scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <button
              onClick={handleAddTag}
              className="flex items-center gap-1 px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
            >
              <Plus size={16} />
              추가
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TagListPage;

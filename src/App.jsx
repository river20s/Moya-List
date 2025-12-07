import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Menu,
  X,
  Tag,
  LayoutGrid,
  HelpCircle,
  LogIn,
  User,
  Edit2,
  Check,
  XCircle
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

// --- Global Config ---
const APP_ID = 'moya-list-local';

const FIREBASE_CONFIG = import.meta.env.VITE_FIREBASE_API_KEY ? {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
} : null; 

// --- Helper ---
const extractHashtags = (text) => {
  const matches = text.match(/#[\w가-힣]+/g);
  if (!matches) return [];
  // Remove # prefix and deduplicate using Set
  const tags = matches.map(tag => tag.substring(1));
  return [...new Set(tags)]; // 중복 제거
};

const HASHTAG_COLORS = ['#EBD8DC', '#F5EBC8', '#CAD3C0', '#D5D5D7', '#D4E4F1', '#F0D8CC', '#DAD3DB'];

// 해시태그에 일관된 색상을 할당하기 위한 함수
const getHashtagColor = (tag, customColors = {}) => {
  // 사용자 지정 색상이 있으면 우선 사용
  if (customColors[tag]) {
    return customColors[tag];
  }

  // 없으면 해시 기반 자동 색상
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return HASHTAG_COLORS[Math.abs(hash) % HASHTAG_COLORS.length];
};

export default function App() {
  // --- State ---
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(['HTML', 'CSS', 'React', '수학', '알고리즘']);

  const [newItemText, setNewItemText] = useState('');
  const [newItemCategories, setNewItemCategories] = useState([]);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const [showGuestInfo, setShowGuestInfo] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false); // 태그 관리 모달
  const [editingTag, setEditingTag] = useState(null); // 편집 중인 태그
  const [editingTagValue, setEditingTagValue] = useState(''); // 편집 중인 태그 값
  const [newTag, setNewTag] = useState(''); // 새 태그 입력
  const [newTagColor, setNewTagColor] = useState(HASHTAG_COLORS[0]); // 새 태그 색상
  const [tagColors, setTagColors] = useState({}); // 태그별 사용자 지정 색상
  const [showColorPicker, setShowColorPicker] = useState(null); // 색상 선택기 표시 (태그 이름)
  const [colorPickerPosition, setColorPickerPosition] = useState({ top: 0, left: 0 }); // 색상 선택기 위치

  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);

  const editorRef = useRef(null);
  const compactEditorRef = useRef(null);

  // 스크롤 상태 변경 시 텍스트 복사 및 포커스
  const prevScrolledRef = useRef(isScrolled);
  useEffect(() => {
    // 스크롤 상태가 실제로 변경되었을 때만 실행
    if (prevScrolledRef.current !== isScrolled) {
      // 현재 활성 입력창에서 비활성 입력창으로 텍스트 복사
      if (isScrolled && editorRef.current && compactEditorRef.current) {
        compactEditorRef.current.textContent = editorRef.current.textContent;
        setTimeout(() => compactEditorRef.current?.focus(), 50);
      } else if (!isScrolled && compactEditorRef.current && editorRef.current) {
        editorRef.current.textContent = compactEditorRef.current.textContent;
        setTimeout(() => editorRef.current?.focus(), 50);
      }
      prevScrolledRef.current = isScrolled;
    }
  }, [isScrolled]);

  // 컴포넌트 마운트 시 포커스
  useEffect(() => {
    if (editorRef.current) {
      setTimeout(() => editorRef.current?.focus(), 100);
    }
  }, []);

  // --- Init ---
  useEffect(() => {
    if (FIREBASE_CONFIG) {
      try {
        const app = initializeApp(FIREBASE_CONFIG);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        setAuth(authInstance);
        setDb(dbInstance);

        // Firebase 사용 시에도 user를 null로 유지 (게스트모드 표시)
        // signInAnonymously(authInstance).catch((error) => {
        //     console.error("Auth Error:", error);
        // });

        // onAuthStateChanged(authInstance, (u) => setUser(u));
      } catch (e) {
        console.error("Firebase init error:", e);
      }
    } else {
      console.log("Firebase 설정이 없어 로컬 스토리지 모드로 실행");
      const savedItems = localStorage.getItem('moya_items');
      if (savedItems) setItems(JSON.parse(savedItems));

      const savedCats = localStorage.getItem('moya_categories');
      if (savedCats) setCategories(JSON.parse(savedCats));

      const savedColors = localStorage.getItem('moya_tag_colors');
      if (savedColors) setTagColors(JSON.parse(savedColors));
    }
  }, []);

  // --- Sync ---
  useEffect(() => {
    if (!user || !db) {
      if (items.length > 0) localStorage.setItem('moya_items', JSON.stringify(items));
      if (categories.length > 0) localStorage.setItem('moya_categories', JSON.stringify(categories));
      return;
    }

    // Firebase 연동
    const q = query(
      collection(db, 'artifacts', APP_ID, 'users', user.uid, 'moya_items'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(fetchedItems);
    }, (error) => {
        console.error("Snapshot error:", error);
    });

    return () => unsubscribe();
  }, [user, db]);

  // --- Handlers ---
  const handleTextChange = (e) => {
    // innerText 대신 textContent 사용하여 공백 유지
    const text = e.target.textContent || '';
    setNewItemText(text);
    const detectedTags = extractHashtags(text);
    setNewItemCategories(detectedTags);
  };

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;

    let finalCategories = newItemCategories.length > 0 ? newItemCategories : ['기타'];

    // 새로운 카테고리 추가
    const newCats = finalCategories.filter(cat => !categories.includes(cat));
    if (newCats.length > 0) {
      const updatedCategories = [...categories, ...newCats];
      setCategories(updatedCategories);
      if (!db) localStorage.setItem('moya_categories', JSON.stringify(updatedCategories));
    }

    const newItem = {
      text: newItemText,
      summary: "",
      categories: finalCategories,
      status: 'unsolved',
      createdAt: new Date().toISOString(),
    };

    let addedId;
    if (user && db) {
      const docRef = await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'moya_items'), {
        ...newItem,
        createdAt: serverTimestamp()
      });
      addedId = docRef.id;
    } else {
      addedId = Date.now().toString();
      const updatedItems = [{ ...newItem, id: addedId }, ...items];
      setItems(updatedItems);
      localStorage.setItem('moya_items', JSON.stringify(updatedItems));
    }

    // 새로 추가된 아이템 애니메이션 트리거
    setNewlyAddedId(addedId);
    setTimeout(() => setNewlyAddedId(null), 800); // 애니메이션 후 상태 초기화

    setNewItemText('');
    setNewItemCategories([]);

    // 모든 contenteditable 초기화
    if (editorRef.current) editorRef.current.textContent = '';
    if (compactEditorRef.current) compactEditorRef.current.textContent = '';

    const currentEditor = isScrolled ? compactEditorRef.current : editorRef.current;
    if (currentEditor) currentEditor.focus();
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'unsolved' ? 'solved' : 'unsolved';
    if (user && db) {
      await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'moya_items', id), { status: newStatus });
    } else {
      const updatedItems = items.map(item => item.id === id ? { ...item, status: newStatus } : item);
      setItems(updatedItems);
      localStorage.setItem('moya_items', JSON.stringify(updatedItems));
    }
  };

  const deleteItem = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("삭제하시겠습니까?")) return;
    if (user && db) {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'moya_items', id));
    } else {
      const updatedItems = items.filter(item => item.id !== id);
      setItems(updatedItems);
      localStorage.setItem('moya_items', JSON.stringify(updatedItems));
    }
  };

  // 태그 추가
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (categories.includes(newTag.trim())) {
      alert('이미 존재하는 태그입니다.');
      return;
    }
    const trimmedTag = newTag.trim();
    const updatedCategories = [...categories, trimmedTag];
    setCategories(updatedCategories);
    localStorage.setItem('moya_categories', JSON.stringify(updatedCategories));

    // 선택한 색상 저장
    const updatedColors = { ...tagColors, [trimmedTag]: newTagColor };
    setTagColors(updatedColors);
    localStorage.setItem('moya_tag_colors', JSON.stringify(updatedColors));

    // 입력창 및 색상 초기화
    setNewTag('');
    setNewTagColor(HASHTAG_COLORS[0]);
  };

  // 태그 수정 시작
  const startEditTag = (tag) => {
    setEditingTag(tag);
    setEditingTagValue(tag);
  };

  // 태그 수정 완료
  const handleEditTag = () => {
    if (!editingTagValue.trim()) return;
    if (editingTagValue === editingTag) {
      setEditingTag(null);
      return;
    }
    if (categories.includes(editingTagValue.trim()) && editingTagValue.trim() !== editingTag) {
      alert('이미 존재하는 태그입니다.');
      return;
    }

    // 모든 아이템의 카테고리 업데이트
    const updatedItems = items.map(item => {
      if (item.categories && item.categories.includes(editingTag)) {
        return {
          ...item,
          categories: item.categories.map(cat => cat === editingTag ? editingTagValue.trim() : cat)
        };
      }
      return item;
    });

    const updatedCategories = categories.map(cat => cat === editingTag ? editingTagValue.trim() : cat);

    setItems(updatedItems);
    setCategories(updatedCategories);
    localStorage.setItem('moya_items', JSON.stringify(updatedItems));
    localStorage.setItem('moya_categories', JSON.stringify(updatedCategories));
    setEditingTag(null);
  };

  // 태그 삭제
  const handleDeleteTag = (tag) => {
    if (!window.confirm(`"${tag}" 태그를 삭제하시겠습니까?\n이 태그가 포함된 항목에서 태그가 제거됩니다.`)) return;

    // 모든 아이템에서 해당 태그 제거
    const updatedItems = items.map(item => {
      if (item.categories && item.categories.includes(tag)) {
        return {
          ...item,
          categories: item.categories.filter(cat => cat !== tag)
        };
      }
      return item;
    });

    const updatedCategories = categories.filter(cat => cat !== tag);

    // 태그 색상도 제거
    const updatedColors = { ...tagColors };
    delete updatedColors[tag];

    setItems(updatedItems);
    setCategories(updatedCategories);
    setTagColors(updatedColors);
    localStorage.setItem('moya_items', JSON.stringify(updatedItems));
    localStorage.setItem('moya_categories', JSON.stringify(updatedCategories));
    localStorage.setItem('moya_tag_colors', JSON.stringify(updatedColors));

    if (filterCategory === tag) {
      setFilterCategory('all');
    }
  };

  // 태그 색상 변경
  const handleChangeTagColor = (tag, color) => {
    const updatedColors = { ...tagColors, [tag]: color };
    setTagColors(updatedColors);
    localStorage.setItem('moya_tag_colors', JSON.stringify(updatedColors));
  };

  const filteredItems = items.filter(item => {
    const statusMatch = filterStatus === 'all' || item.status === filterStatus;

    // 이전 데이터와 호환성 유지 (category 필드)
    const itemCategories = item.categories || (item.category ? [item.category] : []);
    const catMatch = filterCategory === 'all' || itemCategories.includes(filterCategory);

    return statusMatch && catMatch;
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddItem();
    }
  };

  // 텍스트를 해시태그 하이라이트와 함께 렌더링 (입력창용 - 통일된 스타일)
  const renderHighlightedText = (text) => {
    if (!text) return null;

    const parts = [];
    let lastIndex = 0;
    const hashtagRegex = /#[\w가-힣]+/g;
    let match;

    while ((match = hashtagRegex.exec(text)) !== null) {
      // 해시태그 이전 텍스트
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        parts.push(beforeText);
      }
      // 해시태그 - 통일된 스타일 (진한 색상, 굵은 글씨)
      parts.push(
        <span
          key={`hash-${match.index}`}
          className="font-bold text-slate-700"
        >
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    // 남은 텍스트
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
  };

  // 스크롤 snap 제어
  const isSnapping = useRef(false);

  // 스크롤 이벤트 핸들러 - snap 기능 추가
  const scrollTimeoutRef = useRef(null);
  const handleScroll = (e) => {
    if (isSnapping.current) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const scrollTop = e.target.scrollTop;
      const threshold = window.innerHeight * 0.3; // 30% 스크롤 시 전환

      // Snap 로직
      if (scrollTop > 0 && scrollTop < threshold) {
        // 조금만 스크롤했으면 맨 위로
        isSnapping.current = true;
        e.target.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          isSnapping.current = false;
          setIsScrolled(false);
        }, 300);
      } else if (scrollTop >= threshold && scrollTop < window.innerHeight) {
        // 중간 정도 스크롤했으면 완전히 아래로
        isSnapping.current = true;
        e.target.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
        setTimeout(() => {
          isSnapping.current = false;
          setIsScrolled(true);
        }, 300);
      } else {
        // 이미 충분히 스크롤됨
        const shouldBeScrolled = scrollTop >= window.innerHeight * 0.5;
        if (shouldBeScrolled !== isScrolled) {
          setIsScrolled(shouldBeScrolled);
        }
      }
    }, 150);
  };

  return (
    <>
      {/* 게스트모드 안내 툴팁 - 최상위 레이어 */}
      {showGuestInfo && (
        <div
          className="fixed right-4 top-20 w-64 p-3 bg-white border border-slate-300/50 rounded-lg shadow-xl text-xs text-slate-600 z-[9999]"
          onMouseEnter={() => setShowGuestInfo(true)}
          onMouseLeave={() => setShowGuestInfo(false)}
        >
          게스트모드에서는 모든 데이터가 현재 기기의 브라우저에만 저장됩니다.
          브라우저 데이터를 삭제하지 않는 한 작성한 질문과 메모가 계속 유지되지만,
          다른 기기나 브라우저와는 동기화되지 않습니다. 여러 기기에서 사용하려면 로그인하세요.
        </div>
      )}

      {/* 로그인 모달 */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">로그인</h2>
              <button
                onClick={() => setShowLogin(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-slate-600 mb-6">
              로그인 기능은 곧 추가될 예정입니다. 현재는 게스트모드로 사용하실 수 있습니다.
            </p>
            <button
              onClick={() => setShowLogin(false)}
              className="w-full py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 색상 선택 드롭다운 - fixed 포지션으로 모달 외부에 표시 */}
      {showColorPicker && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-slate-300 p-2 flex gap-1 z-[250]"
          style={{
            top: `${colorPickerPosition.top}px`,
            left: `${colorPickerPosition.left}px`
          }}
        >
          {HASHTAG_COLORS.map(color => {
            const isCurrentColor = showColorPicker === 'new'
              ? newTagColor === color
              : tagColors[showColorPicker] === color;

            return (
              <button
                key={color}
                onClick={() => {
                  if (showColorPicker === 'new') {
                    setNewTagColor(color);
                  } else {
                    handleChangeTagColor(showColorPicker, color);
                  }
                  setShowColorPicker(null);
                }}
                className={`w-7 h-7 rounded-full border-2 transition-all ${isCurrentColor ? 'border-slate-700 scale-110' : 'border-slate-300 hover:scale-105'}`}
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
      )}

      {/* 태그 관리 모달 */}
      {showTagManager && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]"
          onClick={() => {
            // 색상 선택기 외부 클릭 시 닫기
            if (showColorPicker) {
              setShowColorPicker(null);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">태그 관리</h2>
              <button
                onClick={() => {
                  setShowTagManager(false);
                  setEditingTag(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* 태그 목록 */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {categories.map(cat => {
                const bgColor = getHashtagColor(cat, tagColors);
                const isEditing = editingTag === cat;

                return (
                  <div key={cat} className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editingTagValue}
                          onChange={(e) => setEditingTagValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditTag();
                            if (e.key === 'Escape') setEditingTag(null);
                          }}
                          onBlur={handleEditTag}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border-2 border-slate-400 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={handleEditTag}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                          title="확인"
                        >
                          <Check size={18} className="text-green-600" />
                        </button>
                        <button
                          onClick={() => setEditingTag(null)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="취소"
                        >
                          <XCircle size={18} className="text-slate-500" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          onClick={() => startEditTag(cat)}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          {cat}
                        </div>
                        {/* 색상 선택 - 작은 원 버튼 */}
                        <button
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setColorPickerPosition({
                              top: rect.bottom + 4,
                              left: rect.right - 250 // 드롭다운 너비를 고려하여 오른쪽 정렬
                            });
                            setShowColorPicker(showColorPicker === cat ? null : cat);
                          }}
                          className="w-7 h-7 rounded-full border-2 border-slate-400 hover:border-slate-600 transition-all"
                          style={{ backgroundColor: bgColor }}
                          title="색상 변경"
                        />
                        <button
                          onClick={() => handleDeleteTag(cat)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 새 태그 추가 */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">새 태그 추가</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                  }}
                  placeholder="태그 이름 입력..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm border border-slate-300 focus:outline-none focus:border-slate-400"
                />
                {/* 색상 선택 - 작은 원 버튼 */}
                <button
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setColorPickerPosition({
                      top: rect.bottom + 4,
                      left: rect.right - 250 // 드롭다운 너비를 고려하여 오른쪽 정렬
                    });
                    setShowColorPicker(showColorPicker === 'new' ? null : 'new');
                  }}
                  className="w-7 h-7 rounded-full border-2 border-slate-400 hover:border-slate-600 transition-all"
                  style={{ backgroundColor: newTagColor }}
                  title="색상 선택"
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-1"
                >
                  <Plus size={16} />
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen bg-[#F0EFEB] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-[#F0EFEB] border-r border-slate-300/50 transition-all duration-300 flex flex-col z-20 absolute md:relative h-full overflow-hidden`}>
        <div className="p-6 border-b border-slate-300/50 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-700">
            <div className="w-8 h-8 bg-[#CAD3C0] rounded-lg flex items-center justify-center text-slate-700">M</div>
            <span>Moya List</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-1">
            <button onClick={() => setFilterStatus('all')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${filterStatus === 'all' ? 'bg-[#D4E4F1] text-slate-700' : 'text-slate-600 hover:bg-slate-300/20'}`}>
              <LayoutGrid size={16} /> 전체 보기
            </button>
            <button onClick={() => setFilterStatus('unsolved')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${filterStatus === 'unsolved' ? 'bg-[#F5EBC8] text-slate-700' : 'text-slate-600 hover:bg-slate-300/20'}`}>
              <Circle size={16} className="text-slate-500" /> 미해결
            </button>
            <button onClick={() => setFilterStatus('solved')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${filterStatus === 'solved' ? 'bg-[#CAD3C0] text-slate-700' : 'text-slate-600 hover:bg-slate-300/20'}`}>
              <CheckCircle2 size={16} className="text-slate-500" /> 해결됨
            </button>
          </div>

          {/* 해시태그 클라우드 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tags</h3>
              <button
                onClick={() => setShowTagManager(true)}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
              >
                <Edit2 size={12} />
                추가/편집
              </button>
            </div>

            <div className="flex flex-wrap gap-2 px-1">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${filterCategory === 'all' ? 'ring-2 ring-slate-400' : ''}`}
                style={{ backgroundColor: '#D5D5D7' }}
              >
                전체
              </button>
              {categories.map(cat => {
                const bgColor = getHashtagColor(cat, tagColors);
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${filterCategory === cat ? 'ring-2 ring-slate-400' : ''}`}
                    style={{ backgroundColor: bgColor }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header - 스크롤 전에는 숨김 */}
        {isScrolled && (
          <div className="flex items-center justify-between p-4 md:px-8 md:py-6 bg-[#F0EFEB]/80 backdrop-blur-sm border-b border-slate-300/50">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-300/20 rounded-lg transition-colors">
                <Menu size={20} className="text-slate-600" />
              </button>
              <span className="font-bold text-xl text-slate-700">Moya List</span>
            </div>

            {/* 게스트모드/로그인 상태 표시 */}
            <div className="flex items-center gap-2">
              {!user ? (
                <div className="flex items-center gap-2">
                  <button
                    onMouseEnter={() => setShowGuestInfo(true)}
                    onMouseLeave={() => setShowGuestInfo(false)}
                    className="flex items-center gap-1 text-xs text-slate-500"
                  >
                    게스트모드
                    <HelpCircle size={14} className="text-slate-400" />
                  </button>

                  <button
                    onClick={() => setShowLogin(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-white text-xs rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <LogIn size={14} />
                    로그인
                  </button>
                </div>
              ) : (
                <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-300/20 rounded-lg transition-colors">
                  <User size={16} className="text-slate-600" />
                  <span className="text-xs text-slate-600">프로필</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
          {/* Full Screen Input Area - 항상 렌더링, visibility로 제어 */}
          <div className={`h-screen flex items-center justify-center bg-[#F0EFEB] relative transition-opacity duration-300 ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="w-full max-w-3xl mx-auto px-4">
              {/* Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="absolute top-6 left-6 p-2 hover:bg-slate-300/20 rounded-lg transition-colors"
              >
                <Menu size={24} className="text-slate-600" />
              </button>

              {/* Contenteditable Input with Overlay */}
              <div className="relative">
                {/* Placeholder */}
                {!newItemText && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 py-6 text-3xl md:text-5xl text-center">
                    무엇이 궁금하신가요?
                  </div>
                )}

                <div
                  ref={editorRef}
                  id="questionEditor"
                  contentEditable={!isScrolled}
                  onInput={handleTextChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full bg-transparent focus:outline-none caret-slate-800 py-6 text-3xl md:text-5xl text-center ${newItemText ? 'text-transparent' : 'text-slate-800'}`}
                  style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  suppressContentEditableWarning
                />

                {/* Highlight Overlay */}
                {newItemText && (
                  <div
                    className="absolute inset-0 pointer-events-none text-slate-800 py-6 text-3xl md:text-5xl text-center"
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  >
                    {renderHighlightedText(newItemText)}
                  </div>
                )}
              </div>

              {newItemCategories.length > 0 && (
                <div className="mt-6 flex items-center justify-center gap-2 text-base text-slate-600 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Tag size={16} />
                  <span>카테고리: {newItemCategories.join(', ')}</span>
                </div>
              )}

              {/* 스크롤 힌트 */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-slate-400 text-sm animate-bounce">
                ↓ 스크롤하여 목록 보기
              </div>
            </div>
          </div>

          {/* Sticky Compact Input Area - 항상 렌더링 */}
          <div className={`sticky top-0 z-10 bg-[#F0EFEB] px-4 md:px-8 py-4 border-b border-slate-300/50 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="w-full max-w-3xl mx-auto">
              {/* Contenteditable Input with Overlay */}
              <div className="relative">
                {/* Placeholder */}
                {!newItemText && (
                  <div className="absolute inset-0 pointer-events-none flex items-center text-slate-400 py-3 px-4 text-base text-left">
                    궁금한 것을 입력하세요...
                  </div>
                )}

                <div
                  ref={compactEditorRef}
                  contentEditable={isScrolled}
                  onInput={handleTextChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full bg-transparent focus:outline-none caret-slate-800 py-3 px-4 text-base text-left ${newItemText ? 'text-transparent' : 'text-slate-800'}`}
                  style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  suppressContentEditableWarning
                />

                {/* Highlight Overlay */}
                {newItemText && (
                  <div
                    className="absolute inset-0 pointer-events-none text-slate-800 py-3 px-4 text-base text-left"
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  >
                    {renderHighlightedText(newItemText)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="px-4 md:px-8 py-6 bg-[#F0EFEB] min-h-screen">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] opacity-40">
                <Plus size={48} className="text-slate-400 mb-4" />
                <h2 className="text-2xl font-bold text-slate-400">첫 궁금증을 등록해보세요</h2>
                <p className="text-slate-400 mt-2">위 입력창에 입력 후 Enter를 누르세요</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4 pb-20">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className={`bg-[#F0EFEB] p-5 rounded-xl border transition-all ${item.status === 'solved' ? 'border-[#CAD3C0]' : 'border-slate-300/50'} ${item.id === newlyAddedId ? 'animate-sink-in' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2 flex-wrap">
                        {(item.categories || (item.category ? [item.category] : ['기타'])).map((cat, idx) => {
                          const bgColor = getHashtagColor(cat, tagColors);
                          return (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium"
                              style={{ backgroundColor: bgColor }}
                            >
                              {cat}
                            </span>
                          );
                        })}
                      </div>
                      <button onClick={() => toggleStatus(item.id, item.status)} className={`${item.status === 'solved' ? 'text-[#CAD3C0]' : 'text-slate-300 hover:text-slate-500'}`}>
                        {item.status === 'solved' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                    </div>
                    <h3 className={`font-medium text-slate-800 mb-2 ${item.status === 'solved' && 'line-through text-slate-400'}`}>{item.text}</h3>
                    {item.summary && <p className="text-sm text-slate-500 mb-4 whitespace-pre-wrap">{item.summary}</p>}
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] text-slate-400">{item.createdAt && new Date(item.createdAt).toLocaleDateString()}</span>
                      <button onClick={(e) => deleteItem(item.id, e)} className="text-slate-300 hover:text-red-400"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
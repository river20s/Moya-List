import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Menu,
  X,
  Tag,
  LayoutGrid
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
const extractHashtag = (text) => {
  const match = text.match(/#([\w가-힣]+)/);
  return match ? match[1] : null;
};

export default function App() {
  // --- State ---
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(['HTML', 'CSS', 'React', '수학', '알고리즘']);

  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);

  // --- Init ---
  useEffect(() => {
    if (FIREBASE_CONFIG) {
      try {
        const app = initializeApp(FIREBASE_CONFIG);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        setAuth(authInstance);
        setDb(dbInstance);

        signInAnonymously(authInstance).catch((error) => {
            console.error("Auth Error:", error);
        });

        onAuthStateChanged(authInstance, (u) => setUser(u));
      } catch (e) {
        console.error("Firebase init error:", e);
      }
    } else {
      console.log("Firebase 설정이 없어 로컬 스토리지 모드로 실행");
      const savedItems = localStorage.getItem('moya_items');
      if (savedItems) setItems(JSON.parse(savedItems));
      
      const savedCats = localStorage.getItem('moya_categories');
      if (savedCats) setCategories(JSON.parse(savedCats));
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
  }, [user, db, items, categories]);

  // --- Handlers ---
  const handleTextChange = (e) => {
    const text = e.target.value;
    setNewItemText(text);
    const detectedTag = extractHashtag(text);
    if (detectedTag) {
      setNewItemCategory(detectedTag);
    } else {
      setNewItemCategory('');
    }
  };

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;

    let finalCategory = newItemCategory || '기타';
    if (!categories.includes(finalCategory)) {
        const newCategories = [...categories, finalCategory];
        setCategories(newCategories);
        if (!db) localStorage.setItem('moya_categories', JSON.stringify(newCategories));
    }

    const newItem = {
      text: newItemText,
      summary: "",
      category: finalCategory,
      status: 'unsolved',
      createdAt: new Date().toISOString(),
    };

    if (user && db) {
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'moya_items'), {
        ...newItem,
        createdAt: serverTimestamp()
      });
    } else {
      const updatedItems = [{ ...newItem, id: Date.now().toString() }, ...items];
      setItems(updatedItems);
      localStorage.setItem('moya_items', JSON.stringify(updatedItems));
    }

    setNewItemText('');
    setNewItemCategory('');
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

  const filteredItems = items.filter(item => {
    const statusMatch = filterStatus === 'all' || item.status === filterStatus;
    const catMatch = filterCategory === 'all' || item.category === filterCategory;
    return statusMatch && catMatch;
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddItem();
    }
  };

  // 텍스트를 해시태그 하이라이트와 함께 렌더링
  const renderHighlightedText = (text) => {
    if (!text) return null;

    const parts = [];
    let lastIndex = 0;
    const hashtagRegex = /#[\w가-힣]+/g;
    let match;

    while ((match = hashtagRegex.exec(text)) !== null) {
      // 해시태그 이전 텍스트
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }
      // 해시태그
      parts.push(
        <span key={`hash-${match.index}`} className="text-indigo-600 font-semibold">
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    // 남은 텍스트
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return <>{parts}</>;
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    setIsScrolled(scrollTop > 50);
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20 absolute md:relative h-full overflow-hidden`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">M</div>
            <span>Moya List</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-1">
            <button onClick={() => setFilterStatus('all')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${filterStatus === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <LayoutGrid size={16} /> 전체 보기
            </button>
            <button onClick={() => setFilterStatus('unsolved')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${filterStatus === 'unsolved' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Circle size={16} className="text-amber-500" /> 미해결
            </button>
            <button onClick={() => setFilterStatus('solved')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${filterStatus === 'solved' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <CheckCircle2 size={16} className="text-emerald-500" /> 해결됨
            </button>
          </div>
          <div className="space-y-1">
            <h3 className="px-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Categories</h3>
            <button onClick={() => setFilterCategory('all')} className={`w-full text-left px-3 py-1.5 rounded text-sm ${filterCategory === 'all' ? 'text-indigo-700 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}># 전체</button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)} className={`w-full text-left px-3 py-1.5 rounded text-sm ${filterCategory === cat ? 'text-indigo-700 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}>
                # {cat}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:px-8 md:py-6 bg-white/80 backdrop-blur-sm border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Menu size={20} className="text-slate-600" />
            </button>
            <span className="font-bold text-xl text-indigo-600">Moya List</span>
          </div>
          <span className="text-xs text-slate-400">{FIREBASE_CONFIG ? "Firebase 연동됨" : "로컬 모드"}</span>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
          {/* Input Area - Large Hero Section */}
          <div className={`sticky top-0 z-10 bg-white border-b border-slate-200 transition-all duration-500 ${isScrolled ? 'px-4 md:px-8 py-4' : 'px-4 md:px-8 py-12 md:py-24'}`}>
            <div className="max-w-3xl mx-auto">
              {/* Input with Highlight Overlay */}
              <div className="relative">
                <input
                  type="text"
                  value={newItemText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-6 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-transparent caret-slate-800 ${isScrolled ? 'py-3 text-base' : 'py-6 text-2xl md:text-3xl'}`}
                  autoFocus
                />
                {/* Highlight Overlay */}
                <div className={`absolute inset-0 px-6 pointer-events-none flex items-center overflow-hidden text-slate-800 whitespace-pre-wrap ${isScrolled ? 'py-3 text-base' : 'py-6 text-2xl md:text-3xl'}`}>
                  {newItemText ? renderHighlightedText(newItemText) : (
                    <span className="text-slate-400">궁금한 것을 입력하세요... (# 으로 카테고리 지정, Enter로 등록)</span>
                  )}
                </div>
              </div>

              {newItemCategory && (
                <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Tag size={14} />
                  <span>카테고리: {newItemCategory}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="px-4 md:px-8 py-6">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] opacity-40">
                <Plus size={48} className="text-slate-400 mb-4" />
                <h2 className="text-2xl font-bold text-slate-400">첫 궁금증을 등록해보세요</h2>
                <p className="text-slate-400 mt-2">위 입력창에 입력 후 Enter를 누르세요</p>
                <p className="text-slate-400 mt-4 text-sm">👇 스크롤을 내려보세요</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4 pb-20">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className={`bg-white p-5 rounded-xl shadow-sm border transition-all hover:shadow-md ${item.status === 'solved' ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-200'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'solved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {item.category}
                      </span>
                      <button onClick={() => toggleStatus(item.id, item.status)} className={`${item.status === 'solved' ? 'text-emerald-500' : 'text-slate-300 hover:text-amber-500'}`}>
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
  );
}
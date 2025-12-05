import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Menu, 
  X, 
  Tag, 
  LayoutGrid,
  Sparkles,
  Loader2
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
// 로컬에서 실행 시
const APP_ID = 'moya-list-local';

const FIREBASE_CONFIG = null; 

const GEMINI_API_KEY = ""; 

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
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
    if (detectedTag) setNewItemCategory(detectedTag);
  };

  const handleAskAI = async () => {
    if (!newItemText) return alert("내용을 입력해주세요.");
    
    setIsAiLoading(true);
    
    // API 키가 없으면 시뮬레이션
    if (!GEMINI_API_KEY) {
       setTimeout(() => {
           setAiAnswer("API 키가 설정되지 않아 시뮬레이션 답변을 드립니다.\n\n" + newItemText + "에 대한 요약입니다.");
           setIsAiLoading(false);
       }, 1500);
       return;
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `요약해줘: ${newItemText}` }] }]
        })
      });
      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setAiAnswer(answer || "답변 실패");
    } catch (error) {
      setAiAnswer("에러: " + error.message);
    } finally {
      setIsAiLoading(false);
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
      summary: aiAnswer ? `[AI] ${aiAnswer}` : (newItemText.length > 50 ? newItemText.slice(0, 50) + "..." : ""), 
      category: finalCategory,
      status: 'unsolved',
      createdAt: new Date().toISOString(), // 로컬용 날짜 포맷
    };

    if (user && db) {
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'moya_items'), {
        ...newItem,
        createdAt: serverTimestamp() // 파이어베이스용 서버 시간
      });
    } else {
      const updatedItems = [{ ...newItem, id: Date.now().toString() }, ...items];
      setItems(updatedItems);
      localStorage.setItem('moya_items', JSON.stringify(updatedItems));
    }

    setNewItemText('');
    setNewItemCategory('');
    setAiAnswer('');
    setIsModalOpen(false);
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

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20 absolute md:relative h-full`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">M</div>
            <span className={`${!sidebarOpen && 'hidden'}`}>Moya List</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400"><X size={20}/></button>
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
      <main className="flex-1 relative bg-slate-50 overflow-y-auto p-4 md:p-10" onClick={(e) => { if(e.target === e.currentTarget && !isModalOpen) setIsModalOpen(true); }}>
        <div className="md:hidden w-full flex justify-between items-center mb-6">
          <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white rounded shadow-sm text-slate-600"><Menu size={20} /></button>
          <span className="font-bold text-indigo-600">Moya List</span>
          <div className="w-8"></div>
        </div>

        {items.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
            <Plus size={40} className="text-slate-400 mb-4" />
            <h2 className="text-2xl font-bold text-slate-400">화면을 클릭해 기록하세요</h2>
            <p className="text-slate-400 mt-2">({FIREBASE_CONFIG ? "Firebase 연동됨" : "로컬 스토리지 모드"})</p>
          </div>
        )}

        <div className="w-full max-w-4xl space-y-4 mx-auto pb-20">
             {filteredItems.map(item => (
                 <div key={item.id} className={`bg-white p-5 rounded-xl shadow-sm border transition-all hover:shadow-md ${item.status === 'solved' ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-200'}`}>
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
      </main>

      {/* Input Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-slate-700">궁금증 기록</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              
              <textarea
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-700 mb-4"
                  placeholder="내용을 입력하세요. (예: #React useEffect가 뭐지?)"
                  value={newItemText}
                  onChange={handleTextChange}
                  autoFocus
              />

              {aiAnswer && (
                  <div className="mb-4 p-3 bg-indigo-50 rounded-lg text-sm text-indigo-800 border border-indigo-100">
                      <div className="flex items-center gap-2 font-bold mb-1">
                          <Sparkles size={14} /> AI 답변:
                      </div>
                      {aiAnswer}
                  </div>
              )}
              
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="flex items-center gap-2 w-full">
                      <Tag size={16} className="text-slate-400" />
                      <input 
                        type="text" 
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        placeholder="카테고리 (자동)"
                        className="bg-transparent text-sm text-slate-600 focus:outline-none w-full"
                        list="category-list"
                      />
                      <datalist id="category-list">
                          {categories.map(c => <option key={c} value={c} />)}
                      </datalist>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                      <button 
                        onClick={handleAskAI}
                        disabled={isAiLoading || !newItemText}
                        className="flex-1 md:flex-none whitespace-nowrap px-4 py-2.5 bg-white border border-indigo-200 text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                      >
                          {isAiLoading ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16} />}
                          AI에게 묻기
                      </button>
                      
                      <button 
                        onClick={handleAddItem}
                        className="flex-1 md:flex-none whitespace-nowrap px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                      >
                          등록
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}
      
      <button className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center z-40" onClick={() => setIsModalOpen(true)}>
          <Plus size={24} />
      </button>
    </div>
  );
}
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
  XCircle,
  MessageSquare,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  Search,
  Calendar,
  Filter,
  Lightbulb,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3
} from 'lucide-react';


// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged,
  GoogleAuthProvider, 
  signInWithPopup,    
  signOut
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
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

// --- Global Config & Init (컴포넌트 밖으로 이동!) ---
const APP_ID = 'moya-list-local';

const FIREBASE_CONFIG = import.meta.env.VITE_FIREBASE_API_KEY ? {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
} : null;

// Firebase 인스턴스를 전역 변수로 선언
let app = null;
let auth = null;
let db = null;

// Config가 있을 때만 초기화 수행
if (FIREBASE_CONFIG) {
  try {
    app = initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("✅ Firebase initialized successfully");
    console.log("Auth:", auth ? "OK" : "FAIL");
    console.log("DB:", db ? "OK" : "FAIL");
  } catch (e) {
    console.error("❌ Firebase Global Init Error:", e);
  }
} else {
  console.warn("⚠️ Firebase config not found - running in local mode");
}

// --- Helper Functions ---
const extractHashtags = (text) => {
  const matches = text.match(/#[\w가-힣]+/g);
  if (!matches) return [];
  const tags = matches.map(tag => tag.substring(1));
  return [...new Set(tags)];
};

const linkifyText = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const HASHTAG_COLORS = ['#EBD8DC', '#F5EBC8', '#CAD3C0', '#D5D5D7', '#D4E4F1', '#F0D8CC', '#DAD3DB'];

const getHashtagColor = (tag, customColors = {}) => {
  if (customColors[tag]) return customColors[tag];
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
  const [categories, setCategories] = useState([]);

  const [newItemText, setNewItemText] = useState('');
  const [newItemCategories, setNewItemCategories] = useState([]);

  // 필터 state
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState('none'); // 'none', 'date', 'status'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'solved', 'unsolved'
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const [showGuestInfo, setShowGuestInfo] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newTagColor, setNewTagColor] = useState(HASHTAG_COLORS[0]);
  const [tagColors, setTagColors] = useState({});
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [colorPickerPosition, setColorPickerPosition] = useState({ top: 0, left: 0 });
  const [tagSortOrder, setTagSortOrder] = useState('usage'); // 'usage', 'recent', 'alphabetical', 'custom'
  const [customTagOrder, setCustomTagOrder] = useState([]);
  const [draggedTagIndex, setDraggedTagIndex] = useState(null);

  const [detailModalItem, setDetailModalItem] = useState(null);
  const [detailDescription, setDetailDescription] = useState('');
  const [detailImages, setDetailImages] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);

  // 자동 분류 관련 state
  const [uncategorizedCount, setUncategorizedCount] = useState(0);

  const editorRef = useRef(null);
  const compactEditorRef = useRef(null);
  const prevScrolledRef = useRef(isScrolled);

  // --- Scroll Effect ---
  useEffect(() => {
    if (prevScrolledRef.current !== isScrolled) {
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

  // --- Focus Effect ---
  useEffect(() => {
    if (editorRef.current) {
      setTimeout(() => editorRef.current?.focus(), 100);
    }
  }, []);

  // URL 파라미터 저장용 ref
  const urlParamsRef = useRef(null);

  // --- URL Param Effect ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const textParam = params.get('text');
    const urlParam = params.get('url');

    if (textParam) {
      console.log('📥 URL Params detected:', { text: textParam, url: urlParam });
      const extractedTags = extractHashtags(textParam);

      // URL 파라미터를 ref에 저장하고 나중에 처리
      urlParamsRef.current = {
        text: textParam,
        tags: extractedTags,
        url: urlParam
      };

      // 입력창은 비워두기 (자동 추가만 하고 표시하지 않음)
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // URL 파라미터로 받은 데이터를 Firebase 인증 완료 후 추가
  useEffect(() => {
    const addFromUrlParams = async () => {
      // user !== null (로그인 상태)일 때만 실행
      if (urlParamsRef.current && user) {
        console.log('🚀 Adding item from URL params, user state:', user.email);
        const { text, tags, url } = urlParamsRef.current;

        const finalCategories = tags.length > 0 ? tags : ['기타'];
        const initialDescription = url ? `원본 링크: ${url}` : "";

        try {
          const collectionPath = `users/${user.uid}/moya_items`;
          await addDoc(collection(db, collectionPath), {
            text: text,
            summary: "",
            description: initialDescription,
            images: [],
            categories: finalCategories,
            status: 'unsolved',
            createdAt: serverTimestamp()
          });
          console.log('✅ URL param item saved to Firestore');
          urlParamsRef.current = null; // 성공 후에만 null로 설정
        } catch (error) {
          console.error('❌ Failed to save URL param item:', error);
        }
      }
    };

    addFromUrlParams();
  }, [user]);

  // --- Auth & Init Effect ---
  useEffect(() => {
    console.log('🔄 Auth & Init Effect running...');
    // Firebase가 정상적으로 로드된 경우
    if (auth && db) {
      console.log('✅ Firebase auth and db are available');
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        console.log('👤 Auth state changed:', currentUser ? `Logged in as ${currentUser.email}` : 'Logged out');
        setUser(currentUser);

        // [데이터 가져오기 로직]
        if (currentUser) {
          // 마이그레이션 완료 플래그 확인
          const migrationDone = localStorage.getItem('moya_migration_done');
          const localItems = localStorage.getItem('moya_items');

          // 마이그레이션이 아직 안 되었고, 로컬 데이터가 있을 때만 팝업 표시
          if (!migrationDone && localItems) {
            const parsedItems = JSON.parse(localItems);
            if (parsedItems.length > 0) {
              const shouldMigrate = window.confirm(
                "게스트 모드에서 작성한 데이터가 있습니다. 로그인한 계정으로 가져오시겠습니까?"
              );

              if (shouldMigrate) {
                try {
                  // Promise.all로 병렬 처리하여 확실하게 모두 저장될 때까지 기다림
                  const collectionPath = `users/${currentUser.uid}/moya_items`;
                  await Promise.all(parsedItems.map(item => {
                    const { id, ...itemData } = item;
                    return addDoc(collection(db, collectionPath), {
                      ...itemData,
                      createdAt: itemData.createdAt ? new Date(itemData.createdAt) : serverTimestamp()
                    });
                  }));

                  // 저장이 완료된 후에 로컬 데이터 삭제
                  localStorage.removeItem('moya_items');
                  alert("데이터 가져오기 완료!");
                } catch (error) {
                  console.error("Migration failed:", error);
                  alert("데이터 가져오기 중 오류가 발생했습니다.");
                }
              } else {
                // 가져오지 않기를 선택한 경우 로컬 데이터 삭제
                localStorage.removeItem('moya_items');
              }

              // 마이그레이션 처리 완료 플래그 설정 (선택 여부와 무관)
              localStorage.setItem('moya_migration_done', 'true');
            }
          }
        } else {
          // 로그아웃 시 마이그레이션 플래그 제거 (다음 로그인 시 다시 물어봄)
          localStorage.removeItem('moya_migration_done');

          // 게스트 모드: 로컬 스토리지에서 데이터 로드
          const savedItems = localStorage.getItem('moya_items');
          if (savedItems) {
            setItems(JSON.parse(savedItems));
          } else {
            setItems([]); // 로컬 데이터가 없으면 빈 배열
          }

          const savedCats = localStorage.getItem('moya_categories');
          if (savedCats) {
            setCategories(JSON.parse(savedCats));
          } else {
            setCategories([]); // 로컬 데이터가 없으면 빈 배열
          }

          const savedColors = localStorage.getItem('moya_tag_colors');
          if (savedColors) {
            setTagColors(JSON.parse(savedColors));
          } else {
            setTagColors({}); // 로컬 데이터가 없으면 빈 객체
          }

          const savedCustomOrder = localStorage.getItem('moya_custom_tag_order');
          if (savedCustomOrder) {
            setCustomTagOrder(JSON.parse(savedCustomOrder));
          }

          const savedSortOrder = localStorage.getItem('moya_tag_sort_order');
          if (savedSortOrder) {
            setTagSortOrder(savedSortOrder);
          }
        }
      });
      return () => unsubscribe();
    } else {
      // 로컬 모드 Fallback (Firebase 설정이 없는 경우)
      console.log("로컬 스토리지 모드 실행");
      const savedItems = localStorage.getItem('moya_items');
      if (savedItems) setItems(JSON.parse(savedItems));

      const savedCats = localStorage.getItem('moya_categories');
      if (savedCats) setCategories(JSON.parse(savedCats));

      const savedColors = localStorage.getItem('moya_tag_colors');
      if (savedColors) setTagColors(JSON.parse(savedColors));

      const savedCustomOrder = localStorage.getItem('moya_custom_tag_order');
      if (savedCustomOrder) setCustomTagOrder(JSON.parse(savedCustomOrder));

      const savedSortOrder = localStorage.getItem('moya_tag_sort_order');
      if (savedSortOrder) setTagSortOrder(savedSortOrder);
    }
  }, []); // 빈 배열: 최초 1회 실행

  // --- Sync Effect (DB Listener) ---
  useEffect(() => {
    console.log('🔄 Sync Effect running... user:', user ? user.email : 'null', 'db:', db ? 'OK' : 'null');

    if (!user || !db) {
      console.log('⏭️ Skipping DB sync (no user or db)');
      return;
    }

    console.log('🎧 Setting up Firestore listener for user:', user.uid);

    // 로그인 상태 -> Firestore 실시간 동기화
    const collectionPath = `users/${user.uid}/moya_items`;
    console.log('  - Listening to path:', collectionPath);

    const q = query(
      collection(db, collectionPath),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeItems = onSnapshot(
      q,
      {
        includeMetadataChanges: false, // 메타데이터 변경은 무시
      },
      (snapshot) => {
        console.log('📦 Snapshot received, docs count:', snapshot.docs.length);
        console.log('   - fromCache:', snapshot.metadata.fromCache);
        console.log('   - hasPendingWrites:', snapshot.metadata.hasPendingWrites);

        const fetchedItems = snapshot.docs.map(doc => {
          const data = doc.data();
          let createdAt = data.createdAt;

          // Firestore Timestamp를 ISO 문자열로 변환
          if (createdAt?.toDate) {
            createdAt = createdAt.toDate().toISOString();
          } else if (createdAt?.seconds) {
            // Firestore Timestamp 객체인 경우
            createdAt = new Date(createdAt.seconds * 1000).toISOString();
          } else if (!createdAt) {
            // createdAt이 없는 경우 현재 시간 사용
            createdAt = new Date().toISOString();
          }

          return {
            id: doc.id,
            ...data,
            createdAt
          };
        });

        console.log('✅ Fetched items from DB:', fetchedItems);
        setItems(fetchedItems);
      },
      (error) => {
        console.error("❌ Snapshot error:", error);
        console.error("   - Error code:", error.code);
        console.error("   - Error message:", error.message);
      }
    );

    // 카테고리 및 태그 색상 동기화 리스너 추가
    const settingsPath = `users/${user.uid}/moya_settings`;
    const settingsDocRef = doc(db, settingsPath, 'preferences');

    const unsubscribeSettings = onSnapshot(
      settingsDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log('📋 Settings snapshot received:', data);

          if (data.categories) {
            setCategories(data.categories);
          }
          if (data.tagColors) {
            setTagColors(data.tagColors);
          }
        } else {
          console.log('⚠️ No settings document found, using defaults');
        }
      },
      (error) => {
        console.error("❌ Settings snapshot error:", error);
      }
    );

    // 사용자 문서 리스너 (태그 정렬 순서 등)
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log('👤 User snapshot received:', data);

          if (data.customTagOrder) {
            setCustomTagOrder(data.customTagOrder);
          }
          if (data.tagSortOrder) {
            setTagSortOrder(data.tagSortOrder);
          }
        }
      },
      (error) => {
        console.error("❌ User snapshot error:", error);
      }
    );

    console.log('✅ Firestore listeners registered');
    return () => {
      console.log('🔌 Unsubscribing Firestore listeners');
      unsubscribeItems();
      unsubscribeSettings();
      unsubscribeUser();
    };
  }, [user]); // user만 의존성으로 설정

  // --- 게스트 모드 로컬 스토리지 동기화 ---
  useEffect(() => {
    // 게스트 모드일 때만 로컬 스토리지에 저장
    if (!user) {
      console.log('💾 Saving to localStorage (guest mode):', items.length, 'items');
      localStorage.setItem('moya_items', JSON.stringify(items));
      localStorage.setItem('moya_categories', JSON.stringify(categories));
    } else {
      console.log('🔒 Skipping localStorage save (logged in)');
    }
  }, [user, items, categories]);

  // 카테고리 없는 항목 개수 추적
  useEffect(() => {
    const uncategorized = items.filter(item => {
      const itemCategories = item.categories || [];
      return itemCategories.length === 0 || (itemCategories.length === 1 && itemCategories[0] === '기타');
    });
    setUncategorizedCount(uncategorized.length);
  }, [items]);

  // 태그 정렬 순서 저장
  useEffect(() => {
    localStorage.setItem('moya_tag_sort_order', tagSortOrder);
    if (user && db) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, { tagSortOrder }, { merge: true }).catch(console.error);
    }
  }, [tagSortOrder, user]);

  // --- Handlers ---
  const handleTextChange = (e) => {
    const text = e.target.textContent || '';
    setNewItemText(text);
    const detectedTags = extractHashtags(text);
    setNewItemCategories(detectedTags);
  };

  // GPT-4o를 사용한 자동 카테고리 분류 (개발 중)
  const handleAutoClassify = () => {
    alert('🚧 개발 중인 기능입니다.\n\nGPT-4o를 활용한 AI 자동 분류 기능이 곧 추가될 예정입니다!');
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowLogin(false);
    } catch (error) {
      console.error("Login Failed:", error);
      alert("로그인 실패");
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    if (window.confirm("로그아웃 하시겠습니까?")) {
      try {
        await signOut(auth);
        // 로그아웃 시 items를 비우지 않음 - onAuthStateChanged에서 처리됨
      } catch (error) {
        console.error("Logout Failed:", error);
      }
    }
  };

  const handleAddItem = async (manualText = null, manualCategories = null, sourceUrl = null) => {
    const targetText = typeof manualText === 'string' ? manualText : newItemText;
    // const targetCategories = manualCategories || newItemCategories;
    const targetCategories = manualCategories || extractHashtags(targetText);

    if (!targetText.trim()) return;

    let finalCategories = targetCategories.length > 0 ? targetCategories : ['기타'];
    const initialDescription = sourceUrl ? `원본 링크: ${sourceUrl}` : "";

    // 카테고리 업데이트
    const newCats = finalCategories.filter(cat => !categories.includes(cat));
    if (newCats.length > 0) {
      const updatedCategories = [...categories, ...newCats];
      setCategories(updatedCategories);

      // 카테고리 저장 (로그인 상태에 따라 분기)
      if (user && db) {
        // 로그인 상태: Firestore에 저장
        try {
          const settingsDocRef = doc(db, `users/${user.uid}/moya_settings`, 'preferences');
          await setDoc(settingsDocRef, {
            categories: updatedCategories,
            tagColors: tagColors
          }, { merge: true });
          console.log('✅ Categories saved to Firestore');
        } catch (error) {
          console.error('❌ Failed to save categories to Firestore:', error);
        }
      } else {
        // 게스트 모드: 로컬 스토리지에 저장
        localStorage.setItem('moya_categories', JSON.stringify(updatedCategories));
      }
    }

    const newItem = {
      text: targetText,
      summary: "",
      description: initialDescription,
      images: [],
      categories: finalCategories,
      status: 'unsolved',
      createdAt: new Date().toISOString(),
    };

    // --- 저장 로직 (핵심 수정 부분) ---
    console.log('🔍 handleAddItem called');
    console.log('  - user:', user ? `${user.uid} (${user.email})` : 'null');
    console.log('  - db:', db ? 'OK' : 'null');
    console.log('  - auth:', auth ? 'OK' : 'null');

    // user가 있으면 무조건 DB로 간다. (db는 전역 변수라 null일 확률이 거의 없음)
    if (user && db) {
      try {
        // 단순화된 경로 사용
        const collectionPath = `users/${user.uid}/moya_items`;
        console.log('💾 Attempting to save to Firestore...');
        console.log('  - Path:', collectionPath);
        console.log('  - Data:', { text: targetText, categories: finalCategories, status: 'unsolved' });

        const docRef = await addDoc(collection(db, collectionPath), {
          text: targetText,
          summary: "",
          description: initialDescription,
          images: [],
          categories: finalCategories,
          status: 'unsolved',
          createdAt: serverTimestamp()
        });

        console.log('✅ Successfully saved to DB with ID:', docRef.id);
        console.log('  - Full path:', `${collectionPath}/${docRef.id}`);

        // DB 저장 시에는 setItems를 직접 하지 않음 (onSnapshot이 처리)
        // 하지만 신규 아이템 강조 효과를 위해 ID는 필요
        setNewlyAddedId(docRef.id);
        setTimeout(() => setNewlyAddedId(null), 800);
      } catch (error) {
        console.error("❌ DB Save Error:", error);
        console.error("Error details:", error.message);
        console.error("Error code:", error.code);
        alert(`저장에 실패했습니다: ${error.message}`);
        return; // 실패하면 입력창 비우지 않음
      }
    } else {
      // 로컬 스토리지 저장
      console.log('💿 Saving to local storage (guest mode)...');
      const addedId = Date.now().toString();
      const updatedItems = [{ ...newItem, id: addedId }, ...items];
      setItems(updatedItems);
      localStorage.setItem('moya_items', JSON.stringify(updatedItems));
      console.log('✅ Saved to local storage, total items:', updatedItems.length);

      setNewlyAddedId(addedId);
      setTimeout(() => setNewlyAddedId(null), 800);
    }

    // UI 초기화
    setNewItemText('');
    setNewItemCategories([]);
    if (editorRef.current) editorRef.current.textContent = '';
    if (compactEditorRef.current) compactEditorRef.current.textContent = '';

    const currentEditor = isScrolled ? compactEditorRef.current : editorRef.current;
    if (currentEditor) currentEditor.focus();
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'unsolved' ? 'solved' : 'unsolved';
    if (user && db) {
      await updateDoc(doc(db, `users/${user.uid}/moya_items`, id), { status: newStatus });
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
      await deleteDoc(doc(db, `users/${user.uid}/moya_items`, id));
    } else {
      const updatedItems = items.filter(item => item.id !== id);
      setItems(updatedItems);
      localStorage.setItem('moya_items', JSON.stringify(updatedItems));
    }
  };

  // ... (나머지 태그 관련 핸들러, 스크롤 핸들러 등은 기존과 동일) ...
  // (코드 길이상 생략하지만, 기존 핸들러들 그대로 사용하시면 됩니다)
  // 태그 핸들러, 스크롤 핸들러, 렌더링 부분은 수정할 필요 없습니다.

  // --- 기존의 나머지 핸들러와 UI 렌더링 부분 유지 ---
  // 아래 handleAddTag 부터는 기존 코드 복붙해서 쓰시면 됩니다.
  
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
    
    // 로컬 스토리지 동기화 (로그인 여부 상관없이 카테고리는 로컬에 저장해도 무방하나, 
    // 엄격하게 하려면 분기 필요. 여기선 UX 편의상 로컬 저장 유지)
    localStorage.setItem('moya_categories', JSON.stringify(updatedCategories));

    const updatedColors = { ...tagColors, [trimmedTag]: newTagColor };
    setTagColors(updatedColors);
    localStorage.setItem('moya_tag_colors', JSON.stringify(updatedColors));

    setNewTag('');
    setNewTagColor(HASHTAG_COLORS[0]);
  };
  
  // (중략: startEditTag, handleEditTag, handleDeleteTag, handleChangeTagColor 등등...)
  // 기존 코드의 나머지 함수들과 return문 이하는 그대로 두시면 됩니다.
  
  // 여기서부터는 편의를 위해 기존 코드를 그대로 붙여넣되, handleItemClick 등 필요한 부분만 남겨둡니다.
  const startEditTag = (tag) => { setEditingTag(tag); setEditingTagValue(tag); };
  
  const handleEditTag = () => {
    if (!editingTagValue.trim()) return;
    if (editingTagValue === editingTag) { setEditingTag(null); return; }
    if (categories.includes(editingTagValue.trim()) && editingTagValue.trim() !== editingTag) {
      alert('이미 존재하는 태그입니다.'); return;
    }
    const updatedItems = items.map(item => {
      if (item.categories && item.categories.includes(editingTag)) {
        return { ...item, categories: item.categories.map(cat => cat === editingTag ? editingTagValue.trim() : cat) };
      }
      return item;
    });
    const updatedCategories = categories.map(cat => cat === editingTag ? editingTagValue.trim() : cat);
    setItems(updatedItems);
    setCategories(updatedCategories);
    if(!user) { // 로컬일때만 수동 저장 (DB일땐 별도 로직 필요하나 일단 유지)
        localStorage.setItem('moya_items', JSON.stringify(updatedItems));
    }
    localStorage.setItem('moya_categories', JSON.stringify(updatedCategories));
    setEditingTag(null);
  };

  const handleDeleteTag = (tag) => {
    if (!window.confirm(`"${tag}" 태그를 삭제하시겠습니까?`)) return;
    const updatedItems = items.map(item => {
      if (item.categories && item.categories.includes(tag)) {
        return { ...item, categories: item.categories.filter(cat => cat !== tag) };
      }
      return item;
    });
    const updatedCategories = categories.filter(cat => cat !== tag);
    const updatedColors = { ...tagColors };
    delete updatedColors[tag];
    setItems(updatedItems);
    setCategories(updatedCategories);
    setTagColors(updatedColors);
    if(!user) localStorage.setItem('moya_items', JSON.stringify(updatedItems));
    localStorage.setItem('moya_categories', JSON.stringify(updatedCategories));
    localStorage.setItem('moya_tag_colors', JSON.stringify(updatedColors));
    if (filterCategory === tag) setFilterCategory('all');
  };

  const handleDragStart = (e, index) => {
    setDraggedTagIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedTagIndex === null || draggedTagIndex === index) return;

    const newOrder = [...customTagOrder];
    const draggedTag = newOrder[draggedTagIndex];
    newOrder.splice(draggedTagIndex, 1);
    newOrder.splice(index, 0, draggedTag);

    setCustomTagOrder(newOrder);
    setDraggedTagIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedTagIndex(null);
    // 수동 정렬 순서를 로컬 스토리지에 저장
    localStorage.setItem('moya_custom_tag_order', JSON.stringify(customTagOrder));
    // Firestore에도 저장
    if (user && db) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, { customTagOrder }, { merge: true }).catch(console.error);
    }
  };

  const handleChangeTagColor = (tag, color) => {
    const updatedColors = { ...tagColors, [tag]: color };
    setTagColors(updatedColors);
    localStorage.setItem('moya_tag_colors', JSON.stringify(updatedColors));
  };

  const handleItemClick = (item) => {
    setDetailModalItem(item);
    setDetailDescription(item.description || '');
    setDetailImages(item.images || []);
    setIsEditMode(false);
  };

  const handleCloseDetailModal = () => {
    setDetailModalItem(null);
    setDetailDescription('');
    setDetailImages([]);
    setIsEditMode(false);
  };

  const handleStartEdit = () => {
    setIsEditMode(true);
  };

  const handleSaveDetail = async () => {
    if (!detailModalItem) return;

    const updatedData = {
      description: detailDescription,
      images: detailImages
    };

    if (user && db) {
      await updateDoc(doc(db, `users/${user.uid}/moya_items`, detailModalItem.id), updatedData);
    } else {
      const updatedItems = items.map(item =>
        item.id === detailModalItem.id
          ? { ...item, ...updatedData }
          : item
      );
      setItems(updatedItems);
      localStorage.setItem('moya_items', JSON.stringify(updatedItems));
    }
    handleCloseDetailModal();
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 4 - detailImages.length;

    if (remainingSlots <= 0) {
      alert('이미지는 최대 4장까지만 추가할 수 있습니다.');
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDetailImages(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveImage = (index) => {
    setDetailImages(prev => prev.filter((_, i) => i !== index));
  };

  const isSnapping = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const handleScroll = (e) => {
    if (isSnapping.current) return;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      const scrollTop = e.target.scrollTop;
      const threshold = window.innerHeight * 0.3;
      if (scrollTop > 0 && scrollTop < threshold) {
        isSnapping.current = true;
        e.target.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => { isSnapping.current = false; setIsScrolled(false); }, 300);
      } else if (scrollTop >= threshold && scrollTop < window.innerHeight) {
        isSnapping.current = true;
        e.target.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
        setTimeout(() => { isSnapping.current = false; setIsScrolled(true); }, 300);
      } else {
        const shouldBeScrolled = scrollTop >= window.innerHeight * 0.5;
        if (shouldBeScrolled !== isScrolled) setIsScrolled(shouldBeScrolled);
      }
    }, 150);
  };

  // 태그 토글 함수
  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // 향상된 필터링 로직
  const filteredItems = items.filter(item => {
    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const textMatch = item.text?.toLowerCase().includes(query);
      const descMatch = item.description?.toLowerCase().includes(query);
      if (!textMatch && !descMatch) return false;
    }

    // 상태 필터
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }

    // 태그 필터 (여러 개 선택 가능)
    if (selectedTags.length > 0) {
      const itemCategories = item.categories || (item.category ? [item.category] : []);
      const hasMatchingTag = selectedTags.some(tag => itemCategories.includes(tag));
      if (!hasMatchingTag) return false;
    }

    // 날짜 필터
    if (selectedDate) {
      const itemDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : null;
      if (itemDate !== selectedDate) return false;
    }

    return true;
  });

  // 그룹핑 로직
  const groupedItems = () => {
    if (groupBy === 'date') {
      const groups = {};
      filteredItems.forEach(item => {
        const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '날짜 없음';
        if (!groups[date]) groups[date] = [];
        groups[date].push(item);
      });
      return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    } else if (groupBy === 'status') {
      const solved = filteredItems.filter(item => item.status === 'solved');
      const unsolved = filteredItems.filter(item => item.status === 'unsolved');
      const result = [];
      if (unsolved.length > 0) result.push(['미해결', unsolved]);
      if (solved.length > 0) result.push(['해결됨', solved]);
      return result;
    }
    return [['all', filteredItems]];
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddItem();
    }
  };

  const renderHighlightedText = (text) => {
    if (!text) return null;
    const parts = [];
    let lastIndex = 0;
    const hashtagRegex = /#[\w가-힣]+/g;
    let match;
    while ((match = hashtagRegex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
      parts.push(<span key={`hash-${match.index}`} className="font-bold text-slate-700">{match[0]}</span>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    return <>{parts}</>;
  };

  // 컨트리뷰션 히트맵 데이터 생성
  const getContributionData = () => {
    const today = new Date();
    const weeks = 12; // 12주간 표시
    const days = weeks * 7;

    // 날짜별 아이템 개수 맵 생성
    const activityMap = {};
    items.forEach(item => {
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        const dateKey = date.toISOString().split('T')[0];
        activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
      }
    });

    // 히트맵 데이터 생성
    const heatmapData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const count = activityMap[dateKey] || 0;

      heatmapData.push({
        date: dateKey,
        count: count,
        level: count === 0 ? 0 : count <= 1 ? 1 : count <= 2 ? 2 : count <= 3 ? 3 : 4
      });
    }

    return heatmapData;
  };

  const contributionData = getContributionData();

  const getColorForLevel = (level) => {
    const colors = {
      0: '#E8EDE7',
      1: '#B8D4AC',
      2: '#8FBC7A',
      3: '#5E994D',
      4: '#3B7A2A'
    };
    return colors[level] || colors[0];
  };

  // 날짜별 아이템이 있는 날짜 목록 생성
  const getUniqueDates = () => {
    const dates = items
      .filter(item => item.createdAt)
      .map(item => new Date(item.createdAt).toLocaleDateString('ko-KR'))
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b) - new Date(a));
    return dates;
  };

  const uniqueDates = getUniqueDates();

  // 날짜-시간 포맷팅 함수
  const formatDateTime = (dateString) => {
    if (!dateString) return '날짜 없음';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 캘린더 생성 함수
  const generateCalendar = (currentMonth) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendar = [];
    let week = new Array(7).fill(null);

    // 이전 달의 날짜로 채우기
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      week[i] = {
        date: new Date(year, month - 1, prevMonthLastDay - (startingDayOfWeek - 1 - i)),
        isCurrentMonth: false
      };
    }

    // 현재 달의 날짜 채우기
    let currentDay = 1;
    for (let i = startingDayOfWeek; i < 7 && currentDay <= daysInMonth; i++) {
      week[i] = {
        date: new Date(year, month, currentDay),
        isCurrentMonth: true
      };
      currentDay++;
    }
    calendar.push(week);

    // 나머지 주 채우기
    while (currentDay <= daysInMonth) {
      week = new Array(7).fill(null);
      for (let i = 0; i < 7 && currentDay <= daysInMonth; i++) {
        week[i] = {
          date: new Date(year, month, currentDay),
          isCurrentMonth: true
        };
        currentDay++;
      }

      // 다음 달 날짜로 빈 칸 채우기
      let nextMonthDay = 1;
      for (let i = 0; i < 7; i++) {
        if (!week[i]) {
          week[i] = {
            date: new Date(year, month + 1, nextMonthDay),
            isCurrentMonth: false
          };
          nextMonthDay++;
        }
      }
      calendar.push(week);
    }

    return calendar;
  };

  // 특정 날짜에 아이템이 있는지 확인
  const getItemCountForDate = (date) => {
    const dateStr = date.toLocaleDateString('ko-KR');
    return items.filter(item =>
      item.createdAt && new Date(item.createdAt).toLocaleDateString('ko-KR') === dateStr
    ).length;
  };

  // 날짜가 선택된 날짜인지 확인
  const isDateSelected = (date) => {
    if (!selectedDate) return false;
    return date.toLocaleDateString('ko-KR') === selectedDate;
  };

  // 오늘 날짜인지 확인
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 통계 계산 함수
  const getCategoryStats = (daysAgo) => {
    const now = new Date();
    const targetDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    const recentItems = items.filter(item => {
      if (!item.createdAt) return false;
      const itemDate = new Date(item.createdAt);
      return itemDate >= targetDate;
    });

    const categoryCount = {};
    recentItems.forEach(item => {
      const itemCategories = item.categories || (item.category ? [item.category] : ['기타']);
      itemCategories.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });

    return Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // 상위 5개만
  };

  const weeklyStats = getCategoryStats(7);
  const monthlyStats = getCategoryStats(30);
  const yearlyStats = getCategoryStats(365);

  // 태그 정렬 함수
  const getSortedCategories = () => {
    if (tagSortOrder === 'custom' && customTagOrder.length > 0) {
      // 커스텀 순서대로 정렬
      const ordered = customTagOrder.filter(tag => categories.includes(tag));
      const remaining = categories.filter(tag => !customTagOrder.includes(tag));
      return [...ordered, ...remaining];
    } else if (tagSortOrder === 'usage') {
      // 사용 빈도순 (많이 사용된 순)
      const usageCount = {};
      items.forEach(item => {
        const itemCategories = item.categories || (item.category ? [item.category] : []);
        itemCategories.forEach(cat => {
          usageCount[cat] = (usageCount[cat] || 0) + 1;
        });
      });
      return [...categories].sort((a, b) => (usageCount[b] || 0) - (usageCount[a] || 0));
    } else if (tagSortOrder === 'recent') {
      // 최근 사용 순
      const recentUse = {};
      items.forEach(item => {
        const itemCategories = item.categories || (item.category ? [item.category] : []);
        const itemDate = item.createdAt ? new Date(item.createdAt).getTime() : 0;
        itemCategories.forEach(cat => {
          if (!recentUse[cat] || recentUse[cat] < itemDate) {
            recentUse[cat] = itemDate;
          }
        });
      });
      return [...categories].sort((a, b) => (recentUse[b] || 0) - (recentUse[a] || 0));
    } else if (tagSortOrder === 'alphabetical') {
      // 가나다순
      return [...categories].sort((a, b) => a.localeCompare(b, 'ko'));
    }
    return categories;
  };

  const sortedCategories = getSortedCategories();


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
            {/* 로그인 모달 내용 */}
            <div className="flex flex-col gap-4">
              <p className="text-slate-600 mb-2">
                구글 계정으로 로그인하여 데이터를 안전하게 보관하세요.
              </p>
  
              <button
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn size={20} />
                Google 계정으로 로그인
              </button>

              <button
                onClick={() => setShowLogin(false)}
                className="w-full py-3 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 색상 선택 드롭다운 */}
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

      {/* 이미지 확대 모달 */}
      {enlargedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[300] p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <button
            onClick={() => setEnlargedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={32} className="text-white" />
          </button>
          <img
            src={enlargedImage}
            alt="Enlarged"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* 날짜 선택 모달 - 캘린더 뷰 */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4" onClick={() => setShowDatePicker(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={20} />
                날짜 선택
              </h2>
              <button
                onClick={() => setShowDatePicker(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            {selectedDate && (
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setShowDatePicker(false);
                }}
                className="w-full p-3 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium mb-4"
              >
                <X size={14} className="inline mr-1" />
                날짜 필터 해제
              </button>
            )}

            {/* 캘린더 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-lg font-semibold">
                {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
              </span>
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                <div
                  key={day}
                  className={`text-center text-xs font-semibold py-2 ${
                    idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-600'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 캘린더 날짜 */}
            <div className="space-y-1">
              {generateCalendar(calendarMonth).map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-cols-7 gap-1">
                  {week.map((day, dayIdx) => {
                    if (!day) return <div key={dayIdx} />;

                    const count = getItemCountForDate(day.date);
                    const isSelected = isDateSelected(day.date);
                    const isTodayDate = isToday(day.date);
                    const hasItems = count > 0;

                    return (
                      <button
                        key={dayIdx}
                        onClick={() => {
                          if (day.isCurrentMonth && hasItems) {
                            setSelectedDate(day.date.toLocaleDateString('ko-KR'));
                            setShowDatePicker(false);
                          }
                        }}
                        disabled={!hasItems || !day.isCurrentMonth}
                        className={`
                          relative aspect-square p-1 rounded-lg text-sm transition-all
                          ${!day.isCurrentMonth ? 'text-slate-300' : ''}
                          ${dayIdx === 0 ? 'text-red-500' : dayIdx === 6 ? 'text-blue-500' : ''}
                          ${isTodayDate && day.isCurrentMonth ? 'ring-2 ring-blue-400' : ''}
                          ${isSelected ? 'bg-slate-700 text-white font-bold' : ''}
                          ${!isSelected && hasItems && day.isCurrentMonth ? 'bg-green-50 hover:bg-green-100 font-semibold' : ''}
                          ${!hasItems || !day.isCurrentMonth ? 'cursor-default' : 'cursor-pointer'}
                        `}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <span>{day.date.getDate()}</span>
                          {hasItems && day.isCurrentMonth && (
                            <div className={`absolute bottom-1 flex gap-0.5`}>
                              {count <= 3 ? (
                                Array.from({ length: count }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1 h-1 rounded-full ${
                                      isSelected ? 'bg-white' : 'bg-green-600'
                                    }`}
                                  />
                                ))
                              ) : (
                                <span className={`text-[8px] font-bold ${isSelected ? 'text-white' : 'text-green-600'}`}>
                                  {count}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* 범례 */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-50 border border-green-200"></div>
                <span>항목 있음</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded ring-2 ring-blue-400"></div>
                <span>오늘</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상세 정보 모달 */}
      {detailModalItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800 mb-2">{detailModalItem.text}</h2>
                <div className="flex gap-2 flex-wrap items-center mb-2">
                  {(detailModalItem.categories || ['기타']).map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: getHashtagColor(cat, tagColors) }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={12} />
                  <span>{formatDateTime(detailModalItem.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {!isEditMode && (
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <Edit2 size={14} />
                    편집
                  </button>
                )}
                <button
                  onClick={handleCloseDetailModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {isEditMode ? (
                <>
                  {/* 편집 모드 */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      설명 (200자 이내)
                    </label>
                    <textarea
                      value={detailDescription}
                      onChange={(e) => setDetailDescription(e.target.value.slice(0, 200))}
                      placeholder="궁금증에 대한 설명을 입력하세요. URL을 포함할 수 있습니다."
                      className="w-full h-32 p-3 rounded-lg border border-slate-300 focus:outline-none focus:border-slate-500 resize-none text-sm"
                    />
                    <div className="text-xs text-slate-400 mt-1 text-right">
                      {detailDescription.length} / 200
                    </div>
                  </div>

                  {detailDescription && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs font-semibold text-slate-500 mb-2">미리보기:</div>
                      <div className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                        {linkifyText(detailDescription)}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      이미지 (최대 4장)
                    </label>

                    {detailImages.length < 4 && (
                      <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 transition-colors">
                        <div className="text-center">
                          <ImageIcon size={32} className="mx-auto text-slate-400 mb-2" />
                          <span className="text-sm text-slate-500">클릭하여 이미지 추가</span>
                          <span className="block text-xs text-slate-400 mt-1">
                            ({detailImages.length}/4)
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}

                    {detailImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {detailImages.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-slate-200 cursor-pointer"
                              onClick={() => setEnlargedImage(img)}
                            />
                            <button
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <button
                      onClick={() => setIsEditMode(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveDetail}
                      className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      저장
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* 보기 모드 */}
                  {detailDescription && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">설명</h3>
                      <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap break-words">
                        {linkifyText(detailDescription)}
                      </div>
                    </div>
                  )}

                  {detailImages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">이미지</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {detailImages.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`Image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setEnlargedImage(img)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {!detailDescription && detailImages.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">아직 추가된 정보가 없습니다.</p>
                      <p className="text-xs mt-1">편집 버튼을 눌러 설명과 이미지를 추가하세요.</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={handleCloseDetailModal}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      닫기
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 태그 관리 모달 */}
      {showTagManager && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]"
          onClick={() => {
            if (showColorPicker) setShowColorPicker(null);
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

            {/* 정렬 옵션 */}
            <div className="mb-4 pb-4 border-b border-slate-200">
              <label className="block text-sm font-semibold text-slate-700 mb-2">정렬 순서</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setTagSortOrder('usage')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tagSortOrder === 'usage'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  사용 빈도순
                </button>
                <button
                  onClick={() => setTagSortOrder('recent')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tagSortOrder === 'recent'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  최근 사용순
                </button>
                <button
                  onClick={() => setTagSortOrder('alphabetical')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tagSortOrder === 'alphabetical'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  가나다순
                </button>
                <button
                  onClick={() => {
                    setTagSortOrder('custom');
                    setCustomTagOrder([...sortedCategories]);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tagSortOrder === 'custom'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  수동 정렬
                </button>
              </div>
              {tagSortOrder === 'custom' && (
                <p className="text-xs text-slate-500 mt-2">드래그하여 순서를 변경하세요</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {sortedCategories.map((cat, index) => {
                const bgColor = getHashtagColor(cat, tagColors);
                const isEditing = editingTag === cat;

                return (
                  <div
                    key={cat}
                    className={`flex items-center gap-2 ${tagSortOrder === 'custom' ? 'cursor-move' : ''} ${draggedTagIndex === index ? 'opacity-50' : ''}`}
                    draggable={tagSortOrder === 'custom' && !isEditing}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
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
                        <button onClick={handleEditTag} className="p-2 hover:bg-green-100 rounded-lg transition-colors"><Check size={18} className="text-green-600" /></button>
                        <button onClick={() => setEditingTag(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><XCircle size={18} className="text-slate-500" /></button>
                      </>
                    ) : (
                      <>
                        <div onClick={() => startEditTag(cat)} className="flex-1 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-100 transition-colors">
                          {cat}
                        </div>
                        <button
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setColorPickerPosition({ top: rect.bottom + 4, left: rect.right - 250 });
                            setShowColorPicker(showColorPicker === cat ? null : cat);
                          }}
                          className="w-7 h-7 rounded-full border-2 border-slate-400 hover:border-slate-600 transition-all"
                          style={{ backgroundColor: bgColor }}
                        />
                        <button onClick={() => handleDeleteTag(cat)} className="p-2 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={16} className="text-red-500" /></button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">새 태그 추가</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
                  placeholder="태그 이름 입력..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm border border-slate-300 focus:outline-none focus:border-slate-400"
                />
                <button
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setColorPickerPosition({ top: rect.bottom + 4, left: rect.right - 250 });
                    setShowColorPicker(showColorPicker === 'new' ? null : 'new');
                  }}
                  className="w-7 h-7 rounded-full border-2 border-slate-400 hover:border-slate-600 transition-all"
                  style={{ backgroundColor: newTagColor }}
                />
                <button onClick={handleAddTag} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-1">
                  <Plus size={16} /> 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 레이아웃 */}
      <div className="flex h-screen bg-[#F0EFEB] text-slate-800 font-sans overflow-hidden">
        {/* 사이드바 */}
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
              <button onClick={() => setStatusFilter('all')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${statusFilter === 'all' ? 'bg-[#D4E4F1] text-slate-700' : 'text-slate-600 hover:bg-slate-300/20'}`}><LayoutGrid size={16} /> 전체 보기</button>
              <button onClick={() => setStatusFilter('unsolved')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${statusFilter === 'unsolved' ? 'bg-[#F5EBC8] text-slate-700' : 'text-slate-600 hover:bg-slate-300/20'}`}><Circle size={16} className="text-slate-500" /> 미해결</button>
              <button onClick={() => setStatusFilter('solved')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${statusFilter === 'solved' ? 'bg-[#CAD3C0] text-slate-700' : 'text-slate-600 hover:bg-slate-300/20'}`}><CheckCircle2 size={16} className="text-slate-500" /> 해결됨</button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tags</h3>
                <button onClick={() => setShowTagManager(true)} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"><Edit2 size={12} /> 추가/편집</button>
              </div>
              <div className="flex flex-wrap gap-2 px-1">
                <button onClick={() => setSelectedTags([])} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedTags.length === 0 ? 'ring-2 ring-slate-400' : ''}`} style={{ backgroundColor: '#D5D5D7' }}>전체</button>
                {sortedCategories.map(cat => (
                  <button key={cat} onClick={() => setSelectedTags([cat])} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedTags.includes(cat) ? 'ring-2 ring-slate-400' : ''}`} style={{ backgroundColor: getHashtagColor(cat, tagColors) }}>{cat}</button>
                ))}
              </div>

              {/* 자동 분류 버튼 */}
              {uncategorizedCount > 0 && (
                <div className="px-1 pt-2">
                  <button
                    onClick={handleAutoClassify}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  >
                    <Sparkles size={14} />
                    AI 자동 분류 ({uncategorizedCount}개)
                  </button>
                </div>
              )}
            </div>

            {/* 활동 히트맵 */}
            <div className="space-y-2 border-t border-slate-300/50 pt-4 mt-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Activity</h3>
              <div className="px-1">
                <div className="bg-white/30 rounded-lg p-3">
                  <div className="flex flex-col gap-1">
                    {Array.from({ length: 7 }).map((_, dayIndex) => (
                      <div key={dayIndex} className="flex gap-1">
                        {contributionData
                          .filter((_, index) => index % 7 === dayIndex)
                          .map((day, weekIndex) => (
                            <div
                              key={`${dayIndex}-${weekIndex}`}
                              className="w-2.5 h-2.5 rounded-sm transition-all hover:ring-1 hover:ring-slate-400 cursor-pointer"
                              style={{ backgroundColor: getColorForLevel(day.level) }}
                              title={`${day.date}: ${day.count}개 작성`}
                            />
                          ))}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400">
                    <span>12주 전</span>
                    <div className="flex items-center gap-1">
                      <span>적음</span>
                      {[0, 1, 2, 3, 4].map(level => (
                        <div
                          key={level}
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ backgroundColor: getColorForLevel(level) }}
                        />
                      ))}
                      <span>많음</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 통계 섹션 */}
            <div className="space-y-3 border-t border-slate-300/50 pt-4 mt-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1">
                <BarChart3 size={12} />
                Statistics
              </h3>

              {/* 일주일 통계 - 막대 그래프 */}
              {weeklyStats.length > 0 && (
                <div className="px-1">
                  <div className="bg-white/30 rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-3">
                      <TrendingUp size={12} className="text-blue-500" />
                      <h4 className="text-xs font-semibold text-slate-700">지난 일주일</h4>
                    </div>
                    <div className="space-y-2.5">
                      {weeklyStats.map(([category, count], index) => {
                        const maxCount = weeklyStats[0][1];
                        const percentage = (count / maxCount) * 100;

                        return (
                          <button
                            key={category}
                            onClick={() => {
                              setSelectedTags([category]);
                              setSidebarOpen(false);
                            }}
                            className="w-full text-left group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className="text-[10px] text-slate-400 font-mono">{index + 1}</span>
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate"
                                  style={{ backgroundColor: getHashtagColor(category, tagColors) }}
                                >
                                  {category}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-slate-700">{count}</span>
                            </div>
                            <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: getHashtagColor(category, tagColors)
                                }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 한 달 통계 - 막대 그래프 */}
              {monthlyStats.length > 0 && (
                <div className="px-1">
                  <div className="bg-white/30 rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-3">
                      <TrendingUp size={12} className="text-green-500" />
                      <h4 className="text-xs font-semibold text-slate-700">지난 한 달</h4>
                    </div>
                    <div className="space-y-2.5">
                      {monthlyStats.map(([category, count], index) => {
                        const maxCount = monthlyStats[0][1];
                        const percentage = (count / maxCount) * 100;

                        return (
                          <button
                            key={category}
                            onClick={() => {
                              setSelectedTags([category]);
                              setSidebarOpen(false);
                            }}
                            className="w-full text-left group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className="text-[10px] text-slate-400 font-mono">{index + 1}</span>
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate"
                                  style={{ backgroundColor: getHashtagColor(category, tagColors) }}
                                >
                                  {category}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-slate-700">{count}</span>
                            </div>
                            <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: getHashtagColor(category, tagColors)
                                }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 1년 통계 - 막대 그래프 */}
              {yearlyStats.length > 0 && (
                <div className="px-1">
                  <div className="bg-white/30 rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-3">
                      <TrendingUp size={12} className="text-purple-500" />
                      <h4 className="text-xs font-semibold text-slate-700">지난 1년</h4>
                    </div>
                    <div className="space-y-2.5">
                      {yearlyStats.map(([category, count], index) => {
                        const maxCount = yearlyStats[0][1];
                        const percentage = (count / maxCount) * 100;

                        return (
                          <button
                            key={category}
                            onClick={() => {
                              setSelectedTags([category]);
                              setSidebarOpen(false);
                            }}
                            className="w-full text-left group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className="text-[10px] text-slate-400 font-mono">{index + 1}</span>
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate"
                                  style={{ backgroundColor: getHashtagColor(category, tagColors) }}
                                >
                                  {category}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-slate-700">{count}</span>
                            </div>
                            <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: getHashtagColor(category, tagColors)
                                }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          {isScrolled && (
            <div className="flex items-center justify-between p-4 md:px-8 md:py-6 bg-[#F0EFEB]/80 backdrop-blur-sm border-b border-slate-300/50">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-300/20 rounded-lg transition-colors"><Menu size={20} className="text-slate-600" /></button>
                <span className="font-bold text-xl text-slate-700">Moya List</span>
              </div>
              <div className="flex items-center gap-2">
                {!user ? (
                  <div className="flex items-center gap-2">
                    <button onMouseEnter={() => setShowGuestInfo(true)} onMouseLeave={() => setShowGuestInfo(false)} className="flex items-center gap-1 text-xs text-slate-500">게스트모드 <HelpCircle size={14} className="text-slate-400" /></button>
                    <button onClick={() => setShowLogin(true)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-white text-xs rounded-lg hover:bg-slate-600 transition-colors"><LogIn size={14} /> 로그인</button>
                  </div>
                ) : (
                  <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-100/50 rounded-lg transition-colors group" title="클릭하여 로그아웃">
                    {user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-5 h-5 rounded-full" /> : <User size={16} className="text-slate-600 group-hover:text-red-500" />}
                    <span className="text-xs text-slate-600 group-hover:text-red-600">{user.displayName || '사용자'} (로그아웃)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* List Area */}
          <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
            {/* Full Screen Input */}
            <div className={`h-screen flex items-center justify-center bg-[#F0EFEB] relative transition-opacity duration-300 ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <div className="w-full max-w-3xl mx-auto px-4">
                <button onClick={() => setSidebarOpen(true)} className="absolute top-6 left-6 p-2 hover:bg-slate-300/20 rounded-lg transition-colors"><Menu size={24} className="text-slate-600" /></button>
                <div className="relative">
                  {!newItemText && <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 py-6 text-3xl md:text-5xl text-center">무엇이 궁금하신가요?</div>}
                  <div ref={editorRef} id="questionEditor" contentEditable={!isScrolled} onInput={handleTextChange} onKeyDown={handleKeyDown} className={`w-full bg-transparent focus:outline-none caret-slate-800 py-6 text-3xl md:text-5xl text-center ${newItemText ? 'text-transparent' : 'text-slate-800'}`} style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }} suppressContentEditableWarning />
                  {newItemText && <div className="absolute inset-0 pointer-events-none text-slate-800 py-6 text-3xl md:text-5xl text-center" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{renderHighlightedText(newItemText)}</div>}
                </div>
                {newItemCategories.length > 0 && <div className="mt-6 flex items-center justify-center gap-2 text-base text-slate-600 animate-in fade-in slide-in-from-top-2 duration-200"><Tag size={16} /><span>카테고리: {newItemCategories.join(', ')}</span></div>}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-slate-400 text-sm animate-bounce">↓ 스크롤하여 목록 보기</div>
              </div>
            </div>

            {/* Compact Input */}
            <div className={`sticky top-0 z-10 bg-[#F0EFEB] px-4 md:px-8 py-4 border-b border-slate-300/50 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="w-full max-w-3xl mx-auto">
                <div className="relative">
                  {!newItemText && <div className="absolute inset-0 pointer-events-none flex items-center text-slate-400 py-3 px-4 text-base text-left">궁금한 것을 입력하세요...</div>}
                  <div ref={compactEditorRef} contentEditable={isScrolled} onInput={handleTextChange} onKeyDown={handleKeyDown} className={`w-full bg-transparent focus:outline-none caret-slate-800 py-3 px-4 text-base text-left ${newItemText ? 'text-transparent' : 'text-slate-800'}`} style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }} suppressContentEditableWarning />
                  {newItemText && <div className="absolute inset-0 pointer-events-none text-slate-800 py-3 px-4 text-base text-left" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{renderHighlightedText(newItemText)}</div>}
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="px-4 md:px-8 py-4 bg-[#F0EFEB] border-b border-slate-300/50">
              <div className="max-w-3xl mx-auto space-y-3">
                {/* 검색 바 */}
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="질문 또는 설명에서 검색..."
                    className="w-full pl-10 pr-4 py-2 bg-white/50 border border-slate-300/50 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* 필터 옵션들 */}
                <div className="flex flex-wrap gap-2 items-center">
                  {/* 상태 필터 */}
                  <div className="flex items-center gap-1 bg-white/50 rounded-lg p-1 border border-slate-300/50">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${statusFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-200/50'}`}
                    >
                      전체
                    </button>
                    <button
                      onClick={() => setStatusFilter('unsolved')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${statusFilter === 'unsolved' ? 'bg-yellow-500 text-white' : 'text-slate-600 hover:bg-slate-200/50'}`}
                    >
                      <Circle size={12} />
                      미해결
                    </button>
                    <button
                      onClick={() => setStatusFilter('solved')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${statusFilter === 'solved' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-200/50'}`}
                    >
                      <CheckCircle2 size={12} />
                      해결됨
                    </button>
                  </div>

                  {/* 그룹핑 옵션 */}
                  <div className="flex items-center gap-1 bg-white/50 rounded-lg p-1 border border-slate-300/50">
                    <button
                      onClick={() => setGroupBy('none')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${groupBy === 'none' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-200/50'}`}
                    >
                      <LayoutGrid size={12} />
                      기본
                    </button>
                    <button
                      onClick={() => setGroupBy('date')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${groupBy === 'date' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-200/50'}`}
                    >
                      <Calendar size={12} />
                      날짜별
                    </button>
                    <button
                      onClick={() => setGroupBy('status')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${groupBy === 'status' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-200/50'}`}
                    >
                      <Filter size={12} />
                      상태별
                    </button>
                  </div>

                  {/* 날짜 선택 버튼 */}
                  <button
                    onClick={() => setShowDatePicker(true)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                      selectedDate
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white/50 text-slate-600 border-slate-300/50 hover:bg-slate-200/50'
                    }`}
                  >
                    <Calendar size={12} />
                    {selectedDate || '날짜 선택'}
                  </button>

                  {/* 결과 수 */}
                  <span className="text-xs text-slate-500 ml-auto">
                    {filteredItems.length}개 항목
                  </span>
                </div>

                {/* 태그 필터 칩 */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <Tag size={14} className="text-slate-400" />
                    {sortedCategories.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          selectedTags.includes(tag)
                            ? 'ring-2 ring-slate-700 shadow-sm'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: getHashtagColor(tag, tagColors) }}
                      >
                        {tag}
                      </button>
                    ))}
                    {selectedTags.length > 0 && (
                      <button
                        onClick={() => setSelectedTags([])}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all"
                      >
                        <X size={12} className="inline mr-1" />
                        초기화
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Item List */}
            <div className="px-4 md:px-8 py-6 bg-[#F0EFEB] min-h-screen">
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] opacity-40">
                  {items.length === 0 ? (
                    <>
                      <Plus size={48} className="text-slate-400 mb-4" />
                      <h2 className="text-2xl font-bold text-slate-400">첫 궁금증을 등록해보세요</h2>
                      <p className="text-slate-400 mt-2">위 입력창에 입력 후 Enter를 누르세요</p>
                    </>
                  ) : (
                    <>
                      <Search size={48} className="text-slate-400 mb-4" />
                      <h2 className="text-2xl font-bold text-slate-400">검색 결과가 없습니다</h2>
                      <p className="text-slate-400 mt-2">다른 검색어나 필터를 시도해보세요</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-6 pb-20">
                  {groupedItems().map(([groupName, groupItems]) => (
                    <div key={groupName}>
                      {groupBy !== 'none' && (
                        <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
                          {groupBy === 'date' && <Calendar size={18} />}
                          {groupBy === 'status' && (groupName === '미해결' ? <Circle size={18} /> : <CheckCircle2 size={18} />)}
                          {groupName}
                          <span className="text-sm font-normal text-slate-400">({groupItems.length})</span>
                        </h3>
                      )}
                      <div className="space-y-4">
                        {groupItems.map(item => (
                    <div key={item.id} onClick={() => handleItemClick(item)} title="클릭하여 상세 정보 보기" className={`p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${item.status === 'solved' ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' : 'bg-white/50 border-slate-300/50'} ${item.id === newlyAddedId ? 'animate-sink-in' : ''}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-2 flex-wrap">
                          {(item.categories || (item.category ? [item.category] : ['기타'])).map((cat, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: getHashtagColor(cat, tagColors) }}>{cat}</span>
                          ))}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); toggleStatus(item.id, item.status); }} className={`transition-all ${item.status === 'solved' ? 'text-yellow-500 hover:text-yellow-600' : 'text-slate-300 hover:text-slate-500'}`}>
                          {item.status === 'solved' ? <Lightbulb size={20} className="fill-yellow-500" /> : <Circle size={20} />}
                        </button>
                      </div>
                      <div className="flex items-start gap-2 mb-3">
                        {item.status === 'solved' && (
                          <Lightbulb size={18} className="text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                        )}
                        <h3 className="font-medium text-slate-800 flex-1">{item.text}</h3>
                      </div>

                      {item.description && (
                        <div className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {linkifyText(item.description)}
                        </div>
                      )}

                      {item.images && item.images.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto">
                          {item.images.slice(0, 4).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Image ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2 text-slate-400">
                          {(item.description || (item.images && item.images.length > 0)) && (
                            <MessageSquare size={12} title="상세 정보가 있습니다." />
                          )}
                          <span className="text-[10px]">{item.createdAt && new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button onClick={(e) => deleteItem(item.id, e)} className="text-slate-300 hover:text-red-400"><Trash2 size={16} /></button>
                      </div>
                    </div>
                        ))}
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

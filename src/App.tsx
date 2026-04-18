/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShoppingBag, LayoutDashboard, PlusCircle, Activity, Box, Search, User, Trash2, X, Globe, CheckCircle2, AlertCircle, Edit2, Save, LogOut, Sun, Moon, Smartphone, MessageCircle, BarChart3, TrendingUp, Users, Calendar, ArrowRight, Star, Heart, Share2, Upload, Trash, Menu, ArrowLeft, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, getDocFromServer, setDoc } from 'firebase/firestore';
import firebaseConfigLocal from '../firebase-applet-config.json';

// --- Initialization ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigLocal.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigLocal.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigLocal.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigLocal.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigLocal.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigLocal.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigLocal.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (firebaseConfigLocal as any).firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const googleProvider = new GoogleAuthProvider();

const ADMIN_EMAIL = 'motaem23y@gmail.com';

// --- Types & Constants ---
type Language = 'EN' | 'AR';

interface Review {
  id: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: any;
}

interface OrderItem {
  id: string;
  name: { EN: string; AR: string };
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: any;
}

interface Settings {
  facebook: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
  siteName: string;
  heroTitle: { EN: string; AR: string };
  heroDesc: { EN: string; AR: string };
}

interface Product {
  id: string;
  name: { EN: string; AR: string };
  description: { EN: string; AR: string };
  price: number;
  oldPrice?: number;
  stock: number;
  category: { EN: string; AR: string };
  categoryKey: 'dresses' | 'tops' | 'bottoms' | 'shoes' | 'accessories';
  images: string[];
  img: string; // fallback for old data
  isNew?: boolean;
  isSale?: boolean;
  createdAt: any;
  updatedAt: any;
  views?: number;
}

interface CartItem {
  id: string;
  name: { EN: string; AR: string };
  price: number;
  img: string;
  quantity: number;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: { EN: string; AR: string };
}

const TRANSLATIONS = {
  COLLECTIONS: { EN: "COLLECTIONS", AR: "المجموعات" },
  NEW_ARRIVALS: { EN: "NEW ARRIVALS", AR: "وصل حديثاً" },
  SALE: { EN: "SALE", AR: "تخفيضات" },
  ACCOUNT: { EN: "ACCOUNT", AR: "حسابي" },
  ADMIN_PANEL: { EN: "ADMIN PANEL", AR: "لوحة التحكم" },
  LIVE: { EN: "LIVE", AR: "مباشر" },
  PRODUCT_TITLE: { EN: "Product Title", AR: "عنوان المنتج" },
  CATEGORY: { EN: "Category", AR: "الفئة" },
  PRICE: { EN: "Price (EGP)", AR: "السعر (ج.م)" },
  IMAGE_URL: { EN: "Image URL", AR: "رابط الصورة" },
  PUBLISH: { EN: "Publish Product", AR: "نشر المنتج" },
  ACTIVE_ITEMS: { EN: "Active Items", AR: "منتج نشط" },
  ORDERS: { EN: "Orders", AR: "طلبات" },
  SEARCH: { EN: "Search...", AR: "بحث..." },
  HERO_TITLE: { EN: "Summer Drop '24", AR: "تشكيلة صيف 24" },
  HERO_DESC: { EN: "Explore our curated collection of exclusive linen sets and ethereal dresses designed for the modern muse.", AR: "اكتشفوا مجموعتنا المختارة من أطقم الكتان الحصرية والفساتين الرقيقة المصممة للمرآة العصرية." },
  YOUR_CART: { EN: "Your Cart", AR: "سلة التسوق" },
  EMPTY_CART: { EN: "Your cart is empty", AR: "السلة فارغة" },
  TOTAL: { EN: "Total", AR: "الإجمالي" },
  CHECKOUT: { EN: "Checkout", AR: "الدفع" },
  ADDED_TO_CART: { EN: "Added to cart", AR: "تمت الإضافة للسلة" },
  PRODUCT_PUBLISHED: { EN: "Product published successfully!", AR: "تم نشر المنتج بنجاح!" },
  PRODUCT_UPDATED: { EN: "Product updated successfully!", AR: "تم تحديث المنتج بنجاح!" },
  PRODUCT_DELETED: { EN: "Product deleted!", AR: "تم حذف المنتج!" },
  EGP: { EN: "EGP", AR: "ج.م" },
  LOGIN_GOOGLE: { EN: "Login with Google", AR: "تسجيل الدخول بجوجل" },
  LOGOUT: { EN: "Logout", AR: "تسجيل الخروج" },
  WELCOME: { EN: "Welcome back!", AR: "مرحباً بك مجدداً!" },
  EDIT: { EN: "Edit", AR: "تعديل" },
  UPDATE: { EN: "Update Product", AR: "تحديث المنتج" },
  CANCEL: { EN: "Cancel", AR: "إلغاء" },
  PLEASE_LOGIN: { EN: "Please login to proceed", AR: "من فضلك سجل دخولك للمتابعة" },
  ORDER_CONFIRMED: { EN: "Order Confirmed!", AR: "تم تأكيد الطلب!" },
  ORDER_DESC: { EN: "Thank you for your purchase. We'll contact you soon.", AR: "شكراً لشرائك. سنتواصل معك قريباً." },
  NO_PRODUCTS: { EN: "No products found matching your search.", AR: "لم يتم العثور على منتجات تطابق بحثك." },
  SOCIAL_LINKS: { EN: "Social Links", AR: "روابط التواصل" },
  SAVE_SETTINGS: { EN: "Save Settings", AR: "حفظ الإعدادات" },
  ORDER_LIST: { EN: "Customer Orders", AR: "طلبات العملاء" },
  STATUS: { EN: "Status", AR: "الحالة" },
  DATE: { EN: "Date", AR: "التاريخ" },
  CUSTOMER: { EN: "Customer", AR: "العميل" },
  ITEMS: { EN: "Items", AR: "المنتجات" },
  PENDING: { EN: "Pending", AR: "قيد الانتظار" },
  COMPLETED: { EN: "Completed", AR: "مكتمل" },
  CANCELLED: { EN: "Cancelled", AR: "ملغي" },
  TAB_PRODUCTS: { EN: "Products", AR: "المنتجات" },
  TAB_ORDERS: { EN: "Orders", AR: "الطلبات" },
  TAB_SETTINGS: { EN: "Settings", AR: "الإعدادات" },
  TAB_DASHBOARD: { EN: "Dashboard", AR: "لوحة التحكم" },
  TOTAL_REVENUE: { EN: "Total Revenue", AR: "إجمالي الأرباح" },
  NEW_CUSTOMERS: { EN: "New Customers", AR: "عملاء جدد" },
  TOP_PRODUCTS: { EN: "Top Products", AR: "الأكثر مبيعاً" },
  UPLOADING: { EN: "Uploading...", AR: "جاري الرفع..." },
  DESCRIPTION: { EN: "Description", AR: "الوصف" },
  REVIEWS: { EN: "Customer Reviews", AR: "آراء العملاء" },
  ADD_REVIEW: { EN: "Add Review", AR: "إضافة تقييم" },
  BACK_TO_SHOP: { EN: "Back to Shop", AR: "العودة للتسوق" },
  STOCK: { EN: "Stock Quantity", AR: "الكمية المتوفرة" },
  OUT_OF_STOCK: { EN: "Out of Stock", AR: "نفذت الكمية" },
  BUY_NOW: { EN: "Buy Now", AR: "اشتري الآن" },
  IN_STOCK: { EN: "In Stock", AR: "متوفر" }
};

export default function App() {
  const [lang, setLang] = useState<Language>('AR');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState('COLLECTIONS');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'PRODUCTS' | 'ORDERS' | 'SETTINGS'>('PRODUCTS');
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings>({ 
    facebook: '', 
    instagram: '', 
    tiktok: '', 
    whatsapp: '',
    siteName: '11:11',
    heroTitle: { EN: TRANSLATIONS.HERO_TITLE.EN, AR: TRANSLATIONS.HERO_TITLE.AR },
    heroDesc: { EN: TRANSLATIONS.HERO_DESC.EN, AR: TRANSLATIONS.HERO_DESC.AR }
  });
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  // Admin Form State
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    titleEN: '', titleAR: '', 
    descEN: '', descAR: '',
    catEN: '', catAR: '', 
    price: '', oldPrice: '',
    stock: '10',
    images: [] as string[],
    isNew: false, isSale: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (key: string) => {
    const entry = (TRANSLATIONS as any)[key];
    if (!entry) return key;
    return entry[lang] || entry['EN'] || key;
  };
  const isAdmin = user?.email === ADMIN_EMAIL;

  const getL = (obj: any) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj['EN'] || obj['AR'] || '';
  };

  // --- Derived Data ---
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.status === 'completed' ? o.total : 0), 0);
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    
    // Simple mock data for graph
    const chartData = [
      { name: 'Jan', val: 4000 },
      { name: 'Feb', val: 3000 },
      { name: 'Mar', val: 2000 },
      { name: 'Apr', val: 2780 },
      { name: 'May', val: 1890 },
      { name: 'Jun', val: 2390 },
      { name: 'Jul', val: 3490 },
    ];

    return { totalRevenue, completedOrders, pendingOrders, chartData };
  }, [orders]);

  // --- Effects ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    // Connection test
    const testConnection = async () => {
      try { await getDocFromServer(doc(db, 'settings', 'global')); } 
      catch (e: any) { 
        if (e.code === 'permission-denied') {
          console.warn("Public settings access denied - check rules.");
        }
      }
    };
    testConnection();
    // Load Cart from Local Storage
    const savedCart = localStorage.getItem('eleven_eleven_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('eleven_eleven_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(data);
      },
      error: (err) => {
        console.error("Products Listener Error:", err);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), {
      next: (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as Settings);
        }
      },
      error: (err) => {
        console.error("Settings Listener Error:", err);
      }
    });

    return () => unsubscribeSettings();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [theme]);

  useEffect(() => {
    if (selectedProduct) {
      const q = query(collection(db, 'products', selectedProduct.id, 'reviews'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
      });
      return () => unsub();
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      });
      return () => unsubscribe();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (user) {
      // Sync local cart to Firestore if user logged in
      const sync = async () => {
        try {
          await setDoc(doc(db, 'carts', user.uid), { 
            items: cart, 
            updatedAt: serverTimestamp(),
            userId: user.uid 
          });
        } catch (e: any) {
          console.error("Cart sync failed:", e.message);
        }
      };
      if (cart.length > 0) sync();
    }
  }, [cart, user]);

  // --- Handlers ---
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      notify(TRANSLATIONS.WELCOME);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/popup-blocked') {
        notify({ EN: "Popup blocked! Please allow popups.", AR: "النافذة المنبثقة محجوزة! يرجى السماح بها." }, 'error');
      } else if (error.code === 'auth/network-request-failed') {
        notify({ EN: "Network error! Check your connection or try a different browser.", AR: "خطأ في الشبكة! تحقق من اتصالك أو جرب متصفحاً آخر." }, 'error');
      } else {
        notify({ EN: "Login failed. Try again.", AR: "فشل تسجيل الدخول. حاول مجدداً." }, 'error');
      }
    }
  };

  const handleLogout = async () => {
    try { 
      await signOut(auth); 
      notify({ EN: "Logged out successfully", AR: "تم تسجيل الخروج بنجاح" }); 
    } catch (e: any) { console.error(e); }
  };

  const handleCheckout = async () => {
    if (!user) {
      notify(TRANSLATIONS.PLEASE_LOGIN, 'info');
      handleLogin();
      return;
    }
    
    try {
      //shopify-like stock deduction logic
      const { writeBatch, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);

      // Verify stock first
      for (const item of cart) {
        const prod = products.find(p => p.id === item.id);
        if (!prod || prod.stock < item.quantity) {
           throw new Error(`Insufficient stock for ${getL(item.name)}`);
        }
        const productRef = doc(db, 'products', item.id);
        batch.update(productRef, { stock: prod.stock - item.quantity });
      }

      const orderData = {
        customerName: user.displayName || "Unknown",
        customerEmail: user.email,
        items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
        total: cartTotal,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      
      const orderRef = doc(collection(db, 'orders'));
      batch.set(orderRef, orderData);
      
      await batch.commit();

      setCart([]);
      setIsCartOpen(false);
      setIsOrderModalOpen(true);
      notify({ EN: "Order placed!", AR: "تم إرسال الطلب بنجاح!" });
    } catch (e: any) {
      console.error(e);
      notify({ EN: e.message || "Checkout failed", AR: e.message || "فشل الدفع" }, 'error');
    }
  };

  const updateSettings = async () => {
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      notify({ EN: "Settings saved!", AR: "تم حفظ الإعدادات بنجاح!" });
    } catch (e: any) {
      console.error(e);
      notify({ EN: "Failed to save settings: " + e.message, AR: "فشل حفظ الإعدادات: " + e.message }, 'error');
    }
  };

  const notify = (message: { EN: string; AR: string }, type: Notification['type'] = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const addReview = async (productId: string, rating: number, comment: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'products', productId, 'reviews'), {
        userName: user.displayName || "Client",
        userPhoto: user.photoURL || "",
        rating,
        comment,
        createdAt: serverTimestamp()
      });
      notify({ EN: "Review added!", AR: "تم إضافة التقييم!" });
    } catch (e) { console.error(e); }
  };
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      notify(TRANSLATIONS.OUT_OF_STOCK, 'error');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          notify({ EN: "No more stock available", AR: "لا توجد كمية كافية متوفرة" }, 'info');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, img: product.img, quantity: 1 }];
    });
    notify(TRANSLATIONS.ADDED_TO_CART);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (newProduct.images.length >= 4) {
      notify({ EN: "Max 4 images per product", AR: "4 صور كحد أقصى لكل منتج" }, 'info');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_DIM = 800;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // Lower quality to fit multiple imgs
        setNewProduct(prev => ({ ...prev, images: [...prev.images, dataUrl] }));
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startEdit = (p: Product) => {
    setIsEditing(p.id);
    setNewProduct({
      titleEN: p.name.EN, titleAR: p.name.AR,
      descEN: p.description?.EN || '', descAR: p.description?.AR || '',
      catEN: p.category.EN, catAR: p.category.AR,
      price: p.price.toString(),
      oldPrice: p.oldPrice?.toString() || '',
      stock: p.stock?.toString() || '0',
      images: p.images || [p.img],
      isNew: !!p.isNew,
      isSale: !!p.isSale
    });
    setIsAdminPanelOpen(true);
    setAdminTab('PRODUCTS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePublish = async () => {
    if (!newProduct.titleEN || !newProduct.price || !isAdmin) return;
    
    // Aggressive size check
    const payloadSize = JSON.stringify(newProduct).length;
    if (payloadSize > 800000) {
      notify({ EN: "Images too heavy, please use smaller files", AR: "الصور ثقيلة جداً، يرجى استخدام ملفات أصغر" }, 'error');
      return;
    }

    const productData = {
      name: { EN: newProduct.titleEN, AR: newProduct.titleAR || newProduct.titleEN },
      description: { EN: newProduct.descEN, AR: newProduct.descAR || newProduct.descEN },
      price: parseFloat(newProduct.price),
      oldPrice: newProduct.oldPrice ? parseFloat(newProduct.oldPrice) : null,
      stock: parseInt(newProduct.stock || '0'),
      category: { EN: newProduct.catEN, AR: newProduct.catAR || newProduct.catEN },
      categoryKey: newProduct.catEN.toLowerCase() as any,
      images: newProduct.images.length > 0 ? newProduct.images : (newProduct.images as any),
      img: newProduct.images[0] || "https://picsum.photos/seed/new/400/400",
      isNew: newProduct.isNew,
      isSale: newProduct.isSale,
      updatedAt: serverTimestamp()
    };

    try {
      if (isEditing) {
        await updateDoc(doc(db, 'products', isEditing), productData);
        notify(TRANSLATIONS.PRODUCT_UPDATED);
      } else {
        await addDoc(collection(db, 'products'), { ...productData, createdAt: serverTimestamp() });
        notify(TRANSLATIONS.PRODUCT_PUBLISHED);
      }
      setIsEditing(null);
      setNewProduct({ titleEN: '', titleAR: '', descEN: '', descAR: '', catEN: '', catAR: '', price: '', oldPrice: '', stock: '10', images: [], isNew: false, isSale: false });
    } catch (e: any) {
      console.error(e);
      notify({ EN: "Failed: " + e.message, AR: "فشلت العملية: " + e.message }, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      notify(TRANSLATIONS.PRODUCT_DELETED);
    } catch (e) {
      console.error(e);
    }
  };

    const filtered = products.filter(p => {
      const name = getL(p.name);
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      
      if (activeTab === 'NEW_ARRIVALS') return !!p.isNew;
      if (activeTab === 'SALE') return !!p.isSale;
      return true;
    });

    return (
    <div className={`flex flex-col w-full min-h-screen transition-all duration-500 ${theme === 'dark' ? 'bg-[#0a0a0f] text-white' : 'bg-[#f8f9fa] text-gray-900'}`} dir={lang === 'AR' ? 'rtl' : 'ltr'}>
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {theme === 'dark' ? (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-purple-900/20 blur-[200px] rounded-full animate-float" />
            <div className="absolute bottom-[0%] right-[0%] w-[1200px] h-[1200px] bg-pink-900/20 blur-[250px] rounded-full animate-float" style={{ animationDelay: '3s' }} />
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-purple-200 blur-[200px] rounded-full animate-float" />
            <div className="absolute bottom-[0%] right-[0%] w-[1200px] h-[1200px] bg-pink-200 blur-[250px] rounded-full animate-float" style={{ animationDelay: '3s' }} />
          </>
        )}
      </div>

      {/* Notifications */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 w-full max-w-sm px-6">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div key={n.id} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-3 px-6 py-4 glass rounded-3xl shadow-2xl bg-white/10 backdrop-blur-2xl">
              {n.type === 'success' ? <CheckCircle2 className="text-accent-green" size={18} /> : <AlertCircle className="text-accent-pink" size={18} />}
              <span className="text-sm font-medium">{getL(n.message)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-8 md:p-12 relative z-10">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between mb-8 sm:mb-16 gap-6 glass p-6 sm:px-10 rounded-[32px] sm:rounded-[48px] bg-white/5 border-white/10">
          <div className="text-2xl sm:text-3xl font-black tracking-[6px] uppercase logo flex items-center gap-2">
            <div className="w-2 h-8 bg-white" />
            <span>{settings.siteName || '11:11'}</span>
          </div>

          <nav className="hidden xl:flex gap-10 text-[11px] font-bold tracking-[3px] opacity-70">
            {['COLLECTIONS', 'NEW_ARRIVALS', 'SALE', 'ACCOUNT'].map((key) => (
              <button key={key} onClick={() => key === 'ACCOUNT' ? handleLogin() : setActiveTab(key)} className={`cursor-pointer transition-all hover:opacity-100 relative group ${activeTab === key ? 'opacity-100' : 'opacity-40'}`}>
                {t(key as keyof typeof TRANSLATIONS)}
                <span className={`absolute -bottom-2 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full ${activeTab === key ? 'w-full' : ''}`} />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-2.5 glass rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'hover:bg-yellow-500/20 text-yellow-500' : 'hover:bg-blue-500/10 text-blue-600'}`}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button onClick={() => setLang(lang === 'EN' ? 'AR' : 'EN')} className="flex items-center gap-2 px-4 py-2 glass rounded-full hover:bg-white/10 text-xs font-bold transition-all">
              <Globe size={14} /> {lang}
            </button>

            <div className="relative group hidden sm:block">
              <Search size={18} className={`absolute ${lang === 'AR' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 opacity-30`} />
              <input type="text" placeholder={t('SEARCH')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`glass rounded-full py-2.5 w-40 lg:w-56 focus:w-72 transition-all outline-none border-none text-sm px-12 ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-black/5 text-black'}`} />
            </div>

            <div className="relative">
              <ShoppingBag size={24} className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => setIsCartOpen(true)} />
              {cart.length > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent-pink rounded-full flex items-center justify-center text-[10px] font-bold text-black shadow-lg">{cart.reduce((a, b) => a + b.quantity, 0)}</span>}
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="relative group/profile">
                  <div onClick={() => isAdmin && setIsAdminPanelOpen(!isAdminPanelOpen)} className={`w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${isAdmin ? 'border-accent-green' : 'border-white/20'}`}>
                    <img src={user.photoURL || ''} alt="User" />
                  </div>
                  <div className="absolute top-full mt-2 right-0 hidden group-hover/profile:block z-[100]">
                    <div className="glass p-2 rounded-2xl bg-black shadow-xl border border-white/10 min-w-[150px]">
                       <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-accent-pink hover:bg-white/5 rounded-xl transition-all">
                          <LogOut size={14} /> {t('LOGOUT')}
                       </button>
                    </div>
                  </div>
                </div>
                {isAdmin && <LayoutDashboard size={20} className="cursor-pointer opacity-70 hover:opacity-100 hidden sm:block" onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)} />}
              </div>
            ) : (
              <button onClick={handleLogin} className="p-2.5 glass rounded-full hover:bg-white/10 transition-all"><User size={22} /></button>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative h-[250px] sm:h-[400px] mb-12 sm:mb-20 rounded-[48px] overflow-hidden group shadow-3xl">
          <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1600" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center p-10 sm:p-20">
            <motion.h1 initial={{ x: -20 }} animate={{ x: 0 }} transition={{ delay: 0.3 }} className="text-4xl sm:text-7xl font-light tracking-tight mb-4">{getL(settings.heroTitle)}</motion.h1>
            <motion.p initial={{ x: -20 }} animate={{ x: 0 }} transition={{ delay: 0.4 }} className="max-w-md text-sm sm:text-lg opacity-80 font-light leading-relaxed mb-8">{getL(settings.heroDesc)}</motion.p>
          </div>
        </motion.div>

        {/* Admin Section */}
        <AnimatePresence>
          {isAdmin && isAdminPanelOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-12">
              <div className="glass p-8 sm:p-12 rounded-[48px] bg-white/5 border-white/10 text-white">
                <div className="flex flex-col gap-8 mb-12">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <h2 className="text-2xl font-black tracking-widest flex items-center gap-3 italic text-accent-pink">
                      <LayoutDashboard size={28} /> {t('ADMIN_PANEL')}
                    </h2>
                    <div className="flex gap-4">
                      <div className="px-6 py-3 glass rounded-2xl bg-white/5 border-white/10 text-center">
                        <p className="text-[10px] font-bold uppercase opacity-40 mb-1">{t('ACTIVE_ITEMS')}</p>
                        <p className="text-xl font-black text-accent-green">{products.length}</p>
                      </div>
                      <div className="px-6 py-3 glass rounded-2xl bg-white/5 border-white/10 text-center">
                        <p className="text-[10px] font-bold uppercase opacity-40 mb-1">{t('ORDERS')}</p>
                        <p className="text-xl font-black text-accent-pink">{orders.length}</p>
                      </div>
                    </div>
                    <button onClick={() => setIsAdminPanelOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
                  </div>

                  <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto custom-scrollbar">
                    {['DASHBOARD', 'PRODUCTS', 'ORDERS', 'SETTINGS'].map(tab => (
                      <button key={tab} onClick={() => setAdminTab(tab as any)} className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all ${adminTab === tab ? (theme === 'dark' ? 'bg-white text-black' : 'bg-accent-pink text-white') : 'opacity-40 hover:opacity-100'}`}>
                        {t(`TAB_${tab}` as any)}
                      </button>
                    ))}
                  </div>
                </div>

                {adminTab === 'DASHBOARD' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="glass p-6 rounded-3xl bg-white/5 border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-accent-pink/20 text-accent-pink"><TrendingUp size={24} /></div>
                          <span className="text-[10px] font-bold uppercase opacity-40">Revenue</span>
                        </div>
                        <p className="text-3xl font-black">{stats.totalRevenue.toLocaleString()} <span className="text-sm font-light opacity-50">{t('EGP')}</span></p>
                      </div>
                      <div className="glass p-6 rounded-3xl bg-white/5 border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-accent-green/20 text-accent-green"><ShoppingBag size={24} /></div>
                          <span className="text-[10px] font-bold uppercase opacity-40">Completed</span>
                        </div>
                        <p className="text-3xl font-black">{stats.completedOrders}</p>
                      </div>
                      <div className="glass p-6 rounded-3xl bg-white/5 border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400"><Users size={24} /></div>
                          <span className="text-[10px] font-bold uppercase opacity-40">Pending</span>
                        </div>
                        <p className="text-3xl font-black">{stats.pendingOrders}</p>
                      </div>
                    </div>
                    
                    {/* Chart Container Fix */}
                    <div className="glass p-8 rounded-[40px] bg-white/5 border-white/10 h-[400px] flex flex-col">
                      <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6 italic">Performance Overview</h3>
                      <div className="flex-1 min-h-0 w-full relative">
                        <ResponsiveContainer width="99%" height="100%">
                          <AreaChart data={stats.chartData}>
                            <defs>
                              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ff1b6b" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ff1b6b" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 10}} />
                            <Tooltip contentStyle={{backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '10px'}} />
                            <Area type="monotone" dataKey="val" stroke="#ff1b6b" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </motion.div>
                )}

                {adminTab === 'PRODUCTS' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                    <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
                       <h3 className="text-2xl font-bold tracking-tight italic">{isEditing ? t('EDIT') : t('PUBLISH')}</h3>
                       {isEditing && (
                         <button onClick={() => {
                           setIsEditing(null);
                           setNewProduct({ titleEN: '', titleAR: '', descEN: '', descAR: '', catEN: '', catAR: '', price: '', oldPrice: '', stock: '10', images: [], isNew: false, isSale: false });
                         }} className="text-xs font-bold uppercase tracking-widest text-accent-pink hover:underline">{t('CANCEL')}</button>
                       )}
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">Title (EN)</label>
                            <input type="text" className="glass-input" value={newProduct.titleEN} onChange={e => setNewProduct({...newProduct, titleEN: e.target.value})} placeholder="English" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">العنوان (AR)</label>
                            <input type="text" className="glass-input" value={newProduct.titleAR} onChange={e => setNewProduct({...newProduct, titleAR: e.target.value})} placeholder="العربية" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">Description (EN)</label>
                            <textarea className="glass-input h-24 py-4" value={newProduct.descEN} onChange={e => setNewProduct({...newProduct, descEN: e.target.value})} placeholder="Exclusive Summer Collection Details..." />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">الوصف (AR)</label>
                            <textarea className="glass-input h-24 py-4" value={newProduct.descAR} onChange={e => setNewProduct({...newProduct, descAR: e.target.value})} placeholder="تفاصيل المجموعة الصيفية الحصرية..." />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">Price</label>
                            <input type="number" className="glass-input" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="0.00" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">{t('STOCK')}</label>
                             <input type="number" className="glass-input" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} placeholder="10" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">Old Price</label>
                            <input type="number" className="glass-input" value={newProduct.oldPrice} onChange={e => setNewProduct({...newProduct, oldPrice: e.target.value})} placeholder="0.00" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">Category (EN)</label>
                            <input type="text" className="glass-input" value={newProduct.catEN} onChange={e => setNewProduct({...newProduct, catEN: e.target.value})} placeholder="e.g. Dresses" />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">Product Images (Max 4)</label>
                          <div className="flex flex-wrap gap-4 items-center">
                            {newProduct.images.map((img, idx) => (
                              <div key={idx} className="relative group w-24 h-24 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-xl">
                                <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                <button 
                                  onClick={() => setNewProduct(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                                  className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            {newProduct.images.length < 4 && (
                              <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 rounded-2xl bg-white/10 border-2 border-dashed border-white/20 hover:border-accent-pink hover:bg-accent-pink/5 transition-all flex flex-col items-center justify-center text-accent-pink group"
                              >
                                <Upload size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-[8px] font-bold uppercase tracking-widest">{isUploading ? '...' : '+ Add'}</span>
                              </button>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                          </div>
                        </div>
                        <button onClick={handlePublish} className="w-full glass-btn py-6 bg-accent-pink text-white shadow-2xl transition-all font-black tracking-widest uppercase italic">{isEditing ? t('UPDATE') : t('PUBLISH')}</button>
                      </div>
                    </div>

                    <div className="pt-12 border-t border-white/10">
                       <h4 className="text-xl font-bold mb-8 italic">{lang === 'AR' ? 'إدارة المنتجات' : 'Inventory Management'}</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {products.map(p => (
                            <div key={p.id} className="p-4 glass rounded-3xl bg-white/5 border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-all">
                               <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                                  <img src={p.img} className="w-full h-full object-cover" />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm truncate">{getL(p.name)}</p>
                                  <p className="text-xs opacity-40 font-mono">{p.stock} in stock</p>
                                  <div className="flex gap-4 mt-3">
                                     <button onClick={() => startEdit(p)} className="text-[10px] font-black uppercase text-accent-green hover:underline">Edit</button>
                                     <button onClick={() => { if(confirm('Delete?')) handleDelete(p.id) }} className="text-[10px] font-black uppercase text-accent-pink hover:underline">Delete</button>
                                  </div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </motion.div>
                )}
                {adminTab === 'ORDERS' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <h3 className="text-xl font-bold italic">{t('ORDER_LIST')}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[700px]">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="py-4 text-[10px] uppercase opacity-40">{t('CUSTOMER')}</th>
                            <th className="py-4 text-[10px] uppercase opacity-40">{t('ITEMS')}</th>
                            <th className="py-4 text-[10px] uppercase opacity-40">{t('TOTAL')}</th>
                            <th className="py-4 text-[10px] uppercase opacity-40">{t('STATUS')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(order => (
                            <tr key={order.id} className="border-b border-white/5">
                              <td className="py-4">
                                <div className="flex flex-col">
                                  <span className="font-bold">{order.customerName}</span>
                                  <span className="text-xs opacity-50">{order.customerEmail}</span>
                                </div>
                              </td>
                              <td className="py-4 text-xs">{order.items.map(item => `${getL(item.name)} (x${item.quantity})`).join(', ')}</td>
                              <td className="py-4 font-black text-accent-pink">{order.total} {t('EGP')}</td>
                              <td className="py-4">
                                <select value={order.status} onChange={async (e) => await updateDoc(doc(db, 'orders', order.id), { status: e.target.value })} className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-xs">
                                  <option value="pending">Pending</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {adminTab === 'SETTINGS' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 max-w-2xl">
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold italic">Brand Identity</h3>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase opacity-50">Site Name</label>
                          <input type="text" className="glass-input" value={settings.siteName} onChange={e => setSettings({...settings, siteName: e.target.value})} placeholder="e.g. 11:11 Fashion" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase opacity-50">Hero Title (EN)</label>
                            <input type="text" className="glass-input" value={settings.heroTitle.EN} onChange={e => setSettings({...settings, heroTitle: {...settings.heroTitle, EN: e.target.value}})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase opacity-50">Hero Title (AR)</label>
                            <input type="text" className="glass-input" value={settings.heroTitle.AR} onChange={e => setSettings({...settings, heroTitle: {...settings.heroTitle, AR: e.target.value}})} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase opacity-50">Hero Desc (EN)</label>
                            <textarea className="glass-input min-h-[100px] resize-none" value={settings.heroDesc.EN} onChange={e => setSettings({...settings, heroDesc: {...settings.heroDesc, EN: e.target.value}})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase opacity-50">Hero Desc (AR)</label>
                            <textarea className="glass-input min-h-[100px] resize-none" value={settings.heroDesc.AR} onChange={e => setSettings({...settings, heroDesc: {...settings.heroDesc, AR: e.target.value}})} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xl font-bold italic">{t('SOCIAL_LINKS')}</h3>
                      <div className="grid grid-cols-2 gap-6">
                        {['facebook', 'instagram', 'tiktok', 'whatsapp'].map(s => (
                          <div key={s} className="space-y-2">
                            <label className="text-[10px] font-bold uppercase opacity-50">{s}</label>
                            <input type="text" className="glass-input" value={(settings as any)[s]} onChange={e => setSettings({...settings, [s]: e.target.value})} placeholder="URL / Number" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={updateSettings} className="glass-btn bg-accent-pink text-white py-4 px-10 hover:scale-105 transition-all font-bold tracking-widest uppercase">{t('SAVE_SETTINGS')}</button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <main>
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 opacity-30 gap-6">
                <Search size={64} strokeWidth={1} />
                <p className="text-xl font-light">{t('NO_PRODUCTS')}</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-12 pb-20">
                {filtered.map((product, idx) => (
                    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }} key={product.id} className="text-center group flex flex-col">
                      <div className="relative aspect-[3/4] mb-6 overflow-hidden rounded-[40px] bg-white/5 border border-white/10 shadow-xl group-hover:shadow-3xl transition-all duration-500 cursor-pointer" onClick={() => setSelectedProduct(product)}>
                        <img src={product.img} alt={getL(product.name)} referrerPolicy="no-referrer" className="object-cover w-full h-full transition-transform duration-[1.5s] group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                        
                        {(product.isNew || product.isSale) && (
                          <div className="absolute top-6 right-6 flex flex-col gap-2">
                            {product.isNew && <span className="bg-accent-green text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-black">New</span>}
                            {product.isSale && <span className="bg-accent-pink text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-black">Sale</span>}
                          </div>
                        )}

                        {isAdmin && (
                          <div className="absolute top-4 left-4 right-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <button onClick={() => startEdit(product)} className="p-3 glass rounded-2xl hover:bg-white/20"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(product.id)} className="p-3 glass bg-red-500/10 rounded-2xl hover:bg-red-500/30 text-red-400"><Trash2 size={16} /></button>
                          </div>
                        )}

                        <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="absolute bottom-6 right-6 p-5 glass rounded-3xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all hover:bg-white hover:text-black shadow-2xl">
                          <ShoppingBag size={22} />
                        </button>
                      </div>
                      <h3 className="text-lg font-bold mb-1 opacity-90">{getL(product.name)}</h3>
                      <div className="flex items-center justify-center gap-3">
                         {product.oldPrice && <p className="text-sm line-through opacity-40">{product.oldPrice.toLocaleString()} {t('EGP')}</p>}
                         <p className="text-sm font-medium text-accent-pink">{product.price.toLocaleString()} {t('EGP')}</p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-20 glass p-10 sm:p-16 rounded-[48px] border-white/10 text-center overflow-hidden relative">
          <div className="relative z-10 flex flex-col items-center gap-10">
            <div className="text-3xl font-black tracking-[8px] uppercase logo flex items-center gap-2">
              <div className="w-2 h-10 bg-accent-pink" />
              <span>{settings.siteName || '11:11'}</span>
            </div>
            
            <p className="max-w-md opacity-50 text-sm font-light leading-relaxed">
              {getL(settings.heroDesc)}
            </p>

          <div className="flex gap-6 mt-4">
              {settings.facebook && <a href={settings.facebook} target="_blank" rel="noreferrer" className="p-4 glass rounded-[24px] bg-white/5 hover:bg-[#1877F2] transition-all hover:scale-110"><Globe size={20} /></a>}
              {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer" className="p-4 glass rounded-[24px] bg-white/5 hover:bg-[#E4405F] transition-all hover:scale-110"><Share2 size={20} /></a>}
              {settings.tiktok && <a href={settings.tiktok} target="_blank" rel="noreferrer" className="p-4 glass rounded-[24px] bg-white/5 hover:bg-black transition-all hover:scale-110"><Smartphone size={20} /></a>}
              {settings.whatsapp && <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="p-4 glass rounded-[24px] bg-white/5 hover:bg-[#25D366] transition-all hover:scale-110"><MessageCircle size={20} /></a>}
            </div>

            <div className="w-full h-px bg-white/10" />
            
            <p className="text-[10px] font-bold tracking-[4px] uppercase opacity-30">© 2024 Eleven Eleven Fashion Platform</p>
          </div>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-pink/5 blur-[120px] rounded-full pointer-events-none" />
        </footer>
      </div>

      {/* --- Order Success Modal --- */}
      <AnimatePresence>
        {isOrderModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOrderModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-2xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative glass p-10 sm:p-20 rounded-[48px] text-center max-w-lg bg-white/10 shadow-4xl border-white/20 overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent-pink via-purple-500 to-accent-green" />
               <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-accent-green/10 text-accent-green">
                  <CheckCircle2 size={48} />
               </div>
               <h2 className="text-4xl font-black mb-4 uppercase tracking-[4px]">{t('ORDER_CONFIRMED')}</h2>
               <p className="text-lg opacity-60 font-light mb-10 leading-relaxed">{t('ORDER_DESC')}</p>
               <button onClick={() => setIsOrderModalOpen(false)} className="w-full py-5 bg-white text-black rounded-3xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Okay</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Product Detail Modal --- */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[280] flex items-center justify-center p-4 sm:p-20 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="relative w-full max-w-6xl glass rounded-[48px] bg-white/5 border-white/10 overflow-hidden grid grid-cols-1 lg:grid-cols-2 shadow-4xl">
               <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 p-3 glass rounded-full hover:bg-white/20 z-10"><X /></button>
               <div className="flex flex-col lg:flex-row h-full">
                  <div className="relative w-full lg:w-[500px] shrink-0 bg-black overflow-hidden flex flex-col">
                    <div 
                      className="relative flex-1 cursor-zoom-in overflow-hidden group"
                      onMouseMove={(e) => {
                        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                        const x = ((e.pageX - left) / width) * 100;
                        const y = ((e.pageY - top) / height) * 100;
                        setZoomPos({ x, y });
                      }}
                      onMouseEnter={() => setIsZoomed(true)}
                      onMouseLeave={() => setIsZoomed(false)}
                    >
                      <motion.img 
                        key={activeImgIdx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={selectedProduct.images ? selectedProduct.images[activeImgIdx] : selectedProduct.img} 
                        className={`w-full h-full object-cover transition-transform duration-200 ${isZoomed ? 'scale-[2.5]' : 'scale-100'}`}
                        style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                      />
                      {!isZoomed && (
                        <div className="absolute bottom-6 right-6 p-4 glass rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                           <Search size={20} />
                        </div>
                      )}
                    </div>
                    
                    {selectedProduct.images && selectedProduct.images.length > 1 && (
                      <div className="flex gap-3 p-6 bg-white/5 overflow-x-auto no-scrollbar">
                        {selectedProduct.images.map((img, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => setActiveImgIdx(idx)}
                            className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${activeImgIdx === idx ? 'border-accent-pink' : 'border-transparent opacity-40 hover:opacity-100'}`}
                          >
                            <img src={img} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-8 sm:p-16 overflow-y-auto max-h-[80vh] lg:max-h-full">
                  <span className="text-xs font-black uppercase tracking-[4px] text-accent-pink mb-4">{getL(selectedProduct.category)}</span>
                  <h2 className="text-4xl sm:text-6xl font-light mb-6 tracking-tight">{getL(selectedProduct.name)}</h2>
                  <div className="flex items-center gap-6 mb-10">
                    <span className="text-5xl font-black">{selectedProduct.price.toLocaleString()} {t('EGP')}</span>
                    {selectedProduct.oldPrice && <span className="text-2xl line-through opacity-30">{selectedProduct.oldPrice.toLocaleString()} {t('EGP')}</span>}
                  </div>
                  <p className="text-lg opacity-60 font-serif italic leading-relaxed mb-12">
                    {getL(selectedProduct.description) || (lang === 'EN' ? 
                      "Meticulously crafted with premium fabrics, this piece embodies timeless elegance and contemporary style." :
                      "صُممت هذه القطعة بدقة باستخدام أقمشة فاخرة، وتجسد الأناقة الخالدة.")
                    }
                  </p>
                  
                  <div className="mb-12">
                     <h3 className="text-sm font-bold uppercase tracking-widest mb-4 border-b border-white/10 pb-2">{t('STOCK')}</h3>
                     <p className={`text-sm font-bold ${selectedProduct.stock > 0 ? 'text-accent-green' : 'text-accent-pink'}`}>
                        {selectedProduct.stock > 0 ? `${t('IN_STOCK')}: ${selectedProduct.stock}` : t('OUT_OF_STOCK')}
                     </p>
                  </div>

                  <div className="mb-12">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-2">{t('REVIEWS')}</h3>
                    <div className="space-y-6 mb-8">
                      {reviews.length > 0 ? reviews.map(r => (
                        <div key={r.id} className="p-6 glass rounded-[32px] bg-white/5 border-white/5">
                          <div className="flex items-center gap-4 mb-3">
                            {r.userPhoto ? <img src={r.userPhoto} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">{r.userName.charAt(0)}</div>}
                            <div>
                               <p className="text-xs font-bold">{r.userName}</p>
                               <div className="flex items-center gap-1 text-accent-pink">
                                  {[...Array(r.rating)].map((_, i) => <Star key={i} size={8} fill="currentColor" />)}
                               </div>
                            </div>
                          </div>
                          <p className="text-sm italic opacity-70 leading-relaxed">"{r.comment}"</p>
                        </div>
                      )) : (
                        <p className="opacity-30 italic text-sm text-center py-6">No reviews yet. Be the first!</p>
                      )}
                    </div>

                    {user && (
                      <div className="space-y-4">
                        <textarea 
                          id="review-comment"
                          className="glass-input min-h-[100px] py-4" 
                          placeholder={lang === 'AR' ? "أضف بضعة كلمات..." : "Add your thoughts..."} 
                        />
                        <button 
                          onClick={() => {
                            const val = (document.getElementById('review-comment') as HTMLTextAreaElement).value;
                            if (val) {
                              addReview(selectedProduct.id, 5, val);
                              (document.getElementById('review-comment') as HTMLTextAreaElement).value = '';
                            }
                          }}
                          className="glass-btn w-full bg-accent-pink text-white py-4 font-bold uppercase tracking-widest text-xs"
                        >
                          {t('ADD_REVIEW')}
                        </button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} className="w-full py-6 glass bg-white text-black rounded-3xl font-black uppercase tracking-[4px] hover:bg-white/90 shadow-2xl transition-all flex items-center justify-center gap-4">
                    <ShoppingBag /> {t('ADDED_TO_CART')}
                  </button>
                </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[250]" />
            <motion.aside
              initial={{ x: lang === 'AR' ? -600 : 600 }}
              animate={{ x: 0 }}
              exit={{ x: lang === 'AR' ? -600 : 600 }}
              className={`fixed top-0 ${lang === 'AR' ? 'left-0 border-r' : 'right-0 border-l'} border-white/10 w-full max-w-[500px] h-full glass z-[260] flex flex-col p-8 sm:p-12 bg-black/40 backdrop-blur-3xl`}
              dir={lang === 'AR' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-3xl font-black">{t('YOUR_CART')}</h3>
                <button onClick={() => setIsCartOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 gap-8">
                    <ShoppingBag size={100} strokeWidth={1} />
                    <p className="text-2xl font-light">{t('EMPTY_CART')}</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <motion.div layout key={item.id} className="flex gap-6 p-6 glass rounded-[32px] group">
                      <img src={item.img} className="w-24 h-32 object-cover rounded-2xl shadow-lg" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                           <p className="font-bold text-base">{getL(item.name)}</p>
                           <button onClick={() => removeFromCart(item.id)} className="text-red-500/20 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                        </div>
                        <p className="text-accent-pink text-sm mb-4">{item.price} {t('EGP')}</p>
                        <div className="flex items-center gap-4">
                          <button onClick={() => updateCartQuantity(item.id, -1)} className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/10">-</button>
                          <span className="text-base font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, 1)} className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/10">+</button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="mt-12 pt-12 border-t border-white/10">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-lg opacity-50 uppercase tracking-[4px]">{t('TOTAL')}</span>
                    <span className="text-4xl font-black text-accent-pink">{cartTotal.toLocaleString()} {t('EGP')}</span>
                  </div>
                  <button onClick={handleCheckout} className="w-full py-6 bg-white text-black rounded-[24px] font-black uppercase tracking-[4px] hover:scale-[1.02] active:scale-95 transition-all shadow-4xl">{t('CHECKOUT')}</button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Decorative Background - REMOVED AS IT IS NOW DYNAMIC AT TOP */}

      <style>{`
        body { background: ${theme === 'dark' ? '#07070a' : '#fff0f6'}; color: ${theme === 'dark' ? 'white' : '#1a1a1a'}; margin: 0; padding: 0; font-family: 'Inter', sans-serif; transition: background 0.8s cubic-bezier(0.4, 0, 0.2, 1); min-height: 100vh; }
        
        .glass { 
          background: ${theme === 'dark' ? 'rgba(25, 25, 35, 0.4)' : 'rgba(255, 255, 255, 0.7)'}; 
          backdrop-filter: blur(40px); 
          border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 158, 226, 0.2)'}; 
          box-shadow: ${theme === 'dark' ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 50px rgba(255, 158, 226, 0.15)'};
        }

        .glass-input { 
          width: 100%; border-radius: 20px; 
          background: ${theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'white'}; 
          border: 1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'}; 
          padding: 14px 20px; color: ${theme === 'dark' ? 'white' : '#1a1a1a'}; outline: none; transition: all 0.3s; 
          font-family: inherit;
        }

        .glass-btn { 
          border-radius: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; 
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow: 0 10px 20px -5px rgba(0,0,0,0.2);
        }
        .glass-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(0,0,0,0.3); }
        .glass-btn:active { transform: translateY(0); }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }
        .animate-float { animation: float 20s ease-in-out infinite; }

        /* Fancy Pink Theme Specifics */
        .text-accent-pink { color: ${theme === 'dark' ? '#ff9ee2' : '#d63384'}; }
        .bg-accent-pink { background-color: ${theme === 'dark' ? '#ff9ee2' : '#d63384'}; }
        .border-accent-pink { border-color: ${theme === 'dark' ? '#ff9ee2' : '#d63384'}; }

        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(214,51,132,0.2)'}; border-radius: 10px; }
      `}</style>
    </div>
  );
}

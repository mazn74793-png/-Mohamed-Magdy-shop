/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="vite/client" />

import { ShoppingBag, LayoutDashboard, PlusCircle, Activity, Box, Search, User, Trash2, X, Globe, CheckCircle2, AlertCircle, Edit2, Save, LogOut, Sun, Moon, Smartphone, MessageCircle, BarChart3, TrendingUp, Users, Calendar, ArrowRight, Star, Heart, Share2, Upload, Trash, Menu, ArrowLeft, Filter, Check, Maximize, CreditCard } from 'lucide-react';
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
  customerPhone: string;
  customerPhone2?: string;
  address: string;
  paymentMethod: 'insta' | 'cash';
  locationUrl?: string;
  items: OrderItem[];
  total: number;
  shippingFee: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: any;
}

interface Settings {
  facebook: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
  whatsappLabel?: string;
  siteName: string;
  heroImage: string;
  shippingFee: number;
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
  FOR_YOU: { EN: "For You", AR: "لك" },
  SUBTOTAL: { EN: "Subtotal", AR: "المجموع" },
  DELIVERY: { EN: "Delivery", AR: "التوصيل" },
  ADD_TO_CART: { EN: "Add to Cart", AR: "أضف للسلة" },
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
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState('COLLECTIONS');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'PRODUCTS' | 'ORDERS' | 'SETTINGS' | 'DASHBOARD'>('DASHBOARD');
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings>({ 
    facebook: '', 
    instagram: '', 
    tiktok: '', 
    whatsapp: '',
    whatsappLabel: 'Contact 11:11',
    siteName: '11:11',
    heroImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1600',
    shippingFee: 50,
    heroTitle: { EN: TRANSLATIONS.HERO_TITLE.EN, AR: TRANSLATIONS.HERO_TITLE.AR },
    heroDesc: { EN: TRANSLATIONS.HERO_DESC.EN, AR: TRANSLATIONS.HERO_DESC.AR }
  });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ phone: '', phone2: '', address: '', method: 'cash' as 'insta' | 'cash', location: '' });
  const [isLocating, setIsLocating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isFullscreenView, setIsFullscreenView] = useState(false);

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

  const filtered = products.filter(p => {
    const name = getL(p.name);
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeTab === 'NEW_ARRIVALS') return !!p.isNew;
    if (activeTab === 'SALE') return !!p.isSale;
    return true;
  });

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.status === 'completed' ? o.total : 0), 0);
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    
    // Group products by category for home page
    const groupedProducts: Record<string, Product[]> = {};
    filtered.forEach(p => {
      const cat = getL(p.category) || (lang === 'EN' ? 'Uncategorized' : 'عام');
      if (!groupedProducts[cat]) groupedProducts[cat] = [];
      groupedProducts[cat].push(p);
    });

    const chartData = [
      { name: 'Jan', val: 4000 },
      { name: 'Feb', val: 3000 },
      { name: 'Mar', val: 2000 },
      { name: 'Apr', val: 2780 },
      { name: 'May', val: 1890 },
      { name: 'Jun', val: 2390 },
      { name: 'Jul', val: 3490 },
    ];

    return { totalRevenue, completedOrders, pendingOrders, chartData, groupedProducts };
  }, [orders, filtered, lang]);

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
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
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

    if (!checkoutForm.phone || !checkoutForm.address) {
      notify({ EN: "Please provide phone and address", AR: "برجاء التأكد من إدخال رقم الهاتف والعنوان" }, 'error');
      return;
    }
    
    try {
      const { writeBatch, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);

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
        customerPhone: checkoutForm.phone,
        customerPhone2: checkoutForm.phone2,
        address: checkoutForm.address,
        paymentMethod: checkoutForm.method,
        locationUrl: checkoutForm.location,
        items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
        total: cartTotal + settings.shippingFee,
        shippingFee: settings.shippingFee,
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

  const shareLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
      setCheckoutForm(prev => ({ ...prev, location: url }));
      setIsLocating(false);
      notify({ EN: "Location captured!", AR: "تم تحديد موقعك بنجاح!" });
    }, () => {
      setIsLocating(false);
      notify({ EN: "Location blocked", AR: "تم رفض الوصول للمكان" }, 'error');
    });
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
        // Double check we have a valid ID
        if (typeof isEditing !== 'string') throw new Error("Invalid editing ID");
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative h-[300px] sm:h-[450px] mb-12 sm:mb-20 rounded-[48px] overflow-hidden group shadow-3xl">
          <img src={settings.heroImage || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1600"} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent flex flex-col justify-center p-10 sm:p-20 text-white">
            <motion.h1 initial={{ x: -20 }} animate={{ x: 0 }} transition={{ delay: 0.3 }} className="text-4xl sm:text-7xl font-light tracking-tight mb-4 drop-shadow-2xl">{getL(settings.heroTitle)}</motion.h1>
            <motion.p initial={{ x: -20 }} animate={{ x: 0 }} transition={{ delay: 0.4 }} className="max-w-md text-sm sm:text-lg opacity-90 font-light leading-relaxed mb-8 drop-shadow-lg">{getL(settings.heroDesc)}</motion.p>
          </div>
        </motion.div>

        {/* Admin Section */}
        <AnimatePresence>
          {isAdmin && isAdminPanelOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-12">
              <div className="p-8 sm:p-12 bg-[#0a0a0c] border border-white/10 rounded-[48px] text-white shadow-4xl shadow-black/80">
                <div className="flex flex-col gap-10 mb-12">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                    <h2 className="text-4xl font-black tracking-widest flex items-center gap-4 italic text-accent-pink uppercase">
                      <LayoutDashboard size={40} /> {t('ADMIN_PANEL')}
                    </h2>
                    <div className="flex gap-4">
                      <div className="px-8 py-4 glass bg-white/5 border-white/10 text-center rounded-3xl min-w-[120px]">
                        <p className="text-[10px] font-bold uppercase opacity-40 mb-1">{t('ACTIVE_ITEMS')}</p>
                        <p className="text-2xl font-black text-accent-green">{products.length}</p>
                      </div>
                      <div className="px-8 py-4 glass bg-white/5 border-white/10 text-center rounded-3xl min-w-[120px]">
                        <p className="text-[10px] font-bold uppercase opacity-40 mb-1">{t('ORDERS')}</p>
                        <p className="text-2xl font-black text-accent-pink">{orders.length}</p>
                      </div>
                    </div>
                    <button onClick={() => setIsAdminPanelOpen(false)} className="p-3 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all bg-white/5"><X /></button>
                  </div>

                  <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto custom-scrollbar">
                    {['DASHBOARD', 'PRODUCTS', 'ORDERS', 'SETTINGS'].map(tab => (
                      <button key={tab} onClick={() => setAdminTab(tab as any)} className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all ${adminTab === tab ? 'bg-accent-pink text-white shadow-lg' : 'opacity-40 hover:opacity-100 text-white'}`}>
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
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 text-white">
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
                            <input type="text" className="glass-input !bg-white/5 !text-white" value={newProduct.titleEN || ''} onChange={e => setNewProduct({...newProduct, titleEN: e.target.value})} placeholder="English" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">العنوان (AR)</label>
                            <input type="text" className="glass-input !bg-white/5 !text-white" value={newProduct.titleAR || ''} onChange={e => setNewProduct({...newProduct, titleAR: e.target.value})} placeholder="العربية" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">Description (EN)</label>
                            <textarea className="glass-input !bg-white/5 !text-white h-24 py-4" value={newProduct.descEN || ''} onChange={e => setNewProduct({...newProduct, descEN: e.target.value})} placeholder="Exclusive Summer Collection Details..." />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">الوصف (AR)</label>
                            <textarea className="glass-input !bg-white/5 !text-white h-24 py-4" value={newProduct.descAR || ''} onChange={e => setNewProduct({...newProduct, descAR: e.target.value})} placeholder="تفاصيل المجموعة الصيفية الحصرية..." />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">Price</label>
                            <input type="number" className="glass-input !bg-white/5 !text-white" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="0.00" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">{t('STOCK')}</label>
                             <input type="number" className="glass-input !bg-white/5 !text-white" value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} placeholder="10" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">Old Price</label>
                            <input type="number" className="glass-input !bg-white/5 !text-white" value={newProduct.oldPrice || ''} onChange={e => setNewProduct({...newProduct, oldPrice: e.target.value})} placeholder="0.00" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">Category (EN)</label>
                            <input type="text" className="glass-input !bg-white/5 !text-white" value={newProduct.catEN || ''} onChange={e => setNewProduct({...newProduct, catEN: e.target.value})} placeholder="e.g. Dresses" />
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
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto pb-10">
                    <div className="min-w-[800px]">
                      <table className="w-full text-left" dir={lang === 'AR' ? 'rtl' : 'ltr'}>
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="py-4 text-[10px] uppercase opacity-40">{t('CUSTOMER')}</th>
                            <th className="py-4 text-[10px] uppercase opacity-40">{t('ITEMS')}</th>
                            <th className="py-4 text-[10px] uppercase opacity-40">{t('TOTAL')}</th>
                            <th className="py-4 text-[10px] uppercase opacity-40">{t('STATUS')}</th>
                            <th className="py-4 text-[10px] uppercase opacity-40">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(order => (
                            <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm text-white">{order.customerName}</span>
                                  <span className="text-[10px] opacity-70 text-white/70">{order.customerPhone}</span>
                                  <span className="text-[10px] opacity-50 text-white/50">{order.address}</span>
                                </div>
                              </td>
                              <td className="py-4 text-[11px] max-w-[200px] truncate text-white/80">{order.items.map(item => `${getL(item.name)} (x${item.quantity})`).join(', ')}</td>
                              <td className="py-4">
                                <div className="flex flex-col">
                                  <span className="font-black text-accent-pink text-xs">{order.total} {t('EGP')}</span>
                                  <span className="text-[9px] opacity-40 text-white/40">Method: {order.paymentMethod}</span>
                                </div>
                              </td>
                              <td className="py-4">
                                <select value={order.status || 'pending'} onChange={async (e) => await updateDoc(doc(db, 'orders', order.id), { status: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none">
                                  <option value="pending" className="bg-gray-900">Pending</option>
                                  <option value="completed" className="bg-gray-900">Completed</option>
                                  <option value="cancelled" className="bg-gray-900">Cancelled</option>
                                </select>
                              </td>
                              <td className="py-4">
                                <div className="flex gap-2">
                                  <a href={`https://wa.me/${order.customerPhone}`} target="_blank" rel="noreferrer" className="p-2 glass bg-white/10 text-accent-pink rounded-lg hover:scale-110 transition-transform"><MessageCircle size={14} /></a>
                                  {order.locationUrl && <a href={order.locationUrl} target="_blank" rel="noreferrer" className="p-2 glass bg-white/10 text-accent-pink rounded-lg hover:scale-110 transition-transform"><Globe size={14} /></a>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {adminTab === 'SETTINGS' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 max-w-4xl text-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <h3 className="text-xl font-bold italic">Brand Identity</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase opacity-50">Site Name</label>
                            <input type="text" className="glass-input !bg-white/5 !text-white" value={settings.siteName || ''} onChange={e => setSettings({...settings, siteName: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase opacity-50">Hero Image URL</label>
                            <input type="text" className="glass-input !bg-white/5 !text-white" value={settings.heroImage || ''} onChange={e => setSettings({...settings, heroImage: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase opacity-50">Default Shipping Fee (EGP)</label>
                            <input type="number" className="glass-input !bg-white/5 !text-white" value={settings.shippingFee ?? ''} onChange={e => setSettings({...settings, shippingFee: parseInt(e.target.value) || 0})} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-xl font-bold italic">Hero Content</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" className="glass-input !bg-white/5 !text-white text-xs" value={settings.heroTitle?.EN || ''} onChange={e => setSettings({...settings, heroTitle: {...settings.heroTitle, EN: e.target.value}})} placeholder="Title EN" />
                            <input type="text" className="glass-input !bg-white/5 !text-white text-xs" value={settings.heroTitle?.AR || ''} onChange={e => setSettings({...settings, heroTitle: {...settings.heroTitle, AR: e.target.value}})} placeholder="العنوان بالعربية" />
                          </div>
                          <textarea className="glass-input !bg-white/5 !text-white text-xs h-20" value={settings.heroDesc?.AR || ''} onChange={e => setSettings({...settings, heroDesc: {...settings.heroDesc, AR: e.target.value}})} placeholder="الوصف بالعربية" />
                          <textarea className="glass-input !bg-white/5 !text-white text-xs h-20" value={settings.heroDesc?.EN || ''} onChange={e => setSettings({...settings, heroDesc: {...settings.heroDesc, EN: e.target.value}})} placeholder="Desc EN" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xl font-bold italic">{t('SOCIAL_LINKS')}</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {['facebook', 'instagram', 'tiktok', 'whatsapp'].map(s => (
                          <div key={s} className="space-y-1">
                            <label className="text-[9px] font-bold uppercase opacity-50">{s}</label>
                            <input type="text" className="glass-input !bg-white/5 !text-white text-xs" value={(settings as any)[s] || ''} onChange={e => setSettings({...settings, [s]: e.target.value})} />
                          </div>
                        ))}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase opacity-50">WhatsApp Button Label</label>
                          <input type="text" className="glass-input !bg-white/5 !text-white text-xs" value={settings.whatsappLabel || ''} onChange={e => setSettings({...settings, whatsappLabel: e.target.value})} placeholder="e.g. Contact 11:11" />
                        </div>
                      </div>
                    </div>
                    <button onClick={updateSettings} className="glass-btn bg-accent-pink text-white py-4 px-12 hover:scale-105 transition-all font-bold tracking-widest uppercase">{t('SAVE_SETTINGS')}</button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap items-center justify-center gap-4 py-10">
          <button 
            onClick={() => { setActiveTab('COLLECTIONS'); setSearchQuery(''); }}
            className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'COLLECTIONS' && searchQuery === '' ? 'bg-accent-pink text-white shadow-xl scale-105' : (theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10')}`}
          >
            {t('FOR_YOU')}
          </button>
          {(Object.entries(stats.groupedProducts as Record<string, Product[]>) as [string, Product[]][]).map(([category, items]) => (
            <button 
              key={category}
              onClick={() => { 
                setActiveTab('COLLECTIONS'); 
                setSearchQuery(category); 
                const el = document.getElementById(`cat-${category}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${searchQuery === category ? 'bg-accent-pink text-white shadow-xl scale-105' : 'bg-black/5 hover:bg-black/10'}`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product Grid Grouped by Category */}
        <main className="space-y-32">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 opacity-30 gap-6">
                <Search size={64} strokeWidth={1} />
                <p className="text-xl font-light">{t('NO_PRODUCTS')}</p>
              </motion.div>
            ) : (
              (Object.entries(stats.groupedProducts as Record<string, Product[]>) as [string, Product[]][]).map(([category, items]) => (
                <section key={category} id={`cat-${category}`} className="space-y-12 scroll-mt-32">
                  <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-black uppercase tracking-[4px]">{category}</h2>
                    <div className="flex-1 h-px bg-current opacity-10" />
                    <span className="text-xs font-bold opacity-30">{items.length} {t('TAB_PRODUCTS')}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-8">
                    {(items as Product[]).map((product, idx) => (
                        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }} key={product.id} className="text-center group flex flex-col">
                          <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-[24px] bg-white/5 border border-black/5 dark:border-white/10 shadow-sm group-hover:shadow-xl transition-all duration-500 cursor-pointer" onClick={() => setSelectedProduct(product)}>
                            <img src={product.img} alt={getL(product.name)} referrerPolicy="no-referrer" className="object-cover w-full h-full transition-transform duration-[1.5s] group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                            
                            {(product.isNew || product.isSale) && (
                              <div className="absolute top-4 right-4 flex flex-col gap-1">
                                {product.isNew && <span className="bg-accent-green text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full text-black">New</span>}
                                {product.isSale && <span className="bg-accent-pink text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full text-black">Sale</span>}
                              </div>
                            )}

                            {isAdmin && (
                              <div className="absolute top-3 left-3 right-3 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                <button onClick={() => startEdit(product)} className="p-2 glass rounded-xl hover:bg-white/20"><Edit2 size={12} /></button>
                                <button onClick={() => handleDelete(product.id)} className="p-2 glass bg-red-500/10 rounded-xl hover:bg-red-500/30 text-red-400"><Trash2 size={12} /></button>
                              </div>
                            )}

                            <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="absolute bottom-4 right-4 p-3 glass rounded-2xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all hover:bg-white hover:text-black shadow-xl">
                              <ShoppingBag size={18} />
                            </button>
                          </div>
                          <h3 className="text-sm font-bold mb-1 opacity-80 line-clamp-1">{getL(product.name)}</h3>
                          <div className="flex items-center justify-center gap-2">
                             {product.oldPrice && <p className="text-[10px] line-through opacity-30">{product.oldPrice.toLocaleString()}</p>}
                             <p className="text-xs font-bold text-accent-pink">{product.price.toLocaleString()} {t('EGP')}</p>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </section>
              ))
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
           {/* --- Full Page Product Detail --- */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className={`fixed inset-0 z-[500] flex flex-col ${theme === 'dark' ? 'bg-[#050508] text-white' : 'bg-[#fff0f6] text-black'} overflow-y-auto custom-scrollbar`}
          >
            {/* Header */}
            <header className="p-6 sm:p-10 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-transparent">
               <button onClick={() => setSelectedProduct(null)} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[4px] group px-6 py-3 glass rounded-full">
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                  {t('BACK_TO_SHOP')}
               </button>
               <div className="flex items-center gap-6">
                 <button onClick={() => setIsCartOpen(true)} className="relative p-4 glass rounded-full hover:scale-110 transition-all bg-white/5">
                    <ShoppingBag size={20} />
                    {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-pink text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">{cart.length}</span>}
                 </button>
               </div>
            </header>

            <main className="flex-1 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-12">
               {/* Left: Sticky Image Section */}
               <div className="lg:h-[calc(100vh-140px)] lg:sticky lg:top-[120px] p-6 sm:p-10 flex flex-col gap-6">
                  <div 
                    className="flex-1 relative rounded-[48px] overflow-hidden glass bg-black/5 dark:bg-white/5 cursor-zoom-in group shadow-4xl shadow-black/20 min-h-[400px]"
                    onClick={() => setIsFullscreenView(true)}
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
                      src={selectedProduct.images?.[activeImgIdx] || selectedProduct.img} 
                      className={`w-full h-full object-cover transition-transform duration-300 ${isZoomed ? 'scale-[2.5]' : 'scale-100'}`}
                      style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                    />
                    {!isZoomed && (
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <div className="p-6 glass rounded-full bg-white/20 backdrop-blur-md"><Maximize size={32} className="text-white" /></div>
                      </div>
                    )}
                  </div>
                  
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="flex gap-4 p-4 glass rounded-[32px] bg-black/5 dark:bg-white/5 overflow-x-auto custom-scrollbar no-scrollbar">
                      {selectedProduct.images.map((img, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setActiveImgIdx(idx)}
                          className={`w-20 h-24 sm:w-24 sm:h-32 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${activeImgIdx === idx ? 'border-accent-pink scale-105 shadow-xl ring-4 ring-accent-pink/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
                        >
                          <img src={img} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
               </div>

               {/* Right: Scrollable Info */}
               <div className="p-6 sm:p-20 pb-40">
                  <div className="max-w-xl">
                     <span className="text-xs font-black uppercase tracking-[8px] text-accent-pink mb-6 block">{getL(selectedProduct.category)}</span>
                     <h1 className="text-5xl sm:text-8xl font-black mb-10 leading-[0.95] tracking-tighter">{getL(selectedProduct.name)}</h1>
                     
                     <div className="flex items-center gap-10 mb-16">
                        <div className="flex flex-col">
                          <span className="text-6xl font-black text-accent-pink">{selectedProduct.price.toLocaleString()} <span className="text-xl font-light opacity-50">{t('EGP')}</span></span>
                          {selectedProduct.oldPrice && <span className="text-2xl line-through opacity-30 italic mt-2">{selectedProduct.oldPrice.toLocaleString()} {t('EGP')}</span>}
                        </div>
                     </div>

                     <p className="text-xl opacity-70 font-light leading-relaxed mb-16 border-l-4 border-accent-pink pl-8 italic">
                        {getL(selectedProduct.description) || (lang === 'EN' ? 
                          "An exquisite embodiment of luxury craftsmanship, designed for those who appreciate the finer points of contemporary tailoring." :
                          "تجسيد رائع للحرفية الفاخرة، مصمم لأولئك الذين يقدرون أدق تفاصيل التصميم العصري.")
                        }
                     </p>

                     <div className="grid grid-cols-2 gap-6 mb-16">
                        <div className="p-8 glass rounded-[32px] bg-black/5 dark:bg-white/5 flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('STOCK')}</label>
                          <span className={`text-xl font-black ${selectedProduct.stock > 0 ? 'text-accent-green' : 'text-accent-pink'}`}>
                            {selectedProduct.stock > 0 ? `${selectedProduct.stock} ${t('ACTIVE_ITEMS')}` : t('OUT_OF_STOCK')}
                          </span>
                        </div>
                        <div className="p-8 glass rounded-[32px] bg-black/5 dark:bg-white/5 flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('DELIVERY')}</label>
                          <span className="text-xl font-black">{lang === 'AR' ? '2-4 أيام عمل' : '2-4 Business Days'}</span>
                        </div>
                     </div>

                     <div className="flex flex-col gap-5">
                        <button 
                          onClick={() => addToCart(selectedProduct)}
                          disabled={selectedProduct.stock <= 0}
                          className={`w-full py-7 rounded-[32px] font-black uppercase tracking-[8px] transition-all shadow-4xl flex items-center justify-center gap-4 ${selectedProduct.stock > 0 ? 'bg-accent-pink text-white hover:scale-[1.02] active:scale-95' : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'}`}
                        >
                          <ShoppingBag size={24} />
                          {t('ADD_TO_CART')}
                        </button>
                        <button 
                          onClick={() => { addToCart(selectedProduct); setIsCartOpen(true); }}
                          disabled={selectedProduct.stock <= 0}
                          className={`w-full py-7 rounded-[32px] font-black uppercase tracking-[8px] transition-all shadow-4xl flex items-center justify-center gap-4 ${selectedProduct.stock > 0 ? 'bg-black text-white dark:bg-white dark:text-black hover:scale-[1.02] active:scale-95' : 'hidden'}`}
                        >
                          {lang === 'AR' ? 'شراء الآن' : 'Buy Now'}
                        </button>
                     </div>
                  </div>

                  {/* Reviews */}
                  <div className="mt-32 max-w-xl">
                     <div className="flex items-center justify-between mb-12 border-b border-black/10 dark:border-white/10 pb-6">
                        <h3 className="text-lg font-black uppercase tracking-[6px] italic">{t('REVIEWS')}</h3>
                        <div className="flex items-center gap-2 text-accent-pink bg-accent-pink/5 px-4 py-2 rounded-full">
                           <Star size={20} fill="currentColor" />
                           <span className="font-black text-sm">4.9/5</span>
                        </div>
                     </div>

                     <div className="space-y-8 mb-16">
                        {reviews.length > 0 ? reviews.map(r => (
                          <div key={r.id} className="p-10 glass rounded-[48px] bg-black/5 dark:bg-white/5 relative group/rev border-none">
                             <div className="flex items-center gap-6 mb-6">
                                <div className="w-16 h-16 rounded-full bg-accent-pink/20 flex items-center justify-center font-black text-accent-pink text-lg uppercase shadow-inner">
                                   {r.userPhoto ? <img src={r.userPhoto} className="w-full h-full rounded-full object-cover" /> : r.userName.charAt(0)}
                                </div>
                                <div>
                                   <p className="font-black text-lg">{r.userName}</p>
                                   <div className="flex gap-1 text-yellow-500 mt-1">
                                      {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} />)}
                                   </div>
                                </div>
                             </div>
                             <p className="text-lg opacity-60 leading-relaxed font-light italic">"{r.comment}"</p>
                          </div>
                        )) : (
                          <p className="text-center opacity-30 py-20 font-serif italic text-2xl">{lang === 'EN' ? "No reviews yet..." : "لا توجد تقييمات بعد..."}</p>
                        )}
                     </div>

                     {user && (
                       <div className="p-10 glass rounded-[48px] bg-black/5 dark:bg-white/5 border-2 border-accent-pink/10">
                          <h4 className="text-[10px] font-black uppercase tracking-[4px] mb-8 opacity-40">{t('ADD_REVIEW')}</h4>
                          <div className="flex items-center gap-3 mb-8">
                             {[1,2,3,4,5].map(star => (
                                <button key={star} onClick={() => setRating(star)} className={`p-2 transition-all ${rating >= star ? 'text-yellow-500 scale-125' : 'opacity-20 hover:opacity-100'}`}>
                                   <Star size={32} fill={rating >= star ? "currentColor" : "none"} />
                                </button>
                             ))}
                          </div>
                          <textarea 
                             placeholder={lang === 'AR' ? 'شاركنا بتجربتك...' : 'Share your experience...'} 
                             value={comment} 
                             onChange={(e) => setComment(e.target.value)}
                             className="w-full glass bg-white/10 dark:bg-black/20 border-none rounded-[32px] p-8 text-lg mb-8 min-h-[160px] outline-none placeholder:opacity-30"
                          />
                          <button onClick={() => { addReview(selectedProduct.id, rating, comment); setComment(''); }} className="w-full py-6 bg-accent-pink text-white rounded-[32px] font-black uppercase tracking-[4px] hover:scale-[1.03] shadow-4xl transition-all">{lang === 'AR' ? 'إضافة تقييم' : 'Submit Review'}</button>
                       </div>
                     )}
                  </div>
               </div>
            </main>

            {/* Fullscreen Overlay inside Detail */}
            <AnimatePresence>
              {isFullscreenView && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black flex flex-col p-8 sm:p-20">
                   <button onClick={() => setIsFullscreenView(false)} className="absolute top-10 right-10 p-5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-xl scale-110"><X size={32} /></button>
                   <div className="flex-1 flex items-center justify-center p-4">
                      <img src={selectedProduct.images?.[activeImgIdx] || selectedProduct.img} className="max-w-full max-h-full object-contain shadow-4xl" />
                   </div>
                   {selectedProduct.images && selectedProduct.images.length > 1 && (
                      <div className="flex gap-4 p-8 justify-center overflow-x-auto no-scrollbar">
                         {selectedProduct.images.map((img, idx) => (
                            <button key={idx} onClick={() => setActiveImgIdx(idx)} className={`w-24 h-32 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${activeImgIdx === idx ? 'border-accent-pink scale-110 shadow-xl' : 'border-transparent opacity-40'}`}>
                               <img src={img} className="w-full h-full object-cover" />
                            </button>
                         ))}
                      </div>
                   )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsCartOpen(false)} 
              className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[250]" 
            />
            <motion.aside
              initial={{ x: lang === 'AR' ? -600 : 600 }}
              animate={{ x: 0 }}
              exit={{ x: lang === 'AR' ? -600 : 600 }}
              className={`fixed top-0 ${lang === 'AR' ? 'left-0 border-r shadow-2xl shadow-pink-500/10' : 'right-0 border-l shadow-2xl shadow-pink-500/10'} border-white/10 w-full max-w-[550px] h-full ${theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-white'} z-[260] flex flex-col overflow-hidden`}
              dir={lang === 'AR' ? 'rtl' : 'ltr'}
            >
              {/* Cart Header */}
              <div className="p-8 pb-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-accent-pink/10 text-accent-pink rounded-2xl">
                      <ShoppingBag size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tight">{t('YOUR_CART')}</h3>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)} 
                  className="p-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all hover:rotate-90"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-32 h-32 bg-accent-pink/5 rounded-full flex items-center justify-center mb-8 text-accent-pink/20"
                    >
                       <ShoppingBag size={64} />
                    </motion.div>
                    <p className="text-xl font-black opacity-30 uppercase tracking-[4px]">{t('EMPTY_CART')}</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-8 text-xs font-black uppercase tracking-[2px] text-accent-pink hover:underline"
                    >
                       {t('BACK_TO_SHOP')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                     {cart.map(item => (
                       <motion.div 
                         layout 
                         key={item.id} 
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="flex gap-6 p-6 rounded-[32px] glass bg-black/5 dark:bg-white/5 group border border-transparent hover:border-accent-pink/20 transition-all"
                       >
                         <div className="w-24 h-32 rounded-2xl overflow-hidden shadow-xl shrink-0 border border-white/10 relative">
                            <img src={item.img} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                         </div>
                         <div className="flex-1 flex flex-col justify-between py-1">
                           <div className="flex justify-between items-start">
                              <div>
                                 <p className="font-black text-lg tracking-tight mb-1">{getL(item.name)}</p>
                                 <p className="text-xs opacity-50 font-medium uppercase tracking-widest">{lang === 'AR' ? 'سعر الوحدة' : 'Unit Price'}: {item.price} {t('EGP')}</p>
                              </div>
                              <button 
                                onClick={() => removeFromCart(item.id)} 
                                className="p-2 text-red-500/20 hover:text-red-500 hover:bg-red-500/5 rounded-full transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                           </div>
                           
                           <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center bg-black/10 dark:bg-white/10 rounded-xl p-1">
                                <button 
                                  onClick={() => updateCartQuantity(item.id, -1)} 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors font-bold"
                                >-</button>
                                <span className="text-sm font-black w-8 text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => updateCartQuantity(item.id, 1)} 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors font-bold"
                                >+</button>
                              </div>
                              <p className="text-accent-pink font-black text-lg">{(item.price * item.quantity).toLocaleString()} <span className="text-xs opacity-50 font-normal">{t('EGP')}</span></p>
                           </div>
                         </div>
                       </motion.div>
                     ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-8 pt-6 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                   <div className="space-y-4 mb-8">
                     <div className="flex justify-between items-center opacity-60">
                        <span className="text-sm font-black uppercase tracking-widest">{t('SUBTOTAL')}</span>
                        <span className="font-bold">{cartTotal.toLocaleString()} {t('EGP')}</span>
                     </div>
                     <div className="flex justify-between items-center text-2xl font-black">
                        <span className="uppercase tracking-widest">{t('TOTAL')}</span>
                        <span className="text-accent-pink">{cartTotal.toLocaleString()} <span className="text-sm font-black opacity-50">{t('EGP')}</span></span>
                     </div>
                   </div>

                   <button 
                    onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                    className="w-full py-6 rounded-[24px] bg-accent-pink text-white font-black uppercase tracking-[6px] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                   >
                     <Check size={24} />
                     {t('CHECKOUT')}
                   </button>
                   
                   <p className="text-center text-[9px] font-black uppercase tracking-widest opacity-30 mt-6 italic">
                     {lang === 'AR' ? 'جميع الأسعار تشمل ضريبة القيمة المضافة' : 'ALL PRICES INCLUDE VAT'}
                   </p>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Sidebar */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsCheckoutOpen(false)} 
              className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[300]" 
            />
            <motion.aside
              initial={{ x: lang === 'AR' ? -600 : 600 }}
              animate={{ x: 0 }}
              exit={{ x: lang === 'AR' ? -600 : 600 }}
              className={`fixed top-0 ${lang === 'AR' ? 'left-0 border-r' : 'right-0 border-l'} border-white/10 w-full max-w-[550px] h-full ${theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-[#fff0f6]'} text-current z-[310] flex flex-col p-10 overflow-y-auto custom-scrollbar`}
              dir={lang === 'AR' ? 'rtl' : 'ltr'}
            >
                <div className="flex items-center justify-between mb-16">
                   <h3 className="text-3xl font-black uppercase tracking-[4px]">{t('CHECKOUT')}</h3>
                   <button onClick={() => setIsCheckoutOpen(false)} className="p-3 bg-black/5 dark:bg-white/5 rounded-full"><X size={24} /></button>
                </div>

                <div className="space-y-12">
                   <div className="space-y-8">
                      <div className="flex items-center gap-4">
                         <div className="flex-1 h-px bg-current opacity-10" />
                         <span className="text-[10px] font-black uppercase tracking-[4px] opacity-40">{lang === 'AR' ? 'بيانات الشحن' : 'Shipping Details'}</span>
                         <div className="flex-1 h-px bg-current opacity-10" />
                      </div>

                      <div className="space-y-4">
                         <input className="glass-input text-lg py-6" placeholder={lang === 'AR' ? 'العنوان بالتفصيل' : 'Detailed Address'} value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} />
                         <div className="grid grid-cols-2 gap-4">
                            <input className="glass-input text-lg py-6" placeholder={lang === 'AR' ? 'رقم الهاتف' : 'Phone'} value={checkoutForm.phone} onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})} />
                            <input className="glass-input text-lg py-6" placeholder={lang === 'AR' ? 'رقم احتياطي' : 'Backup Phone'} value={checkoutForm.phone2} onChange={e => setCheckoutForm({...checkoutForm, phone2: e.target.value})} />
                         </div>
                         <button onClick={shareLocation} disabled={isLocating} className={`w-full py-6 rounded-[32px] border-2 border-dashed transition-all flex items-center justify-center gap-4 font-black uppercase tracking-widest text-xs ${checkoutForm.location ? 'bg-accent-green/10 border-accent-green text-accent-green' : 'border-current opacity-30 hover:opacity-100 hover:bg-current/5'}`}>
                            {checkoutForm.location ? <CheckCircle2 size={24} /> : <Globe size={24} />}
                            {isLocating ? (lang === 'AR' ? 'جاري التحديد...' : 'Locating...') : (checkoutForm.location ? (lang === 'AR' ? 'تم حفظ الموقع' : 'Location Saved') : (lang === 'AR' ? 'إرسال الموقع الحالي (GPS)' : 'Share GPS Location'))}
                         </button>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="flex items-center gap-4">
                         <div className="flex-1 h-px bg-current opacity-10" />
                         <span className="text-[10px] font-black uppercase tracking-[4px] opacity-40">{lang === 'AR' ? 'طريقة الدفع' : 'Payment Method'}</span>
                         <div className="flex-1 h-px bg-current opacity-10" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <button onClick={() => setCheckoutForm({...checkoutForm, method: 'cash'})} className={`py-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3 ${checkoutForm.method === 'cash' ? 'bg-accent-pink text-white border-accent-pink shadow-xl scale-105' : 'border-current opacity-20 hover:opacity-100'}`}>
                            <CreditCard size={32} />
                            <span className="text-[10px] font-black uppercase">Cash on Delivery</span>
                         </button>
                         <button onClick={() => setCheckoutForm({...checkoutForm, method: 'insta'})} className={`py-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3 ${checkoutForm.method === 'insta' ? 'bg-purple-600 text-white border-purple-600 shadow-xl scale-105' : 'border-current opacity-20 hover:opacity-100'}`}>
                            <Smartphone size={32} />
                            <span className="text-[10px] font-black uppercase">InstaPay</span>
                         </button>
                      </div>
                   </div>

                   <div className="pt-12 border-t border-black/10 dark:border-white/10">
                      <div className="flex justify-between items-center mb-4 opacity-50 font-bold uppercase tracking-widest text-xs">
                         <span>{lang === 'AR' ? 'سعر المنتجات' : 'Subtotal'}</span>
                         <span>{cartTotal.toLocaleString()} {t('EGP')}</span>
                      </div>
                      <div className="flex justify-between items-center mb-8 font-bold uppercase tracking-widest text-xs">
                         <span className="opacity-50">{lang === 'AR' ? 'التوصيل' : 'Shipping'}</span>
                         <span className="text-accent-pink">{settings.shippingFee} {t('EGP')}</span>
                      </div>
                      <div className="flex justify-between items-end mb-12">
                         <span className="text-2xl font-black uppercase tracking-[4px]">{t('TOTAL')}</span>
                         <div className="text-right">
                            <span className="text-5xl font-black text-accent-pink">{(cartTotal + settings.shippingFee).toLocaleString()}</span>
                            <span className="text-sm font-black opacity-30 ml-2 uppercase">EGP</span>
                         </div>
                      </div>
                      <button onClick={handleCheckout} className="w-full py-8 bg-black text-white dark:bg-accent-pink rounded-[40px] font-black uppercase tracking-[8px] hover:scale-[1.03] active:scale-95 transition-all shadow-4xl">{t('CHECKOUT')}</button>
                   </div>
                </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp for Customer */}
      <a 
        href={`https://wa.me/${settings.whatsapp}`} 
        target="_blank" 
        rel="noreferrer" 
        className={`fixed bottom-6 ${lang === 'AR' ? 'left-6' : 'right-6'} z-[100] w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group`}
      >
        <MessageCircle size={32} />
        <span className={`absolute ${lang === 'AR' ? 'left-20' : 'right-20'} bg-black text-white text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl`}>
          {settings.whatsappLabel || 'Contact 11:11'}
        </span>
      </a>

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

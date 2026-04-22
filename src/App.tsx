/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="vite/client" />

import { ShoppingBag, LayoutDashboard, PlusCircle, Activity, Box, Search, User, Trash2, X, Globe, CheckCircle2, AlertCircle, Edit2, Save, LogOut, Sun, Moon, Smartphone, MessageCircle, BarChart3, TrendingUp, Users, Calendar, ArrowRight, Star, Heart, Share2, Upload, Trash, Menu, ArrowLeft, Filter, Check, Maximize, CreditCard, Bell, Send, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, getDocFromServer, setDoc, where, increment, getDocs } from 'firebase/firestore';
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
// Enable Offline Persistence for much faster perceived performance
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
}, firebaseConfig.firestoreDatabaseId);
const googleProvider = new GoogleAuthProvider();

const ADMIN_EMAIL = 'motaem23y@gmail.com';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

interface ProductVariant {
  id: string;
  name: { EN: string; AR: string };
  stock: number;
  price?: number;
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
  variants?: ProductVariant[];
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
  variantId?: string;
  variantName?: { EN: string; AR: string };
}

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder?: number;
  usageLimit?: number;
  usedCount: number;
  expiryDate?: any;
  isActive: boolean;
}

interface OrderItem {
  id: string;
  name: { EN: string; AR: string };
  price: number;
  quantity: number;
  variantId?: string;
  variantName?: { EN: string; AR: string };
}

interface Order {
  id: string;
  userId?: string;
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
  discountAmount?: number;
  couponCode?: string;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: any;
  updatedAt?: any;
  adminMessage?: string;
}

interface Notification {
  id: string;
  userId: string;
  orderId?: string;
  title: { EN: string; AR: string };
  message: { EN: string; AR: string };
  read: boolean;
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

interface ToastMessage {
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
  HERO_DESC: { EN: "Explore our curated collection of exclusive linen sets and ethereal dresses designed for the modern muse.", AR: "اكتشفوا مجموعتنا المختارة من أطقم الكتان الحصرية والفساتين الرقيقة المصممة للمرأة العصرية." },
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
   PROCESSING: { EN: "Processing", AR: "جاري التجهيز" },
  SHIPPED: { EN: "Shipped", AR: "جاري الشحن" },
  COMPLETED: { EN: "Completed", AR: "مكتمل" },
  CANCELLED: { EN: "Cancelled", AR: "ملغي" },
  ORDER_MESSAGES: { EN: "Order Messages", AR: "رسائل الطلب" },
  WHATSAPP_CONFIRM: { EN: "Confirm Order via WhatsApp", AR: "تأكيد الطلب عبر واتساب" },
  WHATSAPP_DESC: { EN: "Confirm your order now for faster processing.", AR: "أكمل طلبك الآن من خلال التأكيد عبر واتساب لتسريع الشحن." },
  SEND_MSG: { EN: "Send Notification", AR: "ارسال إشعار" },
  DELETE_ORDER: { EN: "Delete Order", AR: "حذف الطلب" },
  NOTIFICATIONS: { EN: "Notifications", AR: "الإشعارات" },
  MARK_READ: { EN: "Mark as Read", AR: "تحديد كمقروء" },
  TAB_PRODUCTS: { EN: "Products", AR: "المنتجات" },
  TAB_ORDERS: { EN: "Orders", AR: "الطلبات" },
  TAB_SETTINGS: { EN: "Settings", AR: "الإعدادات" },
  TAB_DASHBOARD: { EN: "Dashboard", AR: "لوحة التحكم" },
  TAB_ADMINS: { EN: "Team", AR: "الفريق" },
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
  IN_STOCK: { EN: "In Stock", AR: "متوفر" },
  ADMIN_MANAGEMENT: { EN: "Team Management", AR: "إدارة الفريق" },
  ADD_ADMIN: { EN: "Add New Admin", AR: "إضافة أدمن جديد" },
  ADMIN_EMAIL_PLACEHOLDER: { EN: "Enter registered user email...", AR: "أدخل بريد المستخدم المسجل..." },
  TEAM_LIST: { EN: "Administrators List", AR: "قائمة المديرين" },
  REMOVE: { EN: "Remove", AR: "إزالة" },
  USER_NOT_FOUND: { EN: "User not found. They must login once first.", AR: "المستخدم غير موجود. يجب أن يسجل دخوله مرة واحدة أولاً." },
  ADMIN_ADDED: { EN: "Admin added successfully!", AR: "تم إضافة الأدمن بنجاح!" },
  ADMIN_REMOVED: { EN: "Admin removed!", AR: "تم إزالة الأدمن!" },
  ENABLE_PUSH: { EN: "Enable Device Notifications", AR: "تفعيل إشعارات الجهاز" },
  PUSH_ENABLED: { EN: "Device notifications enabled!", AR: "تم تفعيل إشعارات الجهاز!" },
  PUSH_ERROR: { EN: "Failed to enable notifications.", AR: "فشل تفعيل الإشعارات." },
  OFFLINE_NOTIFY: { EN: "Order Alerts (even when closed)", AR: "تنبيهات الطلبات (حتى والموقع مغلق)" },
  TAB_COUPONS: { EN: "Coupons", AR: "الكوبونات" },
  TAB_CUSTOMERS: { EN: "Customers", AR: "العملاء" },
  VARIANTS: { EN: "Variants", AR: "المتغيرات" },
  ADD_VARIANT: { EN: "Add Variant", AR: "إضافة متغير" },
  VARIANT_NAME: { EN: "Variant (e.g. Red / XL)", AR: "المتغير (مثلاً: أحمر / XL)" },
  COUPON_CODE: { EN: "Coupon Code", AR: "كود الخصم" },
  APPLY: { EN: "Apply", AR: "تطبيق" },
  SHOP_NOW: { EN: "Shop Now", AR: "تسوق الآن" },
  EXPIRED: { EN: "Expired", AR: "منتهي" },
  INVALID_COUPON: { EN: "Invalid Coupon Code", AR: "كود خصم غير صالح" },
  DISCOUNT: { EN: "Discount", AR: "الخصم" },
  MIN_ORDER: { EN: "Min Order", AR: "حد أدنى للطلب" },
  EXPIRY: { EN: "Expiry Date", AR: "تاريخ الانتهاء" },
  EXPIRY_DATE: { EN: "Expiry Date", AR: "تاريخ الانتهاء" },
  USAGE_LIMIT: { EN: "Usage Limit", AR: "حد الاستخدام" },
  TYPE: { EN: "Type", AR: "النوع" },
  VALUE: { EN: "Value", AR: "القيمة" },
  COUPON: { EN: "Coupon", AR: "كوبون الخصم" },
  SELECT_VARIANT: { EN: "Select Color/Size", AR: "اختار اللون/المقاس" },
  LOW_STOCK: { EN: "Low Stock!", AR: "كمية منخفضة!" },
  TOTAL_ORDERS: { EN: "Total Orders", AR: "إجمالي الطلبات" },
  CUSTOMER_VALUE: { EN: "Total Spent", AR: "إجمالي الإنفاق" },
};

const handleFirestoreError = (error: any, operation: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write', path: string | null = null, user: any = null) => {
  if (error.code === 'permission-denied') {
    const errorInfo = {
      error: "Missing or insufficient permissions",
      operationType: operation,
      path: path,
      authInfo: user ? {
        userId: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous,
        providerInfo: user.providerData.map((p: any) => ({ providerId: p.providerId, displayName: p.displayName, email: p.email }))
      } : 'No User'
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
};

export default function App() {
  const [lang, setLang] = useState<Language>('AR');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [user, setUser] = useState<FirebaseUser | null>(null);

  const getL = (obj: any, currentLang?: Language) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    const l = currentLang || lang;
    return obj[l] || obj['EN'] || obj['AR'] || '';
  };
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState('COLLECTIONS');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  type AdminTab = 'PRODUCTS' | 'ORDERS' | 'SETTINGS' | 'DASHBOARD' | 'ADMINS' | 'COUPONS' | 'CUSTOMERS';
  const [adminTab, setAdminTab] = useState<AdminTab>('DASHBOARD');
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [userOrders, setUserOrders] = useState<Order[]>([]);
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
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [adminList, setAdminList] = useState<any[]>([]); // Full objects for management UI
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [checkoutForm, setCheckoutForm] = useState({ phone: '', phone2: '', address: '', method: 'cash' as 'insta' | 'cash', location: '' });
  const [isLocating, setIsLocating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isFullscreenView, setIsFullscreenView] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const dataLoaded = useRef({ products: false, settings: false });

  const checkLoading = () => {
    if (dataLoaded.current.products && dataLoaded.current.settings) {
      setIsInitialLoading(false);
    }
  };

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
    isNew: false, isSale: false,
    variants: [] as ProductVariant[]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const optimizeImg = (url: string, width = 800) => {
    if (!url.includes('images.unsplash.com')) return url;
    if (url.includes('?')) {
      return url.split('?')[0] + `?auto=format&fit=crop&q=80&w=${width}`;
    }
    return url + `?auto=format&fit=crop&q=80&w=${width}`;
  };

  const t = (key: string) => {
    const entry = (TRANSLATIONS as any)[key];
    if (!entry) return key;
    return entry[lang] || entry['EN'] || key;
  };
  const isAdmin = useMemo(() => {
    const isRoot = user && user.email === ADMIN_EMAIL && user.emailVerified;
    const isInList = user && adminList.some(a => a.id === user.uid);
    return isRoot || isInList;
  }, [user, adminList]);

  const filtered = useMemo(() => products.filter(p => {
    const name = getL(p.name, lang);
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeTab === 'NEW_ARRIVALS') return !!p.isNew;
    if (activeTab === 'SALE') return !!p.isSale;
    return true;
  }), [products, lang, searchQuery, activeTab]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.status === 'completed' ? o.total : 0), 0);
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const lowStockProducts = products.filter(p => p.stock <= 5);
    const topProducts = [...products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

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

    return { totalRevenue, completedOrders, pendingOrders, lowStockProducts, topProducts, chartData, groupedProducts };
  }, [orders, filtered, lang, products]);

  // --- Effects ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          await setDoc(doc(db, 'users', u.uid), {
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            lastSeen: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.error("Error updating user record:", e);
        }
      }
    });
    // Connection test
    const testConnection = async () => {
      try { 
        await getDocFromServer(doc(db, 'test', 'connection')); 
      } catch (e: any) { 
        if (e.message?.includes('the client is offline')) {
          console.error("Firestore connectivity check failed: The client is offline. Please check your Firebase configuration or internet connection.");
          notify({ EN: "Internet connection issues detected.", AR: "مشاكل في الاتصال بالإنترنت." }, 'error');
        } else if (e.code === 'permission-denied') {
          // This is expected if the room is public but the test doc isn't
          console.log("Firestore Reachable (Permission Denied for test doc - expected)");
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
    if (!user) {
      setNotifications([]);
      return;
    }
    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    }, (err) => {
      console.error("Notifications Listener Error:", err);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUserOrders([]);
      return;
    }
    const q = query(collection(db, 'orders'), where('customerEmail', '==', user.email), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(data);
        dataLoaded.current.products = true;
        checkLoading();
      },
      error: (err) => {
        console.error("Products Listener Error:", err);
        dataLoaded.current.products = true;
        checkLoading();
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
        dataLoaded.current.settings = true;
        checkLoading();
      },
      error: (err) => {
        console.error("Settings Listener Error:", err);
        dataLoaded.current.settings = true;
        checkLoading();
      }
    });

    return () => unsubscribeSettings();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setOrders([]);
      return;
    }
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    }, (err) => {
      console.error("Orders Listener Error:", err);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!user) {
      setAdminList([]);
      return;
    }
    // Note: This snapshot will fail if not already an admin (except for root admin)
    // but that's handled by Firebase rules and we catch the error.
    const unsubscribe = onSnapshot(collection(db, 'admins'), (snapshot) => {
      setAdminList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      if (err.code !== 'permission-denied') console.error("Admin List Fetch Error:", err);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCoupons([]);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)));
    }, (err) => console.error("Coupons Error:", err));
    return () => unsubscribe();
  }, [user]);

  const customers = useMemo(() => {
    const custMap = new Map<string, { email: string; name: string; totalSpent: number; ordersCount: number }>();
    orders.forEach(order => {
      const email = order.customerEmail.toLowerCase();
      const existing = custMap.get(email) || { email, name: order.customerName, totalSpent: 0, ordersCount: 0 };
      existing.totalSpent += order.total;
      existing.ordersCount += 1;
      custMap.set(email, existing);
    });
    return Array.from(custMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  useEffect(() => {
    document.documentElement.dir = lang === 'AR' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang === 'AR' ? 'ar' : 'en';
  }, [lang]);

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
      let initialLoad = true;
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        if (!initialLoad && snapshot.docChanges().some(change => change.type === 'added')) {
          notify({ EN: "New order received!", AR: "لقد وصلك طلب جديد!" }, 'success');
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => {});
          } catch(e){}
        }
        setOrders(newOrders);
        initialLoad = false;
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
      sync();
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
        if (!prod) throw new Error(`Product not found: ${item.id}`);
        
        if (item.variantId) {
          const variants = [...(prod.variants || [])];
          const vIdx = variants.findIndex(v => v.id === item.variantId);
          if (vIdx === -1 || variants[vIdx].stock < item.quantity) {
             throw new Error(`Insufficient stock for ${getL(item.name)} - ${getL(item.variantName || {EN:'',AR:''})}`);
          }
          variants[vIdx].stock -= item.quantity;
          batch.update(doc(db, 'products', item.id), { 
            variants,
            stock: prod.stock - item.quantity // Also deduct total stock
          });
        } else {
          if (prod.stock < item.quantity) {
             throw new Error(`Insufficient stock for ${getL(item.name)}`);
          }
          batch.update(doc(db, 'products', item.id), { stock: prod.stock - item.quantity });
        }
      }

      // Update coupon usage
      if (appliedCoupon) {
        const { increment } = await import('firebase/firestore');
        batch.update(doc(db, 'coupons', appliedCoupon.id), { 
          usedCount: increment(1) 
        });
      }

      const discountAmount = appliedCoupon ? (
        appliedCoupon.type === 'percentage' 
          ? (cartTotal * appliedCoupon.value / 100)
          : appliedCoupon.value
      ) : 0;

      const orderData = {
        userId: user.uid,
        customerName: user.displayName || "Unknown",
        customerEmail: user.email,
        customerPhone: checkoutForm.phone,
        customerPhone2: checkoutForm.phone2 || null,
        address: checkoutForm.address,
        paymentMethod: checkoutForm.method,
        locationUrl: checkoutForm.location || null,
        items: cart.map(item => {
          const base: any = { 
            id: item.id, 
            name: item.name, 
            price: item.price, 
            quantity: item.quantity 
          };
          if (item.variantId) base.variantId = item.variantId;
          if (item.variantName) base.variantName = item.variantName;
          return base;
        }),
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        discountAmount: discountAmount,
        total: (cartTotal - discountAmount) + settings.shippingFee,
        shippingFee: settings.shippingFee,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      
      const orderRef = doc(collection(db, 'orders'));
      batch.set(orderRef, orderData);
      
      await batch.commit().catch(e => handleFirestoreError(e, 'write', 'checkout-batch', user));

      setLastPlacedOrder({ id: orderRef.id, ...orderData } as Order);
      setCart([]);
      setAppliedCoupon(null);
      setIsCartOpen(false);
      setIsOrderModalOpen(true);
      notify({ EN: "Order placed!", AR: "تم إرسال الطلب بنجاح!" });
      
      // Notify Admin via Server Push
      fetch('/api/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderRef.id })
      }).catch(e => console.error("Push notification trigger failed:", e));
    } catch (e: any) {
      console.error(e);
      notify({ EN: "Checkout failed: " + e.message, AR: "فشل إتمام الشراء: " + (e.message.startsWith('{') ? "خطأ في الصلاحيات" : e.message) }, 'error');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!isAdmin) return;
    if (!confirm(lang === 'AR' ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this order?')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId)).catch(e => handleFirestoreError(e, 'delete', `orders/${orderId}`, user));
      notify({ EN: "Order deleted", AR: "تم حذف الطلب" });
    } catch (e) {
      console.error(e);
    }
  };

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'orders', order.id), { 
        status: newStatus,
        updatedAt: serverTimestamp()
      }).catch(e => handleFirestoreError(e, 'update', `orders/${order.id}`, user));

      // Create notification for user
      if (order.userId) {
        const statuses: any = {
          'processing': { EN: 'Preparing Order', AR: 'جاري تجهيز طلبك' },
          'shipped': { EN: 'Order Shipped', AR: 'تم شحن طلبك' },
          'completed': { EN: 'Order Completed', AR: 'تم اكتمال الطلب' },
          'cancelled': { EN: 'Order Cancelled', AR: 'تم إلغاء الطلب' }
        };
        
        if (statuses[newStatus]) {
          await addDoc(collection(db, 'notifications'), {
            userId: order.userId,
            orderId: order.id,
            title: statuses[newStatus],
            message: { 
              EN: `Your order #${order.id.slice(-5)} is now ${newStatus}.`,
              AR: `طلبك رقم #${order.id.slice(-5)} أصبح الآن ${t(newStatus.toUpperCase())}.`
            },
            read: false,
            createdAt: serverTimestamp()
          }).catch(e => handleFirestoreError(e, 'create', 'notifications', user));
        }
      }
      
      notify({ EN: "Status updated", AR: "تم تحديث الحالة" });
    } catch (e) {
      console.error(e);
    }
  };

  const sendOrderMessage = async (order: Order, msg: string) => {
    if (!isAdmin || !msg.trim()) return;
    try {
      await updateDoc(doc(db, 'orders', order.id), { 
        adminMessage: msg,
        updatedAt: serverTimestamp()
      }).catch(e => handleFirestoreError(e, 'update', `orders/${order.id}`, user));

      if (order.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: order.userId,
          orderId: order.id,
          title: { EN: "Message from Eleven:Eleven", AR: "رسالة من Eleven:Eleven" },
          message: { EN: msg, AR: msg },
          read: false,
          createdAt: serverTimestamp()
        }).catch(e => handleFirestoreError(e, 'create', 'notifications', user));
      }
      
      notify({ EN: "Message sent", AR: "تم إرسال الرسالة" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmailInput.trim()) return;
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', adminEmailInput.trim().toLowerCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        notify(TRANSLATIONS.USER_NOT_FOUND, 'error');
        return;
      }

      const userDoc = snap.docs[0];
      const userData = userDoc.data();
      
      await setDoc(doc(db, 'admins', userDoc.id), {
        email: userData.email,
        uid: userDoc.id,
        addedBy: user?.email,
        createdAt: serverTimestamp()
      });

      notify(TRANSLATIONS.ADMIN_ADDED, 'success');
      setAdminEmailInput('');
    } catch (err) {
      handleFirestoreError(err, 'write', 'admins', user);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      notify({ EN: "Permission denied", AR: "ليس لديك صلاحية" }, 'error');
      return;
    }
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const code = (formData.get('code') as string || '').toUpperCase().trim();
    const type = formData.get('type') as 'percentage' | 'fixed';
    const value = Number(formData.get('value'));
    const minOrder = Number(formData.get('minOrder')) || 0;
    const usageLimitRaw = formData.get('usageLimit');
    const usageLimit = usageLimitRaw ? Number(usageLimitRaw) : null;
    const expiryDateRaw = formData.get('expiryDate');
    const expiryDate = expiryDateRaw ? new Date(expiryDateRaw as string) : null;

    if (!code || isNaN(value)) {
      notify({ EN: "Invalid inputs", AR: "بيانات غير صالحة" }, 'error');
      return;
    }

    const newCoupon = {
      code,
      type,
      value,
      minOrder,
      usageLimit: usageLimit === 0 ? null : usageLimit,
      usedCount: 0,
      isActive: true,
      expiryDate: (expiryDate && !isNaN(expiryDate.getTime())) ? expiryDate : null,
      createdAt: serverTimestamp()
    };
    
    try {
      await addDoc(collection(db, 'coupons'), newCoupon);
      notify({ EN: "Coupon added!", AR: "تم إضافة الكوبون!" }, 'success');
      form.reset();
    } catch (err: any) {
      console.error(err);
      const msg = err.message?.includes('permission-denied') 
        ? { EN: "Permission Denied (Rules)", AR: "خطأ في الصلاحيات (قواعد البيانات)" }
        : { EN: "Error adding coupon", AR: "خطأ في إضافة الكوبون" };
      notify(msg, 'error');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      notify({ EN: "Coupon deleted!", AR: "تم حذف الكوبون!" }, 'success');
    } catch (e) { console.error(e); }
  };

  const handleApplyCoupon = (codeOverride?: string) => {
    const code = codeOverride || prompt(lang === 'AR' ? 'أدخل كود الخصم:' : 'Enter coupon code:');
    if (!code) return;
    
    const coupon = coupons.find(c => c.code === code.toUpperCase() && c.isActive);
    if (!coupon) {
      notify(TRANSLATIONS.INVALID_COUPON, 'error');
      return;
    }
    
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      notify(TRANSLATIONS.EXPIRED, 'error');
      return;
    }
    
    if (coupon.minOrder && cartTotal < coupon.minOrder) {
      notify({ EN: `Min order ${coupon.minOrder} EGP`, AR: `الحد الأدنى للطلب ${coupon.minOrder} ج.م` }, 'error');
      return;
    }
    
    setAppliedCoupon(coupon);
    notify({ EN: "Coupon applied!", AR: "تم تطبيق الخصم!" }, 'success');
  };

  const handleRemoveAdmin = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'admins', uid));
      notify(TRANSLATIONS.ADMIN_REMOVED, 'success');
    } catch (err) {
      handleFirestoreError(err, 'delete', `admins/${uid}`, user);
    }
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !user) {
      alert("Push notifications not supported or user not logged in.");
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const response = await fetch('/api/vapid-public-key');
      const { publicKey } = await response.json();
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, userId: user.uid })
      });
      
      notify(TRANSLATIONS.PUSH_ENABLED, 'success');
    } catch (error) {
      console.error('Push subscription failed:', error);
      notify(TRANSLATIONS.PUSH_ERROR, 'error');
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
      await setDoc(doc(db, 'settings', 'global'), settings).catch(e => handleFirestoreError(e, 'write', 'settings/global', user));
      notify({ EN: "Settings saved!", AR: "تم حفظ الإعدادات بنجاح!" });
    } catch (e: any) {
      console.error(e);
      notify({ EN: "Error: " + e.message, AR: "خطأ: " + (e.message.startsWith('{') ? "خطأ في الصلاحيات" : e.message) }, 'error');
    }
  };

  const notify = (message: { EN: string; AR: string }, type: ToastMessage['type'] = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(n => n.id !== id));
    }, 4000);
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
  const addToCart = (product: Product, variant?: ProductVariant | null) => {
    // If product has variants and none is provided, notify
    if (product.variants && product.variants.length > 0 && !variant) {
      notify(TRANSLATIONS.SELECT_VARIANT, 'info');
      // If modal not open, open it to let them select
      if (selectedProduct?.id !== product.id) {
         setSelectedProduct(product);
      }
      return;
    }

    const effectiveStock = variant ? variant.stock : product.stock;
    const cartId = variant ? `${product.id}-${variant.id}` : product.id;

    if (effectiveStock <= 0) {
      notify(TRANSLATIONS.OUT_OF_STOCK, 'error');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => {
        const itemId = item.variantId ? `${item.id}-${item.variantId}` : item.id;
        return itemId === cartId;
      });

      if (existing) {
        if (existing.quantity >= effectiveStock) {
          notify({ EN: "No more stock available", AR: "لا توجد كمية كافية متوفرة" }, 'info');
          return prev;
        }
        return prev.map(item => {
           const itemId = item.variantId ? `${item.id}-${item.variantId}` : item.id;
           return itemId === cartId ? { ...item, quantity: item.quantity + 1 } : item;
        });
      }
      
      const newCartItem: CartItem = { 
        id: product.id, 
        name: product.name, 
        price: variant?.price || product.price, 
        img: product.img, 
        quantity: 1,
        variantId: variant?.id,
        variantName: variant?.name
      };
      return [...prev, newCartItem];
    });
    notify(TRANSLATIONS.ADDED_TO_CART);
  };

  const removeFromCart = (id: string, variantId?: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.variantId === variantId)));
  };

  const updateCartQuantity = (id: string, delta: number, variantId?: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.variantId === variantId) {
        const prod = products.find(p => p.id === id);
        const maxStock = variantId ? (prod?.variants?.find(v => v.id === variantId)?.stock || 0) : (prod?.stock || 0);
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > maxStock) {
           notify({ EN: "No more stock available", AR: "لا توجد كمية كافية متوفرة" }, 'info');
           return item;
        }
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
        
        const MAX_DIM = 1600;
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95); 
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
      variants: newProduct.variants || [],
      updatedAt: serverTimestamp()
    };

    try {
      if (isEditing) {
        if (typeof isEditing !== 'string') throw new Error("Invalid editing ID");
        await updateDoc(doc(db, 'products', isEditing), productData).catch(e => handleFirestoreError(e, 'update', `products/${isEditing}`, user));
        notify(TRANSLATIONS.PRODUCT_UPDATED);
      } else {
        await addDoc(collection(db, 'products'), { ...productData, createdAt: serverTimestamp() }).catch(e => handleFirestoreError(e, 'create', 'products', user));
        notify(TRANSLATIONS.PRODUCT_PUBLISHED);
      }
      setIsEditing(null);
      setNewProduct({ titleEN: '', titleAR: '', descEN: '', descAR: '', catEN: '', catAR: '', price: '', oldPrice: '', stock: '10', images: [], isNew: false, isSale: false, variants: [] });
    } catch (e: any) {
      console.error(e);
      notify({ EN: "Failed: " + e.message, AR: "فشلت العملية: " + (e.message.startsWith('{') ? "خطأ في الصلاحيات" : e.message) }, 'error');
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
      {/* Initial Loading Overlay */}
      <AnimatePresence>
        {isInitialLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#0a0a0f]"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }} 
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl font-black flex items-center gap-2"
            >
               <span className="bg-gradient-to-r from-[#00f2fe] to-[#667eea] bg-clip-text text-transparent font-serif italic">eleven</span>
               <span className="text-white opacity-30">:</span>
               <span className="bg-gradient-to-r from-[#764ba2] to-[#ff9ee2] bg-clip-text text-transparent font-serif italic">eleven</span>
            </motion.div>
            <div className="mt-8 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ x: "-100%" }}
                 animate={{ x: "100%" }}
                 transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                 className="w-full h-full bg-gradient-to-r from-transparent via-accent-pink to-transparent"
               />
            </div>
            <p className="mt-4 text-[10px] font-bold tracking-[4px] uppercase opacity-40 text-white">
              {lang === 'AR' ? 'جاري التحميل...' : 'Loading Excellence...'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
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

      {/* Toast Messages */}
      <div className={`fixed top-6 ${lang === 'AR' ? 'right-6' : 'left-6'} sm:left-1/2 sm:-translate-x-1/2 z-[500] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none`}>
        <AnimatePresence>
          {toasts.map(n => (
            <motion.div key={n.id} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-3 px-6 py-4 glass rounded-3xl shadow-2xl bg-white/20 backdrop-blur-2xl border-white/20 pointer-events-auto">
              {n.type === 'success' ? <CheckCircle2 className="text-accent-green" size={18} /> : (n.type === 'error' ? <AlertCircle className="text-accent-pink" size={18} /> : <Activity className="text-blue-400" size={18} />)}
              <span className="text-sm font-bold">{getL(n.message)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-8 md:p-12 relative z-10" dir={lang === 'AR' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between mb-8 sm:mb-16 gap-6 glass p-6 sm:px-10 rounded-[32px] sm:rounded-[48px] bg-white/5 border-white/10">
          <div className="flex flex-col items-center sm:items-start group cursor-pointer" onClick={() => setActiveTab('COLLECTIONS')}>
            <div className={`text-2xl sm:text-3xl font-black tracking-tighter flex items-center gap-1.5 transition-transform duration-500 group-hover:scale-105`}>
               <span className="bg-gradient-to-r from-[#00f2fe] to-[#667eea] bg-clip-text text-transparent font-serif italic">eleven</span>
               <span className="text-current opacity-30">:</span>
               <span className="bg-gradient-to-r from-[#764ba2] to-[#ff9ee2] bg-clip-text text-transparent font-serif italic">eleven</span>
            </div>
            <span className="text-[7px] font-black uppercase tracking-[0.4em] opacity-40 mt-1 whitespace-nowrap">
               Scarfs - Women Clothes
            </span>
          </div>

          <nav className="hidden xl:flex gap-10 text-[11px] font-bold tracking-[3px] opacity-70">
            {['COLLECTIONS', 'NEW_ARRIVALS', 'SALE', 'ACCOUNT'].map((key) => (
              <button key={key} onClick={() => {
                if (key === 'ACCOUNT') {
                  if (!user) handleLogin();
                  else setActiveTab('ACCOUNT');
                } else {
                  setActiveTab(key);
                }
              }} className={`cursor-pointer transition-all hover:opacity-100 relative group ${activeTab === key ? 'opacity-100' : 'opacity-40'}`}>
                {t(key as keyof typeof TRANSLATIONS)}
                <span className={`absolute -bottom-2 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full ${activeTab === key ? 'w-full' : ''}`} />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 sm:gap-6 ms-auto">
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
              <Bell size={24} className={`cursor-pointer transition-all ${isNotificationsOpen ? 'text-accent-pink opacity-100' : 'opacity-70 hover:opacity-100'}`} onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} />
              {notifications.filter(n => !n.read).length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent-pink rounded-full border-2 border-black" />}
            </div>

            <div className="relative">
              <ShoppingBag size={24} className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => setIsCartOpen(true)} />
              {cart.length > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent-pink rounded-full flex items-center justify-center text-[10px] font-bold text-black shadow-lg">{cart.reduce((a, b) => a + b.quantity, 0)}</span>}
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="relative group/profile">
                  <div onClick={() => isAdmin && setIsAdminPanelOpen(!isAdminPanelOpen)} className={`w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer transition-all relative ${isAdmin ? 'border-accent-green' : 'border-white/20'}`}>
                    <img src={user.photoURL || ''} alt="User" />
                    {isAdmin && orders.filter(o => o.status === 'pending').length > 0 && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0a0c] animate-pulse" />
                    )}
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
          <img src={optimizeImg(settings.heroImage || "https://images.unsplash.com/photo-1445205170230-053b83016050", 1200)} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
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
                    {['DASHBOARD', 'PRODUCTS', 'ORDERS', 'COUPONS', 'CUSTOMERS', 'SETTINGS', 'ADMINS'].map(tab => (
                      <button key={tab} onClick={() => setAdminTab(tab as any)} className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all relative ${adminTab === tab ? 'bg-accent-pink text-white shadow-lg' : 'opacity-40 hover:opacity-100 text-white'}`}>
                        {t(`TAB_${tab}` as any)}
                        {tab === 'ORDERS' && orders.filter(o => o.status === 'pending').length > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-[#0a0a0c]">
                            {orders.filter(o => o.status === 'pending').length}
                          </span>
                        )}
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="glass p-8 rounded-[40px] bg-white/5 border-white/10 space-y-6">
                          <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 italic flex items-center gap-2">
                             <AlertCircle size={14} className="text-accent-pink" /> 
                             {t('LOW_STOCK')}
                          </h3>
                          <div className="space-y-4">
                             {stats.lowStockProducts.length === 0 ? (
                               <p className="text-xs opacity-30 italic">All products well stocked.</p>
                             ) :stats.lowStockProducts.slice(0, 5).map(p => (
                               <div key={p.id} className="flex items-center justify-between group">
                                  <span className="text-xs font-bold truncate max-w-[150px]">{getL(p.name)}</span>
                                  <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black">{p.stock} units</span>
                               </div>
                             ))}
                          </div>
                          <button onClick={() => setAdminTab('PRODUCTS')} className="text-[10px] font-bold text-accent-pink underline uppercase tracking-widest">{lang === 'AR' ? 'تحديث المخزن' : 'Update Stock'}</button>
                       </div>

                       <div className="glass p-8 rounded-[40px] bg-white/5 border-white/10 space-y-6">
                          <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 italic flex items-center gap-2">
                             <Star size={14} className="text-accent-green" /> 
                             {t('TOP_PRODUCTS')}
                          </h3>
                          <div className="space-y-4">
                             {stats.topProducts.map(p => (
                               <div key={p.id} className="flex items-center justify-between">
                                  <span className="text-xs font-bold truncate max-w-[150px]">{getL(p.name)}</span>
                                  <span className="text-[10px] opacity-40 font-bold">{p.views || 0} views</span>
                               </div>
                             ))}
                          </div>
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
                         <div className="space-y-4 pt-6 border-t border-white/10">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold tracking-widest uppercase opacity-50">{t('VARIANTS')}</label>
                              <button 
                                onClick={() => {
                                  const nameEN = prompt('Variant Name EN (e.g. Red / XL):');
                                  const nameAR = prompt('اسم المتغير (مثلاً: أحمر / XL):');
                                  if(nameEN) {
                                    setNewProduct(prev => ({
                                      ...prev,
                                      variants: [...(prev.variants || []), { id: Date.now().toString(), name: { EN: nameEN, AR: nameAR || nameEN }, stock: 10 }]
                                    }));
                                  }
                                }}
                                className="text-[10px] font-bold text-accent-pink hover:underline uppercase tracking-widest"
                              >
                                + {t('ADD_VARIANT')}
                              </button>
                            </div>
                            <div className="space-y-2">
                              {newProduct.variants?.map((v, idx) => (
                                <div key={v.id} className="flex items-center gap-4 glass p-3 rounded-2xl bg-white/5 border border-white/10">
                                   <div className="flex-1">
                                      <p className="text-xs font-bold text-white mb-1">{getL(v.name)}</p>
                                   </div>
                                   <div className="w-24">
                                      <input 
                                        type="number" 
                                        className="glass-input !bg-black/40 !py-1 !px-2 !text-[10px]" 
                                        value={v.stock} 
                                        onChange={(e) => {
                                          const up = [...(newProduct.variants || [])];
                                          up[idx].stock = parseInt(e.target.value) || 0;
                                          setNewProduct({...newProduct, variants: up});
                                        }}
                                      />
                                   </div>
                                   <button 
                                     onClick={() => setNewProduct(prev => ({ ...prev, variants: prev.variants?.filter((_, i) => i !== idx) }))}
                                     className="p-1 hover:text-red-400 transition-colors"
                                   ><X size={14} /></button>
                                </div>
                              ))}
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
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-white">{order.customerName}</span>
                                    {order.status === 'pending' && <span className="bg-red-500/10 text-red-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse">New</span>}
                                  </div>
                                  <span className="text-[10px] opacity-70 text-white/70">{order.customerPhone}</span>
                                  <span className="text-[10px] opacity-50 text-white/50">{order.address}</span>
                                </div>
                              </td>
                              <td className="py-4 text-[11px] max-w-[200px] truncate text-white/80">{order.items.map(item => `${getL(item.name)} (x${item.quantity})`).join(', ')}</td>
                              <td className="py-4">
                                <div className="flex flex-col">
                                  <span className="font-black text-accent-pink text-xs">{order.total} {t('EGP')}</span>
                                  {order.discountAmount && <span className="text-[8px] text-accent-green">-{order.discountAmount} (Coupon)</span>}
                                  <span className="text-[9px] opacity-40 text-white/40">Method: {order.paymentMethod}</span>
                                </div>
                              </td>
                              <td className="py-4">
                                <select 
                                  value={order.status || 'pending'} 
                                  onChange={(e) => updateOrderStatus(order, e.target.value)} 
                                  className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none"
                                >
                                  <option value="pending" className="bg-gray-900">Pending</option>
                                  <option value="processing" className="bg-gray-900">Processing</option>
                                  <option value="shipped" className="bg-gray-900">Shipped</option>
                                  <option value="completed" className="bg-gray-900">Completed</option>
                                  <option value="cancelled" className="bg-gray-900">Cancelled</option>
                                </select>
                              </td>
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <a href={`https://wa.me/${order.customerPhone}`} target="_blank" rel="noreferrer" className="p-2 glass bg-white/10 text-accent-pink rounded-lg hover:scale-110 transition-transform"><MessageCircle size={14} /></a>
                                  {order.locationUrl && <a href={order.locationUrl} target="_blank" rel="noreferrer" className="p-2 glass bg-white/10 text-green-400 rounded-lg hover:scale-110 transition-transform"><Globe size={14} /></a>}
                                  <button onClick={() => {
                                    const msg = prompt(lang === 'AR' ? 'اكتب الرسالة للعميل:' : 'Enter message for customer:');
                                    if (msg) sendOrderMessage(order, msg);
                                  }} className="p-2 glass bg-white/10 text-blue-400 rounded-lg hover:scale-110 transition-transform"><Send size={14} /></button>
                                  <button onClick={() => deleteOrder(order.id)} className="p-2 glass bg-white/10 text-red-400 rounded-lg hover:scale-110 transition-transform"><Trash2 size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {adminTab === 'COUPONS' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 text-white">
                    <form onSubmit={handleAddCoupon} className="glass p-8 rounded-[40px] bg-white/5 border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase opacity-40 ">{t('COUPON_CODE')}</label>
                        <input name="code" required className="glass-input !bg-white/5 !text-white" placeholder="EID2025" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase opacity-40 ">{t('TYPE')}</label>
                        <select name="type" className="glass-input !bg-black !text-white h-[44px]">
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase opacity-40 ">{t('VALUE')}</label>
                        <input name="value" type="number" required className="glass-input !bg-white/5 !text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase opacity-40 ">{t('MIN_ORDER')} (EGP)</label>
                        <input name="minOrder" type="number" defaultValue="0" className="glass-input !bg-white/5 !text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase opacity-40 ">{t('USAGE_LIMIT')}</label>
                        <input name="usageLimit" type="number" placeholder="Optional" className="glass-input !bg-white/5 !text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase opacity-40 ">{t('EXPIRY_DATE')}</label>
                        <input name="expiryDate" type="date" className="glass-input !bg-white/5 !text-white" />
                      </div>
                      <button type="submit" className="glass-btn bg-accent-pink text-white h-[44px] lg:col-span-1">{t('PUBLISH')}</button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {coupons.map(c => (
                        <div key={c.id} className="glass p-6 rounded-3xl bg-white/5 border-white/10 flex justify-between items-center group relative overflow-hidden">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-xl font-black italic text-accent-pink tracking-widest">{c.code}</h4>
                              <span className="text-[9px] font-bold opacity-30">| {c.type}</span>
                            </div>
                            <p className="text-sm font-bold text-white/50">{c.value}{c.type === 'percentage' ? '%' : ' EGP'} OFF</p>
                            <p className="text-[9px] font-bold uppercase opacity-30 mt-2">Used: {c.usedCount} / {c.usageLimit || '∞'}</p>
                          </div>
                          <button onClick={() => handleDeleteCoupon(c.id)} className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                            <Trash2 size={16} />
                          </button>
                          <div className="absolute top-0 right-0 w-20 h-20 bg-accent-pink/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {adminTab === 'CUSTOMERS' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
                    <table className="w-full text-left" dir={lang === 'AR' ? 'rtl' : 'ltr'}>
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="py-4 text-[10px] uppercase opacity-40">{t('CUSTOMER')}</th>
                            <th className="py-4 text-[10px] uppercase opacity-40 text-center">{t('TOTAL_ORDERS')}</th>
                            <th className="py-4 text-[10px] uppercase opacity-40 text-center">{t('CUSTOMER_VALUE')}</th>
                            <th className="py-4 text-[10px] uppercase opacity-40 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers.map((cust, idx) => (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-6">
                                <span className="block font-bold text-white mb-1">{cust.name}</span>
                                <span className="block text-[10px] opacity-40">{cust.email}</span>
                              </td>
                              <td className="py-6 text-center font-black opacity-60 text-lg">{cust.ordersCount}</td>
                              <td className="py-6 text-center">
                                <span className="text-xl font-black text-accent-green">{cust.totalSpent.toLocaleString()}</span>
                                <span className="text-[9px] opacity-30 ml-2 uppercase">EGP</span>
                              </td>
                              <td className="py-6 text-right">
                                <button className="glass-btn text-[10px] py-2 px-4 opacity-50 hover:opacity-100" onClick={() => {
                                  setSearchQuery(cust.email);
                                  setAdminTab('ORDERS');
                                }}>View Orders</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
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

                    <div className="p-8 rounded-[40px] bg-accent-pink/5 border border-accent-pink/20 space-y-6">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-accent-pink/20 text-accent-pink rounded-2xl">
                            <Bell size={24} />
                         </div>
                         <div>
                           <h3 className="text-xl font-black uppercase tracking-widest">{t('OFFLINE_NOTIFY')}</h3>
                           <p className="text-[10px] opacity-50 font-bold uppercase tracking-[2px]">Shopify-style alerts</p>
                         </div>
                      </div>
                      <p className="text-xs opacity-60 leading-relaxed italic">{lang === 'AR' ? 'اضغط على الزر أدناه للسماح للمتصفح بإرسال تنبيهات لك عند وصول طلبات جديدة، حتى لو كنت لا تستخدم الموقع حالياً.' : 'Click below to allow the browser to send you notifications for new orders, even if you are not currently using the site.'}</p>
                      <button onClick={subscribeToPush} className="w-full sm:w-auto glass-btn bg-white/10 text-white py-4 px-12 hover:bg-accent-green hover:text-black transition-all font-bold tracking-widest uppercase flex items-center justify-center gap-3">
                        <Smartphone size={18} />
                        {t('ENABLE_PUSH')}
                      </button>
                    </div>

                    <button onClick={updateSettings} className="glass-btn bg-accent-pink text-white py-4 px-12 hover:scale-105 transition-all font-bold tracking-widest uppercase">{t('SAVE_SETTINGS')}</button>
                  </motion.div>
                )}

                {adminTab === 'ADMINS' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 max-w-4xl text-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-8">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-accent-pink/20 text-accent-pink rounded-2xl">
                              <Users size={24} />
                           </div>
                           <h3 className="text-xl font-black uppercase tracking-widest">{t('ADMIN_MANAGEMENT')}</h3>
                        </div>
                        
                        <form onSubmit={handleAddAdmin} className="space-y-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-[3px] opacity-40">{t('ADD_ADMIN')}</label>
                              <div className="flex gap-2">
                                 <input 
                                   type="email" 
                                   required
                                   value={adminEmailInput}
                                   onChange={e => setAdminEmailInput(e.target.value)}
                                   placeholder={t('ADMIN_EMAIL_PLACEHOLDER')}
                                   className="flex-1 glass-input !bg-white/5 !text-white !p-4"
                                 />
                                 <button type="submit" className="glass-btn bg-accent-pink text-white px-6 rounded-2xl hover:scale-105 active:scale-95 transition-all">
                                    <PlusCircle size={20} />
                                 </button>
                              </div>
                           </div>
                        </form>
                      </div>

                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black uppercase tracking-widest opacity-40">{t('TEAM_LIST')}</h3>
                          <span className="text-[10px] font-black text-accent-pink bg-accent-pink/10 px-4 py-1 rounded-full">{adminList.length + 1}</span>
                        </div>
                        <div className="space-y-4">
                           {/* Always show root admin first */}
                           <div className="glass p-6 rounded-[32px] bg-white/10 border-white/20 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-accent-pink flex items-center justify-center font-black">
                                    {ADMIN_EMAIL.charAt(0).toUpperCase()}
                                 </div>
                                 <div>
                                    <p className="font-bold text-sm tracking-tight">{ADMIN_EMAIL}</p>
                                    <p className="text-[9px] font-bold uppercase opacity-30 mt-0.5 tracking-[2px]">Owner / Root Admin</p>
                                 </div>
                              </div>
                           </div>

                           {adminList.map(adm => (
                             <div key={adm.id} className="glass p-6 rounded-[32px] bg-white/5 border-white/10 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full bg-accent-pink/50 flex items-center justify-center font-black">
                                      {adm.email.charAt(0).toUpperCase()}
                                   </div>
                                   <div>
                                      <p className="font-bold text-sm tracking-tight">{adm.email}</p>
                                      <p className="text-[9px] font-bold uppercase opacity-30 mt-0.5 tracking-[2px]">Added by {adm.addedBy || 'System'}</p>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => handleRemoveAdmin(adm.id)}
                                  className="p-3 bg-red-500/10 text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/30"
                                >
                                   <Trash2 size={16} />
                                </button>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
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
            {activeTab === 'ACCOUNT' && user && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="space-y-16 py-10"
              >
                <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20 p-10 sm:p-16 glass rounded-[64px] bg-white/5 border-white/10 relative overflow-hidden">
                  <div className="relative z-10 w-32 h-32 rounded-full overflow-hidden border-4 border-accent-pink/30 shadow-4xl shadow-pink-500/20">
                    <img src={user.photoURL || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="relative z-10 text-center md:text-left">
                    <h2 className="text-4xl sm:text-6xl font-black mb-4 tracking-tighter">{user.displayName}</h2>
                    <p className="opacity-50 text-sm font-bold uppercase tracking-[4px]">{user.email}</p>
                    <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-4">
                      {isAdmin && <button onClick={() => setIsAdminPanelOpen(true)} className="px-8 py-3 glass bg-accent-green/20 text-accent-green rounded-full text-[10px] font-black uppercase tracking-[3px] hover:scale-105 transition-all">{t('TAB_DASHBOARD')}</button>}
                      <button onClick={handleLogout} className="px-8 py-3 glass bg-red-500/10 text-red-400 rounded-full text-[10px] font-black uppercase tracking-[3px] hover:scale-105 transition-all">{t('LOGOUT')}</button>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-80 h-80 bg-accent-pink/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                </div>

                <div className="space-y-10">
                  <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-black uppercase tracking-[4px]">{t('TAB_ORDERS')}</h2>
                    <div className="flex-1 h-px bg-current opacity-10" />
                    <span className="text-xs font-bold opacity-30">{userOrders.length} {t('TAB_ORDERS')}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {userOrders.length === 0 ? (
                      <div className="glass p-20 rounded-[48px] text-center bg-white/5 border-white/10 opacity-30 italic">
                        <p>{lang === 'AR' ? 'لا توجد طلبات سابقة' : 'No previous orders found'}</p>
                      </div>
                    ) : (
                      userOrders.map(order => (
                        <motion.div 
                          key={order.id}
                          layout
                          className="glass p-8 sm:p-10 rounded-[40px] bg-white/5 border-white/10 hover:border-accent-pink/20 transition-all group lg:flex items-center gap-10"
                        >
                          <div className="mb-6 lg:mb-0 lg:w-48 text-center lg:text-left">
                            <p className="text-[10px] font-bold uppercase tracking-[3px] opacity-30 mb-2">{t('STATUS')}</p>
                            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[2px] ${
                              order.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                              order.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                              order.status === 'shipped' ? 'bg-purple-500/20 text-purple-400' :
                              order.status === 'completed' ? 'bg-accent-green/20 text-accent-green' : 'bg-red-500/20 text-red-500'
                            }`}>
                              {t(order.status?.toUpperCase())}
                            </span>
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-center">
                              <p className="text-[10px] font-bold uppercase tracking-[3px] opacity-30">{lang === 'AR' ? 'رقم الطلب' : 'ORDER ID'}</p>
                              <p className="text-[10px] font-bold opacity-30">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString(lang === 'AR' ? 'ar-EG' : 'en-US') : ''}</p>
                            </div>
                            <p className="text-xl font-black truncate max-w-sm">#{order.id}</p>
                            <div className="flex flex-wrap gap-2">
                              {order.items.map((item, idx) => (
                                <span key={idx} className="bg-white/5 px-4 py-2 rounded-xl text-[10px] font-bold">{getL(item.name)} (x{item.quantity})</span>
                              ))}
                            </div>
                            {order.adminMessage && (
                              <div className="mt-6 p-6 rounded-3xl bg-accent-pink/5 border border-accent-pink/20">
                                <p className="text-[9px] font-black uppercase tracking-[3px] text-accent-pink mb-2">{t('ORDER_MESSAGES')}</p>
                                <p className="text-xs font-medium leading-relaxed italic">"{order.adminMessage}"</p>
                              </div>
                            )}
                          </div>

                          <div className={`mt-8 lg:mt-0 lg:w-48 text-center ${lang === 'AR' ? 'lg:text-left lg:border-r lg:pr-10' : 'lg:text-right lg:border-l lg:pl-10'} border-t lg:border-t-0 border-white/10 pt-8 lg:pt-0`}>
                            <p className="text-[10px] font-bold uppercase tracking-[3px] opacity-30 mb-2">{t('TOTAL')}</p>
                            <p className="text-3xl font-black text-accent-pink">{order.total.toLocaleString()} <span className="text-lg opacity-50 font-light">{t('EGP')}</span></p>
                            <a href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`${lang === 'AR' ? 'أهلاً، أود الاستفسار عن طلبي رقم' : 'Hi, I want to inquire about my order #'} ${order.id}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-6 text-[10px] font-black uppercase tracking-[3px] text-accent-green hover:underline">
                              <MessageCircle size={14} /> {t('CONTACT_US')}
                            </a>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab !== 'ACCOUNT' && (filtered.length === 0 ? (
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
                            <img src={optimizeImg(product.img, 400)} alt={getL(product.name)} loading="lazy" referrerPolicy="no-referrer" className="object-cover w-full h-full transition-transform duration-[1.5s] group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                            
                            {(product.isNew || product.isSale) && (
                              <div className={`absolute top-4 ${lang === 'AR' ? 'left-4' : 'right-4'} flex flex-col gap-1`}>
                                {product.isNew && <span className="bg-accent-green text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full text-black">New</span>}
                                {product.isSale && <span className="bg-accent-pink text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full text-black">Sale</span>}
                              </div>
                            )}

                            {isAdmin && (
                              <div className="absolute top-3 inset-x-3 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                <button onClick={() => startEdit(product)} className="p-2 glass rounded-xl hover:bg-white/20"><Edit2 size={12} /></button>
                                <button onClick={() => handleDelete(product.id)} className="p-2 glass bg-red-500/10 rounded-xl hover:bg-red-500/30 text-red-400"><Trash2 size={12} /></button>
                              </div>
                            )}

                            <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className={`absolute bottom-4 ${lang === 'AR' ? 'left-4' : 'right-4'} p-3 glass rounded-2xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all hover:bg-white hover:text-black shadow-xl`}>
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
            ))}
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
            
            <p className="text-[10px] font-bold tracking-[4px] uppercase opacity-30">© 2026 Eleven Eleven Fashion Platform</p>
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

                     {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                        <div className="mb-16 space-y-6">
                           <h3 className="text-sm font-black uppercase tracking-[4px] opacity-40">{t('SELECT_VARIANT')}</h3>
                           <div className="flex flex-wrap gap-4">
                              {selectedProduct.variants.map(v => (
                                 <button 
                                   key={v.id} 
                                   onClick={() => setSelectedVariant(v)}
                                   className={`px-8 py-4 rounded-[24px] text-xs font-black tracking-widest transition-all ${selectedVariant?.id === v.id ? 'bg-accent-pink text-white scale-105 shadow-xl' : 'glass bg-black/5 dark:bg-white/5 opacity-50 hover:opacity-100'}`}
                                 >
                                   {getL(v.name)}
                                   {v.stock <= 5 && <span className="ml-2 text-[8px] opacity-50 uppercase tracking-widest">({v.stock} left)</span>}
                                 </button>
                              ))}
                           </div>
                        </div>
                     )}

                     <div className="flex flex-col gap-5">
                        <button 
                          onClick={() => addToCart(selectedProduct, selectedVariant)}
                          disabled={selectedProduct.stock <= 0 && (!selectedVariant || (selectedVariant && selectedVariant.stock <= 0))}
                          className={`w-full py-7 rounded-[32px] font-black uppercase tracking-[8px] transition-all shadow-4xl flex items-center justify-center gap-4 ${(selectedProduct.stock > 0 || (selectedVariant && selectedVariant.stock > 0)) ? 'bg-accent-pink text-white hover:scale-[1.02] active:scale-95' : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'}`}
                        >
                          <ShoppingBag size={24} />
                          {t('ADD_TO_CART')}
                        </button>
                        <button 
                          onClick={() => { 
                            addToCart(selectedProduct, selectedVariant); 
                            setSelectedProduct(null);
                            setIsCheckoutOpen(true); 
                          }}
                          disabled={selectedProduct.stock <= 0 && (!selectedVariant || (selectedVariant && selectedVariant.stock <= 0))}
                          className={`w-full py-7 rounded-[32px] font-black uppercase tracking-[8px] transition-all shadow-4xl flex items-center justify-center gap-4 ${(selectedProduct.stock > 0 || (selectedVariant && selectedVariant.stock > 0)) ? 'bg-black text-white dark:bg-white dark:text-black hover:scale-[1.02] active:scale-95' : 'hidden'}`}
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

      {/* Notifications Sidebar */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsNotificationsOpen(false)} 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[250]" 
            />
            <motion.aside
              initial={{ x: lang === 'AR' ? -600 : 600 }}
              animate={{ x: 0 }}
              exit={{ x: lang === 'AR' ? -600 : 600 }}
              className={`fixed top-0 ${lang === 'AR' ? 'left-0' : 'right-0'} w-full sm:w-[450px] h-full ${theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-white'} z-[260] shadow-4xl flex flex-col border-white/10 ${lang === 'AR' ? 'border-r' : 'border-l'}`}
              dir={lang === 'AR' ? 'rtl' : 'ltr'}
            >
              <div className="p-8 pb-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-accent-pink/10 text-accent-pink rounded-2xl">
                      <Bell size={24} />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tight">{t('NOTIFICATIONS')}</h3>
                </div>
                <button onClick={() => setIsNotificationsOpen(false)} className="p-3 bg-black/5 dark:bg-white/5 rounded-full hover:rotate-90 transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-4">
                {notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 italic">
                    <p>{lang === 'AR' ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <motion.div 
                      key={notif.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-6 rounded-[32px] glass border transition-all ${notif.read ? 'bg-black/5 dark:bg-white/5 border-transparent' : 'bg-accent-pink/5 border-accent-pink/20 shadow-lg'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-black text-[10px] uppercase tracking-wider text-accent-pink">{getL(notif.title, lang)}</h4>
                        <span className="text-[9px] opacity-40 font-bold uppercase">{notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString(lang === 'AR' ? 'ar-EG' : 'en-US') : ''}</span>
                      </div>
                      <p className="text-xs font-medium leading-relaxed opacity-80 mb-4">{getL(notif.message, lang)}</p>
                      <div className="flex gap-2">
                        {!notif.read && (
                          <button 
                            onClick={() => updateDoc(doc(db, 'notifications', notif.id), { read: true })}
                            className="text-[9px] font-black uppercase tracking-widest text-accent-pink bg-accent-pink/10 px-4 py-2 rounded-full hover:bg-accent-pink/20 transition-all"
                          >
                            {t('MARK_READ')}
                          </button>
                        )}
                        <button 
                          onClick={() => deleteDoc(doc(db, 'notifications', notif.id))}
                          className="text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all"
                        >
                          {lang === 'AR' ? 'حذف' : 'Delete'}
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.aside>
          </>
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
                         key={item.variantId ? `${item.id}-${item.variantId}` : item.id} 
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
                                 {item.variantName && <p className="text-[10px] font-bold text-accent-pink uppercase tracking-widest mb-1">{getL(item.variantName)}</p>}
                                 <p className="text-xs opacity-50 font-medium uppercase tracking-widest">{lang === 'AR' ? 'سعر الوحدة' : 'Unit Price'}: {item.price} {t('EGP')}</p>
                              </div>
                              <button 
                                onClick={() => removeFromCart(item.id, item.variantId)} 
                                className="p-2 text-red-500/20 hover:text-red-500 hover:bg-red-500/5 rounded-full transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                           </div>
                           
                           <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center bg-black/10 dark:bg-white/10 rounded-xl p-1">
                                <button 
                                  onClick={() => updateCartQuantity(item.id, -1, item.variantId)} 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors font-bold"
                                >-</button>
                                <span className="text-sm font-black w-8 text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => updateCartQuantity(item.id, 1, item.variantId)} 
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
                    {/* Coupon Section */}
                    <div className="mb-8 p-6 rounded-[32px] glass bg-white/5 border border-white/10 space-y-4">
                       <p className="text-[10px] font-black uppercase tracking-[3px] opacity-40">{t('COUPON')}</p>
                       {!appliedCoupon ? (
                         <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder={lang === 'AR' ? 'كود الخصم...' : 'Discount code...'} 
                              value={couponCodeInput}
                              onChange={e => setCouponCodeInput(e.target.value)}
                              className="flex-1 glass-input !bg-black/40 !text-white !p-4"
                            />
                            <button 
                              onClick={() => handleApplyCoupon(couponCodeInput)}
                              className="px-6 rounded-2xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all"
                            >
                               {t('APPLY')}
                            </button>
                         </div>
                       ) : (
                         <div className="flex items-center justify-between bg-accent-green/10 p-4 rounded-2xl border border-accent-green/20">
                            <div className="flex items-center gap-3 text-accent-green">
                               <Tag size={16} />
                               <span className="text-xs font-black uppercase tracking-widest">{appliedCoupon.code}</span>
                            </div>
                            <button onClick={() => setAppliedCoupon(null)} className="text-accent-pink hover:scale-110 transition-all"><X size={14} /></button>
                         </div>
                       )}
                    </div>
                   <div className="space-y-4 mb-8">
                     <div className="flex justify-between items-center opacity-60">
                        <span className="text-sm font-black uppercase tracking-widest">{t('SUBTOTAL')}</span>
                        <span className="font-bold">{cartTotal.toLocaleString()} {t('EGP')}</span>
                     </div>
                     {appliedCoupon && (
                       <div className="flex justify-between items-center text-accent-green mb-2 px-1">
                          <span className="text-sm font-black uppercase tracking-widest">{t('DISCOUNT')}</span>
                          <span className="font-bold">
                            -{(appliedCoupon.type === 'percentage' ? (cartTotal * appliedCoupon.value / 100) : appliedCoupon.value).toLocaleString()} {t('EGP')}
                          </span>
                       </div>
                     )}
                     <div className="flex justify-between items-center text-2xl font-black">
                        <span className="uppercase tracking-widest leading-none translate-y-1">{t('TOTAL')}</span>
                        <span className="text-accent-pink">{(cartTotal - (appliedCoupon ? (appliedCoupon.type === 'percentage' ? (cartTotal * appliedCoupon.value / 100) : appliedCoupon.value) : 0)).toLocaleString()} <span className="text-sm font-black opacity-50 ml-2">{t('EGP')}</span></span>
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

                   <div className="space-y-8">
                       <div className="flex items-center gap-4">
                          <div className="flex-1 h-px bg-current opacity-10" />
                          <span className="text-[10px] font-black uppercase tracking-[4px] opacity-40">{t('COUPON')}</span>
                          <div className="flex-1 h-px bg-current opacity-10" />
                       </div>
                       
                       <div className="glass p-6 rounded-[32px] bg-white/5 border border-white/10 space-y-4">
                          {!appliedCoupon ? (
                            <div className="flex gap-2">
                               <input 
                                 type="text" 
                                 placeholder={lang === 'AR' ? 'كود الخصم...' : 'Discount code...'} 
                                 value={couponCodeInput}
                                 onChange={e => setCouponCodeInput(e.target.value)}
                                 className="flex-1 glass-input !bg-black/20 !text-white !p-4"
                               />
                               <button 
                                 onClick={() => handleApplyCoupon(couponCodeInput)}
                                 className="px-6 rounded-2xl bg-accent-pink text-white font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all"
                               >
                                  {t('APPLY')}
                               </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-accent-green/10 p-4 rounded-2xl border border-accent-green/20">
                               <div className="flex items-center gap-3 text-accent-green">
                                  <Tag size={16} />
                                  <span className="text-xs font-black uppercase tracking-widest">{appliedCoupon.code}</span>
                               </div>
                               <button onClick={() => setAppliedCoupon(null)} className="text-accent-pink hover:scale-110 transition-all"><X size={14} /></button>
                            </div>
                          )}
                       </div>
                   </div>

                   <div className="pt-12 border-t border-black/10 dark:border-white/10">
                      <div className="flex justify-between items-center mb-4 opacity-50 font-bold uppercase tracking-widest text-xs">
                         <span>{lang === 'AR' ? 'سعر المنتجات' : 'Subtotal'}</span>
                         <span>{cartTotal.toLocaleString()} {t('EGP')}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between items-center mb-4 text-accent-green font-bold uppercase tracking-widest text-xs">
                           <span>{t('DISCOUNT')}</span>
                           <span>-{(appliedCoupon.type === 'percentage' ? (cartTotal * appliedCoupon.value / 100) : appliedCoupon.value).toLocaleString()} {t('EGP')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-8 font-bold uppercase tracking-widest text-xs">
                         <span className="opacity-50">{lang === 'AR' ? 'التوصيل' : 'Shipping'}</span>
                         <span className="text-accent-pink">{settings.shippingFee} {t('EGP')}</span>
                      </div>
                      <div className="flex justify-between items-end mb-12">
                         <span className="text-2xl font-black uppercase tracking-[4px]">{t('TOTAL')}</span>
                         <div className="text-right">
                            <span className="text-5xl font-black text-accent-pink">
                               {(cartTotal - (appliedCoupon ? (appliedCoupon.type === 'percentage' ? (cartTotal * appliedCoupon.value / 100) : appliedCoupon.value) : 0) + settings.shippingFee).toLocaleString()}
                            </span>
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

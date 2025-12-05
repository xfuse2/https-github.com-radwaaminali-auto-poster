
import React, { useState, useEffect, useRef } from 'react';
import { generateAIContent, publishPost, schedulePost, deletePost, updatePost } from './services/facebookService';

// ==========================================
// تعريف الثوابت
// ==========================================
const FACEBOOK_PAGE_ID = '870967939438361'; // تم تحديث رقم الصفحة
const DEFAULT_ACCESS_TOKEN = 'EAARotWwKo7ABQK1c68BLk6TugchWsbRcbZC0jIMCv2jXewgnJoz6ZC9qm4wbwcWX3Ly6w2moPtOkd1iZAH3Qp1ws0KEXuOn3ErZAb5sBsN2sx5bbz1rZC2UwAoMlkCCBd0EQZB5vUD5jyH6JZANgevcATn6i52lv67Lr9QP5j4q9ZBSlLSaHZC2a78q8K9gGo15MtSAXLNtSsQtEdKDw7d0IrFsZAneuvgH9s0Ko9sHqzYQkdosvmyoyJEJV4GAB5aXZAu9k3MKMAZA2ZADwC5b5lKB2fzKLe0QZDZD';

// --- قاموس الترجمة (عربي / إنجليزي) ---
const TRANSLATIONS = {
  ar: {
    appTitle: "الناشر الآلي", pro: "برو", connected: "متصل بـ:", selectPlatforms: "اختر المنصات للنشر:",
    editorTitle: "✨ محرر المنشور", aiButton: "مساعد الذكاء الاصطناعي", aiThinking: "جاري التفكير...",
    placeholder: "اكتب فكرة البوست هنا...", uploadClick: "اضغط لرفع صورة أو فيديو",
    uploadFormat: "JPG, PNG, MP4 حتى 100 ميجا", publishButton: "نشر الآن",
    scheduleButton: "📅 جدولة المنشور", scheduling: "جاري الجدولة...", publishing: "جاري النشر...",
    manageTitle: "🛠️ إدارة المنشورات", deleteBtn: "حذف", editBtn: "تعديل", saveBtn: "حفظ التعديلات",
    postIdPlaceholder: "أدخل رقم المنشور (Post ID)...", previewTitle: "معاينة مباشرة",
    now: "الآن", likes: "45", comments: "5 تعليقات", share: "مشاركة", like: "أعجبني", comment: "تعليق",
    errorSelect: "⚠️ اختر منصة واحدة على الأقل!", errorEmpty: "⚠️ المحتوى فارغ!",
    success: "✅ تم النشر بنجاح!", successSchedule: "⏰ تم جدولة المنشور بنجاح!",
    pickTime: "اختر وقت النشر (اختياري):",
    settings: "الإعدادات", dashboard: "لوحة التحكم",
    integrations: "الحسابات المرتبطة", preferences: "التفضيلات",
    connectedStatus: "متصل ✅", disconnectedStatus: "غير متصل ❌",
    connectBtn: "ربط الحساب", disconnectBtn: "إلغاء الربط",
    darkMode: "الوضع الليلي", language: "اللغة", aiSuccess: "✨ تم توليد المحتوى!",
    deleteConfirm: "هل أنت متأكد من الحذف؟", deleted: "🗑️ تم الحذف!", updated: "✏️ تم التعديل!",
    accessTokenLabel: "رمز الوصول (Facebook Access Token)",
    accessTokenPlaceholder: "الصق التوكن الجديد هنا..."
  },
  en: {
    appTitle: "AutoPoster", pro: "Pro", connected: "Connected:", selectPlatforms: "Select Platforms:",
    editorTitle: "✨ Post Editor", aiButton: "AI Assistant", aiThinking: "Thinking...",
    placeholder: "Write post idea...", uploadClick: "Click to upload Image/Video",
    uploadFormat: "JPG, PNG, MP4 up to 100MB", publishButton: "Publish Now",
    scheduleButton: "📅 Schedule Post", scheduling: "Scheduling...", publishing: "Publishing...",
    manageTitle: "🛠️ Manage Posts", deleteBtn: "Delete", editBtn: "Edit", saveBtn: "Save Changes",
    postIdPlaceholder: "Enter Post ID...", previewTitle: "Live Preview",
    now: "Now", likes: "45", comments: "5 Comments", share: "Share", like: "Like", comment: "Comment",
    errorSelect: "⚠️ Select at least one platform!", errorEmpty: "⚠️ Content is empty!",
    success: "✅ Published Successfully!", successSchedule: "⏰ Post Scheduled!",
    pickTime: "Pick a time (Optional):",
    settings: "Settings", dashboard: "Dashboard",
    integrations: "Connected Accounts", preferences: "Preferences",
    connectedStatus: "Connected ✅", disconnectedStatus: "Disconnected ❌",
    connectBtn: "Connect", disconnectBtn: "Disconnect",
    darkMode: "Dark Mode", language: "Language", aiSuccess: "✨ Content Generated!",
    deleteConfirm: "Are you sure you want to delete?", deleted: "🗑️ Deleted!", updated: "✏️ Updated!",
    accessTokenLabel: "Facebook Access Token",
    accessTokenPlaceholder: "Paste new token here..."
  }
};

const EMOJI_LIST = ['👍', '❤️', '😂', '🔥', '😍', '🚀', '✅', '🎥', '✨'];

// --- الأيقونات (SVG Components) ---
const Icons = {
  Facebook: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  Instagram: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
  Twitter: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  TikTok: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.65-1.58-1.11-.25-.24-.48-.5-.72-.75.03 2.12.03 4.24.03 6.36 0 1.67-.16 3.39-.92 4.93-.97 1.95-2.74 3.42-4.86 3.91-4.22.99-8.49-1.35-9.45-5.32C.23 14.97.74 12.8 1.9 11.05c1.1-1.65 2.85-2.77 4.81-3.04.49-.07.98-.07 1.47-.07v4.51c-.48.01-1.02.1-1.45.39-.78.53-1.11 1.55-.95 2.45.2 1.17 1.25 1.99 2.44 1.91 1.2-.08 2.18-1.09 2.18-2.31.01-4.23.01-8.46 0-12.69-1.72-.1-3.41-.01-5.1.01V2.05c2.37-.01 4.74.02 7.11 0 .04-.67.07-1.35.11-2.03z"/></svg>,
  Image: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>,
  Video: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>,
  Send: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>,
  Magic: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>,
  Trash: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
  Edit: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>,
  Sun: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>,
  Moon: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>,
  Globe: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>,
  Gear: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>,
  Home: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
};

// ==========================================
// مكون صفحة الإعدادات (SettingsView)
// ==========================================
function SettingsView({ t, setView, lang, setLang, darkMode, setDarkMode, accessToken, setAccessToken }: any) {
  // حالة افتراضية لتجربة زر الربط
  const [accounts, setAccounts] = useState({ facebook: true, instagram: false, twitter: false, tiktok: false });
  const toggleAccount = (acc: string) => setAccounts((prev: any) => ({...prev, [acc]: !prev[acc]}));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-6">
            <button onClick={() => setView('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-white"><Icons.Home /></button>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('settings')}</h2>
        </div>

        {/* التفضيلات */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b dark:border-slate-700 pb-2">{t('preferences')}</h3>
            <div className="flex flex-col gap-4">
                 {/* Access Token Input */}
                <div className="flex flex-col gap-2">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{t('accessTokenLabel')}</span>
                    <input 
                        type="text" 
                        value={accessToken} 
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder={t('accessTokenPlaceholder')}
                        className="p-3 rounded-lg border dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white text-sm font-mono break-all focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-xs text-slate-500">
                        {lang === 'ar' ? 'تنبيه: تأكد من اختيار "User or Page" -> "Your Page" عند توليد التوكن.' : 'Note: Ensure you select "User or Page" -> "Your Page" when generating the token.'}
                    </p>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{t('language')}</span>
                    <div className="flex gap-2">
                        <button onClick={() => setLang('ar')} className={`px-4 py-2 rounded-lg text-sm font-bold border ${lang === 'ar' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>العربية</button>
                        <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-lg text-sm font-bold border ${lang === 'en' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>English</button>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{t('darkMode')}</span>
                    <button onClick={() => setDarkMode(!darkMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>
        </div>

        {/* الحسابات */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b dark:border-slate-700 pb-2">{t('integrations')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['facebook', 'instagram', 'twitter', 'tiktok'].map(p => (
                    <div key={p} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${p === 'facebook' ? 'bg-blue-100 text-blue-600' : p === 'instagram' ? 'bg-pink-100 text-pink-600' : 'bg-slate-200 text-slate-600'}`}>
                                {p === 'facebook' && <Icons.Facebook />} {p === 'instagram' && <Icons.Instagram />} {p === 'twitter' && <Icons.Twitter />} {p === 'tiktok' && <Icons.TikTok />}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white capitalize">{p}</h4>
                                <span className={`text-xs ${accounts[p] ? 'text-green-600' : 'text-red-500'}`}>
                                    {accounts[p] ? t('connectedStatus') : t('disconnectedStatus')}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => toggleAccount(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${accounts[p] ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                            {accounts[p] ? t('disconnectBtn') : t('connectBtn')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}

// ==========================================
// التطبيق الرئيسي
// ==========================================
export default function App() {
  // --- States ---
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; msg: string }>({ type: '', msg: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings & Navigation
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState<'home' | 'settings'>('home'); // للتبديل بين الصفحات
  const t = (key: keyof typeof TRANSLATIONS['ar']) => TRANSLATIONS[lang][key];

  // Access Token Management
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem('fb_access_token') || DEFAULT_ACCESS_TOKEN;
  });

  // Save token when changed
  useEffect(() => {
    localStorage.setItem('fb_access_token', accessToken);
  }, [accessToken]);

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [scheduledTime, setScheduledTime] = useState('');
  const [lastPostId, setLastPostId] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  // --- Effects ---
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', hour: 'numeric', minute: 'numeric' }));
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl, lang]);

  // تفعيل الوضع الليلي على مستوى الصفحة
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // --- Functions ---
  const togglePlatform = (platform: string) => { setSelectedPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setSelectedFile(file); setFileType(file.type.startsWith('video/') ? 'video' : 'image'); setPreviewUrl(URL.createObjectURL(file)); } };
  const clearFile = () => { setSelectedFile(null); setFileType(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const handleAiGenerate = async () => {
    if (!message.trim()) return setStatus({ type: 'error', msg: t('placeholder') });
    setIsGenerating(true); setStatus({ type: '', msg: t('aiThinking') });
    try {
        const text = await generateAIContent(message);
        if (text) {
            setMessage(text);
            setStatus({ type: 'success', msg: t('aiSuccess') });
        } else {
            throw new Error('AI Generation Failed');
        }
    } catch (err) { 
        setStatus({ type: 'error', msg: 'AI Error' }); 
    } finally { 
        setIsGenerating(false); 
    }
  };

  const handlePublish = async () => {
    if (!message.trim() && !selectedFile) return setStatus({ type: 'error', msg: t('errorEmpty') });
    if (selectedPlatforms.length === 0) return setStatus({ type: 'error', msg: t('errorSelect') });

    setIsLoading(true);
    setStatus({ type: '', msg: scheduledTime ? t('scheduling') : t('publishing') });

    try {
      if (scheduledTime) {
         // Note: scheduledPost logic usually requires server-side storage, here we use Supabase directly.
         await schedulePost(message, selectedFile, selectedPlatforms, scheduledTime);
         setStatus({ type: 'success', msg: t('successSchedule') });
         setMessage(''); clearFile(); setScheduledTime('');
      } else {
         // Pass the custom accessToken
         const res = await publishPost(message, selectedFile, selectedPlatforms, undefined, accessToken);
         
         let successMsg = t('success');
         if (res.twitterId) {
             successMsg += `\n🐦 Tweet ID: ${res.twitterId}`;
         }
         
         setStatus({ type: 'success', msg: successMsg });
         if (res.id && !res.id.startsWith('mock_')) setLastPostId(res.id);
         setMessage(''); clearFile(); setScheduledTime('');
      }
    } catch (err: any) { setStatus({ type: 'error', msg: err.message }); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async () => { if(!lastPostId || !confirm(t('deleteConfirm'))) return; setIsLoading(true); try { await deletePost(lastPostId, accessToken); setStatus({ type: 'success', msg: t('deleted') }); setLastPostId(''); } catch(err: any) { setStatus({ type: 'error', msg: err.message }); } finally { setIsLoading(false); } };
  const handleUpdate = async () => { if(!lastPostId || !editMessage) return; setIsLoading(true); try { await updatePost(lastPostId, editMessage, accessToken); setStatus({ type: 'success', msg: t('updated') }); setEditMode(false); } catch(err: any) { setStatus({ type: 'error', msg: err.message }); } finally { setIsLoading(false); } };

  // --- Render ---
  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Navbar */}
        <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
                  <h1 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">{t('appTitle')} <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs px-2 py-1 rounded">{t('pro')}</span></h1>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setView('home')} className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 ${view === 'home' ? 'text-blue-600' : 'text-slate-500'}`} title={t('dashboard')}><Icons.Home /></button>
                <button onClick={() => setView('settings')} className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 ${view === 'settings' ? 'text-blue-600' : 'text-slate-500'}`} title={t('settings')}><Icons.Gear /></button>
              </div>
          </div>
        </nav>

        <main className="py-8">
            {view === 'home' ? (
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                    {/* Editor Side */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                            <div className="mb-6"><h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 mb-3">{t('selectPlatforms')}</h3><div className="flex gap-3 flex-wrap">{['facebook', 'instagram', 'twitter', 'tiktok'].map(p => (<button key={p} onClick={() => togglePlatform(p)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold border transition-all ${selectedPlatforms.includes(p) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-300 border-gray-200 dark:border-slate-600'}`}><span className="capitalize">{p}</span></button>))}</div></div>
                            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('editorTitle')}</h2><button onClick={handleAiGenerate} disabled={isGenerating} className="text-sm px-4 py-2 rounded-lg font-bold flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90">{isGenerating ? t('aiThinking') : <><Icons.Magic /> {t('aiButton')}</>}</button></div>
                            <div className="relative mb-4 z-10"><textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 dark:text-white placeholder-slate-400" placeholder={t('placeholder')} /><button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute bottom-3 left-3 text-2xl hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-1 transition-colors">😊</button>{showEmojiPicker && (<div className="absolute bottom-14 left-0 bg-white dark:bg-slate-700 shadow-2xl p-3 grid grid-cols-5 w-64 z-50 rounded-xl border dark:border-slate-600">{EMOJI_LIST.map(e => <button key={e} onClick={() => {setMessage(prev=>prev+e);setShowEmojiPicker(false)}} className="text-2xl hover:bg-slate-100 dark:hover:bg-slate-600 p-1 rounded">{e}</button>)}<button onClick={() => setShowEmojiPicker(false)} className="col-span-5 text-red-500 font-bold mt-2 text-xs">Close</button></div>)}</div>
                            <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${selectedFile ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />{selectedFile ? <div className="text-green-600 dark:text-green-400 font-bold">{selectedFile.name} <span onClick={(e)=>{e.stopPropagation();clearFile()}} className="cursor-pointer ml-2">❌</span></div> : <div className="text-slate-500 dark:text-slate-400"><p className="font-bold">{t('uploadClick')}</p></div>}</div>
                            <div className="mt-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-600 flex items-center justify-between"><label className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2"><Icons.Calendar /> {t('pickTime')}</label><input type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="p-2 rounded-lg border dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"/></div>
                            <div className="mt-4 flex justify-end"><button onClick={handlePublish} disabled={isLoading} className={`px-8 py-3 rounded-xl font-bold text-white flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg ${scheduledTime ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{isLoading ? (scheduledTime ? t('scheduling') : t('publishing')) : (scheduledTime ? <>{t('scheduleButton')} 🕒</> : <><Icons.Send /> {t('publishButton')}</>)}</button></div>
                        </div>
                        {/* Manage Section */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border p-6 border-t-4 border-t-orange-400 dark:border-slate-700 transition-colors"><h3 className="font-bold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">{t('manageTitle')}</h3><div className="flex gap-2 mb-4"><input type="text" value={lastPostId} onChange={(e) => setLastPostId(e.target.value)} placeholder={t('postIdPlaceholder')} className="flex-1 p-2 border dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 dark:text-white text-sm font-mono"/></div><div className="flex gap-3"><button onClick={handleDelete} className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 py-2 rounded-lg font-bold hover:bg-red-100 dark:hover:bg-red-900/40 flex justify-center gap-2"><Icons.Trash /> {t('deleteBtn')}</button><button onClick={() => { setEditMode(!editMode); if(!editMessage) setEditMessage(message); }} className="flex-1 bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-600 py-2 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-slate-600 flex justify-center gap-2"><Icons.Edit /> {t('editBtn')}</button></div>{editMode && (<div className="mt-4 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl animate-fade-in"><textarea value={editMessage} onChange={(e) => setEditMessage(e.target.value)} className="w-full h-20 p-2 border dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white rounded-lg mb-2 outline-none"></textarea><button onClick={handleUpdate} className="w-full bg-orange-500 text-white py-2 rounded-lg font-bold hover:bg-orange-600">{t('saveBtn')}</button></div>)}</div>
                        {status.msg && <div className={`p-4 rounded-xl text-center font-bold whitespace-pre-wrap ${status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{status.msg}</div>}
                    </div>
                    {/* Preview Side */}
                    <div className="lg:col-span-5 flex justify-center"><div className="w-[320px] h-[600px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 overflow-hidden relative shadow-2xl"><div className="w-full h-full bg-[#f0f2f5] pt-8 overflow-y-auto no-scrollbar"><div className="bg-white px-4 py-3 border-b flex justify-between items-center sticky top-0 z-10"><h1 className="text-2xl font-bold text-[#1877F2]">facebook</h1><div className="flex gap-3 text-slate-600">🔍⚡</div></div><div className="bg-white mt-2 pb-2"><div className="p-3 flex gap-2 items-center mb-2"><div className="w-10 h-10 rounded-full bg-blue-500"></div><div><div className="font-bold text-xs text-slate-900">Your Page</div><div className="text-[10px] text-gray-500">{t('now')} · <Icons.Globe /></div></div></div><div className="px-3 pb-2 text-sm text-slate-900 whitespace-pre-wrap" dir={lang === 'ar' ? 'rtl' : 'ltr'}>{message || '...'}</div>{previewUrl && (fileType==='video' ? <video src={previewUrl} className="w-full" controls/> : <img src={previewUrl} className="w-full" />)}<div className="px-3 py-2 flex justify-between items-center border-b border-slate-100 text-xs text-slate-500"><div className="flex items-center gap-1">👍 {t('likes')}</div><div>{t('comments')}</div></div><div className="flex justify-around pt-2 text-slate-500 font-medium text-sm"><button>{t('like')}</button><button>{t('comment')}</button><button>{t('share')}</button></div></div></div></div></div>
                </div>
            ) : (
                <SettingsView 
                    t={t} 
                    setView={setView} 
                    lang={lang} 
                    setLang={setLang} 
                    darkMode={darkMode} 
                    setDarkMode={setDarkMode}
                    accessToken={accessToken}
                    setAccessToken={setAccessToken}
                />
            )}
        </main>
      </div>
    </div>
  );
}
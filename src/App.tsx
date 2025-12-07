import React, { useState, useEffect, useRef } from 'react';
// تم استيراد generateAIImage الآن من facebookService
import { 
  generateAIContent, 
  publishPost, 
  schedulePost, 
  deletePost, 
  updatePost, 
  generateAIImage, 
  delay,
  fetchPosts 
} from './services/facebookService';

// ==========================================
// تعريف الثوابت
// ==========================================
const FACEBOOK_PAGE_ID = '814051691800923'; 
const DEFAULT_ACCESS_TOKEN = 'EAARotWwKo7ABQONHXF8ZCgqRJFk2LeZATKLccExZCSons2ZALlBlyZCWefXEuB8m2OOkUVgfZCLZB0mn1SoVLDsXkZCqgtAMGrGuOq6FATxZCLZCFRUo2mp51gX1VJRvqTTYWF3jXxJgzXxDqWHTOnMJbfLcDZCp68nzcoKb8n9vgW5U8S5D5BXru0sg3WJ2CLa71JXqqAErZAMwPxm2ZCmX3mPIWTaEcl9a9PnzBhQwjj1AZD';

const MAX_FILES = 10;

// نوع بيانات البوست من Supabase
type PostRecord = {
  id?: number;
  facebook_id?: string | null;
  content: string;
  media_url?: string | null;
  media_type?: string | null;
  status: string;
  platforms: string[] | null;
  scheduled_at?: string | null;
  created_at?: string | null;
};

// --- قاموس الترجمة (عربي / إنجليزي) ---
const TRANSLATIONS = {
  ar: {
    appTitle: "الناشر الآلي", pro: "PRO", connected: "متصل بـ:", selectPlatforms: "أين تريد النشر اليوم؟",
    editorTitle: "محرر المحتوى", aiButton: "الكتابة السحرية", aiThinking: "جاري الإبداع...",
    placeholder: "اكتب شيئاً ملهماً لجمهورك...", uploadClick: "رفع وسائط",
    uploadFormat: "صور أو فيديو عالي الدقة (حتى 10 ملفات)", publishButton: "نشر المحتوى",
    scheduleButton: "جدولة لوقت لاحق", scheduling: "جاري الحفظ...", publishing: "جاري الإطلاق...",
    manageTitle: "أرشيف المنشورات", deleteBtn: "حذف", editBtn: "تعديل", saveBtn: "حفظ",
    postIdPlaceholder: "ID المنشور", previewTitle: "معاينة حية",
    now: "الآن", likes: "1.2K", comments: "243 تعليق", share: "مشاركة", like: "أعجبني", comment: "تعليق",
    errorSelect: "برجاء تحديد منصة واحدة على الأقل", errorEmpty: "لا يمكن نشر فراغ، اكتب شيئاً!",
    success: "تم النشر بنجاح! 🚀", successSchedule: "تمت الجدولة بنجاح 📅",
    pickTime: "توقيت النشر",
    settings: "الإعدادات", dashboard: "الرئيسية",
    integrations: "المنصات المتصلة", preferences: "تخصيص الواجهة",
    connectedStatus: "متصل", disconnectedStatus: "غير متصل",
    connectBtn: "ربط", disconnectBtn: "فصل",
    darkMode: "المظهر الداكن", language: "لغة الواجهة", aiSuccess: "تم توليد النص بنجاح ✨",
    aiImageButton: "توليد صورة", 
    deleteConfirm: "هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟", deleted: "تم حذف المنشور", updated: "تم تحديث المنشور",
    accessTokenLabel: "رمز الوصول (Access Token)",
    accessTokenPlaceholder: "أدخل الرمز هنا...",
    selectAll: "تحديد الكل", deselectAll: "إلغاء التحديد",
    timeline: "الخط الزمني",
    allStatus: "الكل",
    scheduledFilter: "المجدولة",
    publishedFilter: "المنشورة",
    noPosts: "لا توجد منشورات في الأرشيف بعد.",
    refreshArchive: "تحديث الأرشيف",

    // Dashboard
    dashboardSubtitle: "نظرة سريعة على أداء النشر والحملات",
    postsThisWeek: "منشورات هذا الأسبوع",
    totalPosts: "إجمالي المنشورات",
    totalScheduled: "منشورات مجدولة",
    mostUsedPlatform: "أكثر منصة استخداماً",
    latestScheduled: "أقرب منشورات مجدولة",
    latestPosts: "أحدث المنشورات",
    createNewPost: "إنشاء منشور جديد",
    postsLastDays: "النشر على مدار الأيام الأخيرة",
    noDashboardData: "لا توجد بيانات كافية بعد، ابدأ بنشر أول منشور لتحصل على إحصائيات هنا.",
    todayFilter: "اليوم",
    weekFilter: "هذا الأسبوع",
    monthFilter: "هذا الشهر",
    platformFacebook: "فيسبوك",
    platformInstagram: "إنستجرام",
    platformTwitter: "تويتر",
    platformTikTok: "تيك توك"
  },
  en: {
    appTitle: "AutoPoster", pro: "PRO", connected: "Connected:", selectPlatforms: "Where to publish today?",
    editorTitle: "Content Editor", aiButton: "Magic Write", aiThinking: "Creating...",
    placeholder: "Write something inspiring...", uploadClick: "Upload Media",
    uploadFormat: "High Quality Photo or Video (up to 10 files)", publishButton: "Launch Post",
    scheduleButton: "Schedule for later", scheduling: "Saving...", publishing: "Launching...",
    manageTitle: "Post Archive", deleteBtn: "Delete", editBtn: "Edit", saveBtn: "Save",
    postIdPlaceholder: "Post ID", previewTitle: "Live Preview",
    now: "Just now", likes: "1.2K", comments: "243 Comments", share: "Share", like: "Like", comment: "Comment",
    errorSelect: "Please select at least one platform", errorEmpty: "Content cannot be empty!",
    success: "Published Successfully! 🚀", successSchedule: "Scheduled Successfully 📅",
    pickTime: "Schedule Time",
    settings: "Settings", dashboard: "Dashboard",
    integrations: "Connected Platforms", preferences: "Interface",
    connectedStatus: "Active", disconnectedStatus: "Inactive",
    connectBtn: "Connect", disconnectBtn: "Disconnect",
    darkMode: "Dark Mode", language: "Language", aiSuccess: "Content Generated ✨",
    aiImageButton: "Generate Image", 
    deleteConfirm: "This action is irreversible. Are you sure?", deleted: "Post Deleted", updated: "Post Updated",
    accessTokenLabel: "Access Token",
    accessTokenPlaceholder: "Paste token here...",
    selectAll: "Select All", deselectAll: "Deselect All",
    timeline: "Timeline",
    allStatus: "All",
    scheduledFilter: "Scheduled",
    publishedFilter: "Published",
    noPosts: "No posts in archive yet.",
    refreshArchive: "Refresh Archive",

    // Dashboard
    dashboardSubtitle: "Quick overview of your posting performance",
    postsThisWeek: "Posts this week",
    totalPosts: "Total posts",
    totalScheduled: "Scheduled posts",
    mostUsedPlatform: "Most used platform",
    latestScheduled: "Upcoming scheduled posts",
    latestPosts: "Latest posts",
    createNewPost: "Create new post",
    postsLastDays: "Posting activity (recent days)",
    noDashboardData: "Not enough data yet. Publish your first post to see stats here.",
    todayFilter: "Today",
    weekFilter: "This week",
    monthFilter: "This month",
    platformFacebook: "Facebook",
    platformInstagram: "Instagram",
    platformTwitter: "Twitter / X",
    platformTikTok: "TikTok"
  }
};

const EMOJI_LIST = ['🔥', '✨', '🚀', '💡', '❤️', '😂', '✅', '📣', '👋', '🌟'];

// --- الأيقونات (SVG Components) ---
const Icons = {
  Facebook: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  Instagram: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zM18.406 5.155c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
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
  Home: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>,
  Upload: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>,
  Heart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>,
  Comment: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>,
  Share: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>,
  Bookmark: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>,
  Retweet: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>,
  Chart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>,
};

// ==========================================
// Settings View
// ==========================================
function SettingsView({ t, setView, lang, setLang, darkMode, setDarkMode, accessToken, setAccessToken, connectionStatus, setConnectionStatus, setStatus }: any) {
  const toggleAccount = (platform: string) => { 
    const isConnected = connectionStatus[platform];
    
    if (isConnected) {
        setConnectionStatus((p: any) => ({ ...p, [platform]: false }));
        setStatus({ type: 'success', msg: `تم فصل حساب ${platform.toUpperCase()} بنجاح! 💔` });
    } else {
        setStatus({ type: '', msg: `جاري ربط حساب ${platform.toUpperCase()}...` });
        setTimeout(() => {
            setConnectionStatus((p: any) => ({ ...p, [platform]: true }));
            setStatus({ type: 'success', msg: `تم ربط حساب ${platform.toUpperCase()} بنجاح! ✅` });
        }, 1000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('home')} className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-white transition-all"><Icons.Home /></button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white brand-font">{t('settings')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">إدارة حساباتك وتفضيلات التطبيق</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* التفضيلات */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/20 dark:border-slate-700 p-8 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Icons.Gear /> {t('preferences')}</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('accessTokenLabel')}</label>
            <input 
              type="text" 
              value={accessToken} 
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={t('accessTokenPlaceholder')}
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white text-xs font-mono break-all focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
            <span className="text-slate-700 dark:text-slate-300 font-medium">{t('language')}</span>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              <button onClick={() => setLang('ar')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${lang === 'ar' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>العربية</button>
              <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${lang === 'en' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>English</button>
            </div>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-slate-700 dark:text-slate-300 font-medium">{t('darkMode')}</span>
            <button onClick={() => setDarkMode(!darkMode)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${darkMode ? 'bg-blue-600' : 'bg-slate-200'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* الحسابات */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/20 dark:border-slate-700 p-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Icons.Globe /> {t('integrations')}</h3>
          <div className="space-y-3">
            {['facebook', 'instagram', 'twitter', 'tiktok'].map(p => (
              <div key={p} className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl transition-colors ${p === 'facebook' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' : p === 'instagram' ? 'bg-pink-50 text-pink-600 group-hover:bg-pink-100' : p === 'tiktok' ? 'bg-slate-100 text-black group-hover:bg-slate-200' : 'bg-sky-50 text-sky-500 group-hover:bg-sky-100'}`}>
                    {p === 'facebook' && <Icons.Facebook />} {p === 'instagram' && <Icons.Instagram />} {p === 'twitter' && <Icons.Twitter />} {p === 'tiktok' && <Icons.TikTok />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white capitalize">{p}</h4>
                    <span className={`text-xs font-medium flex items-center gap-1 ${connectionStatus[p] ? 'text-green-600' : 'text-slate-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${connectionStatus[p] ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                      {connectionStatus[p] ? t('connectedStatus') : t('disconnectedStatus')}
                    </span>
                  </div>
                </div>
                <button onClick={() => toggleAccount(p)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${connectionStatus[p] ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100' : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800'}`}>
                  {connectionStatus[p] ? t('disconnectBtn') : t('connectBtn')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Dashboard View (تاب رئيسية)
// ==========================================
function DashboardView({ t, posts, setView }: { t: (k: any) => string; posts: PostRecord[]; setView: (v: 'dashboard' | 'home' | 'settings') => void }) {
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('week');
  const [animatedWeek, setAnimatedWeek] = useState(0);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [animatedScheduled, setAnimatedScheduled] = useState(0);

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  const monthAgo = new Date(now);
  monthAgo.setDate(now.getDate() - 30);

  const postsThisWeek = posts.filter(p =>
    p.created_at && new Date(p.created_at) >= weekAgo
  ).length;

  const totalPosts = posts.length;
  const totalScheduled = posts.filter(p => p.status === 'scheduled').length;

  // أكثر منصة استخداماً
  const platformCounts: Record<string, number> = {};
  posts.forEach(p => {
    (p.platforms || []).forEach(pl => {
      platformCounts[pl] = (platformCounts[pl] || 0) + 1;
    });
  });
  const mostUsedPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'facebook';

  const platformLabel = (p: string) => {
    if (p === 'facebook') return t('platformFacebook');
    if (p === 'instagram') return t('platformInstagram');
    if (p === 'twitter') return t('platformTwitter');
    if (p === 'tiktok') return t('platformTikTok');
    return p;
  };

  const sortedByDate = [...posts].sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return db - da;
  });

  const latestScheduled = sortedByDate.filter(p => p.status === 'scheduled').slice(0, 2);
  const latestPosts = sortedByDate.slice(0, 5);

  // دالة أنيميشن بسيطة للأرقام
  useEffect(() => {
    const animate = (target: number, setter: (v: number) => void) => {
      setter(0);
      if (target === 0) return;
      const duration = 600;
      const stepMs = 30;
      const steps = Math.ceil(duration / stepMs);
      let current = 0;
      const increment = target / steps;
      const id = setInterval(() => {
        current += increment;
        if (current >= target) {
          setter(target);
          clearInterval(id);
        } else {
          setter(Math.round(current));
        }
      }, stepMs);
      return () => clearInterval(id);
    };

    const clear1 = animate(postsThisWeek, setAnimatedWeek);
    const clear2 = animate(totalPosts, setAnimatedTotal);
    const clear3 = animate(totalScheduled, setAnimatedScheduled);

    return () => {
      clear1 && clear1();
      clear2 && clear2();
      clear3 && clear3();
    };
  }, [postsThisWeek, totalPosts, totalScheduled]);

  // داتا بسيطة للشارت (عدد البوستات في آخر أيام)
  const activityBuckets: Record<string, number> = {};
  posts.forEach(p => {
    if (!p.created_at) return;
    const d = new Date(p.created_at);
    if (filter === 'today') {
      const sameDay = d.toDateString() === now.toDateString();
      if (!sameDay) return;
    } else if (filter === 'week' && d < weekAgo) {
      return;
    } else if (filter === 'month' && d < monthAgo) {
      return;
    }
    const key = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    activityBuckets[key] = (activityBuckets[key] || 0) + 1;
  });

  const chartData = Object.entries(activityBuckets)
    .sort((a, b) => {
      const [da, db] = [a[0], b[0]];
      // DD/MM
      const pa = da.split('/').reverse().join('-');
      const pb = db.split('/').reverse().join('-');
      return new Date(pa).getTime() - new Date(pb).getTime();
    });

  const maxBucket = chartData.reduce((m, [, v]) => Math.max(m, v), 1);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-50 brand-font flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Icons.Chart />
            </span>
            {t('dashboard')}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t('dashboardSubtitle')}
          </p>
        </div>
        <button
          onClick={() => setView('home')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all"
        >
          <Icons.Send />
          {t('createNewPost')}
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="mt-6 bg-slate-900/60 border border-slate-700 rounded-3xl p-8 text-center text-slate-300">
          <p className="mb-3 text-lg">📭 {t('noDashboardData')}</p>
          <button
            onClick={() => setView('home')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/30"
          >
            {t('createNewPost')}
          </button>
        </div>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/70 border border-slate-700 rounded-3xl p-5 flex flex-col justify-between">
              <div className="text-slate-400 text-xs mb-1">{t('postsThisWeek')}</div>
              <div className="text-4xl font-extrabold text-emerald-400">{animatedWeek}</div>
              <div className="mt-2 text-slate-500 text-xs">
                {t('postsLastDays')}
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-700 rounded-3xl p-5 flex flex-col justify-between">
              <div className="text-slate-400 text-xs mb-1">{t('totalPosts')}</div>
              <div className="text-4xl font-extrabold text-blue-400">{animatedTotal}</div>
              <div className="mt-2 text-slate-500 text-xs">
                {t('mostUsedPlatform')}: <span className="font-semibold text-slate-200">{platformLabel(mostUsedPlatform)}</span>
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-700 rounded-3xl p-5 flex flex-col justify-between">
              <div className="text-slate-400 text-xs mb-1">{t('totalScheduled')}</div>
              <div className="text-4xl font-extrabold text-amber-300">{animatedScheduled}</div>
              <div className="mt-2 text-slate-500 text-xs flex items-center gap-1">
                <Icons.Calendar /> {t('latestScheduled')}
              </div>
            </div>
          </div>

          {/* Middle row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Upcoming scheduled */}
            <div className="bg-slate-900/70 border border-slate-700 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="inline-flex w-7 h-7 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Icons.Calendar />
                  </span>
                  {t('latestScheduled')}
                </h3>
              </div>
              {latestScheduled.length === 0 ? (
                <p className="text-xs text-slate-500 mt-2">
                  {t('noPosts')}
                </p>
              ) : (
                latestScheduled.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-slate-800/80 border border-slate-700 px-4 py-3 text-xs text-slate-200 flex flex-col gap-1"
                  >
                    <span className="font-semibold truncate">
                      {(p.content || '').slice(0, 60)}{(p.content || '').length > 60 ? '…' : ''}
                    </span>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>
                        {p.scheduled_at
                          ? new Date(p.scheduled_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
                          : ''}
                      </span>
                      <span className="flex gap-1">
                        {(p.platforms || []).map(pl => (
                          <span key={pl} className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-slate-900">
                            {pl === 'facebook' && <Icons.Facebook />}
                            {pl === 'instagram' && <Icons.Instagram />}
                            {pl === 'twitter' && <Icons.Twitter />}
                            {pl === 'tiktok' && <Icons.TikTok />}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chart */}
            <div className="lg:col-span-2 bg-slate-900/70 border border-slate-700 rounded-3xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Icons.Chart /> {t('postsLastDays')}
                </h3>
                <div className="flex gap-1 text-[11px]">
                  <button
                    onClick={() => setFilter('today')}
                    className={`px-2 py-1 rounded-full border ${
                      filter === 'today'
                        ? 'bg-slate-100 text-slate-900 border-slate-100'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {t('todayFilter')}
                  </button>
                  <button
                    onClick={() => setFilter('week')}
                    className={`px-2 py-1 rounded-full border ${
                      filter === 'week'
                        ? 'bg-slate-100 text-slate-900 border-slate-100'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {t('weekFilter')}
                  </button>
                  <button
                    onClick={() => setFilter('month')}
                    className={`px-2 py-1 rounded-full border ${
                      filter === 'month'
                        ? 'bg-slate-100 text-slate-900 border-slate-100'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {t('monthFilter')}
                  </button>
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                  {t('noPosts')}
                </div>
              ) : (
                <div className="flex-1 flex items-end gap-2 h-40">
                  {chartData.map(([label, value]) => (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-blue-500 to-indigo-400"
                        style={{ height: `${(value / maxBucket) * 100}%` }}
                      />
                      <span className="text-[9px] text-slate-400">{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Latest posts list */}
          <div className="bg-slate-900/70 border border-slate-700 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Icons.Heart /> {t('latestPosts')}
              </h3>
            </div>
            <div className="space-y-2">
              {latestPosts.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-slate-800/70 border border-slate-700 rounded-2xl px-4 py-2 text-xs"
                >
                  <div className="flex-1 mr-2">
                    <div className="text-slate-100 font-semibold truncate">
                      {(p.content || '').slice(0, 90)}{(p.content || '').length > 90 ? '…' : ''}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {p.created_at &&
                        new Date(p.created_at).toLocaleString('ar-EG', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {(p.platforms || []).map(pl => (
                      <span
                        key={pl}
                        className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-slate-900 text-slate-100"
                      >
                        {pl === 'facebook' && <Icons.Facebook />}
                        {pl === 'instagram' && <Icons.Instagram />}
                        {pl === 'twitter' && <Icons.Twitter />}
                        {pl === 'tiktok' && <Icons.TikTok />}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ==========================================
// مكوّن المعاينة الخاص بكل منصة
// ==========================================
const PlatformPreview = ({ platform, message, previewUrl, fileType, t, lang, darkMode }: any) => {
  let logoText = platform;
  let logoColor = '';
  let bgColor = '';
  let screenStyles: React.CSSProperties = {}; 

  switch (platform) {
    case 'instagram':
      logoText = 'Instagram';
      logoColor = 'text-black dark:text-white';
      bgColor = 'bg-white dark:bg-black';
      screenStyles = { width: '340px', height: '640px' };
      break;
    case 'twitter':
      logoText = 'X';
      logoColor = 'text-black dark:text-white';
      bgColor = 'bg-white dark:bg-slate-900';
      screenStyles = { width: '340px', height: '580px' };
      break;
    case 'tiktok':
      logoText = 'TikTok';
      logoColor = 'text-white';
      bgColor = 'bg-black';
      screenStyles = { width: '300px', height: '600px' };
      break;
    case 'facebook':
    default:
      logoText = 'Facebook';
      logoColor = 'text-[#1877F2]';
      bgColor = 'bg-[#f0f2f5] dark:bg-slate-900';
      screenStyles = { width: '340px', height: '680px' };
      break;
  }

  const isDarkPlatform = platform === 'tiktok' || (platform === 'twitter' && darkMode); 
  const textColor = isDarkPlatform && platform !== 'tiktok' ? 'text-white' : 'text-slate-800';
  const postBg = isDarkPlatform ? 'bg-black' : 'bg-white';
  const placeholderColor = isDarkPlatform ? 'text-slate-600' : 'text-slate-300';
  const mediaHeight = platform === 'tiktok' ? 'h-96' : 'max-h-80';

  return (
    <div className="relative bg-slate-900 rounded-[3rem] shadow-2xl shadow-slate-900/40 border-[8px] border-slate-900 ring-1 ring-slate-900/10 overflow-hidden" style={screenStyles}>
      {/* Notch */}
      <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 z-20 flex justify-center">
        <div className="w-32 h-6 bg-slate-900 rounded-b-xl"></div>
      </div>

      {/* Screen Content */}
      <div className="w-full h-full pt-10 overflow-y-auto no-scrollbar pb-8" style={{ backgroundColor: undefined }}>

        {/* Header */}
        <div className={`px-4 py-3 border-b ${isDarkPlatform ? 'border-slate-800' : 'border-slate-100'} ${postBg} flex justify-between items-center sticky top-0 z-10 shadow-sm`}>
          {platform === 'instagram' ? (
            <h1 className={`text-xl font-extrabold tracking-tighter capitalize ${darkMode ? 'text-white' : 'text-black'} italic font-serif`}>Instagram</h1>
          ) : (
            <h1 className={`text-xl font-extrabold tracking-tighter capitalize ${logoColor}`}>{logoText}</h1>
          )}
          <div className="flex gap-4 text-slate-600" />
        </div>

        {/* Post Content */}
        <div className={`mt-2 pb-2 shadow-sm ${postBg} ${textColor}`}>
          <div className="p-3 flex gap-3 items-center mb-1">
            <div>
              <div className={`font-bold text-sm ${textColor}`}>Your Business Page</div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                {t('now')}
              </div>
            </div>
            <div className="ml-auto text-slate-400">•••</div>
          </div>

          <div className="px-3 pb-3 text-sm whitespace-pre-wrap leading-relaxed" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {message || <span className={`${placeholderColor} italic`}>{t('placeholder')}</span>}
          </div>

          {previewUrl ? (
            fileType === 'video' ? 
              <video src={previewUrl} className={`w-full ${mediaHeight} object-cover bg-black`} controls /> : 
              <img src={previewUrl} className={`w-full ${mediaHeight} object-cover bg-slate-100`} />
          ) : (
            <div className={`w-full h-64 flex items-center justify-center text-sm italic ${isDarkPlatform ? 'bg-slate-900 text-slate-600' : 'bg-slate-100 text-slate-300'}`}>Media Preview</div>
          )}

          <div className="px-3 py-3 flex justify-between items-center border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
            <div className="flex justify-around pt-2 text-sm w-full">
              <span className="flex items-center gap-2 px-4 py-2 rounded-lg"><Icons.Check /> {t('like')}</span>
              <span className="flex items-center gap-2 px-4 py-2 rounded-lg">💬 {t('comment')}</span>
              <span className="flex items-center gap-2 px-4 py-2 rounded-lg">↗️ {t('share')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-700 rounded-full z-20"></div>
    </div>
  );
};

// ==========================================
// Main App Component
// ==========================================
export default function App() {
  // --- States ---
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileTypes, setFileTypes] = useState<('image' | 'video')[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // وسائط مولدة بالذكاء الاصطناعي (لينك جاهز من Supabase)
  const [aiMediaUrl, setAiMediaUrl] = useState<string | null>(null);
  const [aiMediaType, setAiMediaType] = useState<'image' | 'video' | null>(null);

  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; msg: string }>({ type: '', msg: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings & Navigation
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState<'home' | 'dashboard' | 'settings'>('home'); 
  const t = (key: keyof typeof TRANSLATIONS['ar']) => TRANSLATIONS[lang][key];

  // Access Token Management
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem('fb_access_token') || DEFAULT_ACCESS_TOKEN;
  });

  useEffect(() => {
    localStorage.setItem('fb_access_token', accessToken);
  }, [accessToken]);

  const [connectionStatus, setConnectionStatus] = useState<any>({ facebook: true, instagram: false, twitter: false, tiktok: false });
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [scheduledTime, setScheduledTime] = useState('');
  const [lastPostId, setLastPostId] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [activePreview, setActivePreview] = useState<string>('facebook');

  // الأرشيف / الخط الزمني
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postFilter, setPostFilter] = useState<'all' | 'scheduled' | 'published'>('all');

  const refreshPosts = async (overrideFilter?: 'all' | 'scheduled' | 'published') => {
    const filterToUse = overrideFilter || postFilter;
    setPostsLoading(true);
    try {
      const data = await fetchPosts(filterToUse === 'all' ? undefined : filterToUse);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'فشل تحميل الأرشيف' });
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', hour: 'numeric', minute: 'numeric' }));
    return () => {
      previewUrls.forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls, lang]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(activePreview)) {
      setActivePreview(selectedPlatforms[0]);
    }
  }, [selectedPlatforms, activePreview]);

  useEffect(() => {
    if (status.msg) {
      const timer = setTimeout(() => setStatus({type: '', msg: ''}), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    // تحميل الأرشيف عند أول فتح
    refreshPosts('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allPlatforms = ['facebook', 'instagram', 'twitter', 'tiktok'];
  const isAllSelected = selectedPlatforms.length === allPlatforms.length;
  
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(allPlatforms);
      setActivePreview('facebook');
    }
  };

  const togglePlatform = (platform: string) => { 
    const isSelected = selectedPlatforms.includes(platform);
    
    if (isSelected && activePreview !== platform) {
      setActivePreview(platform);
      return;
    }

    if (isSelected) {
      setConnectionStatus((p: any) => ({ ...p, [platform]: false }));
      setSelectedPlatforms(prev => prev.filter(p => p !== platform));
    } else {
      if (!connectionStatus[platform]) {
        setStatus({ type: '', msg: `جاري بدء عملية ربط حساب ${platform.toUpperCase()}...` });
        setTimeout(() => {
          setConnectionStatus((p: any) => ({ ...p, [platform]: true }));
          setStatus({ type: 'success', msg: `تم ربط حساب ${platform.toUpperCase()} بنجاح! ✅` });
        }, 1000); 
      } else {
        setStatus({ type: 'success', msg: `حساب ${platform.toUpperCase()} مرتبط بالفعل. ✅` });
      }

      setSelectedPlatforms(prev => [...prev, platform]);
      setActivePreview(platform);
    }
  };
    
  // ** دالة توليد النص **
  const handleAiGenerate = async () => {
    if (!message.trim()) return setStatus({ type: 'error', msg: t('placeholder') });
    setIsLoading(true); setStatus({ type: '', msg: t('aiThinking') });

    const primaryPlatform = selectedPlatforms[0];
    const isVideoPlatform = primaryPlatform === 'tiktok' || primaryPlatform === 'instagram';
    const isInstagram = selectedPlatforms.includes('instagram');

    let combinedPrompt = '';
    const preferredLang = lang === 'ar' ? 'العربية' : 'English';

    if (isVideoPlatform) {
      combinedPrompt = `Act as an expert content creator specializing in short-form video (TikTok/Reels). Based on the topic: "${message}", generate a concise and engaging VIDEO SCRIPT in ${preferredLang} and English. The script must include: 1. A catchy Hook, 2. Brief Scene Description (for visual), and 3. A strong Call-to-Action. Keep it under 60 seconds of speaking time.`;
    } else {
      combinedPrompt = `Act as an expert content creator. Generate a creative and inspiring post based on the following topic, ensuring the response is fluent and grammatically correct in both ARABIC and ENGLISH. DO NOT suggest generating images or any media; just provide the engaging post text: "${message}"`;
    }

    // 🛑 Enforce specific character limit for Instagram
    if (isInstagram) {
      combinedPrompt += " IMPORTANT: Ensure the caption is under 2000 characters to comply with Instagram limits.";
    }

    try {
      const text = await generateAIContent(combinedPrompt, preferredLang);
      if (text) {
        setMessage(text);
        setStatus({ type: 'success', msg: t('aiSuccess') });
      } else {
        throw new Error('AI Generation Failed');
      }
    } catch (err) { 
      setStatus({ type: 'error', msg: 'AI Error' }); 
    } finally { 
      setIsLoading(false); 
    }
  };
    
  // ** توليد صورة AI واحدة (تُرفع على Supabase) **
  const handleAiImageGenerate = async () => {
    const promptText = message.trim();
    if (!promptText) return setStatus({ type: 'error', msg: 'الرجاء إدخال وصف أو موضوع في محرر المحتوى لتوليد الصورة.' });
    
    if (selectedFiles.length > 0 || aiMediaUrl) {
      setStatus({ type: 'error', msg: 'يوجد وسائط مرفقة بالفعل. الرجاء إزالتها أولاً.' });
      return;
    }

    setIsGenerating(true); 
    setIsLoading(true); 
    setStatus({ type: '', msg: 'جاري توليد الصورة بالذكاء الاصطناعي (قد يستغرق 15-30 ثانية)...' });
    
    try {
      const result = await generateAIImage(promptText); 
      
      setAiMediaUrl(result.publicUrl);
      setAiMediaType(result.fileType.startsWith('video/') ? 'video' : 'image');

      // للمعاينة فقط نستخدم نفس اللينك
      setPreviewUrls([result.publicUrl]);
      setFileTypes([result.fileType.startsWith('video/') ? 'video' : 'image']);
      setSelectedFiles([]);

      setStatus({ type: 'success', msg: 'تم توليد الصورة وإرفاقها بنجاح! ✨' });
    } catch (err: any) { 
      console.error("AI Image Error:", err);
      setAiMediaUrl(null);
      setAiMediaType(null);
      setPreviewUrls([]);
      setFileTypes([]);
      setStatus({ type: 'error', msg: err.message || 'فشل توليد الصورة.' }); 
    } finally { 
      setIsGenerating(false); 
      setIsLoading(false); 
    }
  };

  // ** تعديل صورة AI (محاكاة) **
  const handleAiImageEdit = async (style: string) => {
    if (!aiMediaUrl) return setStatus({ type: 'error', msg: 'الرجاء توليد صورة بالذكاء الاصطناعي أولاً.' });
    
    setIsGenerating(true);
    setIsLoading(true);
    setStatus({ type: '', msg: `جاري تعديل الصورة إلى نمط '${style}' بالذكاء الاصطناعي... 🪄` });

    try {
      await delay(2500); 
      const updatedUrl = `${aiMediaUrl.split('?')[0]}?t=${Date.now()}`;
      setAiMediaUrl(updatedUrl);
      setPreviewUrls([updatedUrl]);
      setStatus({ type: 'success', msg: `تم تعديل الصورة بنجاح إلى نمط ${style}!` });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'فشل تعديل الصورة بالذكاء الاصطناعي.' });
    } finally {
      setIsGenerating(false); 
      setIsLoading(false); 
    }
  };

  // ** اختيار ملفات من الجهاز (حتى 10) **
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const spaceLeft = MAX_FILES - selectedFiles.length - (aiMediaUrl ? 1 : 0);
    if (spaceLeft <= 0) {
      setStatus({ type: 'error', msg: `تم الوصول للحد الأقصى (${MAX_FILES} ملفات).` });
      return;
    }

    const toAdd = files.slice(0, spaceLeft);

    const newTypes: ('image' | 'video')[] = [];
    const newUrls: string[] = [];

    toAdd.forEach(f => {
      newTypes.push(f.type.startsWith('video/') ? 'video' : 'image');
      newUrls.push(URL.createObjectURL(f));
    });

    setSelectedFiles(prev => [...prev, ...toAdd]); 
    setFileTypes(prev => [...prev, ...newTypes]); 
    setPreviewUrls(prev => [...prev, ...newUrls]); 
  };
    
  const clearMedia = () => { 
    previewUrls.forEach(url => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    setSelectedFiles([]); 
    setFileTypes([]); 
    setPreviewUrls([]); 
    setAiMediaUrl(null);
    setAiMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  const handlePublish = async () => {
    const hasLocalFiles = selectedFiles.length > 0;
    const hasAiMedia = !!aiMediaUrl;

    if (!message.trim() && !hasLocalFiles && !hasAiMedia) {
      return setStatus({ type: 'error', msg: t('errorEmpty') });
    }

    if (selectedPlatforms.length === 0) return setStatus({ type: 'error', msg: t('errorSelect') });

    setIsLoading(true);
    setStatus({ type: '', msg: scheduledTime ? t('scheduling') : t('publishing') });

    // نستخدم أول ملف فقط حالياً في النشر (باقي الملفات ممكن نوسّع لها لاحقاً)
    const mainFile = hasLocalFiles ? selectedFiles[0] : null;

    try {
      if (scheduledTime) {
        await schedulePost(message, mainFile, selectedPlatforms, scheduledTime);
        await refreshPosts(); // تحديث الأرشيف
        setStatus({ type: 'success', msg: t('successSchedule') });
        setMessage(''); clearMedia(); setScheduledTime('');
      } else {
        // لو فيه ملفات من الجهاز -> نخلي publicUrlFromClient = null
        // لو مفيش ملفات و فيه صورة AI -> نستخدم لينك AI
        const publicUrlForBackend = hasLocalFiles ? null : (aiMediaUrl || null);

        const res = await publishPost(
          message,
          mainFile,
          selectedPlatforms,
          publicUrlForBackend,
          undefined,
          accessToken
        );

        let successMsg = t('success');
        if (res.twitterId) successMsg += `\n🐦 Tweet ID: ${res.twitterId}`;
        setStatus({ type: 'success', msg: successMsg });

        if (res.id && !res.id.startsWith('mock_')) setLastPostId(res.id);
        await refreshPosts(); // تحديث الأرشيف
        setMessage(''); clearMedia(); setScheduledTime('');
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => { 
    if(!lastPostId || !confirm(t('deleteConfirm'))) return; 
    setIsLoading(true); 
    try { 
      await deletePost(lastPostId, accessToken); 
      await refreshPosts();
      setStatus({ type: 'success', msg: t('deleted') }); 
      setLastPostId(''); 
    } catch(err: any) { 
      setStatus({ type: 'error', msg: err.message }); 
    } finally { 
      setIsLoading(false); 
    } 
  };

  const handleUpdate = async () => { 
    if(!lastPostId || !editMessage) return; 
    setIsLoading(true); 
    try { 
      await updatePost(lastPostId, editMessage, accessToken); 
      await refreshPosts();
      setStatus({ type: 'success', msg: t('updated') }); 
      setEditMode(false); 
    } catch(err: any) { 
      setStatus({ type: 'error', msg: err.message }); 
    } finally { 
      setIsLoading(false); 
    } 
  };

  // معاينة: نعرض أول وسيط فقط
  const mainPreviewUrl = (selectedFiles.length > 0 ? previewUrls[0] : (aiMediaUrl || previewUrls[0])) || null;
  const mainPreviewType: 'image' | 'video' | null =
    selectedFiles.length > 0 ? (fileTypes[0] || null) : (aiMediaType || fileTypes[0] || null);

  const totalMediaCount = selectedFiles.length + (aiMediaUrl ? 1 : 0);

  return (
    <div className={`${darkMode ? 'dark' : ''} h-screen overflow-hidden`}>
      <div className="h-full bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-500 overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Navbar */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/60 dark:border-slate-800/60 transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')}>
                <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                  <Icons.Send />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 brand-font tracking-tight">
                  {t('appTitle')}
                </h1>
                <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800/50 uppercase tracking-wider">{t('pro')}</span>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => setView('home')} 
                  className={`p-2.5 rounded-xl transition-all duration-300 ${view === 'home' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Icons.Home />
                </button>
                <button
                  onClick={() => setView('dashboard')}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    view === 'dashboard'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Icons.Calendar />
                </button>
                <button 
                  onClick={() => setView('settings')} 
                  className={`p-2.5 rounded-xl transition-all duration-300 ${view === 'settings' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Icons.Gear />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Toast */}
        {status.msg && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[60] animate-bounce-in">
            <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 flex items-center gap-3 ${
              status.type === 'error' 
              ? 'bg-red-500/90 text-white' 
              : status.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-slate-800/90 text-white'
            }`}>
              <span className="text-xl">{status.type === 'error' ? '⚠️' : status.type === 'success' ? '✅' : '⏳'}</span>
              <span className="font-bold whitespace-pre-wrap text-sm">{status.msg}</span>
            </div>
          </div>
        )}

        <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
          {view === 'home' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up">
              {/* Editor Column */}
              <div className="lg:col-span-7 space-y-6">
                {/* Platform Selector */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('selectPlatforms')}</h3>
                    <button
                      onClick={toggleSelectAll}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-slate-600"
                    >
                      {isAllSelected ? t('deselectAll') : t('selectAll')}
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {['facebook', 'instagram', 'twitter', 'tiktok'].map(p => (
                      <button 
                        key={p} 
                        onClick={() => togglePlatform(p)} 
                        className={`relative group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${
                          selectedPlatforms.includes(p) 
                          ? 'bg-white dark:bg-slate-700 border-blue-500 shadow-lg shadow-blue-500/20 scale-105 z-10' 
                          : 'bg-slate-50 dark:bg-slate-900 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70 hover:opacity-100'
                        } ${activePreview === p ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800' : ''}`}
                      >
                        <div className={`transition-transform duration-300 ${selectedPlatforms.includes(p) ? 'text-blue-600 scale-110' : 'text-slate-400 grayscale group-hover:grayscale-0'}`}>
                          {p === 'facebook' && <Icons.Facebook />}
                          {p === 'instagram' && <Icons.Instagram />}
                          {p === 'twitter' && <Icons.Twitter />}
                          {p === 'tiktok' && <Icons.TikTok />}
                        </div>
                        {selectedPlatforms.includes(p) && <div className="absolute top-2 right-2 text-blue-600"><Icons.Check /></div>}
                        {activePreview === p && <div className="absolute top-[-8px] bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm">Preview</div>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Editor */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-700 p-6 relative overflow-hidden">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6 relative z-10 gap-3">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white brand-font">{t('editorTitle')}</h2>

                    <div className="flex gap-2 flex-wrap">
                      <button 
                        onClick={handleAiGenerate} 
                        disabled={isLoading || isGenerating} 
                        className="group relative px-4 py-2 rounded-xl font-bold text-white shadow-lg shadow-purple-500/30 overflow-hidden disabled:opacity-50"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all group-hover:scale-110"></div>
                        <span className="relative flex items-center gap-2 text-sm">
                          {isGenerating ? <div className="animate-spin"><Icons.Gear /></div> : <Icons.Magic />} 
                          {isGenerating ? t('aiThinking') : t('aiButton')}
                        </span>
                      </button>

                      <button 
                        onClick={handleAiImageGenerate} 
                        disabled={isLoading || isGenerating || selectedFiles.length > 0} 
                        className={`relative px-4 py-2 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 overflow-hidden disabled:opacity-50 ${
                          selectedFiles.length > 0 ? 'bg-slate-600' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-blue-400/50'
                        }`}
                      >
                        <span className="relative flex items-center gap-2 text-sm">
                          <Icons.Image />
                          {t('aiImageButton')}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Text Area */}
                  <div className="relative group mb-6">
                    <textarea 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)} 
                      className="w-full h-40 p-5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-lg transition-all dark:text-white resize-none placeholder-slate-400" 
                      placeholder={t('placeholder')} 
                    />
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors">😊</button>
                    </div>
                    {showEmojiPicker && (
                      <div className="absolute bottom-16 left-4 bg-white dark:bg-slate-800 shadow-2xl p-3 grid grid-cols-5 w-64 z-50 rounded-2xl border border-slate-100 dark:border-slate-600 animate-fade-in-up">
                        {EMOJI_LIST.map(e => (
                          <button 
                            key={e} 
                            onClick={() => {setMessage(prev=>prev+e);setShowEmojiPicker(false)}} 
                            className="text-2xl hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upload Area */}
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className={`group relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                      totalMediaCount > 0 
                      ? 'border-emerald-400/50 bg-emerald-50/50 dark:bg-emerald-900/10' 
                      : 'border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                    />
                    {totalMediaCount > 0 ? (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl">🎉</span>
                        <p className="text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                          تم اختيار {totalMediaCount} ملف (حد أقصى {MAX_FILES})
                        </p>
                        {selectedFiles.length > 0 && (
                          <ul className="text-xs text-slate-600 dark:text-slate-300 max-h-24 overflow-y-auto">
                            {selectedFiles.map((f, i) => (
                              <li key={i}>{f.name}</li>
                            ))}
                          </ul>
                        )}
                        {aiMediaUrl && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-300">
                            + صورة مولدة بالذكاء الاصطناعي
                          </p>
                        )}
                        <button
                          onClick={(e)=>{e.stopPropagation();clearMedia()}}
                          className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-1 rounded-full text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors"
                        >
                          إزالة الملفات
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-slate-700 text-blue-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                          <Icons.Upload />
                        </div>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{t('uploadClick')}</p>
                        <p className="text-xs text-slate-400">{t('uploadFormat')}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* تعديل صورة AI فقط */}
                  {aiMediaUrl && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3 animate-fade-in-up">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">تعديل الصورة بالذكاء الاصطناعي:</p>
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => handleAiImageEdit('إزالة الخلفية')}
                          disabled={isGenerating || isLoading}
                          className="text-xs px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 transition-colors disabled:opacity-50"
                        >
                          إزالة الخلفية
                        </button>
                        <button 
                          onClick={() => handleAiImageEdit('نمط كرتوني')}
                          disabled={isGenerating || isLoading}
                          className="text-xs px-3 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 transition-colors disabled:opacity-50"
                        >
                          نمط كرتوني
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 pr-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-500"><Icons.Calendar /></div>
                      <input
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="bg-transparent text-sm font-medium outline-none dark:text-white w-full"
                      />
                    </div>

                    <button 
                      onClick={handlePublish} 
                      disabled={isLoading} 
                      className={`relative overflow-hidden px-8 py-4 rounded-xl font-bold text-white flex items-center gap-3 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 ${
                        scheduledTime 
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-500/30' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30'
                      }`}
                    >
                      {isLoading ? <div className="animate-spin"><Icons.Gear /></div> : scheduledTime ? <Icons.Calendar /> : <Icons.Send />}
                      {isLoading ? (scheduledTime ? t('scheduling') : t('publishing')) : (scheduledTime ? t('scheduleButton') : t('publishButton'))}
                    </button>
                  </div>
                </div>

                {/* Management Panel + Timeline */}
                <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-700 p-6 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                  <h3 className="font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wide text-xs">{t('manageTitle')}</h3>
                  
                  {/* التحكم في ID آخر بوست */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={lastPostId}
                      onChange={(e) => setLastPostId(e.target.value)}
                      placeholder={t('postIdPlaceholder')}
                      className="flex-1 p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-slate-200 outline-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDelete}
                      className="flex-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex justify-center gap-2"
                    >
                      <Icons.Trash /> {t('deleteBtn')}
                    </button>
                    <button
                      onClick={() => { setEditMode(!editMode); if(!editMessage) setEditMessage(message); }}
                      className="flex-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex justify-center gap-2"
                    >
                      <Icons.Edit /> {t('editBtn')}
                    </button>
                  </div>
                  {editMode && (
                    <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-fade-in-up">
                      <textarea
                        value={editMessage}
                        onChange={(e) => setEditMessage(e.target.value)}
                        className="w-full h-24 p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white rounded-xl mb-3 outline-none resize-none"
                      ></textarea>
                      <button
                        onClick={handleUpdate}
                        className="w-full bg-slate-800 text-white py-2 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                      >
                        {t('saveBtn')}
                      </button>
                    </div>
                  )}

                  {/* الخط الزمني / الأرشيف */}
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Icons.Calendar /> {t('timeline')}
                      </span>
                      <div className="flex items-center gap-1 text-xs">
                        {(['all','scheduled','published'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => { setPostFilter(f); refreshPosts(f); }}
                            className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${
                              postFilter === f
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            {f === 'all' ? t('allStatus') : f === 'scheduled' ? t('scheduledFilter') : t('publishedFilter')}
                          </button>
                        ))}
                        <button
                          onClick={() => refreshPosts()}
                          className="ml-1 px-2 py-1 rounded-full text-[11px] border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title={t('refreshArchive')}
                        >
                          ⟳
                        </button>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {postsLoading ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <div className="animate-spin"><Icons.Gear /></div>
                          <span>جاري تحميل الأرشيف...</span>
                        </div>
                      ) : posts.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {t('noPosts')}
                        </p>
                      ) : (
                        posts.map((post) => (
                          <button
                            key={post.id || post.facebook_id || Math.random()}
                            onClick={() => {
                              if (post.facebook_id) setLastPostId(post.facebook_id);
                              if (post.content) {
                                setMessage(post.content);
                                setEditMessage(post.content);
                                setEditMode(false);
                              }
                            }}
                            className="w-full text-left p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:bg-slate-800 transition-colors text-xs"
                          >
                            <div className="flex justify-between items-center mb-1 gap-2">
                              <span className="font-semibold text-slate-700 dark:text-slate-100 truncate">
                                {(post.content || '').slice(0, 80)}{(post.content || '').length > 80 ? '…' : ''}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                post.status === 'scheduled'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                {post.status === 'scheduled' ? t('scheduledFilter') : t('publishedFilter')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                              <span>
                                {post.created_at
                                  ? new Date(post.created_at).toLocaleString(
                                      lang === 'ar' ? 'ar-EG' : 'en-US',
                                      { dateStyle: 'short', timeStyle: 'short' }
                                    )
                                  : ''}
                              </span>
                              <span className="flex gap-1 items-center">
                                {(post.platforms || []).map((p) => (
                                  <span
                                    key={p}
                                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800"
                                  >
                                    {p === 'facebook' && <Icons.Facebook />}
                                    {p === 'instagram' && <Icons.Instagram />}
                                    {p === 'twitter' && <Icons.Twitter />}
                                    {p === 'tiktok' && <Icons.TikTok />}
                                  </span>
                                ))}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Column */}
              <div className="lg:col-span-5 hidden lg:flex flex-col items-center sticky top-28 gap-4">
                {selectedPlatforms.length > 1 && (
                  <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {selectedPlatforms.map(p => (
                      <button 
                        key={p}
                        onClick={() => setActivePreview(p)}
                        className={`p-2 rounded-lg transition-all ${activePreview === p ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                        {p === 'facebook' && <Icons.Facebook />}
                        {p === 'instagram' && <Icons.Instagram />}
                        {p === 'twitter' && <Icons.Twitter />}
                        {p === 'tiktok' && <Icons.TikTok />}
                      </button>
                    ))}
                  </div>
                )}

                <PlatformPreview 
                  platform={activePreview}
                  message={message}
                  previewUrl={mainPreviewUrl}
                  fileType={mainPreviewType}
                  t={t}
                  lang={lang}
                  darkMode={darkMode}
                />
              </div>
            </div>
          )}

          {view === 'dashboard' && (
            <DashboardView t={t} posts={posts} setView={setView} />
          )}

          {view === 'settings' && (
            <SettingsView 
              t={t} 
              setView={setView} 
              lang={lang} 
              setLang={setLang} 
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
              accessToken={accessToken} 
              setAccessToken={setAccessToken}
              connectionStatus={connectionStatus}
              setConnectionStatus={setConnectionStatus}
              setStatus={setStatus}
            />
          )}
        </main>
      </div>
    </div>
  );
}
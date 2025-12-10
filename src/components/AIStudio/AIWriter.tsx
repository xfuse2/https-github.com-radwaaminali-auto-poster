// src/components/AIStudio/AIWriter.tsx
import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, Check, Download } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/ai-studio';

const AIWriter: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('general');
  const [language, setLanguage] = useState('ar');
  const [platform, setPlatform] = useState('facebook');
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const styles = [
    { value: 'general', label: '✨ عام', desc: 'محتوى متوازن ومناسب للجميع' },
    { value: 'educational', label: '📚 تعليمي', desc: 'محتوى تعليمي واحترافي' },
    { value: 'promotional', label: '🎯 ترويجي', desc: 'محتوى تسويقي مقنع' },
    { value: 'inspirational', label: '✨ ملهم', desc: 'محتوى محفز وإيجابي' },
    { value: 'entertaining', label: '🎭 ترفيهي', desc: 'محتوى مرح وخفيف' },
    { value: 'news', label: '📰 إخباري', desc: 'محتوى إخباري موجز' },
    { value: 'storytelling', label: '📖 قصصي', desc: 'سرد قصصي جذاب' }
  ];

  const platforms = [
    { value: 'facebook', label: 'Facebook', icon: '📘', limit: '250 كلمة' },
    { value: 'twitter', label: 'Twitter/X', icon: '🐦', limit: '280 حرف' },
    { value: 'instagram', label: 'Instagram', icon: '📸', limit: '150 كلمة' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵', limit: '100 كلمة' }
  ];

  const languages = [
    { value: 'ar', label: 'العربية', flag: '🇸🇦' },
    { value: 'en', label: 'English', flag: '🇺🇸' }
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert('⚠️ الرجاء إدخال موضوع');
      return;
    }

    setLoading(true);
    setGeneratedContent('');
    setMetadata(null);

    try {
      const response = await axios.post(`${API_URL}/generate-content`, {
        topic: topic.trim(),
        style,
        language,
        platform
      });

      if (response.data.success) {
        setGeneratedContent(response.data.content);
        setMetadata(response.data.metadata);
      } else {
        alert('❌ فشل في توليد المحتوى');
      }
    } catch (error: any) {
      console.error('Generate Error:', error);
      alert(`❌ خطأ: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-content-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Topic Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📝 الموضوع
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: فوائد التسويق الرقمي للشركات الصغيرة"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-all resize-none"
            />
          </div>

          {/* Style Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              🎨 الأسلوب
            </label>
            <div className="grid grid-cols-2 gap-2">
              {styles.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`
                    p-3 rounded-xl text-left transition-all
                    ${style === s.value
                      ? 'bg-blue-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  <div className="font-medium text-sm">{s.label}</div>
                  <div className="text-xs opacity-80 mt-1">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📱 المنصة
            </label>
            <div className="grid grid-cols-2 gap-2">
              {platforms.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className={`
                    p-3 rounded-xl text-left transition-all
                    ${platform === p.value
                      ? 'bg-purple-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span>{p.icon}</span>
                    <span className="font-medium text-sm">{p.label}</span>
                  </div>
                  <div className="text-xs opacity-80 mt-1">{p.limit}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              🌍 اللغة
            </label>
            <div className="flex gap-2">
              {languages.map(lang => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  className={`
                    flex-1 p-3 rounded-xl transition-all
                    ${language === lang.value
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }
                  `}
                >
                  <div className="text-2xl mb-1">{lang.flag}</div>
                  <div className="font-medium text-sm">{lang.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 
                     hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500
                     text-white font-bold rounded-xl shadow-lg hover:shadow-xl
                     transition-all transform hover:scale-105 disabled:scale-100
                     flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>جاري التوليد...</span>
              </>
            ) : (
              <>
                <Sparkles size={24} />
                <span>✨ توليد المحتوى بالذكاء الاصطناعي</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Section */}
      {generatedContent && (
        <div className="mt-6 animate-fadeIn">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 
                        rounded-xl p-6 border-2 border-blue-200 dark:border-gray-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="text-blue-600" size={20} />
                  المحتوى المولّد
                </h3>
                {metadata && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    📊 {metadata.wordCount} كلمة • {metadata.characterCount} حرف
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg 
                           hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                           flex items-center gap-2 text-sm font-medium"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-green-500" />
                      <span className="text-green-600 dark:text-green-400">تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>نسخ</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg 
                           hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                           flex items-center gap-2 text-sm font-medium"
                >
                  <Download size={16} />
                  <span>تحميل</span>
                </button>
              </div>
            </div>
            
            <textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       font-medium leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AIWriter;
// src/components/AIStudio/AIStudio.tsx
import React, { useState } from 'react';
import { Sparkles, Image, Hash, Languages, BarChart3, Copy, Wand2 } from 'lucide-react';

// Import sub-components
import AIWriter from './AIWriter';

// Placeholders for other components until they are fully implemented
const PlaceholderComponent = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
    <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
      <Wand2 className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
      This feature is currently under development. Check back soon for updates!
    </p>
  </div>
);

const AIStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState('writer');

  const tabs = [
    { id: 'writer', label: 'AI Writer', icon: Sparkles, color: 'blue' },
    { id: 'variants', label: 'Caption Variants', icon: Copy, color: 'purple' },
    { id: 'tone', label: 'Tone Analyzer', icon: BarChart3, color: 'green' },
    { id: 'hashtags', label: 'Hashtags', icon: Hash, color: 'pink' },
    { id: 'translate', label: 'Translation', icon: Languages, color: 'indigo' },
    { id: 'images', label: 'Image Generator', icon: Image, color: 'orange' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'writer': return <AIWriter />;
      case 'variants': return <PlaceholderComponent title="Caption Variants" />;
      case 'tone': return <PlaceholderComponent title="Tone Analyzer" />;
      case 'hashtags': return <PlaceholderComponent title="Hashtag Generator" />;
      case 'translate': return <PlaceholderComponent title="Translation" />;
      case 'images': return <PlaceholderComponent title="Image Generator" />;
      default: return <AIWriter />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Wand2 className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white brand-font">
                AI Content Studio
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create amazing content with AI-powered tools
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              // Dynamic classes for color (simplified for Tailwind purging, best to use fixed classes or safelist)
              const activeClass = isActive 
                ? 'bg-blue-50 dark:bg-slate-700/50 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50';

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 md:px-6 py-4 font-medium transition-all whitespace-nowrap
                    ${activeClass}
                  `}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-4 md:p-6">
            {renderContent()}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>💡 Powered by Google Gemini AI & OpenAI</p>
        </div>
      </div>
    </div>
  );
};

export default AIStudio;
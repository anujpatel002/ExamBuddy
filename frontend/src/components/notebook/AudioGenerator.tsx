'use client';
import { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause, FiDownload, FiMic, FiVolume2, FiClock } from 'react-icons/fi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Source {
  id: string;
  name: string;
}

interface AudioOverview {
  id: string;
  title: string;
  duration: number;
  audioUrl: string;
  transcript: string;
  type: 'overview' | 'deep-dive' | 'summary';
  createdAt: Date;
}

interface AudioGeneratorProps {
  sources: Source[];
  onGenerateAudio: (format: string) => Promise<any>;
}

export default function AudioGenerator({ sources, onGenerateAudio }: AudioGeneratorProps) {
  const [audioOverviews, setAudioOverviews] = useState<AudioOverview[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [translatedText, setTranslatedText] = useState<{[key: string]: string}>({});
  
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
      // Load voices
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const audioTypes = [
    {
      key: 'overview',
      title: 'Overview',
      description: 'High-level summary of all sources (5-10 min)',
      icon: FiVolume2,
      duration: '5-10 min'
    },
    {
      key: 'deep-dive',
      title: 'Deep Dive',
      description: 'Detailed analysis with examples (15-25 min)',
      icon: FiMic,
      duration: '15-25 min'
    },
    {
      key: 'summary',
      title: 'Quick Summary',
      description: 'Key points only (2-5 min)',
      icon: FiClock,
      duration: '2-5 min'
    }
  ];

  const generateAudio = async (type: 'overview' | 'deep-dive' | 'summary') => {
    if (sources.length === 0) {
      toast.error('Add sources first to generate audio overview');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await onGenerateAudio(type);

      const newAudio: AudioOverview = {
        id: Date.now().toString(),
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${new Date().toLocaleDateString()}`,
        duration: response.estimatedDuration || 300,
        audioUrl: response.audioUrl || '',
        transcript: response.transcript || response.content || 'No transcript available',
        type,
        createdAt: new Date()
      };

      setAudioOverviews(prev => [newAudio, ...prev.filter(a => a.type !== type)]);
      toast.success('Audio overview generated successfully');
    } catch (error: any) {
      console.error('Audio generation error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate audio overview');
    } finally {
      setIsGenerating(false);
    }
  };

  const translateText = async (text: string, targetLang: string) => {
    if (targetLang === 'en-US') return text;
    
    if (targetLang === 'hinglish') {
      // Convert to Hinglish (Hindi words in English script)
      const hinglishWords: {[key: string]: string} = {
        'the': 'the', 'and': 'aur', 'is': 'hai', 'are': 'hain', 'this': 'yeh', 'that': 'woh',
        'what': 'kya', 'how': 'kaise', 'when': 'kab', 'where': 'kahan', 'why': 'kyun',
        'good': 'achha', 'bad': 'bura', 'big': 'bada', 'small': 'chota', 'new': 'naya',
        'old': 'purana', 'first': 'pehla', 'last': 'last', 'next': 'next', 'before': 'pehle',
        'after': 'baad mein', 'now': 'abhi', 'today': 'aaj', 'tomorrow': 'kal', 'yesterday': 'kal',
        'yes': 'haan', 'no': 'nahin', 'very': 'bahut', 'also': 'bhi', 'can': 'kar sakta',
        'will': 'karega', 'should': 'chahiye', 'must': 'zaroor', 'important': 'zaroori'
      };
      
      let hinglishText = text;
      Object.entries(hinglishWords).forEach(([eng, hing]) => {
        const regex = new RegExp(`\\b${eng}\\b`, 'gi');
        hinglishText = hinglishText.replace(regex, hing);
      });
      return hinglishText;
    }
    
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 500))}&langpair=en|${targetLang.split('-')[0]}`);
      const data = await response.json();
      return data.responseData?.translatedText || text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  };

  const togglePlayback = async (audioId: string, transcript: string, duration: number) => {
    if (currentlyPlaying === audioId) {
      if (currentUtterance) {
        speechSynthesis?.cancel();
        setCurrentlyPlaying(null);
        setCurrentUtterance(null);
        setPlaybackTime(0);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
      }
    } else {
      if (speechSynthesis) {
        speechSynthesis.cancel();
        
        let textToSpeak = transcript;
        if (selectedLanguage !== 'en-US') {
          if (translatedText[audioId]) {
            textToSpeak = translatedText[audioId];
          } else {
            textToSpeak = await translateText(transcript, selectedLanguage);
            setTranslatedText(prev => ({ ...prev, [audioId]: textToSpeak }));
          }
        }
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Set voice based on language
        const voices = speechSynthesis.getVoices();
        if (selectedLanguage === 'hi-IN') {
          const hindiVoice = voices.find(voice => voice.lang.includes('hi'));
          if (hindiVoice) utterance.voice = hindiVoice;
          utterance.lang = 'hi-IN';
        } else if (selectedLanguage === 'hinglish') {
          // Use Indian English voice for Hinglish to get Hindi accent
          const indianVoice = voices.find(voice => 
            voice.lang === 'en-IN' || 
            (voice.lang === 'en-US' && voice.name.toLowerCase().includes('indian')) ||
            voice.name.toLowerCase().includes('ravi') ||
            voice.name.toLowerCase().includes('aditi')
          );
          if (indianVoice) {
            utterance.voice = indianVoice;
          } else {
            // Fallback: modify speech parameters for Hindi accent
            utterance.rate = 0.7;
            utterance.pitch = 0.9;
          }
          utterance.lang = 'en-IN';
        } else {
          const englishVoice = voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Google'));
          if (englishVoice) utterance.voice = englishVoice;
          utterance.lang = 'en-US';
        }
        
        utterance.onstart = () => {
          setCurrentlyPlaying(audioId);
          setTotalDuration(duration);
          setPlaybackTime(0);
          
          // Start progress tracking
          progressInterval.current = setInterval(() => {
            setPlaybackTime(prev => {
              const next = prev + 1;
              if (next >= duration) {
                if (progressInterval.current) {
                  clearInterval(progressInterval.current);
                  progressInterval.current = null;
                }
                return duration;
              }
              return next;
            });
          }, 1000);
        };
        
        utterance.onend = () => {
          setCurrentlyPlaying(null);
          setCurrentUtterance(null);
          setPlaybackTime(0);
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
          }
        };
        
        utterance.onerror = () => {
          setCurrentlyPlaying(null);
          setCurrentUtterance(null);
          setPlaybackTime(0);
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
          }
        };
        
        setCurrentUtterance(utterance);
        speechSynthesis.speak(utterance);
      }
    }
  };

  const downloadAudio = async (audio: AudioOverview) => {
    try {
      // Validate audio URL before attempting download
      if (!audio.audioUrl || !audio.audioUrl.trim()) {
        toast.error('No audio file available for download');
        return;
      }
      
      const response = await fetch(audio.audioUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${audio.title}.mp3`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Audio download failed:', error);
      toast.error('Failed to download audio: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Audio Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Generate podcast-style audio summaries of your sources with AI narration
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Language Selection */}
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Audio Language:
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="en-US">English</option>
            <option value="hi-IN">Hindi</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>
        
        {sources.length === 0 ? (
          <div className="text-center py-12">
            <FiMic className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Add Sources First
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload documents to generate audio overviews
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Generation Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {audioTypes.map(({ key, title, description, icon: Icon, duration }) => (
                <div key={key} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
                      <p className="text-sm text-gray-500">{duration}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
                  <button
                    onClick={() => generateAudio(key as any)}
                    disabled={isGenerating}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              ))}
            </div>

            {/* Generated Audio Overviews */}
            {audioOverviews.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Generated Audio Overviews
                </h3>
                <div className="space-y-4">
                  {audioOverviews.map((audio) => (
                    <div key={audio.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {audio.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{formatDuration(audio.duration)}</span>
                            <span>•</span>
                            <span>{audio.type.charAt(0).toUpperCase() + audio.type.slice(1)}</span>
                            <span>•</span>
                            <span>{new Date(audio.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadAudio(audio)}
                          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <FiDownload className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Audio Controls */}
                      <div className="flex items-center gap-4 mb-4">
                        <button
                          onClick={() => togglePlayback(audio.id, audio.transcript, audio.duration)}
                          disabled={!speechSynthesis}
                          className={`p-3 rounded-full transition-colors ${
                            speechSynthesis 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {currentlyPlaying === audio.id ? (
                            <FiPause className="w-5 h-5" />
                          ) : (
                            <FiPlay className="w-5 h-5 ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: currentlyPlaying === audio.id && totalDuration > 0 ? `${(playbackTime / totalDuration) * 100}%` : '0%' }}
                            />
                          </div>
                          {currentlyPlaying === audio.id && (
                            <div className="text-xs text-gray-500 mt-1 text-center">
                              {formatDuration(playbackTime)} / {formatDuration(totalDuration)}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 min-w-[60px]">
                          {speechSynthesis ? formatDuration(audio.duration) : 'No TTS support'}
                        </span>
                      </div>

                      {/* Transcript Preview */}
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                          View Transcript
                        </summary>
                        <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {audio.transcript}
                          </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audio element removed - using Speech Synthesis API instead */}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Type, Mic, Video, Image as ImageIcon, Eye } from 'lucide-react';
import { submissions } from '../utils/api';
import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';

interface CommunitySubmission {
  id: string;
  submissionType: 'text' | 'audio' | 'video' | 'photo';
  content?: string;
  fileUrl?: string;
  createdAt: string;
}

export function CommunitySubmissions() {
  const [communitySubmissions, setCommunitySubmissions] = useState<CommunitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    try {
      setLoading(true);
      const data = await submissions.getCommunity(10);
      setCommunitySubmissions(data || []);
    } catch (error) {
      console.error('Failed to load community submissions:', error);
      setCommunitySubmissions([]);
    } finally {
      setLoading(false);
    }
  }

  const typeIcons = {
    text: Type,
    audio: Mic,
    video: Video,
    photo: ImageIcon,
  };

  const typeLabels = {
    text: 'Text',
    audio: 'Audio',
    video: 'Video',
    photo: 'Photo',
  };

  const typeBgColors = {
    text: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    audio: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    video: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
    photo: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  };

  const typeIconColors = {
    text: 'text-blue-600 dark:text-blue-400',
    audio: 'text-purple-600 dark:text-purple-400',
    video: 'text-pink-600 dark:text-pink-400',
    photo: 'text-orange-600 dark:text-orange-400',
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (communitySubmissions.length === 0) {
    return (
      <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-center py-12">
        <Eye className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">
          No community submissions yet. Be the first to share.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {communitySubmissions.map((submission) => {
        const Icon = typeIcons[submission.submissionType];
        const isExpanded = expandedId === submission.id;
        
        return (
          <Card
            key={submission.id}
            className={`border overflow-hidden transition-all ${typeBgColors[submission.submissionType]} cursor-pointer hover:shadow-md`}
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : submission.id)}
              className="w-full text-left"
            >
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800">
                    <Icon className={`w-4 h-4 ${typeIconColors[submission.submissionType]}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Anonymous • {typeLabels[submission.submissionType]}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {submission.createdAt ? new Date(submission.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : ''}
                  </p>
                </div>

                {/* Preview or Content */}
                <div className="space-y-2">
                  {submission.submissionType === 'text' && (
                    <p
                      className={`text-sm text-slate-700 dark:text-slate-300 leading-relaxed ${
                        isExpanded ? '' : 'line-clamp-2'
                      }`}
                    >
                      {submission.content}
                    </p>
                  )}

                  {submission.submissionType === 'audio' && (
                    <div className="flex items-center gap-2 py-2">
                      <div className="w-1 h-6 bg-purple-400 rounded-full opacity-60"></div>
                      <div className="w-1 h-4 bg-purple-400 rounded-full opacity-70"></div>
                      <div className="w-1 h-8 bg-purple-400 rounded-full opacity-50"></div>
                      <div className="w-1 h-5 bg-purple-400 rounded-full opacity-60"></div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 ml-2">Audio message</span>
                    </div>
                  )}

                  {submission.submissionType === 'video' && (
                    <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                      <div className="w-12 h-12 bg-slate-400 dark:bg-slate-600 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-8 border-l-white border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
                      </div>
                    </div>
                  )}

                  {submission.submissionType === 'photo' && (
                    <div className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 opacity-50" />
                    </div>
                  )}
                </div>

                {/* Expand indicator */}
                {submission.submissionType === 'text' && submission.content && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                    {isExpanded ? 'Click to hide' : 'Click to read more'}
                  </p>
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && submission.submissionType === 'text' && (
              <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 bg-white dark:bg-slate-800">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {submission.content}
                </p>
              </div>
            )}
          </Card>
        );
      })}

      <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-4">
        Showing responses from others who showed up today
      </p>
    </div>
  );
}
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
    text: 'bg-gradient-to-br from-blue-400 to-cyan-500 border-0 shadow-lg shadow-blue-500/30',
    audio: 'bg-gradient-to-br from-purple-400 to-indigo-500 border-0 shadow-lg shadow-purple-500/30',
    video: 'bg-gradient-to-br from-pink-400 to-rose-500 border-0 shadow-lg shadow-pink-500/30',
    photo: 'bg-gradient-to-br from-orange-400 to-amber-500 border-0 shadow-lg shadow-orange-500/30',
  };

  const typeIconColors = {
    text: 'text-white',
    audio: 'text-white',
    video: 'text-white',
    photo: 'text-white',
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
      <Card className="bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 text-center py-12">
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
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white drop-shadow">
                      Anonymous • {typeLabels[submission.submissionType]}
                    </p>
                  </div>
                  <p className="text-xs text-white/90 font-medium">
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
                      className={`text-sm text-white leading-relaxed drop-shadow font-medium ${
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
                      <span className="text-xs text-slate-500 dark:text-slate-500 ml-2">Audio message</span>
                    </div>
                  )}

                  {submission.submissionType === 'video' && (
                    <div className="aspect-video bg-gradient-to-br from-pink-200 to-pink-300 dark:from-pink-900 dark:to-pink-800 rounded-lg flex items-center justify-center">
                      <div className="w-12 h-12 bg-pink-400 dark:bg-pink-700 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-8 border-l-white border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
                      </div>
                    </div>
                  )}

                  {submission.submissionType === 'photo' && (
                    <div className="aspect-square bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-900 dark:to-orange-800 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-orange-600 dark:text-orange-200 opacity-50" />
                    </div>
                  )}
                </div>

                {/* Expand indicator */}
                {submission.submissionType === 'text' && submission.content && (
                  <p className="text-xs text-white/80 italic font-medium">
                    {isExpanded ? 'Click to hide' : 'Click to read more'}
                  </p>
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && submission.submissionType === 'text' && (
              <div className="border-t border-white/20 px-4 py-3 bg-white/10 backdrop-blur-sm">
                <p className="text-sm text-white leading-relaxed whitespace-pre-wrap font-medium">
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
import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface SubmissionModalProps {
  type: 'text' | 'audio' | 'video' | 'photo';
  onClose: () => void;
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
}

export function SubmissionModal({
  type,
  onClose,
  onSubmit,
  isSubmitting = false,
}: SubmissionModalProps) {
  const [content, setContent] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');

  const handleContentReady = (value: string) => {
    if (!value.trim()) {
      setError('Please provide content before submitting');
      return;
    }
    setContent(value);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      setError('');
      await onSubmit(content);
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to submit');
    }
  };

  const typeLabels = {
    text: 'Write Your Response',
    audio: 'Record Audio',
    video: 'Record Video',
    photo: 'Take a Photo',
  };

  const typeGradients = {
    text: 'from-blue-600 via-cyan-600 to-teal-600',
    audio: 'from-purple-600 via-indigo-600 to-pink-600',
    video: 'from-pink-600 via-rose-600 to-red-600',
    photo: 'from-orange-600 via-amber-600 to-yellow-600',
  };

  const typeDescription = {
    text: 'Share your thoughts, feelings, or observations.',
    audio: 'Record a voice message of up to 60 seconds.',
    video: 'Record a short video of yourself responding.',
    photo: 'Take or upload a photo that represents your response.',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`sticky top-0 flex items-center justify-between p-6 border-b border-white/20 bg-gradient-to-r ${typeGradients[type]} shadow-lg`}>
          <div>
            <h3 className="text-2xl font-black text-white drop-shadow-lg">
              {typeLabels[type]}
            </h3>
            <p className="text-sm text-white/90 mt-1 font-medium">
              One submission only
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50 backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {typeDescription[type]}
          </p>

          {!showConfirmation && (
            <>
              {type === 'text' && (
                <div className="space-y-3">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your thoughts..."
                    maxLength={500}
                    className="w-full h-56 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none text-sm"
                    autoFocus
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span>{content.length}/500 characters</span>
                  </div>
                </div>
              )}

              {type === 'audio' && (
                <div className="h-48 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Audio recording feature
                    </p>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setContent('audio-file');
                          handleContentReady('audio-file');
                        }
                      }}
                      className="text-xs"
                    />
                  </div>
                </div>
              )}

              {type === 'video' && (
                <div className="h-48 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full mx-auto flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-sm" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Video recording feature
                    </p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setContent('video-file');
                          handleContentReady('video-file');
                        }
                      }}
                      className="text-xs"
                    />
                  </div>
                </div>
              )}

              {type === 'photo' && (
                <div className="h-48 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mx-auto flex items-center justify-center">
                      <div className="w-6 h-6 bg-white rounded" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Photo upload feature
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setContent('photo-file');
                          handleContentReady('photo-file');
                        }
                      }}
                      className="text-xs"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!content.trim()) {
                      setError(`Please add ${type} content before submitting`);
                      return;
                    }
                    setShowConfirmation(true);
                  }}
                  className="flex-1"
                  disabled={isSubmitting || !content.trim()}
                >
                  Review
                </Button>
              </div>
            </>
          )}

          {showConfirmation && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-slate-800 dark:text-white">
                  Are you ready to submit?
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  ⚠️ <strong>This is final.</strong> You can only submit once per dare. There's no edit or delete.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 max-h-32 overflow-auto">
                {type === 'text' && (
                  <p className="text-sm text-slate-700 dark:text-slate-300">{content}</p>
                )}
                {type !== 'text' && (
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {type === 'audio' && '🎙️ Audio file ready'}
                    {type === 'video' && '🎬 Video file ready'}
                    {type === 'photo' && '📸 Photo file ready'}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirmation(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import API from '../services/api';
import { socket } from '../services/socket';
import { X, History, MessageSquare, Send, FileText, Calendar, AlertCircle } from 'lucide-react';

const ActivityDrawer = ({ isOpen, onClose, taskId, onCommentAdded }) => {
  const [activeTab, setActiveTab] = useState('activity'); // 'activity' or 'comments'
  const [taskDetails, setTaskDetails] = useState(null);
  const [logs, setLogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !taskId) return;

    fetchTaskDetails();
    fetchLogs();
    fetchComments();

    // --- Real-time Comments Socket Listener ---
    const handleCommentAdded = (data) => {
      const targetTaskId = data.taskId || data.comment?.task;
      if (targetTaskId === taskId) {
        setComments((prev) => {
          const commentObj = data.comment || data;
          const exists = prev.some((c) => c._id === commentObj._id);
          if (exists) return prev;
          const updated = [...prev, commentObj];
          
          // Notify parent about new comment count
          if (onCommentAdded) onCommentAdded(updated.length);
          return updated;
        });
      }
    };

    socket.on('commentAdded', handleCommentAdded);

    return () => {
      socket.off('commentAdded', handleCommentAdded);
    };
  }, [isOpen, taskId]);

  const fetchTaskDetails = async () => {
    try {
      const { data } = await API.get(`/tasks/${taskId}`);
      const task = data?.data || data;
      setTaskDetails(task);
    } catch (err) {
      console.error('Failed to fetch task details:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/activities/${taskId}`);
      const logList = Array.isArray(data) ? data : (data.data || data.logs || []);
      setLogs(logList);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data } = await API.get(`/tasks/${taskId}/comments`);
      const fetchedComments = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setComments(fetchedComments);
      if (onCommentAdded) onCommentAdded(fetchedComments.length);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const { data } = await API.post(`/tasks/${taskId}/comments`, { text: newComment });
      const added = data?.data || data;
      
      setComments((prev) => {
        const exists = prev.some((c) => c._id === added._id);
        if (exists) return prev;
        const updated = [...prev, added];
        
        // Notify parent instantly on successful add
        if (onCommentAdded) onCommentAdded(updated.length);
        return updated;
      });
      
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end">
      {/* Main Drawer Container */}
      <div className="w-full max-w-md h-full bg-gray-900 border-l border-gray-800 text-white flex flex-col shadow-2xl transition-transform transform translate-x-0">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {activeTab === 'activity' ? <History className="w-5 h-5 text-blue-500" /> : <MessageSquare className="w-5 h-5 text-emerald-500" />}
            Task Details
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Full Description & Meta Section */}
        {taskDetails && (
          <div className="p-4 border-b border-gray-800 bg-gray-950/60 space-y-2 shrink-0">
            <h3 className="text-base font-semibold text-white tracking-wide truncate">
              {taskDetails.title}
            </h3>
            
            <div className="text-xs text-gray-300 bg-gray-900/80 border border-gray-800 p-2.5 rounded-lg max-h-28 overflow-y-auto leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 text-gray-400 font-semibold mb-1">
                <FileText className="w-3.5 h-3.5 text-blue-400" /> Description:
              </div>
              {taskDetails.description ? (
                <div 
                  className="prose prose-invert max-w-none text-xs"
                  dangerouslySetInnerHTML={{ __html: taskDetails.description }}
                />
              ) : (
                <p className="text-gray-500 italic">No description provided for this task.</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {taskDetails.priority && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700 text-gray-300 flex items-center gap-1 font-medium capitalize">
                  <AlertCircle className="w-3 h-3 text-yellow-400" /> Priority: {taskDetails.priority}
                </span>
              )}
              {taskDetails.dueDate && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700 text-gray-300 flex items-center gap-1 font-medium">
                  <Calendar className="w-3 h-3 text-blue-400" /> Due: {new Date(taskDetails.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tabs Switcher */}
        <div className="flex border-b border-gray-800 bg-gray-950/40 shrink-0">
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'activity'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <History className="w-4 h-4" /> Activity History
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'comments'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Comments ({comments.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'activity' ? (
            loading ? (
              <p className="text-center text-gray-400 py-6">Loading activities...</p>
            ) : logs.length === 0 ? (
              <p className="text-center text-gray-400 py-6">No activity logs found for this task.</p>
            ) : (
              logs.map((log) => (
                <div key={log._id || log.id} className="bg-gray-800/60 border border-gray-700/60 p-3 rounded-lg text-sm space-y-1">
                  <p className="text-gray-200 font-medium">
                    <span className="text-blue-400">{log.user?.name || 'Unknown User'}</span> {log.action}
                  </p>
                  <span className="text-[11px] text-gray-400 block">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )
          ) : (
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-center text-gray-400 py-6">No comments yet. Start the conversation!</p>
              ) : (
                comments.some((comment) => comment) && comments.map((comment) => (
                  <div key={comment._id || Math.random()} className="bg-gray-800/60 border border-gray-700/60 p-3 rounded-lg text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-400 font-semibold text-xs">{comment.user?.name || 'User'}</span>
                      <span className="text-[10px] text-gray-400">
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-gray-200 text-xs mt-1 leading-relaxed">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Input for Comments */}
        {activeTab === 'comments' && (
          <form onSubmit={handleAddComment} className="p-3 border-t border-gray-800 bg-gray-950 flex gap-2 shrink-0">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

exports = ActivityDrawer;
export default ActivityDrawer;
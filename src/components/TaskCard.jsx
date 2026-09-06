import { useState, useEffect } from 'react';
import { Calendar, Trash2, History, Paperclip, Download, X, User, MessageSquare } from 'lucide-react';
import ActivityDrawer from './ActivityDrawer';
import API from '../services/api';
import { socket } from '../services/socket'; // <-- Imported socket for real-time card updates

function TaskCard({ task, onDeleteTask, onDragStart, onTaskUpdated, userRole }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showUserPopover, setShowUserPopover] = useState(false);

  const taskId = task._id || task.id;
  const attachments = task.attachments || [];
  
  // Robust initial count getter for total comments
  const getInitialCount = () => {
    return Array.isArray(task.comments) 
      ? task.comments.length 
      : (Number(task.commentCount) || Number(task.commentsCount) || 0);
  };

  const [commentCount, setCommentCount] = useState(getInitialCount());
  const [unreadNewCount, setUnreadNewCount] = useState(0); // Sirf naye unread comments ka count track karne ke liye

  // Sync comment count when task props change safely using Math.max
  useEffect(() => {
    const updatedCount = Array.isArray(task.comments) 
      ? task.comments.length 
      : (Number(task.commentCount) || Number(task.commentCount) || 0);
    
    setCommentCount((prev) => Math.max(prev, updatedCount));
  }, [task]);

  // Real-time socket listener for comment badge updates on TaskCard
  useEffect(() => {
    const handleCommentAdded = (data) => {
      const targetTaskId = data.taskId || data.comment?.task;
      if (targetTaskId === taskId) {
        setCommentCount((prev) => prev + 1);
        if (!isDrawerOpen) {
          setUnreadNewCount((prev) => prev + 1); // Agar drawer band hai toh unread count badhao
        }
      }
    };

    socket.on('commentAdded', handleCommentAdded);

    return () => {
      socket.off('commentAdded', handleCommentAdded);
    };
  }, [taskId, isDrawerOpen]);

  const getRoleFromStorage = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        return parsed.role;
      }
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
    }
    return localStorage.getItem('role') || 'User';
  };

  const currentUserRole = userRole || getRoleFromStorage();
  const isAdminOrPM = ['Admin', 'Project Manager'].includes(currentUserRole);

  const priorityColors = {
    High: 'bg-red-500/10 text-red-400 border-red-500/30',
    Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    Low: 'bg-green-500/10 text-green-400 border-green-500/30',
  };

  const handleDownload = async (e, url, fileName) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'downloaded-file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      window.open(url, '_blank');
    }
  };

  const handleDeleteAttachment = async (e, attachmentId) => {
    e.stopPropagation();
    if (!isAdminOrPM) {
      alert('Only Admins or Project Managers can delete attachments.');
      return;
    }

    if (!window.confirm('Kya aap is file ko delete karna chahte hain?')) return;

    setDeletingId(attachmentId);
    try {
      const { data } = await API.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
      if (onTaskUpdated) {
        onTaskUpdated(data.data || data);
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to delete attachment:', err);
      alert(err.response?.data?.message || 'File delete nahi ho paayi');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div 
        draggable
        onDragStart={(e) => onDragStart(e, taskId)}
        onClick={() => {
          setIsDrawerOpen(true);
          setUnreadNewCount(0); // Drawer khulte hi unread badge reset ho jayega!
        }}
        className="bg-gray-900 border border-gray-700/80 rounded-lg p-4 mb-3 hover:border-gray-500 transition-all cursor-pointer active:cursor-grabbing shadow-sm group relative"
      >
        {/* Title, Priority & Actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-100">{task.title}</h3>
            {/* Red Pulse Notification for Unread Comments */}
            {unreadNewCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" title={`${unreadNewCount} new unread comments!`} />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${priorityColors[task.priority] || priorityColors.Low}`}>
              {task.priority}
            </span>

            {/* View Activity History */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsDrawerOpen(true);
                setUnreadNewCount(0);
              }}
              className="text-gray-400 hover:text-blue-400 transition-colors"
              title="View Activity History"
            >
              <History className="w-3.5 h-3.5" />
            </button>

            {/* Task Delete Icon (Only Admin / PM) */}
            {isAdminOrPM && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTask(taskId);
                }}
                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>

        {/* Assigned User Icon with Popover */}
        <div className="mb-3 pt-2 border-t border-gray-800 flex items-center justify-between relative">
          <span className="text-[11px] text-gray-500">Assignee:</span>
          {task.assignedTo ? (
            <div className="relative">
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserPopover(!showUserPopover);
                }}
                className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-blue-400 text-xs uppercase cursor-pointer hover:bg-blue-600/50 transition-colors"
                title="Click to view assignee details"
              >
                {task.assignedTo.name ? task.assignedTo.name.charAt(0) : 'U'}
              </div>

              {showUserPopover && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 bottom-8 z-20 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 text-xs text-gray-200"
                >
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-gray-700">
                    <span className="font-bold text-blue-400">{task.assignedTo.name}</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded uppercase">
                      {task.assignedTo.role || 'Developer'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[11px] truncate mb-2">{task.assignedTo.email}</p>
                  <button 
                    onClick={() => setShowUserPopover(false)}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-[10px] py-1 rounded text-gray-300 font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-gray-500 italic">
              <User className="w-3 h-3 text-gray-600" />
              <span>Unassigned</span>
            </div>
          )}
        </div>

        {/* Attachment Pill List */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {attachments.map((file, idx) => {
              const fileId = file._id || idx;
              return (
                <div 
                  key={fileId}
                  className="flex items-center gap-1.5 text-[11px] bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300"
                >
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-blue-400 hover:underline truncate max-w-[120px]"
                    title={file.fileName || 'Attachment'}
                  >
                    <Paperclip className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate">{file.fileName || `File ${idx + 1}`}</span>
                  </a>

                  <button
                    onClick={(e) => handleDownload(e, file.url, file.fileName)}
                    className="text-gray-400 hover:text-green-400 transition-colors p-0.5"
                    title="Download File"
                  >
                    <Download className="w-3 h-3" />
                  </button>

                  {isAdminOrPM && (
                    <button
                      onClick={(e) => handleDeleteAttachment(e, file._id)}
                      disabled={deletingId === file._id}
                      className="text-gray-400 hover:text-red-400 transition-colors p-0.5 disabled:opacity-50"
                      title="Delete Attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Card Footer: Timeline & Attachments/Unread Count */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-blue-400" />
              <span>{task.startDate ? new Date(task.startDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <span className="text-gray-600">➜</span>
            <div className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-orange-400" />
              <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}</span>
            </div>
          </div>

          {/* Right side indicators (Only Unread Comments Badge & Attachments count) */}
          <div className="flex items-center gap-3">
            {unreadNewCount > 0 && (
              <div className="flex items-center font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20" title={`${unreadNewCount} unread comments`}>
                <MessageSquare className="w-3 h-3 mr-1" />
                <span>+{unreadNewCount}</span>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="flex items-center text-gray-400 font-medium" title={`${attachments.length} Attachments`}>
                <Paperclip className="w-3 h-3 mr-1" />
                <span>{attachments.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ActivityDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        taskId={taskId}
        onCommentAdded={(newTotalCount) => {
          setCommentCount(newTotalCount);
        }}
      />
    </>
  );
}

export default TaskCard;
import { useState } from 'react';
import { X, Paperclip, Loader2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import API from '../services/api';

function TaskModal({ isOpen, onClose, onAddTask, projectId }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('To Do');
  const [startDate, setStartDate] = useState(''); // <-- 1. Start Date State Add ki
  const [dueDate, setDueDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const dummyProjectId = "66d48a8f1234567890abcdef";

      // 2. Payload mein startDate include kiya
      const payload = {
        title,
        description,
        priority,
        status,
        startDate, // <-- Yahan add kiya
        dueDate,
        project: projectId || dummyProjectId
      };

      const { data } = await API.post('/tasks', payload);
      const createdTask = data.data || data;

      // 3. File upload check
      if (selectedFile && createdTask._id) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        await API.post(`/tasks/${createdTask._id}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (onAddTask) onAddTask(createdTask);

      // Reset Form
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setStatus('To Do');
      setStartDate(''); // Reset Start Date
      setDueDate('');
      setSelectedFile(null);
      onClose();
    } catch (err) {
      console.error('Task creation / File upload failed:', err);
      alert(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg p-6 relative shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">Add New Task</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Task Title</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Design Landing Page"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Description (Rich Text)</label>
            <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden text-black [&_.ql-editor]:text-white [&_.ql-toolbar]:bg-gray-800 [&_.ql-toolbar]:border-gray-700 [&_.ql-container]:border-gray-700">
              <ReactQuill 
                theme="snow"
                value={description}
                onChange={setDescription}
                placeholder="Write task details, formatting, or markdown notes..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Priority</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Start Date & Due Date Fields Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Due Date</label>
              <input 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Attach File (Optional)</label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-900 border border-gray-700 hover:border-blue-500 px-3 py-2 rounded-lg text-xs text-gray-300 transition-all w-full">
                <Paperclip className="w-4 h-4 text-gray-400" />
                <span className="truncate">
                  {selectedFile ? selectedFile.name : 'Choose file...'}
                </span>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;
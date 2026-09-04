import { useState, useRef } from 'react';
import { Paperclip, Loader2, Bold, Italic, List } from 'lucide-react';
import API from '../services/api';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated, projectId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('To Do');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');         // User Email / ID input
  const [assignedToRole, setAssignedToRole] = useState(''); // Role Dropdown
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const editorRef = useRef(null);

  if (!isOpen) return null;

  const applyFormatting = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setDescription(editorRef.current.innerHTML);
    }
  };

  const handleAIGenerate = async () => {
    if (!title.trim()) {
      alert('Please enter a task title first!');
      return;
    }

    setAiLoading(true);
    try {
      const res = await API.post('/tasks/ai-subtasks', { prompt: title });
      const responseData = res.data.data || res.data.subtasks || res.data;
      let formattedText = '';

      if (Array.isArray(responseData)) {
        formattedText = `<ul>` + responseData.map((item) => `<li>${item}</li>`).join('') + `</ul>`;
      } else if (typeof responseData === 'string') {
        formattedText = `<p>${responseData}</p>`;
      } else {
        formattedText = `<pre>${JSON.stringify(responseData, null, 2)}</pre>`;
      }

      const updatedDesc = description 
        ? `${description}<br><br><strong>🤖 AI Subtasks:</strong><br>${formattedText}`
        : `<strong>🤖 AI Subtasks:</strong><br>${formattedText}`;

      setDescription(updatedDesc);
      if (editorRef.current) {
        editorRef.current.innerHTML = updatedDesc;
      }
    } catch (err) {
      console.error('AI Suggestion Error:', err);
      alert(err.response?.data?.message || 'Failed to fetch AI subtasks');
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dummyProjectId = "66d48a8f1234567890abcdef";

    try {
      const payload = {
        title,
        description,
        priority,
        status,
        startDate,
        dueDate,
        project: projectId || dummyProjectId,
        assignedTo: assignedTo.trim() || undefined,
        assignedRole: assignedToRole || undefined
      };

      const { data } = await API.post('/tasks', payload);
      const createdTask = data.data || data.task || data;

      if (selectedFile && createdTask._id) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        await API.post(`/tasks/${createdTask._id}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (onTaskCreated) onTaskCreated(createdTask);
      onClose();

      setTitle('');
      setDescription('');
      setPriority('Medium');
      setStatus('To Do');
      setStartDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setAssignedTo('');
      setAssignedToRole('');
      setSelectedFile(null);
    } catch (err) {
      console.error('Failed to create task:', err);
      alert(err.response?.data?.message || 'Task create nahi ho paaya.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-xl bg-gray-800 p-6 border border-gray-700 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-blue-400">Create New Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Task Title</label>
            <input
              type="text"
              required
              className="w-full rounded-lg bg-gray-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Implement JWT Refresh Token Strategy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Rich Text Editor */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm text-gray-400">Description (Rich Text)</label>
              <button
                type="button"
                onClick={handleAIGenerate}
                disabled={aiLoading}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded transition-all disabled:opacity-50"
              >
                {aiLoading ? '🤖 Generating...' : '✨ AI Breakdown'}
              </button>
            </div>
            
            <div className="flex items-center gap-1 bg-gray-900 px-2 py-1.5 border-t border-x border-gray-600 rounded-t-lg">
              <button type="button" onClick={() => applyFormatting('bold')} className="p-1.5 hover:bg-gray-700 rounded text-gray-300" title="Bold">
                <Bold className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => applyFormatting('italic')} className="p-1.5 hover:bg-gray-700 rounded text-gray-300" title="Italic">
                <Italic className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => applyFormatting('insertUnorderedList')} className="p-1.5 hover:bg-gray-700 rounded text-gray-300" title="Bullet List">
                <List className="w-4 h-4" />
              </button>
            </div>

            <div
              ref={editorRef}
              contentEditable
              onInput={(e) => setDescription(e.currentTarget.innerHTML)}
              className="w-full min-h-[120px] max-h-[200px] overflow-y-auto rounded-b-lg bg-gray-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 border-b border-x border-gray-600 text-sm [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5"
              placeholder="Detailed task description..."
            />
          </div>

          {/* Assign To (Email / ID) & Role Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Assign To (Email)</label>
              <input
                type="text"
                className="w-full rounded-lg bg-gray-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. user@gmail.com"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Assign To Role</label>
              <select
                value={assignedToRole}
                onChange={(e) => setAssignedToRole(e.target.value)}
                className="w-full rounded-lg bg-gray-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm"
              >
                <option value="">-- Select Role --</option>
                <option value="Developer">Developer</option>
                <option value="Tester">Tester</option>
                <option value="DevOps">DevOps</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                
              </select>
            </div>
          </div>

          {/* Dates Grid: Start Date & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                className="w-full rounded-lg bg-gray-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Due Date (Deadline)</label>
              <input
                type="date"
                required
                className="w-full rounded-lg bg-gray-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg bg-gray-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg bg-gray-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Attach File (Optional)</label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-xs text-gray-300 transition-all w-full border border-gray-600">
                <Paperclip className="w-4 h-4 text-gray-400" />
                <span className="truncate">
                  {selectedFile ? selectedFile.name : 'Choose file (JPG, PNG, PDF)...'}
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

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold transition-all disabled:opacity-50"
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
};

export default CreateTaskModal;
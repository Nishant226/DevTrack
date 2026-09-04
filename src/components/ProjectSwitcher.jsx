import { useState, useEffect } from 'react';
import API from '../services/api';
import { FolderKanban, Plus, ChevronDown, Trash2 } from 'lucide-react';
import { hasRole } from '../utils/auth';

const ProjectSwitcher = ({ currentProject, onProjectChange }) => {
  const [projects, setProjects] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Project Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  // Sirf Admin ya Project Manager hi project create ya delete kar sakte hain
  const canManageProject = hasRole(['Admin', 'Project Manager']);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await API.get('/projects');
      // Backend response structure ke mutabiq projects array extract karna
      const projectList = Array.isArray(data) ? data : data.projects || data.data || [];
      setProjects(projectList);
      
      // Auto-select first project if no project is currently selected
      if (projectList.length > 0 && !currentProject) {
        onProjectChange(projectList[0]);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setLoading(true);
      const { data } = await API.post('/projects', {
        title,
        description,
        deadline,
      });

      const newProject = data.project || data.data || data;
      setProjects((prev) => [...prev, newProject]);
      onProjectChange(newProject);
      setIsModalOpen(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setDeadline('');
    } catch (err) {
      console.error('Failed to create project:', err);
      alert(err.response?.data?.message || 'Project creation failed');
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE PROJECT HANDLER ---
  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation(); // Dropdown close hone se rokne ke liye jab trash icon par click ho

    if (!window.confirm("Are you sure you want to delete this project? All associated tasks will be permanently removed.")) {
      return;
    }

    try {
      await API.delete(`/projects/${projectId}`);

      // State se project remove karein
      const updatedProjects = projects.filter((p) => p._id !== projectId);
      setProjects(updatedProjects);

      // Agar deleted project hi current active project tha, toh naya project select karein ya null karein
      if (currentProject?._id === projectId) {
        onProjectChange(updatedProjects.length > 0 ? updatedProjects[0] : null);
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert(err.response?.data?.message || 'Project deletion failed');
    }
  };

  return (
    <div className="relative">
      {/* Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700/80 border border-gray-700 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-colors"
      >
        <FolderKanban className="w-4 h-4 text-blue-400" />
        <span className="max-w-[150px] truncate">
          {currentProject?.title || (projects.length > 0 ? projects[0].title : 'Select Project')}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-800">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">Projects</p>
          </div>

          <div className="max-h-60 overflow-y-auto p-1 space-y-1">
            {projects.length === 0 ? (
              <p className="text-xs text-gray-500 p-2 text-center">No projects found</p>
            ) : (
              projects.map((proj) => (
                <div
                  key={proj._id}
                  onClick={() => {
                    onProjectChange(proj);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between cursor-pointer group ${
                    currentProject?._id === proj._id
                      ? 'bg-blue-600/10 text-blue-400 font-semibold border border-blue-500/20'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <span className="truncate flex-1 pr-2">{proj.title}</span>
                  
                  <div className="flex items-center gap-2">
                    {/* Delete Button (Sirf Admin / PM ke liye visible hoga) */}
                    {canManageProject && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProject(e, proj._id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 p-1 transition-opacity"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {currentProject?._id === proj._id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sirf authorized users (Admin / Project Manager) ko create button dikhega */}
          {canManageProject && (
            <div className="p-2 border-t border-gray-800 bg-gray-950/40">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create New Project
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && canManageProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl bg-gray-900 p-6 border border-gray-800 shadow-2xl text-white space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-blue-400">Create New Project</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. DevTrack Pro v2"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Project overview..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-xs hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSwitcher;
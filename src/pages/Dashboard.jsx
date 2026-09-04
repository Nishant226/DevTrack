import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import CreateTaskModal from '../components/CreateTaskModal';
import ProjectSwitcher from '../components/ProjectSwitcher';
import AdminUsers from '../components/AdminUsers'; // <-- Added AdminUsers import
import { hasRole } from "../utils/auth";
import API from '../services/api';
import { Calendar, FileText, User, Moon, Sun, Trash2, LogOut, X, Shield } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [currentView, setCurrentView] = useState('board');
  
  // Dropdown & Feature States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-select first project on page load
  useEffect(() => {
    const fetchInitialProject = async () => {
      try {
        const { data } = await API.get('/projects');
        const projectList = Array.isArray(data) ? data : data.data || [];
        if (projectList.length > 0 && !currentProject) {
          setCurrentProject(projectList[0]);
        }
      } catch (err) {
        console.error('Failed to load initial project:', err);
      }
    };

    fetchInitialProject();
  }, []);

  const handleTaskCreated = (createdTask) => {
    setNewTask(createdTask);
  };

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("⚠️ Are you sure you want to delete your account? All your data and tasks will be permanently removed.")) {
      try {
        await API.delete('/auth/delete');
        alert("Account successfully deleted.");
        logout();
      } catch (err) {
        console.error("Failed to delete account", err);
        alert(err.response?.data?.message || "Failed to delete account. Please try again.");
      }
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <header className={`flex flex-col md:flex-row justify-between items-start md:items-center px-8 py-4 border-b gap-4 relative transition-colors ${theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-blue-500">DevTrack Pro</h1>
            <ProjectSwitcher 
              currentProject={currentProject} 
              onProjectCheck={(proj) => setCurrentProject(proj)}
              onProjectChange={(proj) => setCurrentProject(proj)} 
            />
          </div>

          {currentProject && currentView !== 'users' && (
            <div className={`hidden lg:flex flex-col border-l pl-6 py-0.5 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-xs font-medium max-w-xs truncate flex items-center gap-1.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{currentProject.description || 'No description provided'}</span>
              </p>
              {currentProject.deadline && (
                <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Deadline: {new Date(currentProject.deadline).toLocaleDateString()}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* View Switcher Tabs (Board vs Analytics vs Admin Users) */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className={`flex gap-1 p-1 rounded-lg border ${theme === 'dark' ? 'bg-gray-900/60 border-gray-700' : 'bg-gray-200 border-gray-300'}`}>
            <button
              onClick={() => setCurrentView('board')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                currentView === 'board' ? 'bg-blue-600 text-white' : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Kanban Board
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                currentView === 'analytics' ? 'bg-blue-600 text-white' : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📈 Analytics
            </button>
            
            {/* Admin Only Tab */}
            {hasRole(['Admin']) && (
              <button
                onClick={() => setCurrentView('users')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  currentView === 'users' ? 'bg-purple-600 text-white' : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👥 User Roles
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {hasRole(['Admin', 'Project Manager']) && currentView !== 'users' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all"
              >
                + New Task
              </button>
            )}
            
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center space-x-2 focus:outline-none px-3 py-1.5 rounded-full transition cursor-pointer ${theme === 'dark' ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
                </div>
                <span className="text-xs font-medium hidden sm:inline">
                  {user?.name || 'Ravi'}
                </span>
              </button>

              {isDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-52 border rounded-lg shadow-xl py-2 z-50 ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                  <div className={`px-4 py-2 border-b text-xs truncate ${theme === 'dark' ? 'border-gray-800 text-gray-400' : 'border-gray-100 text-gray-500'}`}>
                    Signed in as <span className={`font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{user?.email || 'ravi@example.com'}</span>
                  </div>

                  <button
                    onClick={() => { setIsDropdownOpen(false); setIsProfileModalOpen(true); }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center space-x-2.5 ${theme === 'dark' ? 'hover:bg-gray-800 hover:text-white' : 'hover:bg-gray-100 hover:text-black'}`}
                  >
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={() => { setIsDropdownOpen(false); handleToggleTheme(); }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center space-x-2.5 ${theme === 'dark' ? 'hover:bg-gray-800 hover:text-white' : 'hover:bg-gray-100 hover:text-black'}`}
                  >
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-purple-600" />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <div className={`border-t my-1 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}></div>

                  <button
                    onClick={() => { setIsDropdownOpen(false); handleDeleteAccount(); }}
                    className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-950/50 hover:text-red-300 flex items-center space-x-2.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Delete Account</span>
                  </button>

                  <button
                    onClick={() => { setIsDropdownOpen(false); logout(); }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center space-x-2.5 ${theme === 'dark' ? 'hover:bg-gray-800 hover:text-white' : 'hover:bg-gray-100 hover:text-black'}`}
                  >
                    <LogOut className="w-3.5 h-3.5 text-gray-400" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        {currentView === 'users' ? (
          <AdminUsers />
        ) : currentProject ? (
          currentView === 'board' ? (
            <KanbanBoard newTask={newTask} projectId={currentProject._id} />
          ) : (
            <AnalyticsDashboard projectId={currentProject._id} />
          )
        ) : (
          <div className="p-6 text-gray-400 text-center">Loading project details...</div>
        )}
      </main>

      {/* View Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md border rounded-xl shadow-2xl p-6 relative ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <button 
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
              </div>
              <h3 className="text-lg font-bold">{user?.name || 'Ravi'}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email || 'ravi123@gmail.com'}</p>
            </div>

            <div className={`mt-6 border-t pt-4 space-y-3 text-sm ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-800/30">
                <span className="text-gray-400 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-400" /> Role</span>
                <span className="font-semibold text-blue-400">{user?.role || 'Developer'}</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-800/30">
                <span className="text-gray-400">Account Status</span>
                <span className="font-semibold text-emerald-400">Active</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={handleTaskCreated}
        projectId={currentProject?._id}
      />
    </div>
  );
};

export default Dashboard;
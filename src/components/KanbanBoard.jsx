import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import API from '../services/api';
import { socket } from '../services/socket';
import TaskCard from './TaskCard';

const COLUMNS = ['To Do', 'In Progress', 'In Review', 'Completed'];

const KanbanBoard = ({ newTask, projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'priority'
  
  // Pagination States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const limit = 10; // Per page task limit

  useEffect(() => {
    // Agar projectId available nahi hai toh tasks clear karke return ho jayein
    if (!projectId) {
      setTasks([]);
      setHasMore(false);
      return;
    }

    setPage(1);
    fetchTasks(1, true);

    if (!socket.connected) {
      socket.connect();
    }

    // Project-specific socket room join karein
    socket.emit('joinProject', projectId);

    // Real-time handlers: Sirf current project ID waale tasks add/update karein
    const handleTaskCreated = (createdTask) => {
      if (!createdTask || !createdTask._id) return;
      const taskProjId = createdTask.project?._id || createdTask.project;
      if (taskProjId === projectId) {
        setTasks((prev) => {
          if (prev.some((t) => t._id === createdTask._id)) return prev;
          return [createdTask, ...prev];
        });
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      if (!updatedTask || !updatedTask._id) return;
      const taskProjId = updatedTask.project?._id || updatedTask.project;
      if (taskProjId === projectId) {
        setTasks((prev) =>
          prev.map((t) => (t._id === updatedTask._id ? { ...t, ...updatedTask } : t))
        );
      }
    };

    const handleTaskDeleted = (deletedTaskId) => {
      if (!deletedTaskId) return;
      setTasks((prev) => prev.filter((t) => t._id !== deletedTaskId));
    };

    socket.on('taskCreated', handleTaskCreated);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskDeleted', handleTaskDeleted);

    return () => {
      socket.emit('leaveProject', projectId);
      socket.off('taskCreated', handleTaskCreated);
      socket.off('taskUpdated', handleTaskUpdated);
      socket.off('taskDeleted', handleTaskDeleted);
    };
  }, [projectId]);

  // Modals ya components se manual append check
  useEffect(() => {
    if (newTask && newTask._id) {
      const taskProjId = newTask.project?._id || newTask.project;
      if (taskProjId === projectId) {
        setTasks((prev) => {
          if (prev.some((t) => t._id === newTask._id)) return prev;
          return [newTask, ...prev];
        });
      }
    }
  }, [newTask, projectId]);

  const fetchTasks = async (pageNum = 1, isReset = false) => {
    if (!projectId) return;
    try {
      if (!isReset) setIsLoadingMore(true);

      // Backend API call with pagination support (page, limit)
      const { data } = await API.get(`/tasks?project=${projectId}&page=${pageNum}&limit=${limit}`);
      
      const taskList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.tasks)
        ? data.tasks
        : [];

      // Filter to enforce strict project matching
      const filteredTasks = taskList.filter((t) => {
        const tProjId = t.project?._id || t.project;
        return tProjId === projectId;
      });

      setTasks((prev) => {
        let updatedList;
        if (isReset) {
          updatedList = filteredTasks;
        } else {
          const existingIds = new Set(prev.map((t) => t._id));
          const uniqueNewTasks = filteredTasks.filter((t) => !existingIds.has(t._id));
          updatedList = [...prev, ...uniqueNewTasks];
        }

        // Fix: Agar fetched tasks ki length 0 hai ya limit se kam hai, toh hasMore ko false karein
        if (filteredTasks.length === 0 || filteredTasks.length < limit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        return updatedList;
      });
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      if (isReset) setTasks([]);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadMoreTasks = () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTasks(nextPage, false);
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const newStatus = destination.droppableId;

    setTasks((prev) =>
      prev.map((t) => (t._id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      await API.patch(`/tasks/${draggableId}/status`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update task status:', err);
      fetchTasks(1, true);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await API.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 border border-dashed border-gray-700 rounded-xl">
        <p>Select a project from the top dropdown to view its tasks.</p>
      </div>
    );
  }

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Advanced Filtering & Search logic
  const filteredTasks = safeTasks.filter((t) => {
    const matchesSearch = 
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = 
      priorityFilter === 'all' || 
      t.priority?.toLowerCase() === priorityFilter.toLowerCase();

    return matchesSearch && matchesPriority;
  });

  // Sorting Logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    } else if (sortBy === 'priority') {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const pA = priorityWeight[a.priority?.toLowerCase()] || 0;
      const pB = priorityWeight[b.priority?.toLowerCase()] || 0;
      return pB - pA;
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Search, Filter & Sorting Bar */}
      <div className="px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="🔍 Search tasks by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800/80 border border-gray-700 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full sm:w-auto bg-gray-800/80 border border-gray-700 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
          >
            <option value="all">⚡ All Priorities</option>
            <option value="high">🔴 High Priority</option>
            <option value="medium">🟡 Medium Priority</option>
            <option value="low">🟢 Low Priority</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto bg-gray-800/80 border border-gray-700 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
          >
            <option value="newest">⏳ Sort: Newest First</option>
            <option value="oldest">⌛ Sort: Oldest First</option>
            <option value="priority">🔥 Sort: By Priority</option>
          </select>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
          {COLUMNS.map((col) => {
            const columnTasks = sortedTasks.filter((t) => t && t.status === col);

            return (
              <Droppable key={col} droppableId={col}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-4 rounded-xl border transition-colors ${
                      snapshot.isDraggingOver
                        ? 'bg-gray-800/90 border-blue-500/50'
                        : 'bg-gray-800/60 border-gray-700/50'
                    } backdrop-blur-sm min-h-[500px]`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-200">{col}</h3>
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full font-bold">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {columnTasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                            >
                              <TaskCard 
                                task={task} 
                                onDeleteTask={handleDeleteTask} 
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {/* Load More Pagination Button */}
      {hasMore && (
        <div className="flex justify-center pb-6">
          <button
            onClick={loadMoreTasks}
            disabled={isLoadingMore}
            className="bg-gray-800 hover:bg-gray-700 text-blue-400 border border-gray-700 px-6 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          >
            {isLoadingMore ? 'Loading more tasks...' : 'Load More Tasks ⬇️'}
          </button>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import TaskCard from './TaskCard'
import TaskModal from './TaskModal'
import { hasRole } from '../utils/auth'

const INITIAL_TASKS = [
  { id: '1', title: 'Setup Database Schema', description: 'Design PostgreSQL tables.', status: 'To Do', priority: 'High', dueDate: 'Sep 2' },
  { id: '2', title: 'Implement Authentication', description: 'Create JWT auth endpoints.', status: 'In Progress', priority: 'Medium', dueDate: 'Sep 5' },
  { id: '3', title: 'Project Structure Setup', description: 'Initialize Vite + React project.', status: 'Done', priority: 'Low', dueDate: 'Aug 31' }
]

function Board({ searchQuery }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('devtrack_tasks')
    return savedTasks ? JSON.parse(savedTasks) : INITIAL_TASKS
  })

  useEffect(() => {
    localStorage.setItem('devtrack_tasks', JSON.stringify(tasks))
  }, [tasks])

  const columns = ['To Do', 'In Progress', 'Done']

  const handleAddTask = (newTask) => {
    setTasks(prev => [...prev, newTask])
  }

  const handleDeleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetColumn) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return { ...task, status: targetColumn }
      }
      return task
    }))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Project Board</h1>
          <p className="text-xs text-gray-400 mt-1">Manage and track team tasks</p>
        </div>
        
        {hasRole(['Admin', 'Project Manager']) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column, index) => {
          const columnTasks = tasks.filter(t => {
            const matchesStatus = t.status === column
            const matchesSearch = 
              t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              t.description.toLowerCase().includes(searchQuery.toLowerCase())
            
            return matchesStatus && matchesSearch
          })

          return (
            <div 
              key={index} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column)}
              className="bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-[500px] transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center justify-between">
                <span>{column}</span>
                <span className="text-xs bg-gray-700 text-gray-300 px-2.5 py-0.5 rounded-full font-medium">
                  {columnTasks.length}
                </span>
              </h2>

              <div className="space-y-3 min-h-[400px]">
                {columnTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onDeleteTask={handleDeleteTask}
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={handleAddTask}
      />
    </div>
  )
}

export default Board
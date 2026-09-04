import React, { useState, useRef, useEffect } from 'react'
import { Search, Bell, LayoutDashboard, User, Moon, Trash2, LogOut } from 'lucide-react'

function Navbar({ searchQuery, setSearchQuery, user, onOpenProfile, onToggleTheme, onDeleteAccount, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [],)

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between relative">
      <div className="flex items-center space-x-3">
        <LayoutDashboard className="w-6 h-6 text-blue-500" />
        <span className="text-xl font-bold text-white">DevTrack Pro</span>
      </div>

      <div className="relative w-1/3">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks by title or description..." 
          className="w-full bg-gray-900 text-gray-200 text-sm rounded-lg pl-10 pr-4 py-2 border border-gray-700 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex items-center space-x-4">
        <button className="text-gray-400 hover:text-white p-2 rounded-lg bg-gray-700/50">
          <Bell className="w-5 h-5" />
        </button>

        {/* Profile Avatar & Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 focus:outline-none bg-gray-700/50 hover:bg-gray-700 px-3 py-1.5 rounded-full transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
            </div>
            <span className="text-sm font-medium text-gray-200">
              {user?.name || 'Ravi'}
            </span>
          </button>

          {/* Dropdown Options */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-800 text-xs text-gray-400">
                Signed in as <span className="font-semibold text-gray-200">{user?.email || 'ravi@example.com'}</span>
              </div>

              <button
                onClick={() => { setIsOpen(false); onOpenProfile && onOpenProfile(); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center space-x-2.5"
              >
                <User className="w-4 h-4 text-blue-400" />
                <span>View Profile</span>
              </button>

              <button
                onClick={() => { setIsOpen(false); onToggleTheme && onToggleTheme(); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center space-x-2.5"
              >
                <Moon className="w-4 h-4 text-purple-400" />
                <span>Toggle Theme</span>
              </button>

              <div className="border-t border-gray-800 my-1"></div>

              <button
                onClick={() => { setIsOpen(false); onDeleteAccount && onDeleteAccount(); }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-950/50 hover:text-red-300 flex items-center space-x-2.5"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Delete Account</span>
              </button>

              <button
                onClick={() => { setIsOpen(false); onLogout && onLogout(); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center space-x-2.5"
              >
                <LogOut className="w-4 h-4 text-gray-400" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
import { useState, useEffect } from 'react';
import API from '../services/api';
import { Loader2, ShieldAlert, UserCheck } from 'lucide-react';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Saare users fetch karna
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/users');
      setUsers(data.data || data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.message || 'Failed to load users. Make sure you are logged in as Admin.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Role change handler
  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await API.put(`/users/${userId}/role`, { role: newRole });
      
      // Agar backend se naya token aaya hai, toh use save kar lo
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      alert(`User role successfully updated to ${newRole}!`);
      
      // Local state update taaki list instant update ho
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      
      // Page reload taaki permissions aur features properly sync ho jayein
      window.location.reload();
    } catch (err) {
      console.error('Failed to update role:', err);
      alert(err.response?.data?.message || 'Failed to update user role');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 text-white">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-700/50 rounded-xl text-red-300 flex items-center gap-3">
        <ShieldAlert className="w-6 h-6 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl text-white shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" /> Admin User Management
          </h2>
          <p className="text-xs text-gray-400 mt-1">Manage user roles and grant administrative access securely.</p>
        </div>
        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-3 py-1 rounded-full font-medium">
          Total Users: {users.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Current Role</th>
              <th className="py-3 px-4">Change Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-sm">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-200">{user.name}</td>
                <td className="py-3 px-4 text-gray-400">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${
                    user.role === 'Admin' 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : user.role === 'Project Manager'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {user.role === 'Admin' ? (
                    <span className="text-xs text-gray-500 italic bg-gray-800/40 px-3 py-1.5 rounded-lg border border-gray-800">
                      Protected (Cannot change)
                    </span>
                  ) : (
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="Developer">Developer</option>
                      <option value="Tester">Tester</option>
                      <option value="DevOps">DevOps</option>
                      <option value="UI/UX Designer">UI/UX Designer</option>
                     
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsers;
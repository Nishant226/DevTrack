import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/auth/forgotpassword', { email });
      toast.success(data.message || 'Password reset link sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-96 space-y-4 shadow-xl">
        <h2 className="text-xl font-bold text-center">Forgot Password</h2>
        <p className="text-xs text-gray-400 text-center">
          Enter your registered email address and we will send you a link to reset your password.
        </p>
        
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-xs text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded text-xs font-semibold transition disabled:opacity-50"
        >
          {loading ? 'Sending link...' : 'Send Reset Link'}
        </button>

        <div className="text-center mt-4">
          <Link to="/login" className="text-xs text-blue-400 hover:underline">
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
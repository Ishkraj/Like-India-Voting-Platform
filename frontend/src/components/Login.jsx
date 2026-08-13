import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const navigate = useNavigate();
  const location = useLocation();

  // URL check karke automatic toggle karega (Login vs Signup)
  useEffect(() => {
    if (location.pathname === '/signup') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [location]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // 1. Signup Request
  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return alert("Passwords do not match!");
    try {
      await axios.post('http://localhost:5000/api/signup', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      alert("OTP sent to your email!");
      setShowOtp(true);
    } catch (error) {
      alert(error.response?.data?.message || "Error in signup");
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/verify-signup', { email: formData.email, otp });
      alert("Account verified! Jai Hind. Please login now.");
      setShowOtp(false);
      setIsLogin(true);
      navigate('/');
    } catch (error) {
      alert("Invalid or expired OTP");
    }
  };

  // 3. Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', {
        username: formData.username,
        password: formData.password
      });
      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('username', res.data.username);
      navigate('/home');
    } catch (error) {
      alert(error.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-white to-green-600"></div>
      
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-t-orange-500 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="text-green-600">L</span>
            <span className="text-blue-900">IKE</span>
            <span className="text-green-600"> INDIA</span>
          </h1>
          <h2 className="text-xl font-bold text-orange-600 mt-2">Talent Competition 2026</h2>
          <p className="text-sm font-semibold text-blue-900 mt-1 uppercase tracking-widest border-b-2 border-green-600 inline-block pb-1">
            Power of Democracy
          </p>
        </div>

        {showOtp ? (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
            <h3 className="text-lg font-bold text-center text-blue-900 mb-2">Verify Your Email</h3>
            <input 
              type="text" 
              placeholder="Enter 6-digit OTP" 
              required
              className="border-2 border-gray-200 p-3 rounded-lg focus:outline-none focus:border-green-500 text-center text-xl tracking-widest font-bold" 
              onChange={(e) => setOtp(e.target.value)} 
            />
            <button type="submit" className="bg-green-600 text-white p-3 rounded-lg font-bold text-lg hover:bg-green-700 transition shadow-md">
              Verify OTP
            </button>
          </form>
        ) : (
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="flex flex-col gap-4">
            <input 
              type="text" name="username" placeholder="Username" required
              className="border-2 border-gray-200 p-3 rounded-lg focus:outline-none focus:border-orange-500 font-medium" 
              onChange={handleChange} 
            />
            {!isLogin && (
              <input 
                type="email" name="email" placeholder="Email Address" required
                className="border-2 border-gray-200 p-3 rounded-lg focus:outline-none focus:border-orange-500 font-medium" 
                onChange={handleChange} 
              />
            )}
            <input 
              type="password" name="password" placeholder="Password" required
              className="border-2 border-gray-200 p-3 rounded-lg focus:outline-none focus:border-orange-500 font-medium" 
              onChange={handleChange} 
            />
            {!isLogin && (
              <input 
                type="password" name="confirmPassword" placeholder="Confirm Password" required
                className="border-2 border-gray-200 p-3 rounded-lg focus:outline-none focus:border-orange-500 font-medium" 
                onChange={handleChange} 
              />
            )}
            <button type="submit" className="bg-blue-900 text-white p-3 rounded-lg font-bold text-lg hover:bg-blue-800 transition shadow-md mt-2">
              {isLogin ? 'Login to Vote' : 'Register Now'}
            </button>
          </form>
        )}

        {!showOtp && (
          <p className="mt-6 text-center text-sm text-gray-600 font-medium">
            {isLogin ? "Be a voice. Be a change. " : "Already registered? "}
            <span 
              className="text-orange-600 cursor-pointer font-extrabold hover:underline uppercase" 
              onClick={() => navigate(isLogin ? '/signup' : '/')}
            >
              {isLogin ? 'Register Here' : 'Login Here'}
            </span>
          </p>
        )}
      </div>
      
      <p className="mt-8 text-blue-900 font-bold tracking-widest text-sm text-center">
        ★★★ JAI HIND! <span className="mx-2">🇮🇳</span> JAI BHARAT! ★★★
      </p>
    </div>
  );
}
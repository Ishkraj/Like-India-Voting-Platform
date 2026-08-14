import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://like-india-voting-platform.onrender.com/api/login', { phoneNumber, password });
      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('loginExpiry', Date.now() + 24 * 60 * 60 * 1000);
      navigate('/home');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col justify-center items-center p-4 relative pb-20">
      
      <form onSubmit={handleLogin} className="bg-white px-6 py-10 rounded-3xl shadow-2xl flex flex-col gap-6 w-full max-w-md border-t-8 border-orange-500 mt-4">
        
        {/* Old Premium Headings */}
        <div className="text-center mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight mb-1">
            <span className="text-green-600">LIKE</span> <span className="text-blue-900">INDIA</span>
          </h1>
          <h2 className="text-xl font-bold text-orange-600">
            Talent Competition 2026
          </h2>
          <div className="inline-block border-b-4 border-green-600 pb-1 mt-2">
            <h3 className="text-sm font-bold text-blue-900 tracking-widest uppercase">
              Power of Democracy
            </h3>
          </div>
        </div>

        {/* Inputs styled like the old design */}
        <input 
          type="tel" 
          placeholder="Phone Number" 
          required 
          maxLength="10"
          value={phoneNumber} 
          onChange={(e) => setPhoneNumber(e.target.value)} 
          className="p-4 border-2 border-gray-200 rounded-xl focus:border-blue-900 outline-none text-gray-700 font-semibold text-lg transition-all" 
        />
        
        <input 
          type="password" 
          placeholder="Password" 
          required 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="p-4 border-2 border-gray-200 rounded-xl focus:border-blue-900 outline-none text-gray-700 font-semibold text-lg transition-all" 
        />
        
        {/* Old Button Style */}
        <button type="submit" className="bg-blue-900 text-white p-4 rounded-xl font-bold text-xl hover:bg-blue-800 transition shadow-lg mt-2">
          Login to Vote
        </button>
        
        {/* Old Register Link Style */}
        <div className="text-center mt-2 text-sm font-medium text-gray-700">
          Be a voice. Be a change. <Link to="/signup" className="text-orange-600 font-extrabold hover:underline">REGISTER HERE</Link>
        </div>
      </form>

      {/* Jai Hind Footer Note */}
      <div className="absolute bottom-8 left-0 w-full text-center">
        <p className="text-blue-900 font-extrabold text-sm tracking-widest">
          ★★★ JAI HIND! 🇮🇳 JAI BHARAT! ★★★
        </p>
      </div>
      
    </div>
  );
}
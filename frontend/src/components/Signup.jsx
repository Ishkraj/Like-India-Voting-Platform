import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // 🌟 CHECK: Agar user pehle se logged in hai, toh direct Home pe bhejo
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const expiryTime = localStorage.getItem('loginExpiry');
    if (userId && expiryTime && Date.now() < parseInt(expiryTime)) {
      navigate('/home');
    }
  }, [navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();

    // 10-Digit Validation Check 
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert("⚠️ Phone number must be exactly 10 digits long and contain only numbers!");
      return;
    }

    try {
      // Purana data saaf kar do taaki conflict na ho
      localStorage.removeItem('userId');
      localStorage.removeItem('loginExpiry');

      const res = await axios.post('https://like-india-voting-platform.onrender.com/api/signup', { name, phoneNumber, password });
      
      // 🌟 Auto-Login: Backend se mili user ID save karo aur Home pe bhejo
      if (res.data.userId) {
        localStorage.setItem('userId', res.data.userId);
        localStorage.setItem('loginExpiry', Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry
        navigate('/home');
      } else {
        // Agar backend se ID nahi aayi (fallback), toh login pe bhejo
        alert(res.data.message);
        navigate('/login');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col justify-center items-center p-4 relative pb-20">
      
      <form onSubmit={handleSignup} className="bg-white px-6 py-10 rounded-3xl shadow-2xl flex flex-col gap-6 w-full max-w-md border-t-8 border-orange-500 mt-4">
        
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
          type="text" 
          placeholder="Username" 
          required 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="p-4 border-2 border-gray-200 rounded-xl focus:border-blue-900 outline-none text-gray-700 font-semibold text-lg transition-all" 
        />
        
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
          placeholder="Create your new Password" 
          required 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="p-4 border-2 border-gray-200 rounded-xl focus:border-blue-900 outline-none text-gray-700 font-semibold text-lg transition-all" 
        />
        
        {/* Old Button Style */}
        <button type="submit" className="bg-blue-900 text-white p-4 rounded-xl font-bold text-xl hover:bg-blue-800 transition shadow-lg mt-2">
          Register Now
        </button>
        
        {/* Old Login Link Style */}
        <div className="text-center mt-2 text-sm font-medium text-gray-700">
          Already registered? <Link to="/login" className="text-orange-600 font-extrabold hover:underline">LOGIN HERE</Link>
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
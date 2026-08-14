import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import VotingDashboard from './components/VotingDashboard';
import CreateCompetition from './components/CreateCompetition';
import Results from './components/Results';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EditCompetition from './components/EditCompetition';

// 🌟 AUTO-REDIRECT WRAPPER: Agar user logged in hai, toh wapas auth pages par nahi jane dega
const PublicRoute = ({ children }) => {
  const userId = localStorage.getItem('userId');
  const expiryTime = localStorage.getItem('loginExpiry');
  
  // Check: ID hai aur 24 hours expire nahi hue hain
  if (userId && expiryTime && Date.now() < parseInt(expiryTime)) {
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar /> 
        
        <div className="flex-grow">
          <Routes>
            {/* 🌟 Root, Login, aur Signup par PublicRoute laga diya */}
            <Route path="/" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} /> 
            
            {/* Baaki routes normally rahenge */}
            <Route path="/home" element={<Home />} />
            <Route path="/create" element={<CreateCompetition />} />
            <Route path="/edit/:id" element={<EditCompetition />} />
            <Route path="/vote/:id" element={<VotingDashboard />} />
            <Route path="/results/:id" element={<Results />} /> 
            <Route path="/results" element={<Results />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
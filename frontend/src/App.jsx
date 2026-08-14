import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup'; // <-- Ye naya import add kiya
import Home from './components/Home';
import VotingDashboard from './components/VotingDashboard';
import CreateCompetition from './components/CreateCompetition';
import Results from './components/Results';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EditCompetition from './components/EditCompetition';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar /> 
        
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} /> 
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
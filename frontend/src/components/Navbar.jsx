import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    navigate('/');
  };

  return (
    <nav className="bg-blue-900 text-white shadow-md py-3 px-4 sticky top-0 z-50 border-b-4 border-orange-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo / Brand Name */}
        <Link to={userId ? "/home" : "/"} className="flex items-center gap-2">
          <span className="font-black text-lg md:text-xl tracking-wider leading-tight">
            <span className="text-orange-500">L</span>IKE{' '}
            <span className="text-green-500">INDIA</span>
            <span className="block text-[10px] text-gray-300 font-semibold tracking-widest uppercase">
              Voting Platform
            </span>
          </span>
        </Link>

        {/* Navigation / Auth Buttons */}
        <div className="flex items-center gap-2">
          {userId ? (
            <>
              <Link to="/home" className="bg-orange-500 hover:bg-orange-600 text-white text-xs md:text-sm font-bold px-3 py-1.5 rounded-lg transition shadow">
                Home
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm font-bold px-3 py-1.5 rounded-lg transition shadow"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/" className="bg-orange-500 hover:bg-orange-600 text-white text-xs md:text-sm font-bold px-3 py-1.5 rounded-lg transition shadow">
                Login
              </Link>
              <Link to="/signup" className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm font-bold px-3 py-1.5 rounded-lg transition shadow">
                Signup
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
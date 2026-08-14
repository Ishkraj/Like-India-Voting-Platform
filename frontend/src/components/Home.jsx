import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [competitions, setCompetitions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [selectedCompId, setSelectedCompId] = useState(null);
  const [inputPassword, setInputPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const res = await axios.get(`https://like-india-voting-platform.onrender.com/api/competitions`);
      setCompetitions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (type, id = null) => {
    setModalType(type);
    setSelectedCompId(id);
    setInputPassword('');
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!inputPassword) return;

    const actionType = modalType === 'vote' ? 'open' : 'admin';

    try {
      await axios.post(`https://like-india-voting-platform.onrender.com/api/verify-password`, { 
        action: actionType, 
        password: inputPassword 
      });

      if (modalType === 'create') {
        setModalOpen(false);
        navigate('/create');
      } 
      else if (modalType === 'edit') {
        setModalOpen(false);
        navigate(`/edit/${selectedCompId}`);
      } 
      else if (modalType === 'end') {
        await axios.post(`https://like-india-voting-platform.onrender.com/api/end-voting/${selectedCompId}`);
        setModalOpen(false);
        fetchCompetitions();
        setTimeout(() => alert("🛑 Voting has been ended successfully!"), 100);
      } 
      else if (modalType === 'vote') {
        await axios.post(`https://like-india-voting-platform.onrender.com/api/open-voting/${selectedCompId}`);
        setModalOpen(false);
        navigate(`/vote/${selectedCompId}`);
      }
      else if (modalType === 'results') {
        setModalOpen(false);
        navigate(`/results/${selectedCompId}`);
      }
    } catch (error) {
        console.error("Full Error:", error);
        alert(error.response?.data?.message || "❌ Incorrect Password!");
    }
  };

  return (
    <div className="min-h-[80vh] bg-orange-50 p-8 relative">
      <h1 className="text-3xl font-extrabold text-blue-900 text-center mb-8 uppercase">Your Competitions</h1>
      
      {competitions.length === 0 ? (
        <div className="text-center text-gray-600 font-medium mt-10">
          <p className="text-xl">No competitions found!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {competitions.map(comp => (
            <div key={comp._id} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500 hover:shadow-2xl transition flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{comp.name}</h2>
                <p className="text-gray-600 mb-4">{comp.numParticipants} Participants</p>
                <p className="text-sm font-semibold mb-6">
                  Status: {comp.isActive ? <span className="text-green-600">🟢 Active</span> : <span className="text-red-600">🔴 Ended</span>}
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                {comp.isActive ? (
                  <button onClick={() => openModal('vote', comp._id)} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 block text-center transition w-full">
                    Open Voting ➔
                  </button>
                ) : (
                  <button disabled className="bg-gray-400 text-white px-4 py-2 rounded font-bold cursor-not-allowed block text-center">
                    Voting Closed
                  </button>
                )}

                {comp.isActive && (
                  <button onClick={() => openModal('edit', comp._id)} className="bg-yellow-600 text-white px-4 py-2 rounded font-bold hover:bg-yellow-700 transition w-full">
                    ✏️ Edit Participants
                  </button>
                )}

                {comp.isActive && (
                  <button onClick={() => openModal('end', comp._id)} className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition">
                    🛑 End Voting
                  </button>
                )}
                
                <button onClick={() => openModal('results', comp._id)} className="bg-blue-900 text-white px-4 py-2 rounded font-bold hover:bg-blue-800 transition w-full">
                  🏆 View Results
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <button 
          onClick={() => openModal('create')} 
          className="bg-blue-900 text-white px-8 py-4 rounded-lg font-bold text-xl shadow-lg hover:bg-blue-800 transition inline-block"
        >
          + Create New Competition
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border-t-8 border-orange-500">
            <h3 className="text-2xl font-bold text-blue-900 mb-2 text-center">
              {modalType === 'create' && '🛡️ Enter Admin Password'}
              {modalType === 'edit' && '🛡️ Enter Admin Password to Edit'}
              {modalType === 'end' && '🛑 Enter Admin Password to End'}
              {modalType === 'vote' && '🟢 Enter Moderator Password'}
              {modalType === 'results' && '🛡️ Enter Admin Password for Results'}
            </h3>
            <p className="text-gray-500 text-center text-sm mb-6">
              {modalType === 'vote' ? 'Please enter the moderator password to open voting.' : 'Please enter the admin password to proceed.'}
            </p>

            <form onSubmit={handleModalSubmit} className="flex flex-col gap-4">
              <input 
                type="password"
                placeholder="Enter Password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                autoFocus
                required
                className="border-2 border-orange-300 focus:border-blue-900 p-3 rounded-xl text-center font-bold tracking-widest outline-none text-lg"
              />

              <div className="flex gap-3 mt-2">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-md"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function VotingDashboard() {
  const { id } = useParams();
  const [competitionName, setCompetitionName] = useState('Loading...');
  const [unranked, setUnranked] = useState([]);
  const [ratedParticipants, setRatedParticipants] = useState([]); 
  const [totalVotes, setTotalVotes] = useState(0); 
  
  // Custom Modal States
  const [modalMessage, setModalMessage] = useState(null);
  const [activeParticipant, setActiveParticipant] = useState(null); 
  const [currentStars, setCurrentStars] = useState(0); 
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompetitionData();
  }, [id]);

  const fetchCompetitionData = async () => {
    try {
      const res = await axios.get(`https://like-india-voting-platform.onrender.com/api/competitions/${id}`);
      setCompetitionName(res.data.name);
      setTotalVotes(res.data.totalVotes || 0);

      const currentUserId = localStorage.getItem('userId');

      // 🌟 CHECK: Agar current user pehle hi 'votedBy' list me hai, toh seedha block karo!
      if (res.data.votedBy && res.data.votedBy.includes(currentUserId)) {
        setModalMessage("⚠️ You have already voted in this competition! Returning to home.");
        localStorage.removeItem(`votingState_${id}`); // Clean old state
        return;
      }

      // Local storage check for resuming voting (isolated per user/competition)
      const savedData = localStorage.getItem(`votingState_${id}_${currentUserId}`);
      if (savedData) {
        const { savedRated, savedUnranked } = JSON.parse(savedData);
        setRatedParticipants(savedRated || []);
        setUnranked(savedUnranked || []);
      } else {
        setUnranked(res.data.participants);
        setRatedParticipants([]);
      }
    } catch (error) {
      console.error("Error", error);
    }
  };

  // 1. Participant par tap karne par modal kholna
  const handleTap = (participant) => {
    setActiveParticipant(participant);
    setCurrentStars(0); 
  };

  // 2. Modal me stars save karna aur participant ko list se hatana
  const handleSaveRating = () => {
    if (currentStars === 0) {
      alert("Please give at least 1 star!");
      return;
    }

    const newUnranked = unranked.filter(p => p._id !== activeParticipant._id);
    const newRated = [...ratedParticipants, { participantId: activeParticipant._id, stars: currentStars }];
    
    setUnranked(newUnranked);
    setRatedParticipants(newRated);
    
    // Save to local storage with userId mapping so it never mixes up between users
    const currentUserId = localStorage.getItem('userId');
    localStorage.setItem(`votingState_${id}_${currentUserId}`, JSON.stringify({ savedRated: newRated, savedUnranked: newUnranked }));
    
    setActiveParticipant(null);
  };

  // 3. Sabko rate karne ke baad final submit karna
  const submitVote = async () => {
    if (unranked.length > 0) {
      setModalMessage("⚠️ Please rate all participants before submitting!");
      return;
    }
    
    try {
      const currentUserId = localStorage.getItem('userId');

      await axios.post('https://like-india-voting-platform.onrender.com/api/vote', {
        competitionId: id,
        userId: currentUserId,
        ratings: ratedParticipants 
      });

      setModalMessage("🎉 All Ratings Submitted Successfully!");
      
      setRatedParticipants([]); 
      localStorage.removeItem(`votingState_${id}_${currentUserId}`); 
      await fetchCompetitionData(); 
      
    } catch (error) {
      setModalMessage(error.response?.data?.message || "Error submitting vote");
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 p-4 relative pb-20">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-white to-green-600"></div>
      
      <h1 className="text-3xl font-extrabold text-center mb-3 text-blue-900 uppercase tracking-wider mt-4">
        {competitionName}
      </h1>

      <div className="text-center mb-6">
        <span className="bg-blue-900 text-white px-6 py-2 rounded-full font-bold text-sm shadow-md border-2 border-orange-400">
          📊 Total Votes Recorded: {totalVotes}
        </span>
      </div>
      
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {unranked.length > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-3 border-b-2 border-orange-500 pb-1">
              <h2 className="text-lg font-bold text-green-700">
                Rate Participants (Tap to Vote)
              </h2>
              <span className="text-sm font-bold text-gray-500">{unranked.length} Left</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {unranked.map(participant => (
                <div 
                  key={participant._id} 
                  onClick={() => handleTap(participant)}
                  className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-200 border-b-4 border-blue-900 flex flex-col justify-between active:scale-95"
                >
                  <img src={`https://like-india-voting-platform.onrender.com${participant.image}`} alt={participant.name} className="w-full h-32 object-cover"/>
                  <div className="p-3 text-center">
                    <h3 className="text-base font-extrabold text-gray-900 truncate">{participant.name}</h3>
                    <p className="text-orange-600 text-xs font-bold mt-1 uppercase tracking-wider">Act: {participant.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 shadow-2xl rounded-2xl border-t-8 border-t-green-600 text-center mt-10">
            <div className="text-5xl mb-4">🌟</div>
            <h2 className="text-2xl font-extrabold text-blue-900 mb-2">All Participants Rated!</h2>
            <p className="text-gray-600 mb-8 font-medium">You have successfully given stars to everyone. Click below to lock your final votes.</p>
            
            <button 
              onClick={submitVote} 
              className="bg-green-600 text-white w-full md:w-auto md:px-12 py-4 rounded-xl font-black text-xl shadow-xl hover:bg-green-700 transition-all transform hover:scale-105"
            >
              🚀 SUBMIT FINAL VOTES
            </button>
          </div>
        )}
      </div>

      {/* 🌟 STAR RATING MODAL */}
      {activeParticipant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border-t-8 border-orange-500 text-center transform scale-100 transition-all">
            
            <img 
              src={`https://like-india-voting-platform.onrender.com${activeParticipant.image}`} 
              alt={activeParticipant.name} 
              className="w-24 h-24 object-cover rounded-full mx-auto border-4 border-blue-900 shadow-md mb-3"
            />
            <h3 className="text-2xl font-black text-gray-900">{activeParticipant.name}</h3>
            <p className="text-orange-600 text-sm font-bold uppercase tracking-widest mb-6">Act: {activeParticipant.details}</p>
            
            <h4 className="font-bold text-gray-500 mb-2">Give 1 to 6 Stars</h4>
            
            <div className="flex justify-center gap-2 mb-8 flex-wrap">
              {[1, 2, 3, 4, 5, 6].map((star) => (
                <button
                  key={star}
                  onClick={() => setCurrentStars(star)}
                  className={`text-4xl transition-all transform hover:scale-110 active:scale-90 outline-none ${
                    star <= currentStars ? 'text-yellow-400 drop-shadow-md' : 'text-gray-200 grayscale'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setActiveParticipant(null)} 
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold shadow hover:bg-gray-300 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveRating} 
                className={`flex-1 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${
                  currentStars > 0 ? 'bg-blue-900 text-white hover:bg-blue-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={currentStars === 0}
              >
                Save Rating
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Alert Modal (Success/Error) */}
      {modalMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border-t-8 border-orange-500 text-center">
            <h3 className="text-xl font-extrabold text-blue-900 mb-2">Like India Voting</h3>
            <p className="text-gray-700 text-sm font-medium mb-6 whitespace-pre-line leading-relaxed">
              {modalMessage}
            </p>
            <button 
              onClick={() => {
                setModalMessage(null);
                navigate('/home');
              }}
              className="bg-blue-900 hover:bg-blue-800 text-white w-full py-2.5 rounded-xl font-bold text-base shadow-md transition-all active:scale-95"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
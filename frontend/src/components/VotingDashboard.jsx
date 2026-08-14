import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function VotingDashboard() {
  const { id } = useParams();
  const [competitionName, setCompetitionName] = useState('Loading...');
  const [unranked, setUnranked] = useState([]);
  const [ranked, setRanked] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0); 
  
  // Custom Stylish Alert Modal State
  const [modalMessage, setModalMessage] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompetitionData();
  }, [id]);

  const fetchCompetitionData = async () => {
    try {
      const res = await axios.get(`https://like-india-voting-platform.onrender.com/api/competitions/${id}`);
      setCompetitionName(res.data.name);
      setTotalVotes(res.data.totalVotes || 0);

      // Refresh hone par pehle LocalStorage check karega
      const savedData = localStorage.getItem(`votingState_${id}`);
      if (savedData) {
        const { savedRanked, savedUnranked } = JSON.parse(savedData);
        setRanked(savedRanked);
        setUnranked(savedUnranked);
      } else {
        setUnranked(res.data.participants);
        setRanked([]);
      }
    } catch (error) {
      console.error("Error", error);
    }
  };

  const handleTap = (participant) => {
    const newUnranked = unranked.filter(p => p._id !== participant._id);
    const newRanked = [...ranked, participant];
    
    setUnranked(newUnranked);
    setRanked(newRanked);
    
    // Tap karte hi phone me save ho jayega
    localStorage.setItem(`votingState_${id}`, JSON.stringify({ savedRanked: newRanked, savedUnranked: newUnranked }));
  };
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(ranked);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setRanked(items);
    
    // Drag karte hi naya order save ho jayega
    localStorage.setItem(`votingState_${id}`, JSON.stringify({ savedRanked: items, savedUnranked: unranked }));
  };
  const handleUndo = () => {
    if (ranked.length === 0) return; // Agar list khali hai toh kuch mat karo
    
    // Aakhiri select kiya hua participant nikalo
    const lastRanked = ranked[ranked.length - 1]; 
    const newRanked = ranked.slice(0, -1); 
    const newUnranked = [...unranked, lastRanked]; 

    // Dono lists update karo
    setRanked(newRanked);
    setUnranked(newUnranked);

    // Local storage bhi update kar do
    localStorage.setItem(`votingState_${id}`, JSON.stringify({ savedRanked: newRanked, savedUnranked: newUnranked }));
  };

  const submitVote = async () => {
    if (unranked.length > 0) {
      setModalMessage("⚠️ Please select and rank all participants before submitting!");
      return;
    }
    
    try {
      const rankedIds = ranked.map(p => p._id);
      const currentUserId = localStorage.getItem('userId');

      await axios.post('https://like-india-voting-platform.onrender.com/api/vote', {
        competitionId: id,
        rankedParticipants: rankedIds,
        userId: currentUserId
      });

      setModalMessage("Your Vote Submitted Successfully!");
      
      setRanked([]); 
      // Vote successful hone par saved history uda denge taaki agla vote fresh ho
      localStorage.removeItem(`votingState_${id}`); 
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

      {/* Total Votes Counter */}
      <div className="text-center mb-6">
        <span className="bg-blue-900 text-white px-6 py-2 rounded-full font-bold text-sm shadow-md border-2 border-orange-400">
          📊 Total Votes Recorded: {totalVotes}
        </span>
      </div>
      
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold mb-3 border-b-2 border-orange-500 pb-1 text-green-700">
            Available Participants (Tap to Select)
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {unranked.map(participant => (
              <div 
                key={participant._id} 
                onClick={() => handleTap(participant)}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-200 border-b-4 border-blue-900 flex flex-col justify-between active:scale-95"
              >
                <img src={`https://like-india-voting-platform.onrender.com${participant.image}`} alt={participant.name} className="w-full h-28 object-cover"/>
                <div className="p-2">
                  <h3 className="text-sm font-extrabold text-gray-800 truncate">{participant.name}</h3>
                  <p className="text-gray-500 text-xs truncate">{participant.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {ranked.length > 0 && (
          <div className="bg-white p-4 shadow-xl rounded-xl border-t-8 border-t-green-600">
  
          {/* Yahan Heading aur Undo button ko ek Flex row me daal diya hai */}
          <div className="flex justify-between items-center mb-3 border-b-2 border-gray-200 pb-2">
            <h2 className="text-lg font-bold text-blue-900 m-0">
              Your Rankings (Drag to Reorder)
            </h2>
        
            <button 
              onClick={handleUndo} 
              className="bg-yellow-50 text-yellow-700 border border-yellow-300 px-3 py-1 rounded-lg font-bold text-sm hover:bg-yellow-100 transition-all shadow-sm active:scale-95 flex items-center gap-1"
            >
              ↩️ Undo
            </button>
          </div>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="ranked-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {ranked.map((participant, index) => (
                    <Draggable key={participant._id} draggableId={participant._id} index={index}>
                      {(provided) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.draggableProps} 
                          {...provided.dragHandleProps}
                          className="p-3 bg-blue-50 rounded-lg flex items-center justify-between shadow-sm border border-blue-200"
                        >
                          <span className="text-lg font-extrabold text-blue-900">#{index + 1}</span>
                          <h4 className="font-bold text-gray-800 text-sm truncate px-2 flex-1">{participant.name}</h4>
                          <span className="text-gray-400 cursor-grab text-2xl">≡</span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          
          <div className="mt-6 flex justify-center">
            <button 
              onClick={submitVote} 
              className="bg-blue-900 text-white w-full py-3 rounded-xl font-bold text-base shadow-lg hover:bg-blue-800 transition-all"
            >
              Submit Vote
            </button>
          </div>
        </div>
        )}
      </div>

      {/* Custom Stylish Alert Modal */}
      {modalMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border-t-8 border-orange-500 text-center">
            <h3 className="text-xl font-extrabold text-blue-900 mb-2">Like India Voting</h3>
            <p className="text-gray-700 text-sm font-medium mb-6 whitespace-pre-line leading-relaxed">
              {modalMessage}
            </p>
            <button 
              onClick={() => {
                const msg = modalMessage;
                setModalMessage(null);
                if (msg && msg.includes("This is not your competition")) {
                  navigate('/home');
                }
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
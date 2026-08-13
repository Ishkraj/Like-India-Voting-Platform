import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function Results() {
  const { id } = useParams();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 🌟 Home se password verify ho chuka hai, isliye direct results fetch karenge
    axios.get(`https://like-india-voting-platform.onrender.com/api/competitions/${id}`)
      .then(res => {
        setCompetition(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Error loading results');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-orange-50 flex items-center justify-center">
        <p className="text-xl font-bold text-blue-900">Loading Results...</p>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="min-h-[80vh] bg-orange-50 flex items-center justify-center">
        <p className="text-xl font-bold text-red-600">{error || 'Competition not found'}</p>
      </div>
    );
  }

  const sortedParticipants = [...competition.participants].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="min-h-screen bg-orange-50 p-8 relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-white to-green-600"></div>
      
      <h1 className="text-4xl font-extrabold text-blue-900 text-center mb-10 uppercase tracking-wider">
        🏆 {competition.name} Grand Results 🏆
      </h1>
      
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-xl border-t-8 border-green-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sortedParticipants.map((p, index) => (
              <div key={p._id} className={`p-6 rounded-xl shadow-md border-2 flex flex-col items-center text-center transition-all ${
                index === 0 ? 'bg-yellow-50 border-yellow-400 transform scale-105 shadow-xl' : 
                index === 1 ? 'bg-gray-50 border-gray-300' : 
                index === 2 ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-100'
              }`}>
                
                <div className={`w-12 h-12 flex items-center justify-center rounded-full text-xl font-bold mb-3 shadow-md ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900 ring-4 ring-yellow-200' : 
                  index === 1 ? 'bg-gray-300 text-gray-800' : 
                  index === 2 ? 'bg-orange-400 text-orange-900' : 'bg-blue-100 text-blue-900'
                }`}>
                  #{index + 1}
                </div>

                <img src={`https://like-india-voting-platform.onrender.com${p.image}`} alt={p.name} className="w-24 h-24 rounded-full object-cover shadow-md mb-4 border-4 border-white"/>
                <h3 className="font-extrabold text-xl text-gray-800">{p.name}</h3>
                <p className="text-sm text-gray-500 font-medium mb-4">{p.details}</p>
                
                <div className="bg-blue-900 text-white px-5 py-2 rounded-full text-sm font-extrabold tracking-widest shadow-inner mt-auto">
                  {p.totalScore} POINTS
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
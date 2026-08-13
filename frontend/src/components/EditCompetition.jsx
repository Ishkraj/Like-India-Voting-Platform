import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function EditCompetition() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competitionName, setCompetitionName] = useState('');
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/edit-competition/${id}`)
      .then(res => {
        setCompetitionName(res.data.name);
        setParticipants(res.data.participants);
      })
      .catch(err => console.error(err));
  }, [id]);

  const handleParticipantChange = (index, field, value) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const handleImageChange = (index, file) => {
    const updated = [...participants];
    updated[index].image = file;
    setParticipants(updated);
  };

  const addMoreParticipant = () => {
    setParticipants([...participants, { name: '', details: '', image: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('participants', JSON.stringify(participants));

    participants.forEach((p, index) => {
      if (p.image instanceof File) {
        formData.append(`image_${index}`, p.image);
      }
    });

    try {
      await axios.post(`http://localhost:5000/api/edit-competition/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('✅ Participants updated successfully!');
      navigate('/home');
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating competition');
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 p-8 flex flex-col items-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl border-t-8 border-t-yellow-600">
        <h1 className="text-3xl font-extrabold text-blue-900 mb-6 text-center">
          Edit: {competitionName}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <h3 className="text-xl font-bold text-gray-700 border-b pb-2">Participants List</h3>
          
          {participants.map((p, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl border flex flex-col gap-3">
              <span className="font-bold text-blue-900">Participant #{index + 1}</span>
              <input 
                type="text" 
                placeholder="Participant Name" 
                value={p.name} 
                onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                required
                className="border p-2 rounded-lg"
              />
              <input 
                type="text" 
                placeholder="Details (e.g. Hip Hop / City)" 
                value={p.details} 
                onChange={(e) => handleParticipantChange(index, 'details', e.target.value)}
                required
                className="border p-2 rounded-lg"
              />
              <div className="flex items-center gap-4">
                {typeof p.image === 'string' && p.image && (
                  <img src={p.image} alt="preview" className="w-12 h-12 object-cover rounded-full" />
                )}
                <input 
                  type="file" 
                  onChange={(e) => handleImageChange(index, e.target.files[0])}
                  className="text-sm"
                />
              </div>
            </div>
          ))}

          <button 
            type="button" 
            onClick={addMoreParticipant}
            className="bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition"
          >
            + Add On-Spot Participant
          </button>

          <div className="mt-4 border-t pt-4 flex flex-col gap-3">
            <button 
              type="submit" 
              className="bg-blue-900 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-800 transition shadow-lg"
            >
              Save Changes 🇮🇳
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
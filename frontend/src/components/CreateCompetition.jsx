import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // <-- 1. Ye add kiya

export default function CreateCompetition() {
  const navigate = useNavigate(); // <-- 2. Ye add kiya
  
  const [competitionName, setCompetitionName] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [numParticipants, setNumParticipants] = useState(0);
  const [participants, setParticipants] = useState([]);

  // Handle number of participants change
  const handleNumChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    setNumParticipants(count);
    
    // Create empty participant template array
    const newParticipants = Array.from({ length: count }, () => ({
      name: '',
      details: '',
      image: null
    }));
    setParticipants(newParticipants);
  };

  const handleParticipantChange = (index, field, value) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const handleImageChange = (index, e) => {
    const updated = [...participants];
    updated[index].image = e.target.files[0];
    setParticipants(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalName = isCustom ? customName : competitionName;

    const formData = new FormData();
    formData.append('competitionName', finalName);
    formData.append('numParticipants', numParticipants);
    // userId add kar liya hai localStorage se
    formData.append('userId', localStorage.getItem('userId'));

    participants.forEach((p, i) => {
      formData.append(`name_${i}`, p.name);
      formData.append(`details_${i}`, p.details);
      if (p.image) {
        formData.append(`image_${i}`, p.image);
      }
    });

    try {
      await axios.post('https://like-india-voting-platform.onrender.com/api/add-competition', formData);
      alert('Competition created successfully!');
      navigate('/home'); // <-- 3. Ye add kiya (ab direct home pe jayega)
    } catch (err) {
      console.error(err);
      alert('Error creating competition');
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 p-6 relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-white to-green-600"></div>
      
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl border-t-8 border-t-orange-500 mt-10">
        <h1 className="text-3xl font-extrabold text-center text-blue-900 mb-6 uppercase tracking-wider">
          Add New Competition
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Step 1: Competition Details */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="font-bold text-lg text-green-700 mb-3">1. Competition Info</h2>
            <div className="flex flex-col gap-4">
              <select 
                className="p-3 border rounded-lg focus:border-orange-500 focus:outline-none font-medium"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "Custom") {
                    setIsCustom(true);
                    setCompetitionName('');
                  } else {
                    setIsCustom(false);
                    setCompetitionName(val);
                  }
                }} 
                required
              >
                <option value="">Select Competition Type...</option>
                <option value="Dance - Move for freedom">Dance - Move for freedom</option>
                <option value="Music (Singing) - Let your voice unite">Music (Singing) - Let your voice unite</option>
                <option value="Speech - Speak for change">Speech - Speak for change</option>
                <option value="Custom">✨ Other / Custom Event</option>
              </select>

              {/* Custom Event Input Field (Shows only if Custom is selected) */}
              {isCustom && (
                <input 
                  type="text"
                  placeholder="Enter Custom Competition Name..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="p-3 border rounded-lg focus:border-orange-500 focus:outline-none font-medium"
                  required
                />
              )}

              <input 
                type="number" min="1" placeholder="Number of Participants" required
                className="p-3 border rounded-lg focus:border-orange-500 focus:outline-none font-medium"
                onChange={handleNumChange}
              />
            </div>
          </div>

          {/* Step 2: Dynamic Participant Forms */}
          {participants.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h2 className="font-bold text-lg text-blue-900 mb-3">2. Participant Details</h2>
              
              <div className="space-y-6">
                {participants.map((p, index) => (
                  <div key={index} className="p-4 bg-white rounded shadow-sm border-l-4 border-l-green-500 flex flex-col gap-3">
                    <h3 className="font-bold text-orange-600">Participant #{index + 1}</h3>
                    
                    <input 
                      type="text" placeholder="Name or Group Name" required
                      className="p-2 border rounded focus:border-green-500 outline-none"
                      onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                    />
                    
                    <input 
                      type="text" placeholder="Theme / Act Details (e.g., Classical, Hip-Hop)" required
                      className="p-2 border rounded focus:border-green-500 outline-none"
                      onChange={(e) => handleParticipantChange(index, 'details', e.target.value)}
                    />
                    
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-gray-600 mb-1">Upload Participant Image:</label>
                      <input 
                        type="file" accept="image/*" required
                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        onChange={(e) => handleImageChange(index, e)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="bg-blue-900 text-white p-4 rounded-lg font-bold text-xl hover:bg-blue-800 transition shadow-lg mt-4">
            Save Competition & Participants
          </button>
        </form>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import SeatMatrix from '../../components/SeatMatrix';
import { CreditCard, Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const MovieDetail = () => {
  const { movieId } = useParams();
  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [showRes, seatsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/movies/${movieId}`),
          axios.get(`${API_BASE_URL}/seats/show/${movieId}`)
        ]);

        setShow(showRes.data.data);
        setSeats(seatsRes.data);
      } catch (error) {
        console.error('Khong the lay du lieu chi tiet phim:', error);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchData();
    }
  }, [movieId]);

  const handleSeatClick = (code) => {
    setSelectedSeats((prev) =>
      prev.includes(code) ? prev.filter((seat) => seat !== code) : [...prev, code]
    );
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) return alert('Vui long chon ghe!');

    try {
      const res = await axios.post(`${API_BASE_URL}/bookings/hold`, {
        show_id: Number(movieId),
        seat_codes: selectedSeats,
        user_id: 1
      });
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Khong the dat ghe luc nay.');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#111] text-white">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#111] text-white">
        Khong tim thay du lieu phim.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white p-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <img
            src={`http://localhost:5000${show.poster_url}`}
            className="w-full rounded-2xl shadow-2xl mb-6"
            alt={show.title}
          />
          <h1 className="text-3xl font-bold uppercase">{show.title}</h1>
          <p className="text-gray-400 mt-4 text-sm leading-relaxed">{show.description}</p>
        </div>

        <div className="lg:col-span-2 flex flex-col items-center">
          <SeatMatrix
            seatsData={seats}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatClick}
          />

          <div className="w-full mt-8 p-6 bg-[#1a1a1a] border border-gray-800 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold">Ghe da chon</p>
              <p className="text-xl font-mono text-red-500">
                {selectedSeats.join(', ') || 'Chua chon'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs uppercase font-bold">Tong tam tinh</p>
              <p className="text-2xl font-black">
                {(selectedSeats.length * show.price).toLocaleString()}d
              </p>
            </div>
            <button
              onClick={handleBooking}
              className="px-8 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-bold flex items-center gap-2 transition-all"
            >
              <CreditCard size={20} /> THANH TOAN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;

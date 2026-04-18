import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AlertCircle, Clock, Ticket, MapPin, CalendarDays, ChevronLeft } from 'lucide-react'; 
import Navbar from '../components/Navbar';
import { API_BASE_URL, buildAssetUrl } from '../config/api';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate(); 
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/movies/${id}`);
        if (response.data && response.data.success) {
          setMovie(response.data.data);
        }
        setLoading(false);
      } catch (error) {
        console.error('Lỗi lấy chi tiết phim:', error);
        setErrorMsg('Không thể tải thông tin phim. Vui lòng kiểm tra kết nối!');
        setLoading(false);
      }
    };

    fetchMovieDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
        <p className="text-xl font-semibold tracking-wider">Đang tải dữ liệu rạp...</p>
      </div>
    );
  }

  if (errorMsg || !movie) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">{errorMsg || 'Phim không tồn tại'}</h2>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded transition font-bold"
        >
          Quay lại Trang chủ
        </button>
      </div>
    );
  }

  const imageUrl = movie.poster_url 
    ? buildAssetUrl(movie.poster_url) 
    : 'https://placehold.co/300x450/2d2d2d/FFF?text=NO+POSTER';

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pb-20">
      <Navbar />
      
      {/* Nút Quay Lại */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Trở về danh sách</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* --- KHỐI 1: THÔNG TIN PHIM --- */}
        <div className="flex flex-col md:flex-row gap-10 bg-[#242424] p-6 rounded-2xl shadow-2xl border border-gray-800">
          
          {/* Cột trái: Poster */}
          <div className="w-full md:w-1/3 flex-shrink-0">
            <img 
              src={imageUrl} 
              alt={movie.title} 
              className="w-full rounded-xl shadow-2xl shadow-red-900/20 object-cover border border-gray-700"
            />
          </div>
          
          {/* Cột phải: Thông tin */}
          <div className="w-full md:w-2/3 flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 uppercase tracking-wide">
              {movie.title}
            </h1>
            
            {/* Cụm Icon Thống kê */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="flex flex-col bg-[#1a1a1a] p-3 rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold uppercase">Thời lượng</span>
                </div>
                <span className="text-lg font-bold">{movie.duration} phút</span>
              </div>

              <div className="flex flex-col bg-[#1a1a1a] p-3 rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Ticket className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold uppercase">Giá vé</span>
                </div>
                <span className="text-lg font-bold text-green-400">
                  {Number(movie.price).toLocaleString()}đ
                </span>
              </div>

              <div className="flex flex-col bg-[#1a1a1a] p-3 rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold uppercase">Phòng chiếu</span>
                </div>
                <span className="text-lg font-bold">Rạp số {movie.room_id}</span>
              </div>

              <div className="flex flex-col bg-[#1a1a1a] p-3 rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <CalendarDays className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold uppercase">Suất chiếu</span>
                </div>
                {/* Format ngày giờ cho đẹp */}
                <span className="text-base font-bold text-red-400">
                  {new Date(movie.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="mb-2">
              <h3 className="text-xl font-bold border-l-4 border-red-600 pl-3 mb-3">TÓM TẮT PHIM</h3>
              <p className="text-gray-300 text-lg leading-relaxed text-justify">
                {movie.description}
              </p>
            </div>
          </div>
        </div>

        {/* --- KHỐI 2: CHUẨN BỊ CHO SƠ ĐỒ GHẾ --- */}
        <div className="mt-12 bg-[#242424] p-6 rounded-2xl border border-gray-800">
          <h2 className="text-2xl font-bold border-l-4 border-red-600 pl-3 mb-6 uppercase flex items-center gap-2">
            <Ticket className="w-6 h-6 text-red-500" />
            Chọn ghế & Đặt vé
          </h2>
          
          <div className="flex items-center justify-center h-40 border-2 border-dashed border-gray-700 rounded-lg">
            <p className="text-gray-400 italic text-lg">
              Sơ đồ ghế và Headless UI sẽ được lắp ráp vào khu vực này...
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MovieDetail;

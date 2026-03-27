import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, LogOut, UserCircle } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#111111]/80 backdrop-blur-md border-b border-red-900/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        
        <Link 
          to="/" 
          className="flex items-center gap-3 text-red-600 hover:text-red-500 transition-colors group"
        >
          <Film className="w-8 h-8 group-hover:rotate-12 transition-transform" />
          <h1 className="text-3xl font-black tracking-tighter uppercase m-0">
            HTD<span className="text-white">MOVIE</span>
          </h1>
        </Link>

        {/* Cụm nút bấm bên phải */}
        <div className="flex items-center gap-6">
          
          {/* Thông tin User (Giả lập) */}
          <div className="hidden md:flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer transition-colors">
            <UserCircle className="w-6 h-6" />
            <span className="font-medium text-sm">Chào, Admin</span>
          </div>

          {/* Đường kẻ dọc chia cách */}
          <div className="h-6 w-px bg-gray-700 hidden md:block"></div>

          {/* Nút Đăng xuất */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-transparent text-gray-300 border border-gray-600 py-2 px-4 rounded-lg transition-all duration-300 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-[0_0_15px_rgba(229,9,20,0.5)]"
          >
            <span className="font-semibold text-sm">Đăng xuất</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
      </div>
    </nav>
  );
};

export default Navbar;
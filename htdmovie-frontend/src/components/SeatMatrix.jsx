import React, { useState } from 'react';
import { Armchair, Info } from 'lucide-react';

const SeatMatrix = ({ seatsData, onSeatSelect, selectedSeats }) => {
  // Tạo mảng hàng từ A đến J (10 hàng)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const cols = Array.from({ length: 10 }, (_, i) => i + 1);

  const getSeatStatus = (code) => {
    const seat = seatsData.find(s => s.seat_code === code);
    return seat ? seat.status : 0; // 0: Trống, 1: Đang giữ, 2: Đã bán
  };

  return (
    <div className="flex flex-col items-center bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-2xl">
      {/* Màn hình rạp chiếu */}
      <div className="w-full max-w-md h-2 bg-linear-to-r from-transparent via-red-600 to-transparent rounded-full mb-12 shadow-[0_15px_30px_rgba(229,9,20,0.5)]">
        <p className="text-center text-[10px] text-gray-500 mt-4 uppercase tracking-[0.5em]">Màn hình rạp</p>
      </div>

      {/* Lưới ghế 10x10 */}
      <div className="grid grid-cols-10 gap-3">
        {rows.map(row => 
          cols.map(col => {
            const code = `${row}${col}`;
            const status = getSeatStatus(code);
            const isSelected = selectedSeats.includes(code);

            return (
              <button
                key={code}
                disabled={status === 2 || status === 1}
                onClick={() => onSeatSelect(code)}
                className={`
                  relative w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all duration-300
                  ${status === 2 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 
                    status === 1 ? 'bg-yellow-900/50 text-yellow-600 cursor-wait' :
                    isSelected ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(229,9,20,0.6)] scale-110' : 
                    'bg-[#2d2d2d] text-gray-400 hover:bg-gray-700 hover:text-white'}
                `}
              >
                <Armchair size={status === 2 ? 16 : 20} />
                <span className="absolute -top-6 text-[10px] opacity-0 hover:opacity-100 transition-opacity bg-black px-1 rounded">{code}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Chú thích (Legend) */}
      <div className="flex gap-6 mt-10 text-sm text-gray-400 border-t border-gray-800 pt-6">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#2d2d2d] rounded"></div> Trống</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-600 rounded"></div> Đang chọn</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-800 rounded"></div> Đã bán</div>
      </div>
    </div>
  );
};

export default SeatMatrix;
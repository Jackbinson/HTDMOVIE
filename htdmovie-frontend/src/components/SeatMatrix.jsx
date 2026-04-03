import React from 'react';
import { Armchair } from 'lucide-react';

const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const cols = Array.from({ length: 10 }, (_, index) => index + 1);

const SeatMatrix = ({ seatsData, onSeatSelect, selectedSeats }) => {
  const getSeatStatus = code => {
    const seat = seatsData.find(item => item.seat_code === code);
    return seat ? seat.status : 0;
  };

  return (
    <div className="flex flex-col items-center rounded-3xl border border-gray-800 bg-[#1a1a1a] p-8 shadow-2xl">
      <div className="mb-12 h-2 w-full max-w-md rounded-full bg-linear-to-r from-transparent via-red-600 to-transparent shadow-[0_15px_30px_rgba(229,9,20,0.5)]">
        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.5em] text-gray-500">
          Man hinh rap
        </p>
      </div>

      <div className="grid grid-cols-10 gap-3">
        {rows.map(row =>
          cols.map(col => {
            const code = `${row}${col}`;
            const status = getSeatStatus(code);
            const isSelected = selectedSeats.includes(code);
            const isUnavailable = status === 1 || status === 2;

            return (
              <button
                key={code}
                type="button"
                disabled={isUnavailable}
                onClick={() => onSeatSelect(code)}
                title={
                  isUnavailable
                    ? `${code} da duoc giu hoac da ban`
                    : isSelected
                      ? `${code} dang duoc chon`
                      : `${code} con trong`
                }
                className={`group relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 md:h-10 md:w-10 ${
                  isUnavailable
                    ? 'cursor-not-allowed bg-red-600 text-white opacity-90'
                    : isSelected
                      ? 'scale-105 border-2 border-red-500 bg-gray-500 text-white shadow-[0_0_15px_rgba(229,9,20,0.35)]'
                      : 'bg-gray-500 text-white hover:bg-gray-400'
                }`}
              >
                <Armchair size={18} />
                <span className="pointer-events-none absolute -top-6 rounded bg-black px-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
                  {code}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-6 border-t border-gray-800 pt-6 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-500"></div>
          Ghe trong
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-red-500 bg-gray-500"></div>
          Ghe dang chon
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-600"></div>
          Ghe da giu hoac da ban
        </div>
      </div>
    </div>
  );
};

export default SeatMatrix;

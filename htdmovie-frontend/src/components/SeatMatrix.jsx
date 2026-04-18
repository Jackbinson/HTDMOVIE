import React, { useMemo } from 'react';
import { Armchair } from 'lucide-react';

const fallbackRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const fallbackCols = Array.from({ length: 10 }, (_, index) => index + 1);

const parseSeatCode = (seatCode = '') => {
  const match = String(seatCode).match(/^([A-Z]+)(\d+)$/i);

  if (!match) {
    return null;
  }

  return {
    row: match[1].toUpperCase(),
    col: Number(match[2])
  };
};

const buildSeatLayout = seatsData => {
  if (!Array.isArray(seatsData) || seatsData.length === 0) {
    return fallbackRows.map(row => ({
      row,
      seats: fallbackCols.map(col => ({
        seat_code: `${row}${col}`,
        status: 0
      }))
    }));
  }

  const parsedSeats = seatsData
    .map(seat => {
      const parsedCode = parseSeatCode(seat.seat_code);
      return parsedCode
        ? {
            ...seat,
            row: parsedCode.row,
            col: parsedCode.col
          }
        : null;
    })
    .filter(Boolean);

  const groupedRows = new Map();

  parsedSeats.forEach(seat => {
    if (!groupedRows.has(seat.row)) {
      groupedRows.set(seat.row, []);
    }

    groupedRows.get(seat.row).push(seat);
  });

  return [...groupedRows.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([row, seats]) => ({
      row,
      seats: seats.sort((left, right) => left.col - right.col)
    }));
};

const SeatMatrix = ({ seatsData = [], onSeatSelect, selectedSeats = [] }) => {
  const seatLayout = useMemo(() => buildSeatLayout(seatsData), [seatsData]);

  return (
    <div className="flex w-full flex-col items-center rounded-3xl border border-[#2d2d32] bg-[#17171c] p-6 shadow-2xl md:p-8">
      <div className="mb-10 w-full max-w-xl">
        <div className="h-2 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-90 shadow-[0_14px_28px_rgba(255,255,255,0.15)]" />
        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.55em] text-[#b9bec9]">
          Man hinh rap
        </p>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="mx-auto flex min-w-fit flex-col gap-3">
          {seatLayout.map(({ row, seats }) => (
            <div key={row} className="flex items-center gap-3">
              <div className="w-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#8f97a8]">
                {row}
              </div>

              <div className="flex flex-wrap gap-2">
                {seats.map(seat => {
                  const code = seat.seat_code;
                  const isSelected = selectedSeats.includes(code);
                  const isUnavailable = seat.status === 1 || seat.status === 2;

                  const seatClassName = isUnavailable
                    ? 'border-[#f97316] bg-[#dc2626] text-white shadow-[0_0_0_1px_rgba(248,113,113,0.15)]'
                    : isSelected
                      ? 'border-[#ef4444] bg-[#9ca3af] text-[#111827] shadow-[0_0_18px_rgba(239,68,68,0.35)]'
                      : 'border-[#4b5563] bg-[#6b7280] text-white hover:bg-[#7c8593]';

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
                      className={`group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl border text-[10px] font-bold transition-all duration-150 ${seatClassName} ${
                        isUnavailable ? 'cursor-not-allowed opacity-95' : 'cursor-pointer'
                      }`}
                    >
                      <Armchair size={15} />
                      <span className="mt-0.5 leading-none">{code}</span>
                      <span className="pointer-events-none absolute -top-8 rounded bg-black px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-6 border-t border-[#2d2d32] pt-6 text-sm text-[#b6bdc9]">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border border-[#4b5563] bg-[#6b7280]" />
          Ghe trong
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border border-[#ef4444] bg-[#9ca3af]" />
          Ghe dang chon
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border border-[#f97316] bg-[#dc2626]" />
          Ghe da giu hoac da ban
        </div>
      </div>
    </div>
  );
};

export default SeatMatrix;

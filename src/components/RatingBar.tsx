import React from 'react';
import { Star } from 'lucide-react';

interface RatingBarProps {
  value: number;
  onChange: (value: number) => void;
}

export function RatingBar({ value, onChange }: RatingBarProps) {
  return (
    <div className="flex gap-1 items-center">
      {/* 1 to 5: blocks */}
      <div className="flex gap-1 mr-2">
        {[1, 2, 3, 4, 5].map((num) => {
          const isActive = value >= num;
          // red for 1-3, orange for 4-5
          const colorClass = isActive
            ? (num <= 3 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] border-red-500' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] border-orange-500')
            : 'bg-slate-900 border-slate-700 hover:border-slate-500';
          
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`w-6 h-6 rounded border transition-all ${colorClass}`}
            />
          );
        })}
      </div>

      {/* 6 to 10: numbered squares */}
      <div className="flex gap-1">
        {[6, 7, 8, 9, 10].map((num) => {
          const isActive = value >= num;
          const colorClass = isActive
            ? (num <= 7 ? 'bg-yellow-500 text-slate-950 shadow-[0_0_8px_rgba(234,179,8,0.5)] border-yellow-500' : 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.5)] border-emerald-500')
            : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500';
          
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`w-6 h-6 rounded border text-[10px] font-bold flex items-center justify-center transition-all ${colorClass}`}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}

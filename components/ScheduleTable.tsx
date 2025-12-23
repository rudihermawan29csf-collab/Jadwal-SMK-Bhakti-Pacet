
import React, { useState } from 'react';
import { TIME_STRUCTURE } from '../data';
import { WeeklySchedule, CLASSES } from '../types';

interface Props {
  schedule: WeeklySchedule;
  filterType: 'CLASS' | 'TEACHER';
  filterValue: string[]; 
}

const isDarkBackground = (twClass?: string): boolean => {
    if (!twClass) return false;
    const darkPatterns = ['-600', '-500', '-700', '-800', '-900', 'slate-800', 'purple', 'blue-600', 'orange-500', 'amber-800', 'red-800', 'red-700', 'teal-600', 'pink-600'];
    return darkPatterns.some(p => twClass.includes(p));
};

export const ScheduleTable: React.FC<Props> = ({ schedule, filterType, filterValue }) => {
  const [activeDay, setActiveDay] = useState<string>('SENIN');

  const days = TIME_STRUCTURE.map(d => d.day);
  const isFilterAll = filterValue.includes('ALL');

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap gap-2 mb-4 no-print overflow-x-auto pb-2 justify-center">
        {days.map(day => (
            <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap
                    ${activeDay === day 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
                {day}
            </button>
        ))}
        <button
            onClick={() => setActiveDay('ALL')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap
                ${activeDay === 'ALL' 
                    ? 'bg-blue-800 text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
        >
            Semua Hari
        </button>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <div className="min-w-[800px] max-w-4xl mx-auto text-xs md:text-sm">
          {TIME_STRUCTURE.map((day) => {
            const isHidden = activeDay !== 'ALL' && activeDay !== day.day;
            
            return (
                <div 
                    key={day.day} 
                    className={`mb-8 break-inside-avoid page-break ${isHidden ? 'hidden print:block' : 'block animate-fade-in'}`}
                >
                    <h3 className="bg-blue-900 text-white font-bold p-2 text-center uppercase tracking-widest rounded-t-lg shadow-sm border-b border-blue-800">{day.day}</h3>
                    <table className="w-full border-collapse border border-gray-300 table-fixed shadow-sm rounded-b-lg overflow-hidden">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700">
                        <th className="border border-gray-300 p-2 w-10 text-[10px] uppercase">Ke</th>
                        <th className="border border-gray-300 p-2 w-24 text-[10px] uppercase">Waktu</th>
                        {CLASSES.map(cls => (
                            <th key={cls} className={`border border-gray-300 p-2 w-20 text-[10px] md:text-xs ${filterType === 'CLASS' && !isFilterAll && !filterValue.includes(cls) ? 'opacity-30' : ''}`}>
                            {cls}
                            </th>
                        ))}
                        </tr>
                    </thead>
                    <tbody>
                        {day.slots.map((slot, idx) => {
                        const isBreak = slot.period < 0;
                        
                        if (isBreak) {
                            return (
                            <tr key={idx} className="bg-gray-50">
                                <td className="border border-gray-300 p-2 text-center font-bold" colSpan={2}>{slot.start} - {slot.end}</td>
                                <td className="border border-gray-300 p-2 text-center font-bold text-gray-400 italic uppercase text-[10px]" colSpan={CLASSES.length}>
                                {slot.label}
                                </td>
                            </tr>
                            )
                        }

                        return (
                            <tr key={idx} className="hover:bg-gray-50 h-11 transition-colors">
                            <td className="border border-gray-300 p-1 text-center font-semibold bg-gray-50 text-gray-400 text-[10px]">{slot.period}</td>
                            <td className="border border-gray-300 p-1 text-center whitespace-nowrap text-[9px] md:text-xs text-gray-500">{slot.start} - {slot.end}</td>
                            {CLASSES.map(cls => {
                                const dayData = schedule[day.day];
                                const cell = dayData && dayData[slot.period] ? dayData[slot.period][cls] : null;

                                if (!cell) return <td key={cls} className="border border-gray-300"></td>;

                                if (cell.type === 'BLOCKED') {
                                    return (
                                        <td key={cls} className="border border-gray-300 bg-gray-50 text-center text-gray-300 text-[9px] italic">
                                            {cell.blockReason}
                                        </td>
                                    )
                                }

                                let opacityClass = '';
                                if (filterType === 'TEACHER' && !isFilterAll) {
                                    if (cell.teacherId && filterValue.includes(cell.teacherId.toString())) {
                                        opacityClass = 'ring-2 ring-blue-500 z-10';
                                    } else {
                                        opacityClass = 'opacity-20';
                                    }
                                } else if (filterType === 'CLASS' && !isFilterAll) {
                                    if (!filterValue.includes(cls)) {
                                        opacityClass = 'opacity-20'; 
                                    }
                                }

                                const isDark = isDarkBackground(cell.color);

                                return (
                                    <td key={cls} className={`border border-gray-300 p-1 text-center relative transition-all ${opacityClass}`}>
                                        {cell.type === 'CLASS' ? (
                                            <div className={`h-full w-full rounded flex flex-col justify-center items-center shadow-sm border border-black/5 ${cell.color || 'bg-white'}`}>
                                                <span className={`font-black text-[10px] md:text-[11px] leading-tight uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {cell.subjectCode}
                                                </span>
                                                <span className={`text-[7px] font-bold leading-none -mt-0.5 ${isDark ? 'text-white/60' : 'text-black/40'}`}>
                                                    {cell.teacherCode}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-100 text-[10px] italic">empty</span>
                                        )}
                                    </td>
                                );
                            })}
                            </tr>
                        );
                        })}
                    </tbody>
                    </table>
                </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

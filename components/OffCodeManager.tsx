import React, { useState } from 'react';
import { TIME_STRUCTURE } from '../data';
import { OffDayConstraints, Teacher } from '../types';

interface Props {
    teachers: Teacher[];
    constraints: OffDayConstraints;
    onChange: (newConstraints: OffDayConstraints) => void;
}

export const OffCodeManager: React.FC<Props> = ({ teachers, constraints, onChange }) => {
    const [mode, setMode] = useState<'DAY' | 'HOUR'>('DAY');
    const [selectedCode, setSelectedCode] = useState<string | null>(null);

    // --- DAY MODE HANDLERS ---
    const toggleDay = (key: string, day: string) => {
        const currentData = constraints[key] || { blockedDays: [], blockedPeriods: {} };
        const currentDays = currentData.blockedDays;
        
        let newDays;
        if (currentDays.includes(day)) {
            newDays = currentDays.filter(d => d !== day);
        } else {
            newDays = [...currentDays, day];
        }

        const newConstraints = { 
            ...constraints, 
            [key]: { ...currentData, blockedDays: newDays } 
        };
        onChange(newConstraints);
    };

    // --- HOUR MODE HANDLERS ---
    const toggleHour = (key: string, day: string, period: number) => {
        const currentData = constraints[key] || { blockedDays: [], blockedPeriods: {} };
        const dayPeriods = currentData.blockedPeriods[day] || [];
        
        let newDayPeriods;
        if (dayPeriods.includes(period)) {
            newDayPeriods = dayPeriods.filter(p => p !== period);
        } else {
            newDayPeriods = [...dayPeriods, period];
        }

        const newPeriods = { ...currentData.blockedPeriods, [day]: newDayPeriods };
        
        const newConstraints = {
            ...constraints,
            [key]: { ...currentData, blockedPeriods: newPeriods }
        };
        onChange(newConstraints);
    };

    const days = TIME_STRUCTURE.map(d => d.day);

    // Flatten codes for dropdown/list
    const codes: {key: string, label: string}[] = [];
    teachers.forEach(t => {
        t.subjects.forEach(sub => {
            codes.push({
                key: `${t.id}-${sub.code}`,
                label: `${sub.code}-${t.code} (${sub.subject})`
            });
        });
    });

    return (
        <div className="bg-white p-6 shadow rounded">
             <h2 className="text-xl font-bold mb-4 uppercase border-b pb-2">Pengaturan Libur Kode Mapel (Off Days/Hours)</h2>
             
             {/* Mode Selector */}
             <div className="flex gap-4 mb-6">
                 <button 
                    onClick={() => setMode('DAY')}
                    className={`px-4 py-2 rounded font-bold ${mode === 'DAY' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                 >
                    Off By Hari (Full Day)
                 </button>
                 <button 
                    onClick={() => setMode('HOUR')}
                    className={`px-4 py-2 rounded font-bold ${mode === 'HOUR' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                 >
                    Off By Jam (Specific Hours)
                 </button>
             </div>

             {mode === 'DAY' && (
                 <div className="overflow-x-auto">
                     <p className="mb-4 text-sm text-gray-600">Centang hari untuk meliburkan kode mapel secara total pada hari tersebut.</p>
                     <table className="w-full border-collapse border border-gray-300 text-xs md:text-sm">
                        <thead>
                            <tr className="bg-blue-800 text-white">
                                <th className="border border-gray-400 p-2 text-left w-24">Kode</th>
                                <th className="border border-gray-400 p-2 text-left">Guru</th>
                                {days.map(d => (
                                    <th key={d} className="border border-gray-400 p-2 text-center w-16">{d}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {teachers.map(t => (
                                t.subjects.map(sub => {
                                    const key = `${t.id}-${sub.code}`;
                                    const blockedDays = constraints[key]?.blockedDays || [];
                                    
                                    return (
                                        <tr key={key} className="hover:bg-gray-50 border-b odd:bg-white even:bg-gray-50">
                                            <td className="border border-gray-300 p-2 font-bold bg-yellow-50 text-center">{sub.code}-{t.code}</td>
                                            <td className="border border-gray-300 p-2">{t.name} <br/> <span className="text-xs text-gray-500">{sub.subject}</span></td>
                                            {days.map(d => (
                                                <td key={d} className="border border-gray-300 p-2 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-5 h-5 accent-red-600 cursor-pointer"
                                                        checked={blockedDays.includes(d)}
                                                        onChange={() => toggleDay(key, d)}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    )
                                })
                            ))}
                        </tbody>
                     </table>
                 </div>
             )}

             {mode === 'HOUR' && (
                 <div>
                     <p className="mb-4 text-sm text-gray-600">Pilih kode mapel, lalu klik kotak jam untuk memblokir jam tersebut (Warna Merah = Blocked).</p>
                     
                     <div className="mb-4">
                         <label className="block text-sm font-bold mb-1">Pilih Kode Mapel:</label>
                         <select 
                            className="border p-2 rounded w-full md:w-1/2"
                            value={selectedCode || ''}
                            onChange={(e) => setSelectedCode(e.target.value)}
                         >
                             <option value="">-- Pilih Kode --</option>
                             {codes.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                         </select>
                     </div>

                     {selectedCode && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {TIME_STRUCTURE.map(day => (
                                 <div key={day.day} className="border p-2 rounded">
                                     <h4 className="font-bold text-center bg-gray-100 p-1 mb-2">{day.day}</h4>
                                     <div className="grid grid-cols-4 gap-2">
                                         {day.slots.filter(s => s.period >= 0).map(slot => {
                                             const constraint = constraints[selectedCode];
                                             const isDayBlocked = constraint?.blockedDays?.includes(day.day);
                                             const isHourBlocked = constraint?.blockedPeriods?.[day.day]?.includes(slot.period);
                                             const isBlocked = isDayBlocked || isHourBlocked;

                                             return (
                                                 <button
                                                    key={slot.period}
                                                    onClick={() => toggleHour(selectedCode, day.day, slot.period)}
                                                    disabled={isDayBlocked}
                                                    className={`
                                                        p-2 text-xs border rounded flex flex-col items-center justify-center h-16
                                                        ${isBlocked ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white hover:bg-gray-50'}
                                                        ${isDayBlocked ? 'opacity-50 cursor-not-allowed' : ''}
                                                    `}
                                                 >
                                                     <span className="font-bold">Ke-{slot.period}</span>
                                                     <span className="text-[10px]">{slot.start}</span>
                                                     {isDayBlocked && <span className="text-[9px]">(Day Off)</span>}
                                                 </button>
                                             )
                                         })}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
             )}
        </div>
    )
}
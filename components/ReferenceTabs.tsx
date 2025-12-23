
import React from 'react';
import { INITIAL_TEACHERS } from '../data';
import { JPSplitConstraints, SplitOption } from '../types';

interface Props {
    settings: JPSplitConstraints;
    onUpdate: (code: string, options: SplitOption[]) => void;
}

export const JPDistributionTable: React.FC<Props> = ({ settings, onUpdate }) => {
    
    const subjectStats: Record<string, {subject: string, maxHours: number}> = {};

    INITIAL_TEACHERS.forEach(t => {
        t.subjects.forEach(s => {
             const max = Math.max(...(Object.values(s.load) as number[]) || [0]);
             if (!subjectStats[s.code] || max > subjectStats[s.code].maxHours) {
                 subjectStats[s.code] = {
                     subject: s.subject,
                     maxHours: max
                 };
             }
        });
    });

    const sortedCodes = Object.keys(subjectStats).sort((a,b) => subjectStats[a].subject.localeCompare(subjectStats[b].subject));

    const columns: { label: string, val: SplitOption, validFor: number[] }[] = [
        { label: '4 + 4 + 2', val: '4+4+2', validFor: [10] },
        { label: '4 + 4', val: '4+4', validFor: [8] },
        { label: '4 + 3', val: '4+3', validFor: [7] },
        // Column '3 + 4' removed per request
        { label: '4 + 2', val: '4+2', validFor: [6] },
        { label: '3 + 3', val: '3+3', validFor: [6] },
        { label: '2 + 2 + 2', val: '2+2+2', validFor: [6] },
        { label: '3 + 2', val: '3+2', validFor: [5] },
        { label: '2 + 2', val: '2+2', validFor: [4] },
        { label: '5', val: '5', validFor: [5] },
        { label: '4', val: '4', validFor: [4] },
        { label: '3', val: '3', validFor: [3] },
        { label: '2', val: '2', validFor: [2] },
        { label: '1', val: '1', validFor: [1] },
    ];

    const isOptionSelected = (code: string, opt: SplitOption) => {
        const currentOptions = settings[code] || [];
        return currentOptions.includes(opt);
    };

    const handleToggle = (code: string, opt: SplitOption) => {
        const currentOptions = settings[code] || [];
        let newOptions: SplitOption[];

        if (currentOptions.includes(opt)) {
            newOptions = currentOptions.filter(x => x !== opt);
        } else {
            newOptions = [...currentOptions, opt];
        }
        
        onUpdate(code, newOptions);
    };

    return (
        <div className="bg-white p-6 shadow rounded overflow-x-auto">
            <h2 className="text-xl font-bold mb-4 uppercase border-b pb-2">Setting Pembagian JP Per Mapel</h2>
            <p className="mb-4 text-sm text-gray-600">
                Pilih konfigurasi pemecahan jam pelajaran. Anda bisa memilih <b>lebih dari satu opsi</b> (Checkbox). 
                <br/>Scheduler akan memilih salah satu opsi yang dicentang secara acak saat mengisi jadwal.
                <br/><b>Tips:</b> Jika ingin mapel 4 JP langsung 4 jam tanpa jeda, centang opsi <b>'4'</b>. Jika ingin pecah 2 jam-2 jam, centang <b>'2+2'</b>.
            </p>
            <table className="w-full border-collapse border border-gray-300 text-[10px] md:text-xs">
                <thead>
                    <tr className="bg-blue-800 text-white">
                        <th className="p-2 border border-gray-400 text-left min-w-[150px]">Mata Pelajaran</th>
                        <th className="p-2 border border-gray-400 w-12 text-center">Max JP</th>
                        {columns.map(c => (
                            <th key={c.label} className="p-2 border border-gray-400 text-center w-12">{c.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedCodes.map((code) => {
                        const { subject, maxHours } = subjectStats[code];
                        return (
                            <tr key={code} className="hover:bg-gray-50 border-b">
                                <td className="p-2 border border-gray-300 font-medium">
                                    {subject} <span className="text-gray-400">({code})</span>
                                </td>
                                <td className="p-2 border border-gray-300 text-center font-bold">{maxHours}</td>
                                {columns.map(col => {
                                    const isValid = col.validFor.includes(maxHours);
                                    if (!isValid) return <td key={col.label} className="bg-gray-50 border border-gray-300 opacity-20"></td>

                                    const isChecked = isOptionSelected(code, col.val);

                                    return (
                                        <td key={col.label} className={`p-2 border border-gray-300 text-center ${isChecked ? 'bg-blue-100' : ''}`}>
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 cursor-pointer accent-blue-600"
                                                checked={isChecked}
                                                onChange={() => handleToggle(code, col.val)}
                                            />
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
};

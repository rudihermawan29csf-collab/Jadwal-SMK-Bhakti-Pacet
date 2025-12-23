
import React, { useState, useMemo, useEffect } from 'react';
import { WeeklySchedule, CLASSES, Teacher, ScheduleCell, ClassName, UserRole } from '../types';
import { TIME_STRUCTURE } from '../data';
import { exportSpecificClassPDF, exportSpecificTeacherPDF } from '../utils/exporter';

interface Props {
    schedule: WeeklySchedule;
    teachers: Teacher[];
    userRole: UserRole;
    loggedTeacherId: number | null;
}

const isDarkBackground = (twClass?: string): boolean => {
    if (!twClass) return false;
    const darkPatterns = ['-600', '-500', '-700', '-800', '-900', 'slate-800', 'purple', 'blue-600', 'orange-500', 'amber-800', 'red-800', 'red-700', 'teal-600', 'pink-600'];
    return darkPatterns.some(p => twClass.includes(p));
};

export const PerClassTeacherSchedule: React.FC<Props> = ({ schedule, teachers, userRole, loggedTeacherId }) => {
    const isGuru = userRole === 'GURU' && loggedTeacherId !== null;
    
    const [mode, setMode] = useState<'CLASS' | 'TEACHER'>(isGuru ? 'TEACHER' : 'CLASS');
    const [selectedId, setSelectedId] = useState<string>(isGuru ? loggedTeacherId.toString() : CLASSES[0]);

    useEffect(() => {
        if (isGuru) {
            setMode('TEACHER');
            setSelectedId(loggedTeacherId.toString());
        }
    }, [isGuru, loggedTeacherId]);

    const handleDownload = (size: 'A4' | 'F4') => {
        if (mode === 'CLASS') {
            exportSpecificClassPDF(schedule, selectedId, size, teachers);
        } else {
            const t = teachers.find(t => t.id.toString() === selectedId);
            if (t) exportSpecificTeacherPDF(schedule, t, size, teachers);
        }
    };

    const days = TIME_STRUCTURE.map(d => d.day);
    
    const allPeriods = useMemo(() => {
        const uniquePeriods = new Set<number>();
        const sequence: number[] = [];
        const referenceDay = TIME_STRUCTURE.find(d => d.day === 'SENIN') || TIME_STRUCTURE[0];
        referenceDay.slots.forEach(slot => {
            if (!uniquePeriods.has(slot.period)) {
                uniquePeriods.add(slot.period);
                sequence.push(slot.period);
            }
        });
        return sequence;
    }, []);

    const getTimeRange = (period: number) => {
        for (const dayData of TIME_STRUCTURE) {
            const slot = dayData.slots.find(s => s.period === period);
            if (slot) return `${slot.start} - ${slot.end}`;
        }
        return "-";
    };

    const getCellContent = (day: string, period: number) => {
        const dayData = schedule[day];
        if (!dayData) return null;
        
        const slotConfig = TIME_STRUCTURE.find(d => d.day === day)?.slots.find(s => s.period === period);
        if (!slotConfig) return { type: 'NA' }; 

        if (slotConfig.type !== 'LEARNING') {
            return { type: 'BLOCKED', blockReason: slotConfig.label || slotConfig.type };
        }

        const cell = dayData[period];
        if (!cell) return null;

        if (mode === 'CLASS') {
            return cell[selectedId as ClassName];
        } else {
            let found: (ScheduleCell & { className: string }) | null = null;
            Object.entries(cell).forEach(([cls, c]) => {
                const cellData = c as ScheduleCell;
                if (cellData.type === 'CLASS' && cellData.teacherId?.toString() === selectedId) {
                    found = { ...cellData, className: cls };
                }
            });
            return found;
        }
    };

    const legendData = useMemo(() => {
        const dataMap = new Map<string, { code: string, subject: string, teacher: string, color: string }>();
        days.forEach(day => {
            allPeriods.forEach(p => {
                if (p < 0) return;
                const content = getCellContent(day, p) as any;
                if (content && content.type === 'CLASS') {
                    const key = `${content.teacherId}-${content.subjectCode}`;
                    if (!dataMap.has(key)) {
                        const t = teachers.find(tch => tch.id === content.teacherId);
                        const s = t?.subjects.find(sub => sub.code === content.subjectCode);
                        if (t && s) {
                             dataMap.set(key, {
                                 code: s.code,
                                 subject: s.subject,
                                 teacher: t.name,
                                 color: s.color || 'bg-slate-800'
                             });
                        }
                    }
                }
            });
        });
        return Array.from(dataMap.values()).sort((a,b) => a.code.localeCompare(b.code));
    }, [schedule, mode, selectedId, teachers, allPeriods, days]);

    const titlePrefix = mode === 'CLASS' ? 'KELAS' : 'GURU';
    const selectedTitle = mode === 'CLASS' ? selectedId : teachers.find(t => t.id.toString() === selectedId)?.name;

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in border border-gray-200">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-indigo-800 px-5 py-4 text-white no-print">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        {!isGuru && (
                            <div className="flex bg-black/20 p-1 rounded-xl backdrop-blur-sm border border-white/10">
                                <button onClick={() => { setMode('CLASS'); setSelectedId(CLASSES[0]); }} className={`px-4 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all ${mode === 'CLASS' ? 'bg-white shadow-lg text-blue-900' : 'text-blue-200 hover:text-white'}`}>
                                    PER KELAS
                                </button>
                                <button onClick={() => { setMode('TEACHER'); setSelectedId(teachers[0].id.toString()); }} className={`px-4 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all ${mode === 'TEACHER' ? 'bg-white shadow-lg text-blue-900' : 'text-blue-200 hover:text-white'}`}>
                                    PER GURU
                                </button>
                            </div>
                        )}

                        {isGuru ? (
                            <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                                <span className="text-xs font-black uppercase tracking-widest text-blue-200 block mb-0.5">Guru Terpilih</span>
                                <span className="text-sm font-bold text-white">{selectedTitle}</span>
                            </div>
                        ) : (
                            <select 
                                className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/40 w-full md:w-64 backdrop-blur-md appearance-none cursor-pointer"
                                value={selectedId}
                                onChange={(e) => setSelectedId(e.target.value)}
                            >
                                {mode === 'CLASS' ? (
                                    CLASSES.map(c => <option key={c} value={c} className="text-gray-900 font-semibold">KELAS {c}</option>)
                                ) : (
                                    teachers.sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                                        <option key={t.id} value={t.id.toString()} className="text-gray-900 font-semibold">{t.name} ({t.code})</option>
                                    ))
                                )}
                            </select>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={() => handleDownload('F4')} className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-4 py-2 rounded-xl shadow-lg font-black text-[10px] transition-all active:scale-95 uppercase tracking-widest">
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6 bg-slate-50">
                <div className="mb-4 text-center">
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Jadwal Pelajaran {titlePrefix}: <span className="text-blue-700">{selectedTitle}</span></h2>
                </div>

                <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200 bg-white">
                    <table className="w-full border-collapse table-fixed min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-800 text-white shadow-inner">
                                <th className="p-3 border-r border-slate-700 w-14 text-[9px] font-black uppercase tracking-widest">KE</th>
                                <th className="p-3 border-r border-slate-700 w-24 text-[9px] font-black uppercase tracking-widest">WAKTU</th>
                                {days.map(d => (
                                    <th key={d} className="p-3 border-r border-slate-700 text-[9px] font-black uppercase tracking-widest">{d}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {allPeriods.map((p, idx) => {
                                const isIstirahat = p < 0;
                                const label = isIstirahat ? "" : (p === 0 ? "0" : p.toString());
                                const timeRange = getTimeRange(p);
                                const istirahatLabel = p === -1 ? 'ISTIRAHAT' : 'BREAK';
                                
                                return (
                                    <tr key={idx} className={`${isIstirahat ? 'bg-slate-100' : 'bg-white'} border-b border-slate-100 last:border-0 h-14 group`}>
                                        <td className={`border-r border-slate-200 text-center font-black ${isIstirahat ? 'text-slate-400 italic' : 'text-blue-900 group-hover:bg-blue-50'} text-xs`}>
                                            {label}
                                        </td>
                                        <td className={`border-r border-slate-200 text-center font-bold text-[9px] ${isIstirahat ? 'text-slate-400 italic' : 'text-slate-500 group-hover:bg-blue-50'}`}>
                                            {timeRange}
                                        </td>
                                        {days.map(day => {
                                            const content = getCellContent(day, p);
                                            const c = content as any;
                                            if (!content || c.type === 'NA') return <td key={day} className="border-r border-slate-100 bg-slate-50/50"></td>;
                                            if (c.type === 'BLOCKED') {
                                                return <td key={day} className="border-r border-slate-100 text-center bg-slate-100/50 opacity-40 text-[8px] font-black uppercase text-slate-500">{isIstirahat ? istirahatLabel : (c.blockReason || 'OFF')}</td>;
                                            }
                                            if (c.type === 'CLASS') {
                                                const isDark = isDarkBackground(c.color);
                                                return (
                                                    <td key={day} className="border-r border-slate-100 p-1 relative">
                                                        <div className={`${c.color} rounded-lg h-full w-full flex flex-col items-center justify-center shadow-sm p-1 border border-white/50 ring-1 ring-black/5`}>
                                                            <span className={`font-black text-[11px] leading-none mb-0.5 truncate w-full text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>{mode === 'CLASS' ? c.subjectCode : c.className}</span>
                                                            <span className={`text-[8px] font-bold uppercase leading-none truncate w-full text-center ${isDark ? 'text-white/60' : 'text-gray-800/60'}`}>{mode === 'CLASS' ? c.teacherCode : c.subjectCode}</span>
                                                        </div>
                                                    </td>
                                                );
                                            }
                                            return <td key={day} className="border-r border-slate-100 hover:bg-slate-50"></td>;
                                        })}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {legendData.length > 0 && (
                    <div className="mt-8 animate-fade-in border-t border-slate-200 pt-6">
                         <h4 className="font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] mb-4 text-center">Keterangan Mata Pelajaran</h4>
                         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                             {legendData.map((row, idx) => {
                                 const isDark = isDarkBackground(row.color);
                                 return (
                                    <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
                                        <div className={`${row.color} ${isDark ? 'text-white' : 'text-gray-900'} w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shrink-0 shadow-sm uppercase border border-black/5`}>{row.code}</div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-black text-slate-700 text-[10px] truncate uppercase leading-tight">{row.subject}</span>
                                            <span className="text-[8px] text-slate-400 font-bold truncate italic leading-tight">{row.teacher}</span>
                                        </div>
                                    </div>
                                 );
                             })}
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
};

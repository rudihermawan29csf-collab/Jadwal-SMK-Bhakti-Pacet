
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WeeklySchedule, CLASSES, Teacher, ClassName, ScheduleCell, JPSplitConstraints, SplitOption } from '../types';
import { TIME_STRUCTURE } from '../data';
import { TeacherDutyTable } from './TeacherDutyTable';

interface Props {
  schedule: WeeklySchedule;
  setSchedule: (newSchedule: WeeklySchedule) => void;
  teachers: Teacher[];
  filterType: 'CLASS' | 'TEACHER';
  filterValue: string[];
  jpSplitSettings?: JPSplitConstraints;
}

const SPLIT_MAP: Record<SplitOption, number[]> = {
    '4+4+2': [4, 4, 2],
    '4+4': [4, 4],
    '4+3': [4, 3],
    '3+4': [3, 4],
    '4+2': [4, 2],
    '3+3': [3, 3],
    '2+2+2': [2, 2, 2],
    '3+2': [3, 2],
    '2+2': [2, 2],
    '5': [5],
    '4': [4],
    '3': [3],
    '2': [2],
    '1': [1],
    'DEFAULT': []
};

export const ManualEditTable: React.FC<Props> = ({ schedule, setSchedule, teachers, filterType, filterValue, jpSplitSettings = {} }) => {
  const [activeDay, setActiveDay] = useState<string>('SENIN');
  
  // Dropdown State
  const [dropdownOpen, setDropdownOpen] = useState<{day: string, period: number, cls: ClassName} | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setDropdownOpen(null);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, []);

  const isFilterAll = filterValue.includes('ALL');

  // --- HELPER: Max Chunk Size with Defaults ---
  const getMaxChunkSize = (subjectCode: string, totalWeeklyLoad: number): number => {
      const options = jpSplitSettings[subjectCode];
      
      // 1. If user defined settings, use the largest chunk from those settings
      if (options && options.length > 0) {
          let maxChunk = 0;
          options.forEach(opt => {
              const chunks = SPLIT_MAP[opt];
              if (chunks) {
                  const localMax = Math.max(...chunks);
                  if (localMax > maxChunk) maxChunk = localMax;
              }
          });
          return maxChunk > 0 ? maxChunk : totalWeeklyLoad;
      }

      // 2. Default Fallback Logic (Must match scheduler defaults)
      if (totalWeeklyLoad >= 6) return 3; // 3+3 or 2+2+2
      if (totalWeeklyLoad === 5) return 3; // 3+2
      if (totalWeeklyLoad === 4) return 2; // 2+2
      
      return totalWeeklyLoad; 
  };

  // --- GLOBAL CONFLICT CALCULATION ---
  const conflicts = useMemo(() => {
      const conflictMap = new Map<string, string[]>(); // Key: "day-period-class", Value: Error Messages

      const addConflict = (day: string, period: number, cls: string, msg: string) => {
          const key = `${day}-${period}-${cls}`;
          if (!conflictMap.has(key)) conflictMap.set(key, []);
          conflictMap.get(key)?.push(msg);
      };

      const days = TIME_STRUCTURE.map(d => d.day);

      // 1. Check Time Conflicts (One teacher in multiple classes at same time)
      days.forEach(day => {
          const dayData = schedule[day];
          if (!dayData) return;

          Object.keys(dayData).forEach(periodStr => {
              const period = parseInt(periodStr);
              if (period < 0) return; // Skip breaks

              const periodRow = dayData[period];
              const teacherLocations: Record<number, string[]> = {}; // teacherId -> [ClassNames]

              CLASSES.forEach(cls => {
                  const cell = periodRow[cls];
                  if (cell && cell.type === 'CLASS' && cell.teacherId) {
                      if (!teacherLocations[cell.teacherId]) {
                          teacherLocations[cell.teacherId] = [];
                      }
                      teacherLocations[cell.teacherId].push(cls);
                  }
              });

              // If a teacher is found in > 1 class
              Object.entries(teacherLocations).forEach(([tId, classes]) => {
                  if (classes.length > 1) {
                      classes.forEach(cls => {
                          const otherClasses = classes.filter(c => c !== cls).join(', ');
                          addConflict(day, period, cls, `Bentrok Waktu: Mengajar di ${otherClasses} juga.`);
                      });
                  }
              });
          });
      });

      // 2. Check Daily Subject Consistency & MAX JP Limit
      days.forEach(day => {
        const dayData = schedule[day];
        if (!dayData) return;
        
        CLASSES.forEach(cls => {
            const teacherSubjectsInClass: Record<number, Set<string>> = {}; 
            const teacherPeriodsInClass: Record<number, number[]> = {};
            const dailyCounts: Record<string, number> = {}; 
            const dailyPeriods: Record<string, number[]> = {};

            Object.keys(dayData).forEach(periodStr => {
                const period = parseInt(periodStr);
                if (period < 0) return;
                
                const cell = dayData[period]?.[cls];
                if (cell && cell.type === 'CLASS' && cell.teacherId && cell.subjectCode) {
                    if (!teacherSubjectsInClass[cell.teacherId]) {
                        teacherSubjectsInClass[cell.teacherId] = new Set();
                        teacherPeriodsInClass[cell.teacherId] = [];
                    }
                    teacherSubjectsInClass[cell.teacherId].add(cell.subjectCode);
                    teacherPeriodsInClass[cell.teacherId].push(period);

                    const key = `${cell.teacherId}-${cell.subjectCode}`;
                    dailyCounts[key] = (dailyCounts[key] || 0) + 1;
                    if (!dailyPeriods[key]) dailyPeriods[key] = [];
                    dailyPeriods[key].push(period);
                }
            });

            Object.entries(teacherSubjectsInClass).forEach(([tIdStr, subjects]) => {
                if (subjects.size > 1) {
                    const periods = teacherPeriodsInClass[parseInt(tIdStr)];
                    const subjectList = Array.from(subjects).join(' & ');
                    periods.forEach(p => {
                        addConflict(day, p, cls, `Bentrok Mapel: Guru mengajar mapel berbeda (${subjectList}) di kelas yang sama hari ini.`);
                    });
                }
            });

            Object.entries(dailyCounts).forEach(([key, count]) => {
                const [tIdStr, subCode] = key.split('-');
                const tId = parseInt(tIdStr);
                const teacher = teachers.find(t => t.id === tId);
                let totalWeekly = 0;
                if (teacher) {
                    const subject = teacher.subjects.find(s => s.code === subCode);
                    if (subject && subject.load[cls]) {
                        totalWeekly = subject.load[cls] || 0;
                    }
                }
                if (totalWeekly > 0) {
                    const maxAllowed = getMaxChunkSize(subCode, totalWeekly);
                    if (count > maxAllowed) {
                        const periods = dailyPeriods[key];
                        periods.forEach(p => {
                            addConflict(day, p, cls, `Bentrok JP: ${count} JP hari ini (Max: ${maxAllowed} JP).`);
                        });
                    }
                }
            });
        });
      });

      return conflictMap;
  }, [schedule, teachers, jpSplitSettings]);

  const getUsedHoursTotal = (teacherCode: string, subjectCode: string, cls: ClassName): number => {
      let count = 0;
      Object.values(schedule).forEach(day => {
          Object.values(day).forEach(period => {
              const cell = period[cls];
              if (cell && cell.type === 'CLASS' && cell.teacherCode === teacherCode && cell.subjectCode === subjectCode) {
                  count++;
              }
          });
      });
      return count;
  };

  const getUsedHoursOnDay = (teacherCode: string, subjectCode: string, cls: ClassName, dayName: string): number => {
      let count = 0;
      const dayData = schedule[dayName];
      if (!dayData) return 0;
      Object.values(dayData).forEach(periodRow => {
          const cell = periodRow[cls];
          if (cell && cell.type === 'CLASS' && cell.teacherCode === teacherCode && cell.subjectCode === subjectCode) {
              count++;
          }
      });
      return count;
  };

  const handleCellClick = (day: string, period: number, cls: ClassName) => {
      setDropdownOpen({ day, period, cls });
  };

  const updateCell = (day: string, period: number, cls: ClassName, newCell: ScheduleCell) => {
      const newSchedule = { ...schedule };
      newSchedule[day] = { ...newSchedule[day] };
      newSchedule[day][period] = { ...newSchedule[day][period] };
      newSchedule[day][period][cls] = newCell;
      setSchedule(newSchedule);
      setDropdownOpen(null);
  };

  const renderDropdown = () => {
      if (!dropdownOpen) return null;
      const { day, period, cls } = dropdownOpen;

      interface OptionType {
          label: string;
          subCode: string;
          tCode: string;
          remaining: number;
          cell: ScheduleCell;
          maxReached: boolean;
          maxVal: number;
          currentOnDay: number;
      }

      const options: OptionType[] = [];
      teachers.forEach(t => {
          t.subjects.forEach(s => {
              const totalLoad = s.load[cls] || 0;
              if (totalLoad > 0) {
                  const usedTotal = getUsedHoursTotal(t.code, s.code, cls);
                  const remaining = totalLoad - usedTotal;
                  const usedOnDay = getUsedHoursOnDay(t.code, s.code, cls, day);
                  const maxDailyChunk = getMaxChunkSize(s.code, totalLoad);
                  const isMaxReached = usedOnDay >= maxDailyChunk;
                  if (remaining > 0) {
                      options.push({
                          label: s.code,
                          subCode: s.code,
                          tCode: t.code,
                          remaining: remaining,
                          maxReached: isMaxReached,
                          maxVal: maxDailyChunk,
                          currentOnDay: usedOnDay,
                          cell: {
                            type: 'CLASS',
                            subject: s.subject,
                            subjectCode: s.code,
                            teacher: t.name,
                            teacherCode: t.code,
                            teacherId: t.id,
                            color: s.color
                          }
                      });
                  }
              }
          });
      });

      return (
          <div 
            ref={dropdownRef}
            className="absolute z-50 bg-white shadow-xl border border-gray-300 rounded w-96 max-h-96 overflow-y-auto text-sm animate-fade-in"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' }}
          >
              <div className="bg-gray-100 p-2 font-bold border-b text-gray-700 flex justify-between items-center">
                  <span>Edit: {day}, Ke-{period}, {cls}</span>
                  <button onClick={() => setDropdownOpen(null)} className="text-gray-500 hover:text-red-500">✕</button>
              </div>
              <div className="p-1">
                  <button onClick={() => updateCell(day, period, cls, { type: 'EMPTY' })} className="w-full text-left p-2 hover:bg-red-50 text-red-600 font-bold border-b mb-1 uppercase text-xs">[ Kosongkan Sel ]</button>
                  <button onClick={() => updateCell(day, period, cls, { type: 'BLOCKED', blockReason: 'Manual' })} className="w-full text-left p-2 hover:bg-gray-200 text-gray-600 font-bold border-b mb-1 uppercase text-xs">[ Blokir Manual (X) ]</button>
                  {options.length === 0 && <div className="p-4 text-gray-500 italic text-center text-xs">Tidak ada opsi mapel valid untuk kelas ini.<br/><span className="text-[10px]">(Cek Pembagian JP atau Sisa Jam)</span></div>}
                  {options.map((opt, idx) => {
                      const isDisabled = opt.maxReached;
                      let bgClass = 'hover:bg-blue-50';
                      let textClass = 'text-gray-800';
                      if (isDisabled) {
                          bgClass = 'bg-gray-100 cursor-not-allowed opacity-60';
                          textClass = 'text-gray-500';
                      }
                      return (
                          <button
                              key={idx}
                              disabled={isDisabled}
                              onClick={() => { if (!isDisabled) updateCell(day, period, cls, opt.cell) }}
                              className={`w-full text-left p-2 flex justify-between items-center border-b last:border-0 group transition-colors ${bgClass}`}
                          >
                              <div className="flex flex-col flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${textClass} uppercase`}>{opt.label}</span>
                                    {isDisabled && <span className="text-[9px] bg-red-600 text-white px-1 rounded font-black uppercase">Max {opt.maxVal} JP</span>}
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">Hari ini: {opt.currentOnDay}/{opt.maxVal} JP</span>
                              </div>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded ml-2 bg-green-100 text-green-700">SISA: {opt.remaining}</span>
                          </button>
                      );
                  })}
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col relative min-h-screen">
      <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2 justify-center">
        {TIME_STRUCTURE.map(d => (
            <button
                key={d.day}
                onClick={() => setActiveDay(d.day)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap
                    ${activeDay === d.day ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
                {d.day}
            </button>
        ))}
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 text-xs text-yellow-800 max-w-4xl mx-auto w-full rounded-r shadow-sm">
          <p className="font-bold flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>
            Panduan Manual Edit:
          </p>
          <ul className="list-disc pl-5 mt-1 space-y-0.5 opacity-90">
              <li>Pilihan mapel otomatis dibatasi oleh <b>Sisa Jam</b>.</li>
              <li><b>Strict Block:</b> Anda tidak bisa memilih mapel jika jatah JP harian sudah maksimal.</li>
              <li><b>Indikator Konflik:</b> Kotak <span className="bg-red-200 border border-red-500 px-1 font-black text-red-700">MERAH PULSA</span> menandakan bentrok waktu, mapel, atau kelebihan beban JP.</li>
          </ul>
      </div>

      {renderDropdown()}

      <div className="overflow-x-auto shadow-xl rounded-lg bg-white mb-8 border border-gray-200">
          {TIME_STRUCTURE.filter(d => d.day === activeDay).map(day => (
              <div key={day.day} className="min-w-[800px] max-w-4xl mx-auto">
                  <table className="w-full border-collapse border border-gray-300 table-fixed">
                      <thead>
                          <tr className="bg-purple-800 text-white">
                              <th className="border border-gray-400 p-2 w-10 text-[10px] uppercase">Ke</th>
                              <th className="border border-gray-400 p-2 w-24 text-[10px] uppercase">Waktu</th>
                              {CLASSES.map(cls => (
                                  <th key={cls} className={`border border-gray-400 p-2 w-20 text-[10px] md:text-xs ${filterType === 'CLASS' && !isFilterAll && !filterValue.includes(cls) ? 'opacity-30' : ''}`}>{cls}</th>
                              ))}
                          </tr>
                      </thead>
                      <tbody>
                          {day.slots.map((slot, idx) => {
                              if (slot.period < 0) {
                                  return (
                                      <tr key={idx} className="bg-gray-50">
                                          <td className="border border-gray-300 p-2 text-center" colSpan={2}></td>
                                          <td className="border border-gray-300 p-2 text-center font-bold text-gray-400 italic text-[10px] uppercase tracking-widest" colSpan={CLASSES.length}>{slot.label}</td>
                                      </tr>
                                  );
                              }
                              return (
                                  <tr key={idx} className="h-11">
                                      <td className="border border-gray-300 p-1 text-center font-bold bg-gray-50 text-gray-400 text-[10px]">{slot.period}</td>
                                      <td className="border border-gray-300 p-1 text-center text-[10px] text-gray-500">{slot.start} - {slot.end}</td>
                                      {CLASSES.map(cls => {
                                          const cell = schedule[day.day]?.[slot.period]?.[cls];
                                          if (!cell) return <td key={cls} className="border border-gray-300"></td>;
                                          
                                          let opacityClass = '';
                                          if (filterType === 'TEACHER' && !isFilterAll) {
                                              if (cell.type === 'CLASS' && cell.teacherId && filterValue.includes(cell.teacherId.toString())) {
                                                  opacityClass = 'ring-2 ring-purple-500 z-10 scale-[1.02] shadow-md';
                                              } else if (cell.type !== 'EMPTY') {
                                                  opacityClass = 'opacity-20 grayscale';
                                              }
                                          } else if (filterType === 'CLASS' && !isFilterAll) {
                                              if (!filterValue.includes(cls)) opacityClass = 'opacity-20 grayscale';
                                          }

                                          const conflictKey = `${day.day}-${slot.period}-${cls}`;
                                          const conflictErrors = conflicts.get(conflictKey);
                                          const hasConflict = conflictErrors && conflictErrors.length > 0;
                                          
                                          let cellColorClass = cell.color || 'bg-white';
                                          if (cell.type === 'BLOCKED') cellColorClass = 'bg-gray-200';
                                          
                                          return (
                                              <td 
                                                  key={cls} 
                                                  onClick={() => handleCellClick(day.day, slot.period, cls)}
                                                  title={hasConflict ? conflictErrors.join('\n') : ''}
                                                  className={`border border-gray-300 p-1 text-center cursor-pointer hover:bg-purple-50 transition-all relative ${opacityClass}`}
                                              >
                                                  {cell.type === 'CLASS' ? (
                                                      <div className={`h-full w-full rounded flex flex-col items-center justify-center shadow-sm border border-black/5 ${cellColorClass} ${hasConflict ? 'bg-red-200 border-2 border-red-600 animate-pulse' : ''}`}>
                                                          <div className={`text-[10px] font-black leading-tight uppercase ${hasConflict ? 'text-red-900' : 'text-gray-900'}`}>{cell.subjectCode}</div>
                                                          <div className="text-[7px] font-bold text-black/30 leading-none">{cell.teacherCode}</div>
                                                      </div>
                                                  ) : cell.type === 'BLOCKED' ? (
                                                      <div className="h-full w-full rounded flex items-center justify-center bg-gray-100 border border-gray-200">
                                                          <span className="text-gray-400 font-black text-[10px]">X</span>
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
          ))}
      </div>
      <div className="mt-8 border-t-4 border-purple-100 pt-6">
          <TeacherDutyTable teachers={teachers} schedule={schedule} mode="countdown" />
      </div>
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { generateSchedule, createEmptySchedule, fillScheduleWithCode } from './scheduler';
import { WeeklySchedule, CLASSES, ClassName, OffDayConstraints, Teacher, JPSplitConstraints, SplitOption, ScheduleCell, AppSettings, UserRole } from './types';
import { INITIAL_TEACHERS } from './data';
import { ScheduleTable } from './components/ScheduleTable';
import { TeacherDutyTable } from './components/TeacherDutyTable';
import { JPDistributionTable } from './components/ReferenceTabs';
import { OffCodeManager } from './components/OffCodeManager';
import { ManualEditTable } from './components/ManualEditTable';
import { PerClassTeacherSchedule } from './components/PerClassTeacherSchedule';
import { exportDutiesExcel, exportDutiesPDF, exportScheduleExcel, exportSchedulePDF } from './utils/exporter';

type Tab = 'SCHEDULE' | 'PER_CLASS_TEACHER' | 'EDIT_MANUAL' | 'DUTIES' | 'OFF_CODES' | 'JP_DIST';

const STORAGE_KEY = 'SMPN3_PACET_DATA_V1';
const LOGO_URL = "https://iili.io/fE4CthG.png";
const LOGIN_BG_URL = "https://scontent.fsub2-2.fna.fbcdn.net/v/t39.30808-6/481243967_1132369265566430_2047520136138959486_n.jpg?stp=dst-jpg_s960x960_tt6&_nc_cat=102&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=XpI9K8L9024Q7kNvwHZ01Zn&_nc_oc=AdmLx0g_v3DetsCrcvE0bn5BVgR4IsEMCv1P43NwT3aP6B1UJmVTeyF7pLCWijd_UlMQyn3IE4zlPUu0dYv2PXsH&_nc_zt=23&_nc_ht=scontent.fsub2-2.fna&_nc_gid=DC7Pqmrn8_Dnp7iSwc77hQ&oh=00_Afn0d45zoZasyPFNu7wFScX-czBopyGzb1c2TCcOP_yXaQ&oe=69503860";

const DEFAULT_JP_SETTINGS: JPSplitConstraints = {
    'C4': ['2+2'], 'D3': ['3'], 'E1': ['3'], 'F20': ['4+3', '3+2'], 'F21': ['4+2'], 'F24': ['5'], 'G10': ['2+2'], 'I6': ['2+2'], 'J6': ['2+2'], 'K12': ['2'], 'K5': ['2'], 'L11': ['4+4', '4+3'], 'M16': ['2'], 'M27': ['1'], 'M28': ['1'], 'M33': ['4+4+2'], 'M36': ['4+4+2'], 'M38': ['4+4+2'], 'N11': ['3+2'], 'O3': ['2+2'], 'O5': ['2'], 'P2': ['2'], 'Q13': ['2'], 'R9': ['2+2'], 'R29': ['4'], 'R34': ['4'], 'S1': ['3'], 'S7': ['3', '2'], 'T19': ['4+3'], 'T22': ['4'], 'T24': ['3+2'], 'U8': ['2'], 'U30': ['4'], 'U31': ['2'], 'U32': ['4']
};

const App: React.FC = () => {
  const getInitialTeachers = () => JSON.parse(JSON.stringify(INITIAL_TEACHERS));

  // Auth States
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem('USER_ROLE') as UserRole) || 'NONE');
  const [loggedTeacherId, setLoggedTeacherId] = useState<number | null>(() => {
      const id = localStorage.getItem('LOGGED_TEACHER_ID');
      return id ? parseInt(id) : null;
  });
  
  const [loginRole, setLoginRole] = useState<'ADMIN' | 'GURU'>('GURU');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // App States
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [history, setHistory] = useState<WeeklySchedule[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [teachers, setTeachers] = useState<Teacher[]>(getInitialTeachers());
  const [offConstraints, setOffConstraints] = useState<OffDayConstraints>({});
  const [jpSplitSettings, setJpSplitSettings] = useState<JPSplitConstraints>(DEFAULT_JP_SETTINGS);
  const [activeTab, setActiveTab] = useState<Tab>('SCHEDULE');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ academicYear: '2025/2026', semester: '2 (Genap)' });
  
  const [filterType, setFilterType] = useState<'CLASS' | 'TEACHER'>('CLASS');
  const [filterValue, setFilterValue] = useState<string[]>(['ALL']);
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false);
  const multiSelectRef = useRef<HTMLDivElement>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Undo / Redo Logic
  const setScheduleWithHistory = (newSchedule: WeeklySchedule, forceResetHistory = false) => {
    const cloned = JSON.parse(JSON.stringify(newSchedule));
    if (forceResetHistory) {
      setHistory([cloned]);
      setHistoryIndex(0);
    } else {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(cloned);
      if (newHistory.length > 50) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setSchedule(cloned);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setSchedule(JSON.parse(JSON.stringify(prev)));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setSchedule(JSON.parse(JSON.stringify(next)));
    }
  };

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            const initialSchedule = parsed.schedule || createEmptySchedule();
            setSchedule(initialSchedule);
            setHistory([JSON.parse(JSON.stringify(initialSchedule))]);
            setHistoryIndex(0);

            if (parsed.teachers) setTeachers(parsed.teachers);
            if (parsed.offConstraints) setOffConstraints(parsed.offConstraints);
            if (parsed.jpSplitSettings) setJpSplitSettings(parsed.jpSplitSettings);
            if (parsed.settings) setSettings(parsed.settings);
            if (parsed.timestamp) setLastSaved(parsed.timestamp);
        } catch (e) {
            const empty = createEmptySchedule();
            setSchedule(empty);
            setHistory([JSON.parse(JSON.stringify(empty))]);
            setHistoryIndex(0);
            setTeachers(getInitialTeachers());
            setJpSplitSettings(DEFAULT_JP_SETTINGS);
        }
    } else {
        const empty = createEmptySchedule();
        setSchedule(empty);
        setHistory([JSON.parse(JSON.stringify(empty))]);
        setHistoryIndex(0);
        setTeachers(getInitialTeachers());
        setJpSplitSettings(DEFAULT_JP_SETTINGS);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');

      if (loginRole === 'ADMIN') {
          if (passwordInput === 'admin123') {
              setUserRole('ADMIN');
              localStorage.setItem('USER_ROLE', 'ADMIN');
          } else {
              setLoginError('Password Admin salah!');
          }
      } else {
          if (!selectedTeacherId) {
              setLoginError('Pilih nama guru terlebih dahulu!');
              return;
          }
          if (passwordInput === 'guru123') {
              setUserRole('GURU');
              const tId = parseInt(selectedTeacherId);
              setLoggedTeacherId(tId);
              localStorage.setItem('USER_ROLE', 'GURU');
              localStorage.setItem('LOGGED_TEACHER_ID', tId.toString());
              setActiveTab('SCHEDULE');
          } else {
              setLoginError('Password Guru salah!');
          }
      }
  };

  const handleLogout = () => {
      setUserRole('NONE');
      setLoggedTeacherId(null);
      localStorage.removeItem('USER_ROLE');
      localStorage.removeItem('LOGGED_TEACHER_ID');
      setPasswordInput('');
      setSelectedTeacherId('');
      setLoginError('');
  };

  const handleSaveData = () => {
      if (userRole !== 'ADMIN') return;
      const now = new Date().toLocaleString('id-ID');
      const dataToSave = { schedule, teachers, offConstraints, jpSplitSettings, settings, timestamp: now };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setLastSaved(now);
      alert('Data berhasil disimpan!');
  };

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (multiSelectRef.current && !multiSelectRef.current.contains(event.target as Node)) setIsMultiSelectOpen(false);
          if (exportRef.current && !exportRef.current.contains(event.target as Node)) setIsExportDropdownOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCodeStats = (tId: number, sCode: string, targetLoad: number) => {
      if (!schedule) return { total: 0, placed: 0 };
      let total = 0, placed = 0;
      const teacher = teachers.find(t => t.id === tId);
      const subject = teacher?.subjects.find(s => s.code === sCode);
      
      if (subject) {
          const relevantClasses = Object.entries(subject.load)
            .filter(([_, loadVal]) => (loadVal as number) === targetLoad)
            .map(([cls, _]) => cls as ClassName);

          total = relevantClasses.length * targetLoad;

          Object.values(schedule).forEach(day => {
              Object.values(day).forEach(row => {
                  relevantClasses.forEach(cls => {
                      const cell = row[cls];
                      if (cell && cell.type === 'CLASS' && cell.teacherId === tId && cell.subjectCode === sCode) {
                          placed++;
                      }
                  });
              });
          });
      }
      return { total, placed };
  };

  const handleCodeClick = (tId: number, sCode: string, targetLoad: number) => {
      if (userRole !== 'ADMIN' || !schedule) return;
      const nextSchedule = fillScheduleWithCode(schedule, teachers, tId, sCode, offConstraints, jpSplitSettings, targetLoad);
      setScheduleWithHistory(nextSchedule);
  };

  const toggleTeacherFilter = (id: string) => {
      let newValues = [...filterValue];
      if (newValues.includes('ALL')) newValues = [];
      if (newValues.includes(id)) newValues = newValues.filter(v => v !== id);
      else newValues.push(id);
      setFilterValue(newValues.length === 0 ? ['ALL'] : newValues);
  };

  const handleExport = (type: 'EXCEL' | 'PDF_A4' | 'PDF_F4') => {
      if (!schedule) return;
      if (type === 'EXCEL') exportScheduleExcel(schedule);
      if (type === 'PDF_A4') exportSchedulePDF(schedule, teachers, 'A4');
      if (type === 'PDF_F4') exportSchedulePDF(schedule, teachers, 'F4');
      setIsExportDropdownOpen(false);
  };

  if (userRole === 'NONE') {
      return (
          <div 
            className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative overflow-hidden"
            style={{ backgroundImage: `url(${LOGIN_BG_URL})` }}
          >
              {/* Overlay for readability */}
              <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[2px]"></div>

              <div className="relative z-10 bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-white/40 ring-1 ring-black/5">
                  <div className="bg-blue-900 py-10 flex flex-col items-center text-center px-4">
                      <div className="bg-white p-3 rounded-3xl shadow-lg mb-4 ring-4 ring-blue-800/50">
                        <img src={LOGO_URL} alt="Logo" className="h-20 w-auto drop-shadow-md" />
                      </div>
                      <h2 className="text-white text-2xl font-black uppercase tracking-[0.2em]">SMPN 3 PACET</h2>
                      <div className="h-0.5 w-16 bg-blue-400 mt-2 mb-1"></div>
                      <p className="text-blue-200 text-[10px] font-black mt-1 tracking-[0.3em] uppercase opacity-80">Automated Scheduler</p>
                  </div>

                  <form onSubmit={handleLogin} className="p-8 md:p-10">
                      <div className="mb-6">
                          <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.15em] mb-3 ml-1">Masuk Sebagai</label>
                          <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200 shadow-inner">
                              <button 
                                type="button"
                                onClick={() => { setLoginRole('GURU'); setPasswordInput(''); setLoginError(''); }}
                                className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${loginRole === 'GURU' ? 'bg-white text-blue-900 shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                              >Guru</button>
                              <button 
                                type="button"
                                onClick={() => { setLoginRole('ADMIN'); setPasswordInput(''); setLoginError(''); }}
                                className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${loginRole === 'ADMIN' ? 'bg-white text-blue-900 shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                              >Admin</button>
                          </div>
                      </div>

                      {loginRole === 'GURU' && (
                          <div className="mb-5 animate-fade-in">
                              <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.15em] mb-2 ml-1">Pilih Nama Guru</label>
                              <div className="relative">
                                <select 
                                    className="w-full bg-white border-2 border-gray-200 rounded-2xl px-5 py-3.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-gray-800 appearance-none cursor-pointer"
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                                >
                                    <option value="">-- Pilih Nama Anda --</option>
                                    {teachers.sort((a,b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>
                                </div>
                              </div>
                          </div>
                      )}

                      <div className="mb-8">
                          <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.15em] mb-2 ml-1">Password</label>
                          <input 
                              type="password" 
                              className="w-full bg-white border-2 border-gray-200 rounded-2xl px-5 py-3.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold tracking-[0.2em] text-gray-800 placeholder:tracking-normal placeholder:font-normal"
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              placeholder="••••••••"
                          />
                          {loginError && (
                              <div className="flex items-center gap-1 text-red-500 text-[10px] font-black mt-2 ml-1 uppercase animate-bounce">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg>
                                {loginError}
                              </div>
                          )}
                      </div>
                      
                      <button 
                        type="submit" 
                        className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black py-4.5 rounded-2xl shadow-[0_10px_30px_rgba(30,58,138,0.3)] transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 group"
                      >
                          Masuk
                          <svg className="transition-transform group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/></svg>
                      </button>
                  </form>
                  
                  <div className="bg-gray-50 py-4 px-8 border-t border-gray-100 text-center">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                        &copy; 2025 SMPN 3 PACET <br/> 
                        <span className="opacity-60 italic font-normal lowercase tracking-tight">Kreativitas & Integritas Menuju Masa Depan</span>
                    </p>
                  </div>
              </div>
          </div>
      );
  }

  const showExport = activeTab === 'SCHEDULE' || activeTab === 'DUTIES' || activeTab === 'EDIT_MANUAL' || activeTab === 'PER_CLASS_TEACHER';
  const availableTabs = userRole === 'ADMIN' 
    ? ['SCHEDULE', 'PER_CLASS_TEACHER', 'EDIT_MANUAL', 'DUTIES', 'OFF_CODES', 'JP_DIST']
    : ['SCHEDULE', 'PER_CLASS_TEACHER', 'DUTIES'];

  const loggedTeacherName = userRole === 'GURU' ? teachers.find(t => t.id === loggedTeacherId)?.name : 'Administrator';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-blue-900 text-white shadow-md no-print sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-4">
                <div className="bg-white p-1 rounded-lg shadow-inner">
                    <img src={LOGO_URL} alt="Logo" className="h-16 w-auto object-contain" />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-black flex items-center gap-2 uppercase tracking-tight">SMPN 3 PACET</h1>
                    <div className="flex gap-4 mt-0.5">
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-blue-300 font-bold uppercase">TA:</span>
                            <span className="text-xs text-white font-bold">{settings.academicYear}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-blue-300 font-bold uppercase">Semester:</span>
                            <span className="text-xs text-white font-bold uppercase">{settings.semester}</span>
                        </div>
                        {lastSaved && <span className="text-[9px] font-black bg-blue-700/50 px-2 py-0.5 rounded text-blue-200 uppercase flex items-center">SAVED: {lastSaved}</span>}
                    </div>
                </div>
            </div>
            <div className="flex gap-2 items-center">
                <div className="flex flex-col items-end mr-2">
                    <span className="bg-white/10 px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border border-white/20 text-blue-200">{userRole}</span>
                    <span className="text-[10px] font-bold text-white mt-0.5 max-w-[150px] truncate">{loggedTeacherName}</span>
                </div>
                {userRole === 'ADMIN' && (
                    <button onClick={handleSaveData} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow transition text-sm font-bold">SIMPAN</button>
                )}
                {showExport && (
                    <div className="relative" ref={exportRef}>
                        <button onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded shadow transition text-sm font-medium">Download</button>
                        {isExportDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-xl border border-gray-200 z-50 overflow-hidden">
                                <button onClick={() => handleExport('EXCEL')} className="w-full text-left px-4 py-2 hover:bg-green-50 text-sm font-medium border-b">Excel (Warna)</button>
                                <button onClick={() => handleExport('PDF_A4')} className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm font-medium border-b">PDF A4</button>
                                <button onClick={() => handleExport('PDF_F4')} className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm font-medium">PDF F4 (Folio)</button>
                            </div>
                        )}
                    </div>
                )}
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow transition text-sm font-bold ml-2">LOGOUT</button>
            </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 shadow-sm no-print sticky top-[72px] z-20">
        <div className="container mx-auto flex overflow-x-auto">
            {availableTabs.map(t => (
                <button key={t} onClick={() => setActiveTab(t as Tab)} className={`px-6 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${activeTab === t ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
                    {t.replace(/_/g, ' ')}
                </button>
            ))}
        </div>
      </div>

      {(activeTab === 'SCHEDULE' || activeTab === 'EDIT_MANUAL') && (
        <div className="bg-gray-100 border-b border-gray-200 p-3 no-print">
            <div className="container mx-auto flex flex-wrap gap-4 items-center">
                <span className="text-xs font-bold text-gray-600 uppercase">Tampilan:</span>
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value as 'CLASS' | 'TEACHER'); setFilterValue(['ALL']); }} className="border rounded px-2 py-1 text-sm"><option value="CLASS">Per Kelas</option><option value="TEACHER">Per Guru</option></select>
                {filterType === 'CLASS' ? (
                    <select value={filterValue[0]} onChange={(e) => setFilterValue([e.target.value])} className="border rounded px-2 py-1 text-sm"><option value="ALL">Semua Kelas</option>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                ) : (
                    <div className="relative" ref={multiSelectRef}>
                        <button onClick={() => setIsMultiSelectOpen(!isMultiSelectOpen)} className="bg-white border rounded px-3 py-1 text-sm flex justify-between min-w-[200px]">{filterValue.includes('ALL') ? 'Semua Guru' : `${filterValue.length} Guru Terpilih`}</button>
                        {isMultiSelectOpen && (
                            <div className="absolute top-full left-0 mt-1 w-64 bg-white border shadow-xl rounded-md z-50 p-2 max-h-80 overflow-y-auto">
                                <label className="flex items-center gap-2 p-1 hover:bg-gray-50"><input type="checkbox" checked={filterValue.includes('ALL')} onChange={() => setFilterValue(['ALL'])} /> Semua Guru</label>
                                {teachers.map(t => <label key={t.id} className="flex items-center gap-2 p-1 hover:bg-gray-50"><input type="checkbox" checked={filterValue.includes(t.id.toString())} onChange={() => toggleTeacherFilter(t.id.toString())} /> {t.name}</label>)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      )}

      <main className="flex-1 container mx-auto p-4">
        {activeTab === 'SCHEDULE' && schedule && (
            <>
                {userRole === 'ADMIN' && (
                    <div className="bg-white p-4 shadow rounded-lg mb-6 no-print border-t-4 border-blue-600 animate-fade-in">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-gray-700 uppercase">Distribusi Cepat (Klik untuk Mengisi)</h3>
                            <div className="flex gap-2">
                                <button 
                                    disabled={historyIndex <= 0}
                                    onClick={undo}
                                    className={`px-3 py-1.5 rounded text-[10px] font-black uppercase shadow-sm transition-all active:scale-95 flex items-center gap-1 ${historyIndex <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966a.25.25 0 0 0 .41-.192z"/></svg>
                                    Undo
                                </button>
                                <button 
                                    disabled={historyIndex >= history.length - 1}
                                    onClick={redo}
                                    className={`px-3 py-1.5 rounded text-[10px] font-black uppercase shadow-sm transition-all active:scale-95 flex items-center gap-1 ${historyIndex >= history.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                                >
                                    Redo
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966a.25.25 0 0 1 0 .384L8.41 4.658a.25.25 0 0 1-.41-.192z"/></svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {teachers.flatMap(t => t.subjects.flatMap(s => {
                                const uniqueLoads = Array.from(new Set(Object.values(s.load).filter((v): v is number => typeof v === 'number' && v > 0)));
                                return uniqueLoads.map(loadVal => {
                                    const stats = getCodeStats(t.id, s.code, loadVal);
                                    const isComplete = stats.placed >= stats.total;
                                    return (
                                        <button key={`${t.id}-${s.code}-${loadVal}`} onClick={() => handleCodeClick(t.id, s.code, loadVal)} disabled={isComplete} className={`px-3 py-2 rounded border text-xs font-bold flex flex-col items-center min-w-[100px] transition-all ${isComplete ? 'bg-gray-100 text-gray-400 border-gray-200' : `${s.color} shadow-sm active:scale-95 border-black/10 hover:brightness-95`}`}>
                                            <span className="uppercase">{s.code} ({loadVal} JP)</span>
                                            <span className="text-[10px] font-normal opacity-80">{stats.placed}/{stats.total} Jam</span>
                                        </button>
                                    );
                                });
                            }))}
                        </div>
                    </div>
                )}
                
                <div className="bg-white shadow-xl rounded-lg p-6 mb-8 border border-gray-200">
                    <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
                        <div className="flex justify-center items-center gap-6 mb-2">
                            <img src={LOGO_URL} className="h-20 w-auto" alt="Logo" />
                            <div className="text-center">
                                <h1 className="text-2xl font-bold uppercase">JADWAL PELAJARAN SMPN 3 PACET</h1>
                                <h2 className="text-lg font-bold">TAHUN PELAJARAN {settings.academicYear} - SEMESTER {settings.semester.toUpperCase()}</h2>
                            </div>
                        </div>
                    </div>
                    <ScheduleTable schedule={schedule} filterType={filterType} filterValue={filterValue} />
                </div>
                <TeacherDutyTable teachers={teachers} schedule={schedule} mode="countdown" />
            </>
        )}
        {activeTab === 'PER_CLASS_TEACHER' && schedule && <PerClassTeacherSchedule schedule={schedule} teachers={teachers} userRole={userRole} loggedTeacherId={loggedTeacherId} />}
        {activeTab === 'EDIT_MANUAL' && schedule && <ManualEditTable schedule={schedule} setSchedule={setScheduleWithHistory} teachers={teachers} filterType={filterType} filterValue={filterValue} jpSplitSettings={jpSplitSettings} />}
        {activeTab === 'DUTIES' && <TeacherDutyTable teachers={teachers} setTeachers={userRole === 'ADMIN' ? setTeachers : undefined} schedule={null} mode={userRole === 'ADMIN' ? 'static' : 'countdown'} />}
        {activeTab === 'OFF_CODES' && <OffCodeManager teachers={teachers} constraints={offConstraints} onChange={setOffConstraints} />}
        {activeTab === 'JP_DIST' && <JPDistributionTable settings={jpSplitSettings} onUpdate={(code, opts) => setJpSplitSettings(prev => ({...prev, [code]: opts}))} />}
      </main>
      <footer className="bg-white border-t p-4 mt-auto no-print text-center text-[10px] text-gray-400 font-bold tracking-widest uppercase">&copy; 2025 SMPN 3 PACET - AUTOMATED SCHEDULER</footer>
    </div>
  );
};

export default App;

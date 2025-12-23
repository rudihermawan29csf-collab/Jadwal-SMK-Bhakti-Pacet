
import React, { useState } from 'react';
import { Teacher, WeeklySchedule, CLASSES, ClassName, SubjectLoad } from '../types';
import { exportDutiesExcel, exportDutiesPDF } from '../utils/exporter';

interface Props {
  teachers: Teacher[];
  setTeachers?: (teachers: Teacher[]) => void;
  schedule: WeeklySchedule | null;
  mode?: 'static' | 'countdown';
}

export const TeacherDutyTable: React.FC<Props> = ({ teachers, setTeachers, schedule, mode = 'static' }) => {
  const [editId, setEditId] = useState<string | null>(null); // "teacherId|subjectId"
  const [editForm, setEditForm] = useState<Partial<Teacher & { subjectData: SubjectLoad }>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // New Teacher Form State
  const [newTeacher, setNewTeacher] = useState<Partial<Teacher>>({
      name: '', nip: '-', rank: '-', group: '-', code: '', additionalTask: '-', additionalHours: 0
  });
  const [newSubject, setNewSubject] = useState<Partial<SubjectLoad>>({
      subject: '', code: '', color: 'bg-gray-200', load: {}
  });

  const isCountdown = mode === 'countdown';

  // Calculate remaining hours
  const calculateRemaining = (teacherCode: string, subjectCode: string, cls: ClassName, initialLoad: number) => {
    if (!schedule || mode === 'static') return initialLoad;
    let scheduledCount = 0;
    Object.values(schedule).forEach(day => {
        Object.values(day).forEach(period => {
            const cell = period[cls];
            if (cell.type === 'CLASS' && cell.teacherCode === teacherCode && cell.subjectCode === subjectCode) {
                scheduledCount++;
            }
        });
    });
    return initialLoad - scheduledCount;
  };

  // --- Actions ---

  const handleExportPDF = (size: 'A4' | 'F4') => {
    exportDutiesPDF(teachers, size);
    setIsExporting(false);
  };

  const handleExportExcel = () => {
    exportDutiesExcel(teachers);
    setIsExporting(false);
  };

  const handleDelete = (tId: number, sId: string) => {
      if (!setTeachers) return;
      if (!confirm('Hapus data ini?')) return;
      
      const updated = teachers.map(t => {
          if (t.id === tId) {
              return { ...t, subjects: t.subjects.filter(s => s.id !== sId) };
          }
          return t;
      }).filter(t => t.subjects.length > 0); // Remove teacher if no subjects left
      
      setTeachers(updated);
  };

  const startEdit = (t: Teacher, s: SubjectLoad) => {
      setEditId(`${t.id}|${s.id}`);
      setEditForm({
          ...t,
          subjectData: { ...s }
      });
  };

  const cancelEdit = () => {
      setEditId(null);
      setEditForm({});
  };

  const saveEdit = () => {
      if (!setTeachers || !editId || !editForm.subjectData) return;
      
      const [tIdStr, sIdStr] = editId.split('|');
      const tId = parseInt(tIdStr);
      
      const updated = teachers.map(t => {
          if (t.id === tId) {
              const newSubjects = t.subjects.map(s => {
                  if (s.id === sIdStr) {
                      return editForm.subjectData as SubjectLoad;
                  }
                  return s;
              });
              
              return {
                  ...t,
                  name: editForm.name || t.name,
                  nip: editForm.nip || t.nip,
                  rank: editForm.rank || t.rank,
                  group: editForm.group || t.group,
                  code: editForm.code || t.code,
                  additionalTask: editForm.additionalTask || t.additionalTask,
                  additionalHours: editForm.additionalHours !== undefined ? editForm.additionalHours : t.additionalHours,
                  subjects: newSubjects
              };
          }
          return t;
      });
      
      setTeachers(updated);
      setEditId(null);
  };

  const saveNew = () => {
      if (!setTeachers) return;
      if (!newTeacher.name || !newSubject.subject) {
          alert("Nama dan Mapel harus diisi");
          return;
      }

      const newId = Math.max(...teachers.map(t => t.id), 0) + 1;
      const newSubjectData: SubjectLoad = {
          id: `${newId}-1`,
          subject: newSubject.subject || '',
          code: newSubject.code || '',
          color: newSubject.color || 'bg-gray-200',
          load: newSubject.load || {}
      };

      const fullTeacher: Teacher = {
          id: newId,
          name: newTeacher.name || '',
          nip: newTeacher.nip || '-',
          rank: newTeacher.rank || '-',
          group: newTeacher.group || '-',
          code: newTeacher.code || '',
          additionalTask: newTeacher.additionalTask || '-',
          additionalHours: newTeacher.additionalHours || 0,
          subjects: [newSubjectData]
      };

      setTeachers([...teachers, fullTeacher]);
      setIsAdding(false);
      setNewTeacher({ name: '', nip: '-', rank: '-', group: '-', code: '', additionalTask: '-', additionalHours: 0 });
      setNewSubject({ subject: '', code: '', color: 'bg-gray-200', load: {} });
  };

  // Flatten rows for display and calculation
  const rows = [];
  let no = 1;
  const classTotals: Record<string, number> = {};
  CLASSES.forEach(cls => classTotals[cls] = 0);
  let grandTotalJP = 0;

  for (const t of teachers) {
      for (const sub of t.subjects) {
          rows.push({ t, sub, no: no++ });
          
          let subTotal = 0;
          CLASSES.forEach(cls => {
              const val = sub.load[cls] || 0;
              classTotals[cls] += val;
              subTotal += val;
          });
          grandTotalJP += subTotal;
      }
  }

  const renderEditRow = () => {
      const fd = editForm;
      const sd = fd.subjectData!;
      
      return (
          <tr className="bg-yellow-50 border-2 border-blue-500">
              <td colSpan={100} className="p-4">
                  <h4 className="font-bold text-blue-700 mb-2 uppercase text-xs">Edit Data Guru</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                      <div><label className="text-xs font-bold block mb-1">Nama Guru</label><input className="w-full border p-1 rounded" value={fd.name} onChange={e => setEditForm({...fd, name: e.target.value})} /></div>
                      <div><label className="text-xs font-bold block mb-1">Mata Pelajaran</label><input className="w-full border p-1 rounded" value={sd.subject} onChange={e => setEditForm({...fd, subjectData: {...sd, subject: e.target.value}})} /></div>
                      <div><label className="text-xs font-bold block mb-1">Kode Mapel</label><input className="w-full border p-1 rounded" value={sd.code} onChange={e => setEditForm({...fd, subjectData: {...sd, code: e.target.value}})} /></div>
                      <div><label className="text-xs font-bold block mb-1">Kode Guru (Inisial)</label><input className="w-full border p-1 rounded" value={fd.code} onChange={e => setEditForm({...fd, code: e.target.value})} /></div>
                  </div>
                  
                  <div className="mb-4 bg-white p-2 border rounded">
                      <div className="mb-2 font-bold text-xs text-gray-700">Jam Mengajar Per Kelas:</div>
                      <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
                          {CLASSES.map(cls => (
                              <div key={cls}>
                                  <label className="text-[10px] block text-center text-gray-500">{cls}</label>
                                  <input 
                                      type="number" 
                                      className="w-full border p-1 text-center font-bold text-sm" 
                                      value={sd.load[cls] ?? 0} 
                                      onChange={e => {
                                          const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                          const newLoad = {...sd.load, [cls]: val};
                                          setEditForm({...fd, subjectData: {...sd, load: newLoad}});
                                      }}
                                  />
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="flex gap-2 justify-end border-t pt-2">
                      <button onClick={cancelEdit} className="bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-600 text-sm">Batal</button>
                      <button onClick={saveEdit} className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 text-sm font-bold">Simpan Perubahan</button>
                  </div>
              </td>
          </tr>
      )
  };

  const calculateTotalLoad = (sub: SubjectLoad) => {
      return Object.values(sub.load).reduce((a, b) => (a || 0) + (b || 0), 0);
  };

  return (
    <div className="bg-white p-4 shadow rounded overflow-x-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 no-print">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-blue-900">
                {isCountdown ? 'Kontrol Jadwal & Sisa Jam' : 'Pembagian Tugas Guru'}
            </h2>
            {isCountdown && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    <span className="text-green-600">0 Jam</span> = Selesai &bull; <span className="text-red-600">Jam Plus</span> = Belum Terjadwal
                </p>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
              {/* Export Dropdown */}
              <div className="relative">
                  <button 
                    onClick={() => setIsExporting(!isExporting)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>
                      Ekspor Data
                  </button>
                  {isExporting && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                          <button onClick={handleExportExcel} className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-[10px] font-black uppercase text-emerald-700 border-b flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                              Excel (XLSX)
                          </button>
                          <button onClick={() => handleExportPDF('A4')} className="w-full text-left px-4 py-3 hover:bg-red-50 text-[10px] font-black uppercase text-red-700 border-b flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15h3a2 2 0 0 0 0-4H9v4Z"></path></svg>
                              PDF A4
                          </button>
                          <button onClick={() => handleExportPDF('F4')} className="w-full text-left px-4 py-3 hover:bg-red-50 text-[10px] font-black uppercase text-red-700 flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                              PDF F4 (Folio)
                          </button>
                      </div>
                  )}
              </div>

              {!isCountdown && setTeachers && !isAdding && (
                 <button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
                     Tambah Data
                 </button>
              )}
          </div>
      </div>

      {isAdding && (
          <div className="mb-6 border-2 border-blue-600 p-4 bg-blue-50 rounded shadow-md animate-fade-in">
               <h3 className="font-bold mb-4 text-lg border-b border-blue-200 pb-2 text-blue-800">Tambah Guru & Mapel Baru</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex flex-col">
                        <label className="text-xs font-bold mb-1 text-gray-700">Nama Guru</label>
                        <input className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} placeholder="Nama Lengkap" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold mb-1 text-gray-700">Mata Pelajaran</label>
                        <input className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" value={newSubject.subject} onChange={e => setNewSubject({...newSubject, subject: e.target.value})} placeholder="Nama Mapel" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold mb-1 text-gray-700">Kode Mapel</label>
                        <input className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" value={newSubject.code} onChange={e => setNewSubject({...newSubject, code: e.target.value})} placeholder="Contoh: BIN" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold mb-1 text-gray-700">Kode Guru (Inisial)</label>
                        <input className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" value={newTeacher.code} onChange={e => setNewTeacher({...newTeacher, code: e.target.value})} placeholder="Contoh: SH" />
                    </div>
               </div>

               <div className="mb-4 bg-white p-4 rounded border shadow-sm">
                   <label className="text-xs font-bold mb-3 block text-center text-gray-700 border-b pb-1">DISTRIBUSI JAM MENGAJAR PER KELAS</label>
                   <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
                       {CLASSES.map(cls => (
                           <div key={cls} className="flex flex-col items-center group">
                               <label className="text-[10px] font-bold text-gray-500 mb-1 group-hover:text-blue-600">{cls}</label>
                               <input 
                                   type="number" 
                                   min="0"
                                   className="border-2 p-1 rounded w-full text-center font-bold focus:border-blue-500 outline-none"
                                   placeholder="0"
                                   value={newSubject.load?.[cls] || ''}
                                   onChange={e => {
                                       const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                                       setNewSubject({
                                           ...newSubject, 
                                           load: { ...newSubject.load, [cls]: val || 0 }
                                       });
                                   }}
                               />
                           </div>
                       ))}
                   </div>
               </div>

               <div className="flex gap-3 justify-end pt-4 border-t mt-4">
                   <button onClick={() => setIsAdding(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded text-sm font-medium transition">
                        Batal
                   </button>
                   <button onClick={saveNew} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-bold shadow transition flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg>
                        Simpan Data
                   </button>
               </div>
          </div>
      )}
      
      <table className="w-full border-collapse border border-gray-400 text-xs md:text-sm shadow-sm rounded-lg overflow-hidden">
        <thead className="bg-blue-800 text-white">
          <tr className="bg-blue-900">
            <th className="border border-gray-400 p-2" rowSpan={2}>No</th>
            <th className="border border-gray-400 p-2" rowSpan={2}>Kode</th>
            <th className="border border-gray-400 p-2 min-w-[150px]" rowSpan={2}>Nama Guru</th>
            <th className="border border-gray-400 p-2" rowSpan={2}>Mapel</th>
            <th className="border border-gray-400 p-1 text-center" colSpan={3}>TSM/TBSM</th>
            <th className="border border-gray-400 p-1 text-center" colSpan={3}>DKV/MM</th>
            <th className="border border-gray-400 p-2" rowSpan={2}>Total JP</th>
            {!isCountdown && setTeachers && <th className="border border-gray-400 p-2" rowSpan={2}>Aksi</th>}
          </tr>
          <tr className="bg-blue-800">
              <th className="border border-gray-400 p-1 text-[10px] w-12">X TSM</th>
              <th className="border border-gray-400 p-1 text-[10px] w-12">XI TSM</th>
              <th className="border border-gray-400 p-1 text-[10px] w-12">XII TBSM</th>
              <th className="border border-gray-400 p-1 text-[10px] w-12">X DKV</th>
              <th className="border border-gray-400 p-1 text-[10px] w-12">XI DKV</th>
              <th className="border border-gray-400 p-1 text-[10px] w-12">XII MM</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
              const fullId = `${row.t.id}|${row.sub.id}`;
              if (editId === fullId) return <React.Fragment key={fullId}>{renderEditRow()}</React.Fragment>;

              const totalTeaching = calculateTotalLoad(row.sub);

              return (
                <tr key={fullId} className="hover:bg-gray-50 odd:bg-white even:bg-gray-50 transition-colors">
                    <td className="border border-gray-400 p-2 text-center">{row.no}</td>
                    <td className="border border-gray-400 p-2 text-center font-bold bg-yellow-50 text-blue-800">{row.sub.code}</td>
                    <td className="border border-gray-400 p-2 font-medium">{row.t.name}</td>
                    <td className="border border-gray-400 p-2">{row.sub.subject}</td>
                    
                    {CLASSES.map(cls => {
                        const initial = row.sub.load[cls] || 0;
                        if (initial === 0) {
                            return <td key={cls} className="border border-gray-400 bg-gray-100"></td>;
                        }
                        const val = isCountdown ? calculateRemaining(row.t.code, row.sub.code, cls, initial) : initial;
                        let cellClass = "border border-gray-400 text-center p-1 ";
                         if (isCountdown) {
                            cellClass += "font-black ";
                            if (val > 0) cellClass += "text-red-600 bg-red-50"; 
                            else if (val === 0) cellClass += "text-green-600 bg-green-50"; 
                            else cellClass += "text-purple-600 bg-purple-50"; 
                        }
                        return <td key={cls} className={cellClass}>{val}</td>
                    })}

                    <td className="border border-gray-400 p-2 text-center font-black bg-blue-50 text-blue-900">{totalTeaching}</td>
                    
                    {!isCountdown && setTeachers && (
                        <td className="border border-gray-400 p-2 text-center print:hidden">
                            <div className="flex gap-1 justify-center">
                                <button onClick={() => startEdit(row.t, row.sub)} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100 rounded" title="Edit">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>
                                </button>
                                <button onClick={() => handleDelete(row.t.id, row.sub.id)} className="text-red-600 hover:text-red-800 p-1 hover:bg-red-100 rounded" title="Hapus">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                                </button>
                            </div>
                        </td>
                    )}
                </tr>
              );
          })}
        </tbody>
        <tfoot className="bg-blue-100 font-black border-t-2 border-blue-300">
            <tr>
                <td colSpan={4} className="border border-gray-400 p-2 text-center uppercase tracking-widest text-blue-900">JUMLAH JP</td>
                {CLASSES.map(cls => (
                    <td key={cls} className="border border-gray-400 p-2 text-center text-blue-900 bg-blue-200">
                        {classTotals[cls]}
                    </td>
                ))}
                <td className="border border-gray-400 p-2 text-center text-white bg-blue-900">
                    {grandTotalJP}
                </td>
                {!isCountdown && setTeachers && <td className="border border-gray-400 bg-gray-100"></td>}
            </tr>
        </tfoot>
      </table>
    </div>
  );
};

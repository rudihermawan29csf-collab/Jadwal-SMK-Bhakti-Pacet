
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
import { WeeklySchedule, CLASSES, Teacher, ClassName } from '../types';
import { TIME_STRUCTURE } from '../data';

const PAGE_SIZE_F4 = [215, 330]; 
const PAGE_SIZE_A4 = 'a4';

const getFormattedDate = () => {
    const d = new Date();
    return `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`;
};

// Helper untuk mengecek apakah warna background termasuk kategori gelap
const isDarkBackground = (twClass?: string): boolean => {
    if (!twClass) return false;
    const darkPatterns = ['-600', '-500', '-700', '-800', '-900', 'slate-800', 'purple', 'blue-600', 'orange-500', 'amber-800', 'red-800', 'red-700', 'teal-600', 'pink-600'];
    return darkPatterns.some(p => twClass.includes(p));
};

const getRGBFromTailwind = (twClass?: string): [number, number, number] => {
    if (!twClass) return [255, 255, 255];
    const mapping: Record<string, [number, number, number]> = {
        'bg-red-500': [239, 68, 68],
        'bg-red-600': [220, 38, 38],
        'bg-red-700': [185, 28, 28],
        'bg-red-800': [153, 27, 27],
        'bg-red-200': [254, 202, 202],
        'bg-orange-500': [249, 115, 22],
        'bg-orange-300': [253, 186, 71],
        'bg-orange-200': [254, 215, 170],
        'bg-orange-100': [255, 237, 213],
        'bg-amber-100': [254, 243, 199],
        'bg-amber-400': [251, 191, 36],
        'bg-amber-800': [146, 64, 14],
        'bg-yellow-200': [254, 240, 138],
        'bg-yellow-400': [250, 204, 21],
        'bg-green-200': [187, 247, 208],
        'bg-green-400': [74, 222, 128],
        'bg-teal-200': [153, 246, 228],
        'bg-teal-400': [45, 212, 191],
        'bg-teal-600': [13, 148, 136],
        'bg-blue-200': [191, 219, 254],
        'bg-blue-300': [147, 197, 253],
        'bg-blue-600': [37, 99, 235],
        'bg-cyan-100': [207, 250, 254],
        'bg-cyan-400': [34, 211, 238],
        'bg-purple-200': [233, 213, 255],
        'bg-purple-300': [216, 180, 254],
        'bg-purple-600': [147, 51, 234],
        'bg-pink-300': [249, 168, 212],
        'bg-pink-600': [219, 39, 119],
    };
    return mapping[twClass] || [255, 255, 255];
};

export const exportSchedulePDF = (schedule: WeeklySchedule, teachers: Teacher[], size: 'A4' | 'F4') => {
    const doc = new jsPDF({ orientation: 'portrait', format: size === 'F4' ? PAGE_SIZE_F4 : PAGE_SIZE_A4, unit: 'mm' });
    doc.setFontSize(16);
    doc.text("JADWAL PELAJARAN SMPN 3 PACET", 105, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text("Semester Genap - Tahun Pelajaran 2025/2026", 105, 18, { align: 'center' });
    let startY = 25;

    TIME_STRUCTURE.forEach((day) => {
        const bodyData = day.slots.map(slot => {
            const row: any[] = [slot.period < 0 ? '' : slot.period.toString(), `${slot.start} - ${slot.end}`];
            if (slot.period < 0) return [{ content: slot.label || 'ISTIRAHAT', colSpan: 2 + CLASSES.length, styles: { halign: 'center', fillColor: [230, 230, 230], fontStyle: 'bold' } }];
            CLASSES.forEach(cls => {
                const cell = schedule[day.day]?.[slot.period]?.[cls];
                if (cell?.type === 'CLASS') {
                    const isDark = isDarkBackground(cell.color);
                    row.push({ 
                        content: `${cell.subjectCode}\n${cell.teacherCode}`, 
                        styles: { 
                            fillColor: getRGBFromTailwind(cell.color),
                            textColor: isDark ? [255, 255, 255] : [0, 0, 0]
                        } 
                    });
                } else if (cell?.type === 'BLOCKED') row.push({ content: 'X', styles: { fillColor: [240, 240, 240] } });
                else row.push('');
            });
            return row;
        });

        const pageHeight = doc.internal.pageSize.height;
        if (startY > pageHeight - 60) { doc.addPage(); startY = 15; }
        doc.setFontSize(12); doc.setTextColor(0, 0, 100); doc.text(day.day, 14, startY); startY += 2;
        autoTable(doc, { startY: startY, head: [["Ke", "Waktu", ...CLASSES]], body: bodyData, theme: 'grid', headStyles: { fillColor: [0, 50, 100], fontSize: 8, halign: 'center' }, bodyStyles: { fontSize: 6, halign: 'center', cellPadding: 1 } });
        // @ts-ignore
        startY = doc.lastAutoTable.finalY + 10;
    });
    doc.save(`Jadwal_Lengkap_SMPN_3_Pacet_${getFormattedDate()}.pdf`);
};

export const exportScheduleExcel = (schedule: WeeklySchedule) => {
    const wb = XLSX.utils.book_new();
    const ws_data: any[][] = [["JADWAL PELAJARAN SMPN 3 PACET"], ["TAHUN PELAJARAN 2025/2026"], [], ["HARI", "KE", "WAKTU", ...CLASSES]];
    TIME_STRUCTURE.forEach(day => {
        day.slots.forEach(slot => {
            const row: any[] = [day.day, slot.period < 0 ? '' : slot.period, `${slot.start}-${slot.end}`];
            if (slot.period < 0) {
                row.push(slot.label || 'ISTIRAHAT');
                for (let i = 1; i < CLASSES.length; i++) row.push(null);
            } else {
                CLASSES.forEach(cls => {
                    const cell = schedule[day.day]?.[slot.period]?.[cls];
                    row.push(cell?.type === 'CLASS' ? `${cell.subjectCode} (${cell.teacherCode})` : cell?.type === 'BLOCKED' ? 'X' : '');
                });
            }
            ws_data.push(row);
        });
        ws_data.push([]);
    });
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal");
    XLSX.writeFile(wb, `Jadwal_Excel_SMPN_3_Pacet_${getFormattedDate()}.xlsx`);
};

export const exportDutiesPDF = (teachers: Teacher[], size: 'A4' | 'F4') => {
    const doc = new jsPDF({ orientation: 'landscape', format: size === 'F4' ? PAGE_SIZE_F4 : PAGE_SIZE_A4, unit: 'mm' });
    doc.setFontSize(16); doc.text("PEMBAGIAN TUGAS GURU SMPN 3 PACET", 14, 15);
    autoTable(doc, { startY: 25, head: [['No', 'Nama Guru', 'NIP', 'Kode', 'Mapel', ...CLASSES, 'Total']], body: teachers.flatMap((t, i) => t.subjects.map(s => [i+1, t.name, t.nip, t.code, s.subject, ...CLASSES.map(c => s.load[c] || ''), Object.values(s.load).reduce((a:any, b:any) => a+b, 0)])), theme: 'grid', headStyles: { fillColor: [0, 50, 100], fontSize: 9 } });
    doc.save(`Tugas_Guru_SMPN_3_Pacet_${getFormattedDate()}.pdf`);
};

export const exportDutiesExcel = (teachers: Teacher[]) => {
    const headers = ["No", "Nama Guru", "NIP", "Kode", "Mapel", ...CLASSES, "Total"];
    const body = teachers.flatMap((t, i) => t.subjects.map(s => [i+1, t.name, t.nip, t.code, s.subject, ...CLASSES.map(c => s.load[c] || ''), Object.values(s.load).reduce((a:any, b:any) => a+b, 0)]));
    const ws = XLSX.utils.aoa_to_sheet([["PEMBAGIAN TUGAS GURU SMPN 3 PACET"], [], headers, ...body]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Tugas");
    XLSX.writeFile(wb, `Tugas_Guru_SMPN_3_Pacet_${getFormattedDate()}.xlsx`);
};

// --- EKSPOR PDF SPESIFIK PER KELAS ---
export const exportSpecificClassPDF = (schedule: WeeklySchedule, className: string, size: 'A4' | 'F4', teachers: Teacher[]) => {
    const doc = new jsPDF({ orientation: 'portrait', format: size === 'F4' ? PAGE_SIZE_F4 : PAGE_SIZE_A4, unit: 'mm' });
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text(`JADWAL PELAJARAN KELAS ${className}`, 105, 12, { align: 'center' });
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("SMPN 3 PACET - TA 2025/2026", 105, 18, { align: 'center' });

    const days = TIME_STRUCTURE.map(d => d.day);
    const allPeriods = Array.from(new Set(TIME_STRUCTURE.flatMap(d => d.slots.map(s => s.period)))).sort((a, b) => a - b);
    
    // Legend Map
    const legendMap = new Map<string, { code: string, subject: string, teacher: string, color: string }>();

    const body = allPeriods.map(p => {
        const timeSlot = TIME_STRUCTURE[0].slots.find(s => s.period === p);
        const row: any[] = [p < 0 ? '' : p, timeSlot ? `${timeSlot.start}-${timeSlot.end}` : "-"];
        
        days.forEach(day => {
            const slotConfig = TIME_STRUCTURE.find(d => d.day === day)?.slots.find(s => s.period === p);
            const cell = schedule[day]?.[p]?.[className as ClassName];
            
            if (slotConfig && slotConfig.type !== 'LEARNING') {
                row.push({ 
                    content: slotConfig.label || 'BREAK', 
                    styles: { fillColor: [245, 245, 245], textColor: [150, 150, 150], fontSize: 5, fontStyle: 'italic' } 
                });
            } else if (cell?.type === 'CLASS') {
                const isDark = isDarkBackground(cell.color);
                const key = `${cell.teacherId}-${cell.subjectCode}`;
                if (!legendMap.has(key)) {
                    const t = teachers.find(tch => tch.id === cell.teacherId);
                    const s = t?.subjects.find(sub => sub.code === cell.subjectCode);
                    if (t && s) legendMap.set(key, { code: s.code, subject: s.subject, teacher: t.name, color: s.color });
                }
                row.push({ 
                    content: `${cell.subjectCode}\n${cell.teacherCode}`, 
                    styles: { 
                        fillColor: getRGBFromTailwind(cell.color), 
                        textColor: isDark ? [255, 255, 255] : [0, 0, 0],
                        fontStyle: 'bold' 
                    } 
                });
            } else if (cell?.type === 'BLOCKED') {
                row.push({ content: 'X', styles: { fillColor: [245, 245, 245], textColor: [200, 200, 200] } });
            } else {
                row.push('');
            }
        });
        return row;
    });

    autoTable(doc, { 
        startY: 25, 
        head: [["Ke", "Waktu", ...days]], 
        body, 
        theme: 'grid', 
        headStyles: { fillColor: [30, 41, 59], fontSize: 8, halign: 'center' }, 
        bodyStyles: { fontSize: 7, halign: 'center', cellPadding: 1.5, minCellHeight: 10 } 
    });

    // Add Legend
    const legends = Array.from(legendMap.values()).sort((a,b) => a.code.localeCompare(b.code));
    if (legends.length > 0) {
        // @ts-ignore
        let currentY = doc.lastAutoTable.finalY + 10;
        const pageHeight = doc.internal.pageSize.height;
        if (currentY > pageHeight - 30) { doc.addPage(); currentY = 15; }

        doc.setFontSize(9); doc.setFont("helvetica", "bold");
        doc.text("KETERANGAN MATA PELAJARAN:", 14, currentY);
        currentY += 5;
        autoTable(doc, {
            startY: currentY,
            head: [["Kode", "Mata Pelajaran", "Guru Pengampu"]],
            body: legends.map(l => {
                const isDark = isDarkBackground(l.color);
                return [
                    { content: l.code, styles: { fillColor: getRGBFromTailwind(l.color), textColor: isDark ? [255, 255, 255] : [0, 0, 0], fontStyle: 'bold' } },
                    l.subject,
                    l.teacher
                ];
            }),
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [71, 85, 105] },
            columnStyles: { 0: { cellWidth: 20, halign: 'center' } }
        });
    }

    doc.save(`Jadwal_Kelas_${className}_${getFormattedDate()}.pdf`);
};

// --- EKSPOR PDF SPESIFIK PER GURU ---
export const exportSpecificTeacherPDF = (schedule: WeeklySchedule, teacher: Teacher, size: 'A4' | 'F4', teachers: Teacher[]) => {
    const doc = new jsPDF({ orientation: 'portrait', format: size === 'F4' ? PAGE_SIZE_F4 : PAGE_SIZE_A4, unit: 'mm' });
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(`JADWAL MENGAJAR: ${teacher.name}`, 105, 12, { align: 'center' });
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("SMPN 3 PACET - TA 2025/2026", 105, 18, { align: 'center' });
    
    const days = TIME_STRUCTURE.map(d => d.day);
    const allPeriods = Array.from(new Set(TIME_STRUCTURE.flatMap(d => d.slots.map(s => s.period)))).sort((a, b) => a - b);
    const legendMap = new Map<string, { code: string, subject: string, teacher: string, color: string }>();

    const body = allPeriods.map(p => {
        const timeSlot = TIME_STRUCTURE[0].slots.find(s => s.period === p);
        const row: any[] = [p < 0 ? '' : p, timeSlot ? `${timeSlot.start}-${timeSlot.end}` : "-"];
        
        days.forEach(day => {
            const slotConfig = TIME_STRUCTURE.find(d => d.day === day)?.slots.find(s => s.period === p);
            let foundCls = "";
            let cellData: any = null;
            
            const dayCells = schedule[day]?.[p];
            if (dayCells) {
                Object.entries(dayCells).forEach(([cls, cell]) => {
                    if (cell.type === 'CLASS' && cell.teacherId === teacher.id) {
                        foundCls = cls;
                        cellData = cell;
                    }
                });
            }

            if (slotConfig && slotConfig.type !== 'LEARNING') {
                row.push({ 
                    content: slotConfig.label || 'BREAK', 
                    styles: { fillColor: [245, 245, 245], textColor: [150, 150, 150], fontSize: 5, fontStyle: 'italic' } 
                });
            } else if (foundCls) {
                const isDark = isDarkBackground(cellData.color);
                const key = `${cellData.teacherId}-${cellData.subjectCode}`;
                if (!legendMap.has(key)) {
                    const s = teacher.subjects.find(sub => sub.code === cellData.subjectCode);
                    if (s) legendMap.set(key, { code: s.code, subject: s.subject, teacher: teacher.name, color: s.color });
                }
                row.push({ 
                    content: `${foundCls}\n${cellData.subjectCode}`, 
                    styles: { 
                        fillColor: getRGBFromTailwind(cellData.color), 
                        textColor: isDark ? [255, 255, 255] : [0, 0, 0],
                        fontStyle: 'bold' 
                    } 
                });
            } else {
                row.push('');
            }
        });
        return row;
    });

    autoTable(doc, { 
        startY: 25, 
        head: [["Ke", "Waktu", ...days]], 
        body, 
        theme: 'grid', 
        headStyles: { fillColor: [30, 41, 59], fontSize: 8, halign: 'center' }, 
        bodyStyles: { fontSize: 7, halign: 'center', cellPadding: 1.5, minCellHeight: 10 } 
    });

    const legends = Array.from(legendMap.values()).sort((a,b) => a.code.localeCompare(b.code));
    if (legends.length > 0) {
        // @ts-ignore
        let currentY = doc.lastAutoTable.finalY + 10;
        const pageHeight = doc.internal.pageSize.height;
        if (currentY > pageHeight - 30) { doc.addPage(); currentY = 15; }

        doc.setFontSize(9); doc.setFont("helvetica", "bold");
        doc.text("KETERANGAN MATA PELAJARAN:", 14, currentY);
        currentY += 5;
        autoTable(doc, {
            startY: currentY,
            head: [["Kode", "Mata Pelajaran"]],
            body: legends.map(l => {
                const isDark = isDarkBackground(l.color);
                return [
                    { content: l.code, styles: { fillColor: getRGBFromTailwind(l.color), textColor: isDark ? [255, 255, 255] : [0, 0, 0], fontStyle: 'bold' } },
                    l.subject
                ];
            }),
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [71, 85, 105] },
            columnStyles: { 0: { cellWidth: 20, halign: 'center' } }
        });
    }

    doc.save(`Jadwal_Mengajar_${teacher.code}_${getFormattedDate()}.pdf`);
};

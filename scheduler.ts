
import { CLASSES, WeeklySchedule, ScheduleCell, ClassName, OffDayConstraints, Teacher, JPSplitConstraints, SplitOption } from './types';
import { TIME_STRUCTURE } from './data';

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

export const createEmptySchedule = (): WeeklySchedule => {
  const schedule: WeeklySchedule = {};
  TIME_STRUCTURE.forEach(day => {
    schedule[day.day] = {};
    day.slots.forEach(slot => {
      if (slot.period >= 0 || slot.period === 0) {
        const periodRow = {} as Record<ClassName, ScheduleCell>;
        CLASSES.forEach(cls => {
            let cell: ScheduleCell = { type: 'EMPTY' };
            if (slot.type !== 'LEARNING') {
                cell = { type: 'BLOCKED', blockReason: slot.label || slot.type };
            }
            periodRow[cls] = cell;
        });
        schedule[day.day][slot.period] = periodRow;
      }
    });
  });
  return schedule;
};

interface Task {
    teacherId: number;
    teacherName: string;
    teacherCode: string;
    subject: string;
    subjectCode: string;
    class: ClassName;
    duration: number;
    color: string;
    id: string;
    priority: number;
}

const isValidSplitForTotal = (option: SplitOption, total: number): boolean => {
    const parts = SPLIT_MAP[option];
    if (!parts || parts.length === 0) return false;
    const sum = parts.reduce((a, b) => a + b, 0);
    return sum === total;
};

const getMaxDailyLoad = (totalWeekly: number, subjectCode: string, constraints: JPSplitConstraints): number => {
    const userOptions = constraints[subjectCode];
    if (userOptions && userOptions.length > 0) {
        let maxChunkOfAll = 0;
        userOptions.forEach(opt => {
            const parts = SPLIT_MAP[opt];
            if (parts) {
                const localMax = Math.max(...parts);
                if (localMax > maxChunkOfAll) maxChunkOfAll = localMax;
            }
        });
        if (maxChunkOfAll > 0) return maxChunkOfAll;
    }
    // Default Max Daily limits
    if (totalWeekly >= 6) return 4; 
    if (totalWeekly === 5) return 3; 
    if (totalWeekly === 4) return 2; 
    if (totalWeekly === 3) return 2; 
    return totalWeekly; 
};

const splitHoursIntoBlocks = (totalHours: number, subjectCode: string, constraints: JPSplitConstraints): number[] => {
    const preferredOptions = constraints[subjectCode] || [];
    const validPreferences = preferredOptions.filter(opt => isValidSplitForTotal(opt, totalHours));

    if (validPreferences.length > 0) {
        const selectedOption = validPreferences[Math.floor(Math.random() * validPreferences.length)];
        return SPLIT_MAP[selectedOption];
    }

    // Default Fallback Logic for Auto-Distribution
    if (totalHours === 10) return [4, 4, 2];
    if (totalHours === 8) return [4, 4];
    if (totalHours === 7) return [4, 3];
    if (totalHours === 6) return [3, 3];
    if (totalHours === 5) return [3, 2];
    if (totalHours === 4) return [2, 2];
    // Changed: 3 JP default to [2, 1] for better flexibility
    if (totalHours === 3) return [2, 1];
    if (totalHours === 2) return [2];
    if (totalHours === 1) return [1];

    return [totalHours];
};

export const fillScheduleWithCode = (
    currentSchedule: WeeklySchedule,
    teachers: Teacher[],
    targetTeacherId: number,
    targetSubjectCode: string,
    offConstraints: OffDayConstraints = {},
    splitConstraints: JPSplitConstraints = {},
    targetLoad?: number
): WeeklySchedule => {
    const schedule = JSON.parse(JSON.stringify(currentSchedule)) as WeeklySchedule;
    const teacher = teachers.find(t => t.id === targetTeacherId);
    if (!teacher) return schedule;
    const subject = teacher.subjects.find(s => s.code === targetSubjectCode);
    if (!subject) return schedule;

    const days = TIME_STRUCTURE.map(d => d.day);
    const classesNeedFill: { cls: ClassName, remaining: number, totalWeekly: number }[] = [];

    CLASSES.forEach(cls => {
        const required = subject.load[cls] || 0;
        
        if (targetLoad !== undefined && required !== targetLoad) return;
        if (required <= 0) return;

        let placed = 0;
        days.forEach(d => {
            const dayRow = schedule[d];
            if (!dayRow) return;
            Object.values(dayRow).forEach(cellMap => {
                const cell = cellMap[cls];
                if (cell && cell.type === 'CLASS' && cell.teacherId === targetTeacherId && cell.subjectCode === targetSubjectCode) placed++;
            });
        });
        if (placed < required) classesNeedFill.push({ cls, remaining: required - placed, totalWeekly: required });
    });

    if (classesNeedFill.length === 0) return schedule;

    const tasksToPlace: Task[] = [];
    classesNeedFill.forEach(info => {
        const blocks = splitHoursIntoBlocks(info.remaining, targetSubjectCode, splitConstraints);
        blocks.forEach((dur, idx) => {
             tasksToPlace.push({
                teacherId: teacher.id,
                teacherName: teacher.name,
                teacherCode: teacher.code,
                subject: subject.subject,
                subjectCode: subject.code,
                class: info.cls,
                duration: dur,
                color: subject.color,
                id: `fill-${info.cls}-${idx}`,
                priority: 1
             });
        });
    });

    // Sort descending by duration to place harder blocks first
    tasksToPlace.sort((a,b) => b.duration - a.duration);

    const isTeacherBusy = (day: string, period: number, tId: number): boolean => {
        for (const cls of CLASSES) {
            const cell = schedule[day]?.[period]?.[cls];
            if (cell && cell.type === 'CLASS' && cell.teacherId === tId) return true;
        }
        return false;
    };
    
    const isTeacherAlreadyInClass = (day: string, tId: number, cls: ClassName): boolean => {
        const dayData = schedule[day];
        if (!dayData) return false;
        for (const periodStr in dayData) {
            const cell = dayData[periodStr][cls];
            if (cell && cell.type === 'CLASS' && cell.teacherId === tId) return true;
        }
        return false;
    };

    const constraintKey = `${teacher.id}-${subject.code}`;
    const constraints = offConstraints[constraintKey];
    const blockedDays = constraints?.blockedDays || [];
    const specificBlockedPeriods = constraints?.blockedPeriods || {};

    tasksToPlace.forEach(task => {
        const maxDailyLoad = getMaxDailyLoad(
            classesNeedFill.find(c => c.cls === task.class)?.totalWeekly || 0, 
            task.subjectCode, 
            splitConstraints
        );

        let placed = false;
        const shuffledDays = [...days].sort(() => Math.random() - 0.5);
        const passes = [true, false]; 

        for (const avoidSameClass of passes) {
            if (placed) break;
            for (const dayName of shuffledDays) {
                if (placed) break;
                if (blockedDays.includes(dayName)) continue;
                
                // Allow teacher back to same class only if we're on the second pass
                if (avoidSameClass && isTeacherAlreadyInClass(dayName, task.teacherId, task.class)) continue; 

                let currentDailyHours = 0;
                const dayData = schedule[dayName];
                if (!dayData) continue;

                Object.values(dayData).forEach(row => {
                    const cell = row[task.class];
                    if (cell && cell.type === 'CLASS' && cell.subjectCode === task.subjectCode) currentDailyHours++;
                });

                if (currentDailyHours + task.duration > maxDailyLoad) continue;

                const dayConfig = TIME_STRUCTURE.find(d => d.day === dayName)!;
                const learningPeriods = dayConfig.slots.filter(s => s.type === 'LEARNING').map(s => s.period);
                const blockedPeriodsForDay = specificBlockedPeriods[dayName] || [];

                for (let k = 0; k <= learningPeriods.length - task.duration; k++) {
                    const proposedPeriods: number[] = [];
                    let validBlock = true;
                    for (let m = 0; m < task.duration; m++) {
                        const p = learningPeriods[k + m];
                        if (blockedPeriodsForDay.includes(p)) { validBlock = false; break; }
                        const cell = schedule[dayName][p][task.class];
                        if (!cell || cell.type !== 'EMPTY') { validBlock = false; break; }
                        if (isTeacherBusy(dayName, p, task.teacherId)) { validBlock = false; break; }
                        proposedPeriods.push(p);
                    }

                    if (validBlock) {
                        proposedPeriods.forEach(p => {
                            schedule[dayName][p][task.class] = {
                                type: 'CLASS',
                                subject: task.subject,
                                subjectCode: task.subjectCode,
                                teacher: task.teacherName,
                                teacherCode: task.teacherCode,
                                teacherId: task.teacherId,
                                color: task.color,
                            };
                        });
                        placed = true;
                        break;
                    }
                }
            }
        }
    });

    return schedule;
};

export const generateSchedule = (teachers: Teacher[], offConstraints: OffDayConstraints = {}, splitConstraints: JPSplitConstraints = {}): WeeklySchedule | null => {
    return createEmptySchedule();
}

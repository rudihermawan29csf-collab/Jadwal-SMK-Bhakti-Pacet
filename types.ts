
export type ClassName = 
  | 'X TSM' | 'XI TSM' | 'XII TBSM' 
  | 'X DKV' | 'XI DKV' | 'XII MM';

export const CLASSES: ClassName[] = [
  'X TSM', 'XI TSM', 'XII TBSM',
  'X DKV', 'XI DKV', 'XII MM'
];

export type UserRole = 'ADMIN' | 'GURU' | 'NONE';

export interface TimeSlot {
  period: number; 
  start: string;
  end: string;
  type: 'LEARNING' | 'BREAK' | 'CEREMONY' | 'RELIGIOUS' | 'EXERCISE';
  label?: string; 
}

export interface DaySchedule {
  day: string;
  slots: TimeSlot[];
}

export interface SubjectLoad {
  id: string; 
  subject: string;
  code: string;
  color: string;
  load: Partial<Record<ClassName, number>>; 
}

export interface Teacher {
  id: number;
  name: string;
  nip: string;
  rank: string; 
  group: string; 
  code: string; 
  additionalTask: string; 
  additionalHours: number; 
  subjects: SubjectLoad[];
}

export interface ScheduleCell {
  type: 'EMPTY' | 'BLOCKED' | 'CLASS';
  subject?: string;
  teacher?: string;
  teacherId?: number;
  teacherCode?: string;
  subjectCode?: string;
  color?: string;
  blockReason?: string;
}

export type WeeklySchedule = Record<string, Record<number, Record<ClassName, ScheduleCell>>>;

export interface ConstraintData {
  blockedDays: string[]; 
  blockedPeriods: Record<string, number[]>; 
}

export type OffDayConstraints = Record<string, ConstraintData>;

export type SplitOption = 
  | '4+4+2' | '4+4' | '4+3' | '3+4' | '4+2' | '3+3' | '2+2+2' | '3+2' | '2+2' | '5' | '4' | '3' | '2' | '1' | 'DEFAULT';

export type JPSplitConstraints = Record<string, SplitOption[]>;

export interface AppSettings {
  academicYear: string;
  semester: string;
}

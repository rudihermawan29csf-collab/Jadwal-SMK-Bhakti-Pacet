
import { DaySchedule, Teacher } from './types';

export const TIME_STRUCTURE: DaySchedule[] = [
  {
    day: 'SENIN',
    slots: [
      { period: 1, start: '13.00', end: '13.30', type: 'LEARNING' },
      { period: 2, start: '13.30', end: '14.00', type: 'LEARNING' },
      { period: 3, start: '14.00', end: '14.30', type: 'LEARNING' },
      { period: 4, start: '14.30', end: '15.00', type: 'LEARNING' },
      { period: -1, start: '15.00', end: '15.20', type: 'BREAK', label: 'ISTIRAHAT' },
      { period: 5, start: '15.20', end: '15.45', type: 'LEARNING' },
      { period: 6, start: '15.45', end: '16.10', type: 'LEARNING' },
      { period: 7, start: '16.10', end: '16.35', type: 'LEARNING' },
      { period: 8, start: '16.35', end: '17.00', type: 'LEARNING' },
    ]
  },
  {
    day: 'SELASA',
    slots: [
      { period: 1, start: '13.00', end: '13.30', type: 'LEARNING' },
      { period: 2, start: '13.30', end: '14.00', type: 'LEARNING' },
      { period: 3, start: '14.00', end: '14.30', type: 'LEARNING' },
      { period: 4, start: '14.30', end: '15.00', type: 'LEARNING' },
      { period: -1, start: '15.00', end: '15.20', type: 'BREAK', label: 'ISTIRAHAT' },
      { period: 5, start: '15.20', end: '15.45', type: 'LEARNING' },
      { period: 6, start: '15.45', end: '16.10', type: 'LEARNING' },
      { period: 7, start: '16.10', end: '16.35', type: 'LEARNING' },
      { period: 8, start: '16.35', end: '17.00', type: 'LEARNING' },
    ]
  },
  {
    day: 'RABU',
    slots: [
      { period: 1, start: '13.00', end: '13.30', type: 'LEARNING' },
      { period: 2, start: '13.30', end: '14.00', type: 'LEARNING' },
      { period: 3, start: '14.00', end: '14.30', type: 'LEARNING' },
      { period: 4, start: '14.30', end: '15.00', type: 'LEARNING' },
      { period: -1, start: '15.00', end: '15.20', type: 'BREAK', label: 'ISTIRAHAT' },
      { period: 5, start: '15.20', end: '15.45', type: 'LEARNING' },
      { period: 6, start: '15.45', end: '16.10', type: 'LEARNING' },
      { period: 7, start: '16.10', end: '16.35', type: 'LEARNING' },
      { period: 8, start: '16.35', end: '17.00', type: 'LEARNING' },
    ]
  },
  {
    day: 'KAMIS',
    slots: [
      { period: 1, start: '13.00', end: '13.30', type: 'LEARNING' },
      { period: 2, start: '13.30', end: '14.00', type: 'LEARNING' },
      { period: 3, start: '14.00', end: '14.30', type: 'LEARNING' },
      { period: 4, start: '14.30', end: '15.00', type: 'LEARNING' },
      { period: -1, start: '15.00', end: '15.20', type: 'BREAK', label: 'ISTIRAHAT' },
      { period: 5, start: '15.20', end: '15.45', type: 'LEARNING' },
      { period: 6, start: '15.45', end: '16.10', type: 'LEARNING' },
      { period: 7, start: '16.10', end: '16.35', type: 'LEARNING' },
      { period: 8, start: '16.35', end: '17.00', type: 'LEARNING' },
    ]
  },
  {
    day: "JUM'AT",
    slots: [
      { period: 1, start: '13.00', end: '13.30', type: 'LEARNING' },
      { period: 2, start: '13.30', end: '14.00', type: 'LEARNING' },
      { period: 3, start: '14.00', end: '14.30', type: 'LEARNING' },
      { period: 4, start: '14.30', end: '15.00', type: 'LEARNING' },
      { period: -1, start: '15.00', end: '15.20', type: 'BREAK', label: 'ISTIRAHAT' },
      { period: 5, start: '15.20', end: '15.45', type: 'LEARNING' },
      { period: 6, start: '15.45', end: '16.10', type: 'LEARNING' },
      { period: 7, start: '16.10', end: '16.35', type: 'LEARNING' },
      { period: 8, start: '16.35', end: '17.00', type: 'LEARNING' },
    ]
  },
  {
    day: 'SABTU',
    slots: [
      { period: 1, start: '13.00', end: '13.30', type: 'LEARNING' },
      { period: 2, start: '13.30', end: '14.00', type: 'LEARNING' },
      { period: 3, start: '14.00', end: '14.30', type: 'LEARNING' },
      { period: 4, start: '14.30', end: '15.00', type: 'LEARNING' },
      { period: -1, start: '15.00', end: '15.20', type: 'BREAK', label: 'ISTIRAHAT' },
      { period: 5, start: '15.20', end: '15.45', type: 'LEARNING' },
      { period: 6, start: '15.45', end: '16.10', type: 'LEARNING' },
      { period: 7, start: '16.10', end: '16.35', type: 'LEARNING' },
      { period: 8, start: '16.35', end: '17.00', type: 'LEARNING' },
    ]
  }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 1, name: 'Masudah, S. Pd', nip: '-', rank: '-', group: '-', code: 'C4', additionalTask: '-', additionalHours: 0,
    subjects: [{ id: '1-1', subject: 'Matematika', code: 'C4', color: 'bg-blue-300', load: { 'X TSM': 4, 'XI TSM': 3, 'XII TBSM': 4, 'X DKV': 4, 'XI DKV': 3, 'XII MM': 4 } }]
  },
  {
    id: 2, name: 'Muh. Ikhwan, S. Pd.', nip: '-', rank: '-', group: '-', code: 'D3', additionalTask: '-', additionalHours: 0,
    subjects: [{ id: '2-1', subject: 'B Indo', code: 'D3', color: 'bg-red-200', load: { 'XI TSM': 3, 'XI DKV': 3 } }]
  },
  {
    id: 3, name: 'Luluk Uswatun K. S.Pd, M.Pd.', nip: '-', rank: '-', group: '-', code: 'E1', additionalTask: '-', additionalHours: 0,
    subjects: [{ id: '3-1', subject: 'PAI', code: 'E1', color: 'bg-green-200', load: { 'XII TBSM': 3, 'XII MM': 3 } }]
  },
  {
    id: 4, name: 'Abdur Rosyid, S.T.', nip: '-', rank: '-', group: '-', code: 'AR', additionalTask: '-', additionalHours: 0,
    subjects: [
      { id: '4-1', subject: 'Teknologi Dasar Otomotif', code: 'F20', color: 'bg-orange-100', load: { 'X TSM': 4, 'XI TSM': 7, 'XII TBSM': 5 } },
      { id: '4-2', subject: 'Pekerjaan Dasar Teknik Otomotif', code: 'F21', color: 'bg-orange-200', load: { 'X TSM': 4, 'XI TSM': 6 } },
      { id: '4-3', subject: 'Pemeliharaan Kelistrikan Sepeda Motor', code: 'F24', color: 'bg-purple-200', load: { 'XII TBSM': 5 } }
    ]
  },
  {
    id: 5, name: 'Rebby Dwi Prataopu, S.Si.', nip: '-', rank: '-', group: '-', code: 'G10', additionalTask: '-', additionalHours: 0,
    subjects: [{ id: '5-1', subject: 'Projek IPAS', code: 'G10', color: 'bg-purple-600', load: { 'X TSM': 4, 'X DKV': 4 } }]
  },
  {
    id: 6, name: 'Sari Utami, S.S.', nip: '-', rank: '-', group: '-', code: 'I6', additionalTask: '-', additionalHours: 0,
    subjects: [{ id: '6-1', subject: 'B Inggris', code: 'I6', color: 'bg-red-600', load: { 'X TSM': 4, 'XI TSM': 4, 'X DKV': 4, 'XI DKV': 4 } }]
  },
  {
    id: 7, name: 'Nur Janiah, S.Pd.', nip: '-', rank: '-', group: '-', code: 'J6', additionalTask: '-', additionalHours: 0,
    subjects: [{ id: '7-1', subject: 'B Inggris', code: 'J6', color: 'bg-cyan-400', load: { 'XII TBSM': 4, 'XII MM': 4 } }]
  },
  {
    id: 8, name: 'Dwi Septiningtyas, S.Pd.', nip: '-', rank: '-', group: '-', code: 'DS', additionalTask: '-', additionalHours: 0,
    subjects: [
      { id: '8-1', subject: 'B Jawa', code: 'K12', color: 'bg-amber-400', load: { 'X TSM': 2, 'XI TSM': 2, 'XII TBSM': 2, 'X DKV': 2, 'XI DKV': 2, 'XII MM': 2 } },
      { id: '8-2', subject: 'Sejarah Indo', code: 'K5', color: 'bg-yellow-400', load: { 'XI TSM': 2, 'XI DKV': 2 } }
    ]
  },
  {
    id: 9, name: 'Faridatul Khasanah, S.Pd.', nip: '-', rank: '-', group: '-', code: 'L11', additionalTask: '-', additionalHours: 0,
    subjects: [{ id: '9-1', subject: 'PKK', code: 'L11', color: 'bg-pink-300', load: { 'XII TBSM': 8, 'XII MM': 7 } }]
  },
  {
    id: 10, name: 'Yusia Ade Tama, S.Kom.', nip: '-', rank: '-', group: '-', code: 'YT', additionalTask: '-', additionalHours: 0,
    subjects: [
      { id: '10-1', subject: 'Animasi', code: 'M16', color: 'bg-green-400', load: { 'XI DKV': 2 } },
      { id: '10-2', subject: 'Pengantar DKV', code: 'M27', color: 'bg-green-400', load: { 'X DKV': 1 } },
      { id: '10-3', subject: 'Fotografi', code: 'M28', color: 'bg-green-400', load: { 'X DKV': 1 } },
      { id: '10-4', subject: 'Perangkat Lunak Desain', code: 'M33', color: 'bg-green-400', load: { 'XI DKV': 10 } },
      { id: '10-5', subject: 'Desain Media Interaktif', code: 'M36', color: 'bg-green-400', load: { 'XII MM': 10 } },
      { id: '10-6', subject: 'Teknik Pengolahan Audio dan Video', code: 'M38', color: 'bg-green-400', load: { 'XII MM': 10 } }
    ]
  },
  {
    id: 11, name: 'Endang Susilowati, S.Pd.', nip: '-', rank: '-', group: '-', code: 'N11', additionalTask: '-', additionalHours: 0,
    subjects: [{ id: '11-1', subject: 'PKK', code: 'N11', color: 'bg-purple-300', load: { 'XI TSM': 5, 'XI DKV': 5 } }]
  },
  {
    id: 12, name: 'Niken Octafiana, S.Pd.', nip: '-', rank: '-', group: '-', code: 'NO', additionalTask: '-', additionalHours: 0,
    subjects: [
      { id: '12-1', subject: 'B Indo', code: 'O3', color: 'bg-orange-400', load: { 'X TSM': 4, 'XII TBSM': 4, 'X DKV': 4, 'XII MM': 4 } },
      { id: '12-2', subject: 'Sejarah Indo', code: 'O5', color: 'bg-orange-500', load: { 'X TSM': 2, 'X DKV': 2 } }
    ]
  },
  {
    id: 13, name: 'Jannatul Ma\'rifah, S.Pd.', nip: '-', rank: '-', group: '-', code: 'P2', additionalTask: '-', additionalHours: 0,
    subjects: [{ id: '13-1', subject: 'PKn', code: 'P2', color: 'bg-amber-800', load: { 'X TSM': 2, 'XI TSM': 2, 'XII TBSM': 2, 'X DKV': 2, 'XI DKV': 2, 'XII MM': 2 } }]
  },
  {
    id: 14, name: 'Naning Windarti, S.Pd.', nip: '-', rank: '-', group: '-', code: 'Q13', additionalTask: '-', additionalHours: 0,
    subjects: [{ id: '14-1', subject: 'BK', code: 'Q13', color: 'bg-pink-600', load: { 'X TSM': 2, 'XI TSM': 2, 'XII TBSM': 2, 'X DKV': 2, 'XI DKV': 2, 'XII MM': 2 } }]
  },
  {
    id: 15, name: 'Rochmatul Ummah, A.Md.', nip: '-', rank: '-', group: '-', code: 'RU', additionalTask: '-', additionalHours: 0,
    subjects: [
      { id: '15-1', subject: 'Informatika', code: 'R9', color: 'bg-yellow-400', load: { 'X TSM': 4, 'X DKV': 4 } },
      { id: '15-2', subject: 'Komputer Grafis', code: 'R29', color: 'bg-yellow-400', load: { 'X DKV': 4 } },
      { id: '15-3', subject: 'Menerapkan Design Brief', code: 'R34', color: 'bg-yellow-300', load: { 'XI DKV': 4 } }
    ]
  },
  {
    id: 16, name: 'Rus Danny Ardiansyah, S.Pd.', nip: '-', rank: '-', group: '-', code: 'RD', additionalTask: '-', additionalHours: 0,
    subjects: [
      { id: '16-1', subject: 'PAI', code: 'S1', color: 'bg-teal-600', load: { 'X TSM': 3, 'XI TSM': 3, 'X DKV': 3, 'XI DKV': 3 } },
      { id: '16-2', subject: 'PJOK', code: 'S7', color: 'bg-teal-400', load: { 'X TSM': 3, 'XI TSM': 2, 'X DKV': 3, 'XI DKV': 2 } }
    ]
  },
  {
    id: 17, name: 'Tommy Ari Widana, S.Pd.', nip: '-', rank: '-', group: '-', code: 'TW', additionalTask: '-', additionalHours: 0,
    subjects: [
      { id: '17-1', subject: 'Gambar Teknik Otomotif', code: 'T19', color: 'bg-red-800', load: { 'X TSM': 4, 'XI TSM': 7 } },
      { id: '17-2', subject: 'Pemeliharaan Mesin Sepeda Motor', code: 'T22', color: 'bg-red-700', load: { 'XII TBSM': 4 } },
      { id: '17-3', subject: 'Pemeliharaan Kelistrikan Sepeda Motor', code: 'T24', color: 'bg-red-700', load: { 'XII TBSM': 5 } }
    ]
  },
  {
    id: 18, name: 'Dimas Wahyu Kurniawan, S.Pd.', nip: '-', rank: '-', group: '-', code: 'DW', additionalTask: '-', additionalHours: 0,
    subjects: [
      { id: '18-1', subject: 'Seni Rupa', code: 'U8', color: 'bg-cyan-100', load: { 'X TSM': 2, 'X DKV': 2 } },
      { id: '18-2', subject: 'Sketsa dan Ilustrasi', code: 'U30', color: 'bg-cyan-100', load: { 'X DKV': 4 } },
      { id: '18-3', subject: 'Typography', code: 'U31', color: 'bg-cyan-100', load: { 'X DKV': 2 } },
      { id: '18-4', subject: 'Prinsip Dasar Desain dan Komunikasi', code: 'U32', color: 'bg-cyan-100', load: { 'XI DKV': 4 } }
    ]
  }
];

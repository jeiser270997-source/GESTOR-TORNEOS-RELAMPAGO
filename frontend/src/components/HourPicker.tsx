import React from 'react';
import { Clock } from 'lucide-react';
import { parseISO, isWeekend } from 'date-fns';
import { format12h } from '../utils/dateFormatters';

interface HourPickerProps {
  fecha: string;
  hora: string;
  onChange: (hora: string) => void;
  label: string;
  weekendHours?: string[];
  weekdayHour?: string;
}

const HourPicker: React.FC<HourPickerProps> = ({
  fecha,
  hora,
  onChange,
  label,
  weekendHours = ['12:00', '14:00', '16:00', '18:00', '20:00'],
  weekdayHour = '19:30',
}) => {
  const esFinDeSemana = fecha ? isWeekend(parseISO(fecha)) : false;

  if (!esFinDeSemana) {
    return (
      <div className="flex items-center gap-3">
        <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
        <div className="flex-1">
          <span className="text-xs text-neutral-500 block mb-1">{label}</span>
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-white font-bold text-sm flex items-center gap-2">
            <span>{format12h(weekdayHour)}</span>
            <span className="text-[10px] text-neutral-500 font-normal">(entre semana — fijo)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
      <div className="flex-1">
        <span className="text-xs text-neutral-500 block mb-1">{label} (fin de semana)</span>
        <select
          value={hora}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-2 font-bold text-sm focus:outline-none focus:border-blue-500 transition-colors"
        >
          {weekendHours.map((h) => (
            <option key={h} value={h}>
              {format12h(h)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default HourPicker;
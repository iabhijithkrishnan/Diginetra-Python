import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface CalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  markedDates?: string[]; // dates that have recordings in "YYYY-MM-DD" format
}

interface Day {
  day: number;
  currentMonth: boolean;
  date: Date;
  marked?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ 
  selectedDate, 
  onDateChange,
  markedDates = []
}) => {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  
  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust to Monday-based week starting
  };
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  
  // Explicitly type days array
  const days: Day[] = [];
  
  // Previous month days
  const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = 0; i < firstDayOfMonth; i++) {
    const prevMonthDay = prevMonthDaysCount - firstDayOfMonth + i + 1;
    days.push({
      day: prevMonthDay,
      currentMonth: false,
      date: new Date(currentYear, currentMonth - 1, prevMonthDay)
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({
      day: i,
      currentMonth: true,
      date: new Date(currentYear, currentMonth, i),
      marked: markedDates.includes(dateStr)
    });
  }
  
  // Next month days to fill the last week
  const remainingDays = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      day: i,
      currentMonth: false,
      date: new Date(currentYear, currentMonth + 1, i)
    });
  }
  
  const changeMonth = (increment: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + increment);
    onDateChange(newDate);
  };
  
  const changeYear = (increment: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newDate.getFullYear() + increment);
    onDateChange(newDate);
  };
  
  const isSelectedDate = (date: Date) => {
    return date.getDate() === selectedDate.getDate() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getFullYear() === selectedDate.getFullYear();
  };
  
  return (
    <div className="p-4 text-gray-300">
      <div className="text-gray-400 mb-4">Search Time</div>
      
      <div className="flex items-center justify-center mb-4">
        <button onClick={() => changeYear(-1)} className="p-1 text-gray-500 hover:text-gray-300">
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button onClick={() => changeMonth(-1)} className="p-1 text-gray-500 hover:text-gray-300">
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="mx-2 text-sm">
          {currentYear} {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(selectedDate)}
        </div>
        
        <button onClick={() => changeMonth(1)} className="p-1 text-gray-500 hover:text-gray-300">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => changeYear(1)} className="p-1 text-gray-500 hover:text-gray-300">
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {daysOfWeek.map(day => (
          <div key={day} className="py-1 text-gray-500">{day}</div>
        ))}
        
        {days.map((day, index) => (
          <button
            key={index}
            className={`w-full aspect-square flex items-center justify-center text-xs rounded-sm ${
              isSelectedDate(day.date) 
                ? 'bg-red-600 text-white' 
                : day.currentMonth 
                  ? day.marked 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-800' 
                  : 'text-gray-700'
            }`}
            onClick={() => onDateChange(day.date)}
            disabled={!day.currentMonth}
          >
            {day.day}
          </button>
        ))}
      </div>
      
      <button className="w-full mt-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors">
        Search
      </button>
    </div>
  );
};

export default Calendar;

import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function CalendarCard({ value, onDateChange }) {
  const [calendarValue, setCalendarValue] = useState(value || new Date());

  useEffect(() => {
    setCalendarValue(value || new Date());
  }, [value]);

  const handleChange = (nextValue) => {
    setCalendarValue(nextValue);
    onDateChange?.(nextValue);
  };

  return (
    <div className="summary-card white calendar-card-wrap">
      <Calendar
        onChange={handleChange}
        value={calendarValue}
        selectRange={true}
        prev2Label={null}
        next2Label={null}
        showNeighboringMonth={true}
        className="custom-calendar"
      />
    </div>
  );
}
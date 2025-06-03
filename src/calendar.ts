import axios from 'axios';

interface ICalendarResponse {
  country_code: string;
  country_text: string;
  days: ICalendarDay[];
  dt_end: string;
  dt_start: string;
  statistic: ICalendarStatistic;
  status: string;
  work_week_type: string;
}

interface ICalendarDay {
  date: string;
  type_id: number;
  type_text: string;
  week_day: string;
  week_hours: number;
}

interface ICalendarStatistic {
  calendar_days: number;
  calendar_days_without_holidays: number;
  holidays: number;
  shortened_working_days: number;
  weekends: number;
  work_days: number;
  working_hours: number
}

export async function getWorkingDays(): Promise<number> {
  if (!process.env.CALENDAR_API_URL) {
    throw new Error('CALENDAR_API_URL is required');
  }
  
  try {
    const response = await axios.get<ICalendarResponse>(process.env.CALENDAR_API_URL);

    return response.data.statistic.work_days;
    
  } catch (error) {
    console.error('Error fetching working days:', error);
    // Fallback to a default of 22 working days if API fails
    return 22;
  }
} 
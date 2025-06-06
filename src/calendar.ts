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
  type_id: number;  // 1 - рабочий день, 2 - выходной, 3 - праздник, 4 - региональный праздник, 5 - сокращенный день, 6 - перенесенный выходной
  type_text: string;
  week_day: string;
  working_hours: number;
  note?: string;
}

interface ICalendarStatistic {
  calendar_days: number;
  calendar_days_without_holidays: number;
  holidays: number;
  shortened_working_days: number;
  weekends: number;
  work_days: number;
  working_hours: number;
}

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

async function getCalendarData(startDate: Date, endDate: Date): Promise<ICalendarResponse> {
  if (!process.env.CALENDAR_API_TOKEN) {
    throw new Error('CALENDAR_API_TOKEN is required');
  }

  const period = `${formatDate(startDate)}-${formatDate(endDate)}`;
  const url = `https://production-calendar.ru/get-period/${process.env.CALENDAR_API_TOKEN}/ru/${period}/json`;

  try {
    const response = await axios.get<ICalendarResponse>(url);
    if (response.data.status !== 'ok') {
      throw new Error('Calendar API returned error status');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    throw error;
  }
}

export async function getWorkingDaysForRange(startDate: Date, endDate: Date): Promise<number> {
  try {
    const data = await getCalendarData(startDate, endDate);
    return data.statistic.work_days;
  } catch (error) {
    console.error('Error getting working days:', error);
    // Fallback to a simple calculation if API fails
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(days * 0.7); // Rough estimate: 70% of days are working days
  }
}

export async function getWorkingDays(): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return getWorkingDaysForRange(startOfMonth, endOfMonth);
}

export async function getWorkingDaysForFirstHalf(): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const fifteenthOfMonth = new Date(now.getFullYear(), now.getMonth(), 15);
  
  return getWorkingDaysForRange(startOfMonth, fifteenthOfMonth);
}

export async function getWorkingDaysForSecondHalf(): Promise<number> {
  const now = new Date();
  const sixteenthOfMonth = new Date(now.getFullYear(), now.getMonth(), 16);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return getWorkingDaysForRange(sixteenthOfMonth, endOfMonth);
}

// Дополнительная функция для получения информации о конкретном дне
export async function getDayInfo(date: Date): Promise<ICalendarDay | null> {
  try {
    const data = await getCalendarData(date, date);
    return data.days[0] || null;
  } catch (error) {
    console.error('Error getting day info:', error);
    return null;
  }
}

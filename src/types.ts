export const CALENDAR_VIEW_TYPE = "mantle-calendar-view";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  sourceFile: string;
  sourceType: "kanban" | "custom";
  completed: boolean;
  priority?: "low" | "medium" | "high" | "critical";
  linkedFile?: string;
  description?: string;
}

export interface MantleCalendarData {
  customEvents: CalendarEvent[];
}

export interface Watercraft {
  type: 'Pontoon' | 'SpeedBoat' | 'JetSki';
  capacity: number;
  quantity?: number; // For multiple units like jet skis
}

export interface TimeSlot {
  userId: string | null;
  startTime: string;
  endTime: string;
}

export interface DailySchedule {
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  watercraft: {
    [key: string]: {
      details: Watercraft;
      timeSlots: TimeSlot[][];  // Array of arrays for multiple units
    }
  }
} 
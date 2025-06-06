export interface Watercraft {
  id: number;
  type: 'Pontoon' | 'SpeedBoat' | 'JetSki';
  capacity: number;
  quantity?: number; // For multiple units like jet skis
}

export interface TimeSlot {
  userId: string | null;
  startTime: string;
  endTime: string;
  firstName?: string;
}

export interface Reservation {
  id?: number;
  unitIndex: number;
  seatIndex: number;
  startTime: string;
  endTime: string;
  firstName: string;
  date: string;
  watercraftType: string;
  watercraftTypeId: number;
  userId?: string;
}

export interface DailySchedule {
  date: string;
  dayOfWeek?: string;
  startTime: string;
  endTime: string;
  watercraft: {
    [key: string]: {
      details: Watercraft;
      timeSlots: TimeSlot[][];  // Array of arrays for multiple units
    }
  }
} 
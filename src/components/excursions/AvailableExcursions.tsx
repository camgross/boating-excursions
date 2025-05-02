'use client';

import React, { useState } from 'react';
import { DailySchedule } from '@/types/excursions';
import DaySchedule from './DaySchedule';

const AvailableExcursions: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const scheduleData: DailySchedule[] = [
    {
      date: '2024-06-21',
      dayOfWeek: 'Saturday',
      startTime: '14:00',
      endTime: '18:00',
      watercraft: {
        pontoon: {
          details: { type: 'Pontoon', capacity: 8 },
          timeSlots: [Array(16).fill({ userId: null, startTime: '', endTime: '' })]
        },
        speedBoat: {
          details: { type: 'SpeedBoat', capacity: 5 },
          timeSlots: [Array(16).fill({ userId: null, startTime: '', endTime: '' })]
        },
        jetSki: {
          details: { type: 'JetSki', capacity: 2, quantity: 2 },
          timeSlots: [
            Array(16).fill({ userId: null, startTime: '', endTime: '' }),
            Array(16).fill({ userId: null, startTime: '', endTime: '' })
          ]
        }
      }
    },
    {
      date: '2024-06-22',
      dayOfWeek: 'Sunday',
      startTime: '13:00',
      endTime: '17:00',
      watercraft: {
        pontoon: {
          details: { type: 'Pontoon', capacity: 8 },
          timeSlots: [Array(16).fill({ userId: null, startTime: '', endTime: '' })]
        },
        speedBoat: {
          details: { type: 'SpeedBoat', capacity: 5 },
          timeSlots: [Array(16).fill({ userId: null, startTime: '', endTime: '' })]
        },
        jetSki: {
          details: { type: 'JetSki', capacity: 2, quantity: 2 },
          timeSlots: [
            Array(16).fill({ userId: null, startTime: '', endTime: '' }),
            Array(16).fill({ userId: null, startTime: '', endTime: '' })
          ]
        }
      }
    },
    {
      date: '2024-06-23',
      dayOfWeek: 'Monday',
      startTime: '13:00',
      endTime: '17:00',
      watercraft: {
        pontoon: {
          details: { type: 'Pontoon', capacity: 8 },
          timeSlots: [Array(16).fill({ userId: null, startTime: '', endTime: '' })]
        },
        speedBoat: {
          details: { type: 'SpeedBoat', capacity: 5 },
          timeSlots: [Array(16).fill({ userId: null, startTime: '', endTime: '' })]
        },
        jetSki: {
          details: { type: 'JetSki', capacity: 2, quantity: 2 },
          timeSlots: [
            Array(16).fill({ userId: null, startTime: '', endTime: '' }),
            Array(16).fill({ userId: null, startTime: '', endTime: '' })
          ]
        }
      }
    },
    {
      date: '2024-06-24',
      dayOfWeek: 'Tuesday',
      startTime: '13:00',
      endTime: '17:00',
      watercraft: {
        pontoon: {
          details: { type: 'Pontoon', capacity: 8 },
          timeSlots: [Array(16).fill({ userId: null, startTime: '', endTime: '' })]
        },
        speedBoat: {
          details: { type: 'SpeedBoat', capacity: 5 },
          timeSlots: [Array(16).fill({ userId: null, startTime: '', endTime: '' })]
        },
        jetSki: {
          details: { type: 'JetSki', capacity: 2, quantity: 2 },
          timeSlots: [
            Array(16).fill({ userId: null, startTime: '', endTime: '' }),
            Array(16).fill({ userId: null, startTime: '', endTime: '' })
          ]
        }
      }
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8">Available Excursions</h2>
      <div className="grid grid-cols-1 gap-8">
        {scheduleData.map((day) => (
          <DaySchedule 
            key={day.date}
            schedule={day}
            isSelected={selectedDate === day.date}
            onSelect={() => setSelectedDate(day.date)}
          />
        ))}
      </div>
    </div>
  );
};

export default AvailableExcursions; 
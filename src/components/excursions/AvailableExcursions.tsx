'use client';

import React, { useState } from 'react';
import { DailySchedule } from '@/types/excursions';
import DaySchedule from './DaySchedule';

const AvailableExcursions: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWatercraft, setSelectedWatercraft] = useState<string | null>(null);

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

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedWatercraft(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8">Available Excursions</h2>
      <div className="grid grid-cols-1 gap-8">
        {scheduleData.map((day) => (
          <div key={day.date} className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold">
                {day.dayOfWeek} - {new Date(day.date).toLocaleDateString()}
              </h3>
              <button
                onClick={() => handleDateSelect(selectedDate === day.date ? null : day.date)}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  selectedDate === day.date ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {selectedDate === day.date ? 'Hide Schedule' : 'View Schedule'}
              </button>
            </div>

            {selectedDate === day.date && (
              <div className="space-y-6">
                {!selectedWatercraft ? (
                  <div className="flex gap-4 flex-wrap">
                    {Object.entries(day.watercraft).map(([key, craft]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedWatercraft(key)}
                        className={`px-6 py-3 rounded-lg transition-colors ${
                          selectedWatercraft === key 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <div className="font-semibold">{craft.details.type}</div>
                        <div className="text-sm">
                          Capacity: {craft.details.capacity} persons
                          {craft.details.quantity && ` (${craft.details.quantity} available)`}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-semibold">
                        {day.watercraft[selectedWatercraft!].details.type} Schedule
                      </h4>
                      <button
                        onClick={() => setSelectedWatercraft(null)}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        ← Back to Watercraft Selection
                      </button>
                    </div>
                    {selectedWatercraft && (
                      <DaySchedule 
                        date={day.date}
                        dayOfWeek={day.dayOfWeek}
                        startTime={day.startTime}
                        endTime={day.endTime}
                        watercraft={{
                          [selectedWatercraft!]: day.watercraft[selectedWatercraft!]
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableExcursions; 
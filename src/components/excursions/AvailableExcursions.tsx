'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DailySchedule } from '@/types/excursions';
import DaySchedule from './DaySchedule';

// Helper to parse date string as local time
const getLocalDateObj = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getDayOfWeek = (dateString: string) => {
  return getLocalDateObj(dateString).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Chicago' });
};

const getFormattedDate = (dateString: string) => {
  return getLocalDateObj(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });
};

const AvailableExcursions: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWatercraft, setSelectedWatercraft] = useState<string | null>(null);
  const [availabilityMap, setAvailabilityMap] = useState<{[key: string]: number}>({});

  const scheduleData: DailySchedule[] = [
    {
      date: '2025-06-21',
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
      date: '2025-06-22',
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
      date: '2025-06-23',
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
      date: '2025-06-24',
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

  // Generate time slots for calculations
  const timeSlots = useMemo(() => {
    const allTimeSlots: string[] = [];
    scheduleData.forEach(day => {
      const [startHour, startMinute] = day.startTime.split(':').map(Number);
      const [endHour, endMinute] = day.endTime.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        allTimeSlots.push(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
        currentMinute += 15;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute = 0;
        }
      }
    });
    return Array.from(new Set(allTimeSlots));
  }, [scheduleData]);

  // Calculate availability percentages for each watercraft on each day
  const calculateAvailability = useCallback(() => {
    const savedReservations = localStorage.getItem('reservations');
    const reservations = savedReservations ? JSON.parse(savedReservations) : [];
    
    const newAvailabilityMap: {[key: string]: number} = {};
    
    scheduleData.forEach(day => {
      Object.entries(day.watercraft).forEach(([key, craft]) => {
        // Calculate total seat-slots (all seats for all time slots)
        const totalSeatSlots = 16 * (craft.details.quantity || 1) * craft.details.capacity;
        
        // Count booked seat-slots
        const dayReservations = reservations.filter((r: any) => 
          r.date === day.date && 
          r.watercraftType === craft.details.type
        );
        
        let bookedSeatSlots = 0;
        dayReservations.forEach((reservation: any) => {
          const startIdx = timeSlots.indexOf(reservation.startTime);
          const endIdx = timeSlots.indexOf(reservation.endTime);
          if (startIdx !== -1 && endIdx !== -1) {
            bookedSeatSlots += (endIdx - startIdx);
          }
        });
        
        const availabilityKey = `${day.date}-${key}`;
        const availability = Math.round(((totalSeatSlots - bookedSeatSlots) / totalSeatSlots) * 100);
        newAvailabilityMap[availabilityKey] = Math.max(0, Math.min(100, availability));
      });
    });
    
    setAvailabilityMap(newAvailabilityMap);
  }, [timeSlots]);

  // Calculate availability on mount and when reservations change
  useEffect(() => {
    calculateAvailability();
    
    // Set up storage event listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'reservations') {
        calculateAvailability();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [calculateAvailability]);

  console.log('DEBUG: scheduleData at render', scheduleData);

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8">Available Excursions</h2>
      <div className="grid grid-cols-1 gap-8">
        {scheduleData.map((day) => (
          <div key={day.date} className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold">
                {getDayOfWeek(day.date)} - {getFormattedDate(day.date)}
              </h3>
              <div className="text-sm font-medium text-gray-600">
                {day.startTime} - {day.endTime}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 flex-wrap">
                {Object.entries(day.watercraft).map(([key, craft]) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (selectedDate === day.date && selectedWatercraft === key) {
                        setSelectedDate(null);
                        setSelectedWatercraft(null);
                      } else {
                        setSelectedDate(day.date);
                        setSelectedWatercraft(key);
                      }
                    }}
                    className={`px-6 py-3 rounded-lg transition-colors ${
                      selectedDate === day.date && selectedWatercraft === key
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    } flex flex-col items-start relative`}
                  >
                    <div className="font-semibold">{craft.details.type}</div>
                    <div className="text-sm opacity-90">
                      {craft.details.capacity} {craft.details.capacity === 1 ? 'person' : 'persons'}
                      {craft.details.quantity && ` • ${craft.details.quantity} available`}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs opacity-80">
                        {selectedDate === day.date && selectedWatercraft === key ? 'Hide Schedule' : 'View Schedule'}
                      </div>
                      <div className={`text-xs font-medium ${
                        availabilityMap[`${day.date}-${key}`] > 50 
                          ? 'text-green-600' 
                          : availabilityMap[`${day.date}-${key}`] > 20 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                      }`}>
                        {availabilityMap[`${day.date}-${key}`]}% available
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          availabilityMap[`${day.date}-${key}`] > 50 
                            ? 'bg-green-500' 
                            : availabilityMap[`${day.date}-${key}`] > 20 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${availabilityMap[`${day.date}-${key}`]}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>

              {selectedDate === day.date && selectedWatercraft && (
                <div className="mt-6">
                  <DaySchedule 
                    date={day.date}
                    dayOfWeek={getDayOfWeek(day.date)}
                    startTime={day.startTime}
                    endTime={day.endTime}
                    watercraft={{
                      [selectedWatercraft]: {
                        details: day.watercraft[selectedWatercraft].details,
                        timeSlots: day.watercraft[selectedWatercraft].timeSlots
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableExcursions; 
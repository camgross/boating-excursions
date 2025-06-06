'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DailySchedule } from '@/types/excursions';
import DaySchedule from './DaySchedule';
import { supabase } from '@/lib/supabase';
import { toZonedTime, format } from 'date-fns-tz';

// Helper to parse date string as Central Time
const getCentralDateObj = (dateString: string) => {
  // dateString is expected in 'YYYY-MM-DD' format
  // Create a date at midnight Central Time
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date in Central Time by using the timezone offset
  const date = new Date(Date.UTC(year, month - 1, day));
  return toZonedTime(date, 'America/Chicago');
};

const getDayOfWeek = (dateString: string) => {
  // Use the exact date string to determine day of week
  const date = new Date(dateString + 'T00:00:00');
  return format(date, 'EEEE');
};

export const getFormattedDate = (dateString: string) => {
  // Use the exact date string for formatting
  const date = new Date(dateString + 'T00:00:00');
  return format(date, 'MMMM d, yyyy');
};

const AvailableExcursions: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWatercraft, setSelectedWatercraft] = useState<string | null>(null);
  const [availabilityMap, setAvailabilityMap] = useState<{[key: string]: number}>({});
  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [watercraftTypes, setWatercraftTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSchedules() {
      setLoading(true);
      try {
        // First fetch watercraft types
        const { data: typesData, error: typesError } = await supabase.from('watercraft_types').select('*');
        if (typesError) {
          console.error('Error fetching watercraft types:', typesError);
          setWatercraftTypes([]);
        } else {
          setWatercraftTypes(typesData || []);
        }

        // Define the specific dates we want to show (fixed dates)
        const targetDates = [
          '2025-06-21', // Saturday
          '2025-06-22', // Sunday
          '2025-06-23', // Monday
          '2025-06-24'  // Tuesday
        ];

        // Then fetch schedules
        let { data: scheduleData, error } = await supabase
          .from('daily_schedules')
          .select('*')
          .in('date', targetDates)
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching schedules:', error);
          setSchedules([]);
        } else {
          // If no schedules exist for these dates, create them
          if (!scheduleData || scheduleData.length === 0) {
            const newSchedules = targetDates.map(date => ({
              date,
              start_time: date === '2025-06-21' ? '14:00' : '13:00', // 2 PM for Saturday, 1 PM for others
              end_time: date === '2025-06-21' ? '18:00' : '17:00',   // 6 PM for Saturday, 5 PM for others
            }));

            // Insert the new schedules
            const { data: insertedData, error: insertError } = await supabase
              .from('daily_schedules')
              .insert(newSchedules)
              .select();

            if (insertError) {
              console.error('Error creating schedules:', insertError);
              setSchedules([]);
              return;
            }

            scheduleData = insertedData;
          }

          const mappedSchedules = (scheduleData || []).map((item: any) => {
            // Use the date directly without any timezone conversion
            return {
              ...item,
              date: item.date, // Use the date as is
              startTime: item.start_time,
              endTime: item.end_time,
              watercraft: (typesData || []).reduce((acc: any, type: any) => ({
                ...acc,
                [type.type]: {
                  details: type,
                  timeSlots: []
                }
              }), {})
            };
          });
          console.log('Mapped schedules:', JSON.stringify(mappedSchedules, null, 2));
          setSchedules(mappedSchedules);
        }
      } catch (err) {
        console.error('Error in fetchSchedules:', err);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedules();
  }, []);

  const fetchReservations = async () => {
    const { data, error } = await supabase.from('reservations').select('*');
    if (error) {
      console.error('Error fetching reservations:', error);
      setReservations([]);
    } else {
      console.log('Raw reservations from Supabase:', JSON.stringify(data, null, 2));
      
      // First fetch watercraft types if not already loaded
      let types = watercraftTypes;
      if (types.length === 0) {
        const { data: typesData, error: typesError } = await supabase.from('watercraft_types').select('*');
        if (typesError) {
          console.error('Error fetching watercraft types:', typesError);
        } else {
          types = typesData || [];
          setWatercraftTypes(types);
          console.log('Watercraft types loaded:', JSON.stringify(types, null, 2));
        }
      }

      const mapped = (data || []).map(r => {
        // Find the watercraft type for this reservation
        const watercraftType = types.find(w => w.id === r.watercraft_type_id)?.type;
        const normalizeTime = (t: string) => t.length === 5 ? t : t.slice(0,5);
        return {
          id: r.id,
          ...r,
          unitIndex: r.unit_number - 1,
          seatIndex: r.seat_number - 1,
          startTime: normalizeTime(r.start_time),
          endTime: normalizeTime(r.end_time),
          firstName: r.first_name,
          watercraftType: watercraftType, // Map to actual type name
          userId: r.user_id,
        };
      });
      
      console.log('Mapped reservations in state:', JSON.stringify(mapped, null, 2));
      setReservations(mapped);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleReservationChange = () => {
    fetchReservations();
  };

  // Generate time slots for calculations
  const timeSlots = useMemo(() => {
    const allTimeSlots: string[] = [];
    schedules.forEach(day => {
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
  }, [schedules]);

  // Helper function to get the next time slot
  const getNextTimeSlot = (time: string) => {
    const idx = timeSlots.indexOf(time);
    if (idx === -1) return time;
    
    // If it's the last slot, return the operating hours end time
    if (idx === timeSlots.length - 1) {
      return time;
    }
    
    return timeSlots[idx + 1];
  };

  // Calculate availability percentages for each watercraft on each day
  const calculateAvailability = useCallback(() => {
    const newAvailabilityMap: {[key: string]: number} = {};
    
    schedules.forEach(day => {
      Object.entries(day.watercraft).forEach(([key, craft]) => {
        // Generate time slots for this day and watercraft
        const [startHour, startMinute] = day.startTime.split(':').map(Number);
        const [endHour, endMinute] = day.endTime.split(':').map(Number);
        const slots: string[] = [];
        let current = new Date(0, 0, 0, startHour, startMinute);
        const end = new Date(0, 0, 0, endHour, endMinute);
        while (current < end) {
          slots.push(`${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`);
          current.setMinutes(current.getMinutes() + 15);
        }
        const totalTimeSlots = slots.length;
        const totalSeats = (craft.details.quantity || 1) * craft.details.capacity;
        const totalAvailableSlots = totalTimeSlots * totalSeats;
        
        // Count booked slots by checking each seat in each time slot
        const dayReservations = reservations.filter((r: any) => 
          r.date === day.date && 
          r.watercraftType === craft.details.type
        );

        // Debug logging for slot and reservation math
        console.log(`\n[DEBUG] ${day.date} - ${craft.details.type}`);
        console.log('Total slots:', slots);
        console.log('Total seats:', totalSeats);
        console.log('Total available slots:', totalAvailableSlots);
        console.log('Reservations:', dayReservations);

        let totalBookedSlots = 0;
        
        // For each time slot
        slots.forEach(timeSlot => {
          // For each unit
          for (let unitIndex = 0; unitIndex < (craft.details.quantity || 1); unitIndex++) {
            // For each seat in the unit
            for (let seatIndex = 0; seatIndex < craft.details.capacity; seatIndex++) {
              // Helper to normalize time to 'HH:mm'
              const normalizeTime = (t: string) => t.slice(0, 5);
              const isBooked = dayReservations.some((reservation: { unitIndex: number; seatIndex: number; startTime: string; endTime: string }) => {
                const slotTime = normalizeTime(timeSlot);
                const resStart = normalizeTime(reservation.startTime);
                const resEnd = normalizeTime(reservation.endTime);
                const match = reservation.unitIndex === unitIndex &&
                  reservation.seatIndex === seatIndex &&
                  slotTime >= resStart &&
                  (
                    slotTime < resEnd ||
                    (slotTime === normalizeTime(slots[slots.length - 1]) && resEnd === day.endTime)
                  );
                if (match) {
                  console.log(`[BOOKED] Slot: ${slotTime}, Unit: ${unitIndex}, Seat: ${seatIndex}, Reservation: [${resStart} - ${resEnd}]`);
                } else {
                  console.log(`[NOT BOOKED] Slot: ${slotTime}, Unit: ${unitIndex}, Seat: ${seatIndex}, Reservation: [${resStart} - ${resEnd}]`);
                }
                return match;
              });
              if (isBooked) {
                totalBookedSlots++;
              }
            }
          }
        });
        console.log('Total booked slots:', totalBookedSlots);
        
        const availabilityKey = `${day.date}-${key}`;
        const availability = totalAvailableSlots === 0 ? 0 : Math.round(((totalAvailableSlots - totalBookedSlots) / totalAvailableSlots) * 100);
        newAvailabilityMap[availabilityKey] = Math.max(0, Math.min(100, availability));
      });
    });
    
    setAvailabilityMap(newAvailabilityMap);
  }, [schedules, reservations]);

  // Calculate availability when schedules or reservations change
  useEffect(() => {
    calculateAvailability();
  }, [calculateAvailability]);

  console.log('DEBUG: scheduleData at render', schedules);
  console.log('Schedules being rendered:', schedules);

  // Temporary UI debug output for production verification
  const debugDay = schedules[0];
  let debugCraftKey: string = '';
  let debugCraft: any = null;
  if (debugDay) {
    const keys = Object.keys(debugDay.watercraft);
    if (keys.length > 0) {
      debugCraftKey = keys[0];
      debugCraft = debugDay.watercraft[debugCraftKey];
    }
  }
  const debugSlots = debugDay && debugCraft ? (() => {
    const [startHour, startMinute] = debugDay.startTime.split(':').map(Number);
    const [endHour, endMinute] = debugDay.endTime.split(':').map(Number);
    let current = new Date(0, 0, 0, startHour, startMinute);
    const end = new Date(0, 0, 0, endHour, endMinute);
    const slots: string[] = [];
    while (current < end) {
      slots.push(`${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`);
      current.setMinutes(current.getMinutes() + 15);
    }
    return slots;
  })() : [];
  const debugReservations = reservations.filter(r => debugDay && r.date === debugDay.date && debugCraft && r.watercraftType === debugCraft.details.type);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading schedules...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8">Available Excursions</h2>
      <div className="grid grid-cols-1 gap-8">
        {schedules.map((day) => (
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
                {watercraftTypes.map((craft) => (
                  <button
                    key={craft.id}
                    onClick={() => {
                      if (selectedDate === day.date && selectedWatercraft === craft.type) {
                        setSelectedDate(null);
                        setSelectedWatercraft(null);
                      } else {
                        setSelectedDate(day.date);
                        setSelectedWatercraft(craft.type);
                      }
                    }}
                    className={`px-6 pt-4 pb-3 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 flex flex-col items-start relative`}
                    style={{ minWidth: 180 }}
                  >
                    {/* Blue bar for selected state */}
                    {selectedDate === day.date && selectedWatercraft === craft.type && (
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary rounded-t-lg" />
                    )}
                    <div className="font-semibold mt-1">{craft.type}</div>
                    <div className="text-sm opacity-90">
                      {craft.capacity} {craft.capacity === 1 ? 'person' : 'persons'}
                      {craft.quantity && ` • ${craft.quantity} available`}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs opacity-80">
                        {selectedDate === day.date && selectedWatercraft === craft.type ? 'Hide Schedule' : 'View Schedule'}
                      </div>
                      <div className={`text-xs font-medium ${
                        availabilityMap[`${day.date}-${craft.type}`] > 50 
                          ? 'text-green-600' 
                          : availabilityMap[`${day.date}-${craft.type}`] > 20 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                      }`}>
                        {availabilityMap[`${day.date}-${craft.type}`]}% available
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          availabilityMap[`${day.date}-${craft.type}`] > 50 
                            ? 'bg-green-500' 
                            : availabilityMap[`${day.date}-${craft.type}`] > 20 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${availabilityMap[`${day.date}-${craft.type}`]}%` }}
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
                    watercraft={
                      selectedWatercraft
                        ? {
                            [selectedWatercraft]: {
                              details: {
                                id: watercraftTypes.find(w => w.type === selectedWatercraft)?.id || 0,
                                type: selectedWatercraft as "Pontoon" | "SpeedBoat" | "JetSki",
                                capacity: watercraftTypes.find(w => w.type === selectedWatercraft)?.capacity || 1,
                                quantity: watercraftTypes.find(w => w.type === selectedWatercraft)?.quantity || 1
                              },
                              timeSlots: []
                            }
                          }
                        : {}
                    }
                    reservations={reservations.filter(r => r.date === day.date)}
                    onReservationChange={handleReservationChange}
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
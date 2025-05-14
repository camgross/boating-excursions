'use client';

import React, { useState, useEffect } from 'react';
import { Watercraft, Reservation } from '@/types/excursions';
import { toast } from 'react-hot-toast';

interface TimeGridProps {
  watercraft: Watercraft;
  date: string;
  onReservationChange: () => void;
}

const TimeGrid: React.FC<TimeGridProps> = ({ watercraft, date, onReservationChange }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<{[key: string]: boolean}>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reservationName, setReservationName] = useState('');
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  // Load reservations from localStorage on mount
  useEffect(() => {
    const savedReservations = localStorage.getItem('reservations');
    if (savedReservations) {
      setReservations(JSON.parse(savedReservations));
    }
  }, []);

  const getOperatingHours = () => {
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    console.log(`Date: ${date}, Day of week number: ${dayOfWeek}, Day name: ${dayNames[dayOfWeek]}`);

    // Saturday: 2 PM - 6 PM
    // Sunday, Monday, Tuesday: 1 PM - 5 PM
    if (dayOfWeek === 6) { // Saturday
      return { startTime: '14:00', endTime: '18:00' };
    } else if (dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 2) {
      return { startTime: '13:00', endTime: '17:00' };
    }
    return { startTime: '00:00', endTime: '00:00' };
  };

  const generateTimeSlots = () => {
    const { startTime, endTime } = getOperatingHours();
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const slots = [];
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      slots.push(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
      currentMinute += 15;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }
    
    return slots;
  };

  const isSlotBooked = (unitIndex: number, seatIndex: number, time: string) => {
    return reservations.some(reservation => 
      reservation.unitIndex === unitIndex && 
      reservation.seatIndex === seatIndex && 
      reservation.date === date &&
      reservation.watercraftType === watercraft.type &&
      time >= reservation.startTime && 
      time < reservation.endTime
    );
  };

  const handleSlotClick = (time: string, unitIndex: number, seatIndex: number) => {
    if (isSlotBooked(unitIndex, seatIndex, time)) return;
    
    setSelectedStartTime(time);
    setSelectedEndTime(time);
    setSelectedUnit(unitIndex);
    setSelectedSeat(seatIndex);
    setSelectedSlots({ [`${unitIndex}-${seatIndex}-${time}`]: true });
    setIsModalOpen(true);
  };

  const handleSaveReservation = () => {
    if (!selectedStartTime || !selectedEndTime || selectedUnit === null || selectedSeat === null || !reservationName) {
      toast.error('Please fill in all fields');
      return;
    }

    const newReservation: Reservation = {
      unitIndex: selectedUnit,
      seatIndex: selectedSeat,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
      firstName: reservationName,
      date: date,
      watercraftType: watercraft.type
    };

    const updatedReservations = [...reservations, newReservation];
    localStorage.setItem('reservations', JSON.stringify(updatedReservations));
    setReservations(updatedReservations);
    
    // Reset state
    setSelectedSlots({});
    setSelectedStartTime(null);
    setSelectedEndTime(null);
    setSelectedUnit(null);
    setSelectedSeat(null);
    setReservationName('');
    setIsModalOpen(false);
    
    onReservationChange();
    toast.success('Reservation saved successfully!');
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {Array.from({ length: watercraft.quantity || 1 }).map((_, unitIndex) => (
            <div key={unitIndex} className="mb-6">
              <h5 className="text-lg font-semibold mb-2">
                {watercraft.type} {watercraft.quantity ? `#${unitIndex + 1}` : ''}
              </h5>
              <div className="flex">
                {/* Time labels */}
                <div className="w-20 flex-shrink-0">
                  <div className="h-8"></div>
                  {timeSlots.map((time) => (
                    <div key={`time-${time}`} className="h-8 text-xs font-medium flex items-center">
                      {time}
                    </div>
                  ))}
                </div>
                
                {/* Seats grid */}
                <div className="flex-1">
                  {/* Seat headers */}
                  <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `repeat(${watercraft.capacity}, minmax(0, 1fr))` }}>
                    {Array.from({ length: watercraft.capacity }).map((_, seatIndex) => (
                      <div key={`header-${seatIndex}`} className="h-8 text-xs font-medium flex items-center justify-center border-b">
                        Seat {seatIndex + 1}
                      </div>
                    ))}
                  </div>
                  
                  {/* Time slots grid */}
                  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${watercraft.capacity}, minmax(0, 1fr))` }}>
                    {timeSlots.map((time) => (
                      <React.Fragment key={`time-row-${time}`}>
                        {Array.from({ length: watercraft.capacity }).map((_, seatIndex) => {
                          const isBooked = isSlotBooked(unitIndex, seatIndex, time);
                          return (
                            <button
                              key={`${unitIndex}-${seatIndex}-${time}`}
                              onClick={() => handleSlotClick(time, unitIndex, seatIndex)}
                              className={`h-8 border rounded transition-colors ${
                                isBooked
                                  ? 'bg-blue-500 text-white cursor-not-allowed'
                                  : selectedSlots[`${unitIndex}-${seatIndex}-${time}`]
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                              disabled={isBooked}
                            />
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Make Reservation</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={reservationName}
                onChange={(e) => setReservationName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your first name"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReservation}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Save Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeGrid; 
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Watercraft, TimeSlot, Reservation } from '@/types/excursions';
import { toast } from 'react-hot-toast';

interface TimeGridProps {
  watercraft: Watercraft;
  date: string;
  onReservationChange: () => void;
}

const TimeGrid: React.FC<TimeGridProps> = ({ watercraft, date, onReservationChange }) => {
  const [selectedSlots, setSelectedSlots] = useState<{[key: string]: boolean}>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
  const [reservationName, setReservationName] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  // Default operating hours
  const startTime = '09:00';
  const endTime = '17:00';

  // Load reservations from localStorage on mount
  useEffect(() => {
    const savedReservations = localStorage.getItem('reservations');
    if (savedReservations) {
      setReservations(JSON.parse(savedReservations));
    }
  }, []);

  // Reset selection when modal is closed
  useEffect(() => {
    if (!isModalOpen) {
      setSelectedUnit(null);
      setSelectedSeat(null);
      setSelectedStartTime(null);
      setSelectedEndTime(null);
      setSelectedSlots({});
    }
  }, [isModalOpen]);

  const generateTimeSlots = () => {
    const slots = [];
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const isSlotBooked = (unitIndex: number, seatIndex: number, time: string) => {
    return reservations.some(reservation => {
      const slotTime = new Date(`2000-01-01T${time}`);
      const start = new Date(`2000-01-01T${reservation.startTime}`);
      const end = new Date(`2000-01-01T${reservation.endTime}`);
      
      // Check if the slot is booked for the same watercraft type and date
      return reservation.unitIndex === unitIndex && 
             reservation.seatIndex === seatIndex && 
             reservation.date === date &&
             reservation.watercraftType === watercraft.type &&
             slotTime >= start && 
             slotTime < end;
    });
  };

  const getReservationName = (unitIndex: number, seatIndex: number, time: string) => {
    const reservation = reservations.find(res => {
      const slotTime = new Date(`2000-01-01T${time}`);
      const start = new Date(`2000-01-01T${res.startTime}`);
      const end = new Date(`2000-01-01T${res.endTime}`);
      return res.unitIndex === unitIndex && 
             res.seatIndex === seatIndex && 
             res.date === date &&
             res.watercraftType === watercraft.type &&
             slotTime >= start && 
             slotTime < end;
    });
    return reservation?.firstName;
  };

  const isStartOfReservation = (unitIndex: number, seatIndex: number, time: string) => {
    const reservation = reservations.find(res => {
      return res.unitIndex === unitIndex && 
             res.seatIndex === seatIndex && 
             res.date === date &&
             res.watercraftType === watercraft.type &&
             res.startTime === time;
    });
    return !!reservation;
  };

  const hasDuplicateReservation = (firstName: string, startTime: string, endTime: string) => {
    console.log('Checking for duplicates with:', { firstName, startTime, endTime });
    
    return reservations.some(reservation => {
      // Check for any reservation by the same person on the same date
      if (reservation.firstName !== firstName || reservation.date !== date) {
        return false;
      }

      const newStart = new Date(`2000-01-01T${startTime}`);
      const newEnd = new Date(`2000-01-01T${endTime}`);
      const resStart = new Date(`2000-01-01T${reservation.startTime}`);
      const resEnd = new Date(`2000-01-01T${reservation.endTime}`);
      
      console.log('Comparing times:', {
        newStart: newStart.toISOString(),
        newEnd: newEnd.toISOString(),
        resStart: resStart.toISOString(),
        resEnd: resEnd.toISOString(),
        watercraftType: reservation.watercraftType,
        currentWatercraftType: watercraft.type
      });

      // Check for any time overlap, including exact matches
      const hasTimeOverlap = (
        (newStart >= resStart && newStart < resEnd) ||  // New start time falls within existing reservation
        (newEnd > resStart && newEnd <= resEnd) ||      // New end time falls within existing reservation
        (newStart <= resStart && newEnd >= resEnd)      // New reservation completely overlaps existing reservation
      );

      return hasTimeOverlap;
    });
  };

  const handleMouseDown = (slotTime: string, unitIndex: number, seatIndex: number) => {
    console.log('MouseDown - Setting initial values:', { slotTime, unitIndex, seatIndex });
    if (isSlotBooked(unitIndex, seatIndex, slotTime)) return;
    setIsDragging(true);
    setSelectedStartTime(slotTime);
    setSelectedEndTime(slotTime);
    setSelectedUnit(unitIndex);
    setSelectedSeat(seatIndex);
    setSelectedSlots({ [`${unitIndex}-${seatIndex}-${slotTime}`]: true });
  };

  const handleMouseEnter = (slotTime: string, unitIndex: number, seatIndex: number) => {
    if (isDragging && selectedStartTime && selectedUnit === unitIndex && selectedSeat === seatIndex) {
      console.log('MouseEnter - Updating selection:', { slotTime, unitIndex, seatIndex });
      const timeSlots = generateTimeSlots();
      const startIndex = timeSlots.indexOf(selectedStartTime);
      const endIndex = timeSlots.indexOf(slotTime);
      const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
      
      const newSelectedSlots: { [key: string]: boolean } = {};
      for (let i = min; i <= max; i++) {
        newSelectedSlots[`${unitIndex}-${seatIndex}-${timeSlots[i]}`] = true;
      }
      
      setSelectedSlots(newSelectedSlots);
      setSelectedEndTime(timeSlots[max]);
      setSelectedUnit(unitIndex);
      setSelectedSeat(seatIndex);
    }
  };

  const handleMouseUp = () => {
    console.log('MouseUp - Final values:', {
      selectedStartTime,
      selectedEndTime,
      selectedUnit,
      selectedSeat
    });
    if (isDragging && selectedStartTime && selectedEndTime && selectedUnit !== null && selectedSeat !== null) {
      // Get the final selected time block
      const timeSlots = generateTimeSlots();
      const startIndex = timeSlots.indexOf(selectedStartTime);
      const endIndex = timeSlots.indexOf(selectedEndTime);
      const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
      
      // Update both start and end times to ensure we have the correct block
      setSelectedStartTime(timeSlots[min]);
      setSelectedEndTime(timeSlots[max]);
      setIsModalOpen(true);
    }
    setIsDragging(false);
  };

  const handleSaveReservation = () => {
    console.log('Debug - Field values before save:', {
      selectedUnit: selectedUnit,
      selectedSeat: selectedSeat,
      selectedStartTime: selectedStartTime,
      selectedEndTime: selectedEndTime,
      reservationName: reservationName,
      allFieldsPresent: Boolean(selectedUnit !== null && selectedSeat !== null && selectedStartTime && selectedEndTime && reservationName)
    });

    if (selectedUnit === null) {
      console.log('Missing selectedUnit');
      toast.error('Please select a unit');
      return;
    }
    if (selectedSeat === null) {
      console.log('Missing selectedSeat');
      toast.error('Please select a seat');
      return;
    }
    if (!selectedStartTime) {
      console.log('Missing selectedStartTime');
      toast.error('Please select a start time');
      return;
    }
    if (!selectedEndTime) {
      console.log('Missing selectedEndTime');
      toast.error('Please select an end time');
      return;
    }
    if (!reservationName) {
      console.log('Missing reservationName');
      toast.error('Please enter your name');
      return;
    }

    // Get the final time block
    const timeSlots = generateTimeSlots();
    const startIndex = timeSlots.indexOf(selectedStartTime);
    const endIndex = timeSlots.indexOf(selectedEndTime);
    const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
    
    const startTime = timeSlots[min];
    const endTime = timeSlots[max];

    if (hasDuplicateReservation(reservationName, startTime, endTime)) {
      toast.error('You already have a reservation during this time period');
      return;
    }

    const newReservation: Reservation = {
      unitIndex: selectedUnit,
      seatIndex: selectedSeat,
      startTime: startTime,
      endTime: endTime,
      firstName: reservationName,
      date: date,
      watercraftType: watercraft.type
    };

    console.log('Creating new reservation:', newReservation);

    const updatedReservations = [...reservations, newReservation];
    localStorage.setItem('reservations', JSON.stringify(updatedReservations));
    setReservations(updatedReservations);
    onReservationChange();
    setIsModalOpen(false);
    setSelectedSlots({});
    toast.success('Reservation saved successfully!');
  };

  const handleCancelReservation = () => {
    setIsModalOpen(false);
    setReservationName('');
    setSelectedStartTime(null);
    setSelectedEndTime(null);
    setSelectedUnit(null);
    setSelectedSeat(null);
    setSelectedSlots({});
  };

  const handleClearReservations = () => {
    localStorage.removeItem('reservations');
    setReservations([]);
    toast.success('All reservations cleared');
  };

  const timeSlots = generateTimeSlots();

  const getReservationForSlot = (unitIndex: number, seatIndex: number, time: string) => {
    return reservations.find(reservation => 
      reservation.unitIndex === unitIndex && 
      reservation.seatIndex === seatIndex && 
      reservation.watercraftType === watercraft.type &&
      reservation.date === date &&
      time >= reservation.startTime && 
      time < reservation.endTime
    );
  };

  return (
    <div className="space-y-4">
      {/* Development-only clear button */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex justify-end">
          <button
            onClick={handleClearReservations}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
          >
            Clear All Reservations
          </button>
        </div>
      )}
      <div 
        ref={gridRef}
        className="overflow-x-auto"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="min-w-full">
          {Array.from({ length: watercraft.quantity || 1 }).map((_, unitIndex) => (
            <div key={unitIndex} className="mb-6">
              <h5 className="text-lg font-semibold mb-2">
                {watercraft.type} 
                {watercraft.quantity ? ` #${unitIndex + 1}` : ''}
              </h5>
              <div className="flex">
                {/* Time labels column */}
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
                          const isStart = isStartOfReservation(unitIndex, seatIndex, time);
                          const reservationName = getReservationName(unitIndex, seatIndex, time);
                          return (
                            <button
                              key={`${unitIndex}-${seatIndex}-${time}`}
                              onMouseDown={() => !isBooked && handleMouseDown(time, unitIndex, seatIndex)}
                              onMouseEnter={() => !isBooked && handleMouseEnter(time, unitIndex, seatIndex)}
                              className={`h-8 border rounded transition-colors relative ${
                                isBooked
                                  ? 'bg-blue-500 text-white cursor-not-allowed'
                                  : selectedSlots[`${unitIndex}-${seatIndex}-${time}`]
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                              title={`Seat ${seatIndex + 1} at ${time}`}
                              disabled={isBooked}
                            >
                              {isStart && reservationName && (
                                <span className="absolute top-0 left-0 right-0 text-xs px-1 truncate">
                                  {reservationName}
                                </span>
                              )}
                            </button>
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
                onClick={handleCancelReservation}
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
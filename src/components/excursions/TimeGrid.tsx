'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Watercraft, TimeSlot, Reservation } from '@/types/excursions';

interface TimeGridProps {
  watercraft: {
    details: Watercraft;
    timeSlots: TimeSlot[][];
  };
  startTime: string;
  endTime: string;
}

const TimeGrid: React.FC<TimeGridProps> = ({ watercraft, startTime, endTime }) => {
  const [selectedSlots, setSelectedSlots] = useState<{[key: string]: boolean}>({});
  const [isDragging, setIsDragging] = useState(false);
  const [startSlot, setStartSlot] = useState<string | null>(null);
  const [tempSlots, setTempSlots] = useState<{[key: string]: boolean}>({});
  const [showModal, setShowModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  // Load reservations from localStorage on mount
  useEffect(() => {
    const storedReservations = localStorage.getItem('boating-reservations');
    if (storedReservations) {
      setReservations(JSON.parse(storedReservations));
    }
  }, []);

  const generateTimeSlots = () => {
    const slots = [];
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const isSlotBooked = (unitIndex: number, seatIndex: number, time: string) => {
    return reservations.some(reservation => {
      const slotTime = new Date(`2000-01-01T${time}`);
      const start = new Date(`2000-01-01T${reservation.startTime}`);
      const end = new Date(`2000-01-01T${reservation.endTime}`);
      return reservation.unitIndex === unitIndex && 
             reservation.seatIndex === seatIndex && 
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
             slotTime >= start && 
             slotTime < end;
    });
    return reservation?.firstName;
  };

  const isStartOfReservation = (unitIndex: number, seatIndex: number, time: string) => {
    const reservation = reservations.find(res => {
      return res.unitIndex === unitIndex && 
             res.seatIndex === seatIndex && 
             res.startTime === time;
    });
    return !!reservation;
  };

  const handleMouseDown = (slotTime: string, unitIndex: number, seatIndex: number) => {
    if (isSlotBooked(unitIndex, seatIndex, slotTime)) return;
    setIsDragging(true);
    setStartSlot(`${unitIndex}-${seatIndex}-${slotTime}`);
    setTempSlots({ [`${unitIndex}-${seatIndex}-${slotTime}`]: true });
  };

  const handleMouseEnter = (slotTime: string, unitIndex: number, seatIndex: number) => {
    if (isDragging && startSlot) {
      const [startUnitIndex, startSeatIndex, startTime] = startSlot.split('-');
      const currentSlot = `${unitIndex}-${seatIndex}-${slotTime}`;
      
      if (startUnitIndex === unitIndex.toString() && startSeatIndex === seatIndex.toString()) {
        const newTempSlots = { ...tempSlots };
        const timeSlots = generateTimeSlots();
        const startIndex = timeSlots.indexOf(startTime);
        const endIndex = timeSlots.indexOf(slotTime);
        
        const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
        
        for (let i = min; i <= max; i++) {
          newTempSlots[`${unitIndex}-${seatIndex}-${timeSlots[i]}`] = true;
        }
        
        setTempSlots(newTempSlots);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging && Object.keys(tempSlots).length > 0) {
      setShowModal(true);
    }
    setIsDragging(false);
  };

  const handleSaveReservation = () => {
    if (!firstName.trim()) return;

    const [unitIndex, seatIndex, startTime] = Object.keys(tempSlots)[0].split('-');
    const timeSlots = generateTimeSlots();
    const startIndex = timeSlots.indexOf(startTime);
    const endIndex = timeSlots.indexOf(Object.keys(tempSlots)[Object.keys(tempSlots).length - 1].split('-')[2]);
    
    const newReservation: Reservation = {
      unitIndex: parseInt(unitIndex),
      seatIndex: parseInt(seatIndex),
      startTime: timeSlots[Math.min(startIndex, endIndex)],
      endTime: timeSlots[Math.max(startIndex, endIndex)],
      firstName: firstName.trim()
    };

    const updatedReservations = [...reservations, newReservation];
    setReservations(updatedReservations);
    localStorage.setItem('boating-reservations', JSON.stringify(updatedReservations));
    
    setShowModal(false);
    setFirstName('');
    setTempSlots({});
  };

  const handleCancelReservation = () => {
    setShowModal(false);
    setFirstName('');
    setTempSlots({});
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-4">
      <div 
        ref={gridRef}
        className="overflow-x-auto"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="min-w-full">
          {Array.from({ length: watercraft.details.quantity || 1 }).map((_, unitIndex) => (
            <div key={unitIndex} className="mb-6">
              <h5 className="text-lg font-semibold mb-2">
                {watercraft.details.type} 
                {watercraft.details.quantity ? ` #${unitIndex + 1}` : ''}
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
                  <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `repeat(${watercraft.details.capacity}, minmax(0, 1fr))` }}>
                    {Array.from({ length: watercraft.details.capacity }).map((_, seatIndex) => (
                      <div key={`header-${seatIndex}`} className="h-8 text-xs font-medium flex items-center justify-center border-b">
                        Seat {seatIndex + 1}
                      </div>
                    ))}
                  </div>
                  
                  {/* Time slots grid */}
                  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${watercraft.details.capacity}, minmax(0, 1fr))` }}>
                    {timeSlots.map((time) => (
                      <React.Fragment key={`time-row-${time}`}>
                        {Array.from({ length: watercraft.details.capacity }).map((_, seatIndex) => {
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
                                  ? 'bg-gray-300 cursor-not-allowed'
                                  : tempSlots[`${unitIndex}-${seatIndex}-${time}`]
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
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Make Reservation</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
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
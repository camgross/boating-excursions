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
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{unitIndex: number, seatIndex: number, timeIndex: number} | null>(null);
  const [dragEnd, setDragEnd] = useState<{unitIndex: number, seatIndex: number, timeIndex: number} | null>(null);
  const [editReservation, setEditReservation] = useState<Reservation | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

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

  const handleMouseDown = (unitIndex: number, seatIndex: number, timeIndex: number) => {
    if (isSlotBooked(unitIndex, seatIndex, timeSlots[timeIndex])) return;
    setDragging(true);
    setDragStart({ unitIndex, seatIndex, timeIndex });
    setDragEnd({ unitIndex, seatIndex, timeIndex });
  };

  const handleMouseEnter = (unitIndex: number, seatIndex: number, timeIndex: number) => {
    if (!dragging || !dragStart) return;
    // Only allow drag within the same seat/unit
    if (unitIndex !== dragStart.unitIndex || seatIndex !== dragStart.seatIndex) return;
    setDragEnd({ unitIndex, seatIndex, timeIndex });
  };

  const handleMouseUp = () => {
    if (dragging && dragStart && dragEnd) {
      setDragging(false);
      // Calculate range
      const [start, end] = [dragStart.timeIndex, dragEnd.timeIndex].sort((a, b) => a - b);
      const newSelectedSlots: {[key: string]: boolean} = {};
      for (let i = start; i <= end; i++) {
        newSelectedSlots[`${dragStart.unitIndex}-${dragStart.seatIndex}-${timeSlots[i]}`] = true;
      }
      setSelectedStartTime(timeSlots[start]);
      setSelectedEndTime(timeSlots[end]);
      setSelectedUnit(dragStart.unitIndex);
      setSelectedSeat(dragStart.seatIndex);
      setSelectedSlots(newSelectedSlots);
      setIsModalOpen(true);
    }
    setDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Helper to clear selection state
  const clearSelection = () => {
    setSelectedSlots({});
    setSelectedStartTime(null);
    setSelectedEndTime(null);
    setSelectedUnit(null);
    setSelectedSeat(null);
    setReservationName('');
    setIsModalOpen(false);
  };

  const handleCancelReservation = () => {
    clearSelection();
  };

  const getNextTimeSlot = (time: string) => {
    const idx = timeSlots.indexOf(time);
    if (idx === -1) return time;
    
    // If it's the last slot, return the operating hours end time
    if (idx === timeSlots.length - 1) {
      const { endTime } = getOperatingHours();
      return endTime;
    }
    
    return timeSlots[idx + 1];
  };

  const isOverlap = (startA: string, endA: string, startB: string, endB: string) => {
    return startA < endB && startB < endA;
  };

  const handleSaveReservation = () => {
    if (!selectedStartTime || !selectedEndTime || selectedUnit === null || selectedSeat === null || !reservationName) {
      toast.error('Please fill in all fields');
      return;
    }

    // Set endTime to the next slot after the last selected time
    const trueEndTime = getNextTimeSlot(selectedEndTime);
    const normalizedName = reservationName.trim().toLowerCase();

    // Helper to check if a reservation is the one being edited
    const isEditingThisReservation = (r: Reservation) =>
      editReservation &&
      r.unitIndex === editReservation.unitIndex &&
      r.seatIndex === editReservation.seatIndex &&
      r.startTime === editReservation.startTime &&
      r.endTime === editReservation.endTime &&
      r.date === editReservation.date &&
      r.watercraftType === editReservation.watercraftType;

    // 1. Prevent overlapping reservations for the same seat/unit (exclude the one being edited)
    const seatConflict = reservations.some(r =>
      !isEditingThisReservation(r) &&
      r.unitIndex === selectedUnit &&
      r.seatIndex === selectedSeat &&
      r.date === date &&
      r.watercraftType === watercraft.type &&
      isOverlap(selectedStartTime, trueEndTime, r.startTime, r.endTime)
    );
    if (seatConflict) {
      toast.error('This seat is already reserved for the selected time.');
      return;
    }

    // 2. Prevent the same user from having overlapping reservations on the same day across all boats/seats (exclude the one being edited)
    const userConflict = reservations.some(r =>
      !isEditingThisReservation(r) &&
      r.date === date &&
      r.firstName.trim().toLowerCase() === normalizedName &&
      isOverlap(selectedStartTime, trueEndTime, r.startTime, r.endTime)
    );
    if (userConflict) {
      toast.error('You already have a reservation at this time.');
      return;
    }

    let updatedReservations;
    if (editReservation) {
      // Update the existing reservation
      updatedReservations = reservations.map(r =>
        isEditingThisReservation(r)
          ? {
              ...r,
              firstName: reservationName,
              // Optionally allow changing other fields in the future
            }
          : r
      );
    } else {
      // Add a new reservation
      const newReservation: Reservation = {
        unitIndex: selectedUnit,
        seatIndex: selectedSeat,
        startTime: selectedStartTime,
        endTime: trueEndTime,
        firstName: reservationName,
        date: date,
        watercraftType: watercraft.type
      };
      updatedReservations = [...reservations, newReservation];
    }
    localStorage.setItem('reservations', JSON.stringify(updatedReservations));
    setReservations(updatedReservations);
    clearSelection();
    setEditReservation(null);
    onReservationChange();
    toast.success('Reservation saved successfully!');
  };

  const openEditModal = (reservation: Reservation) => {
    setEditReservation(reservation);
    setReservationName(reservation.firstName);
    setSelectedStartTime(reservation.startTime);
    setSelectedEndTime(timeSlots[timeSlots.indexOf(reservation.endTime) - 1] || reservation.startTime);
    setSelectedUnit(reservation.unitIndex);
    setSelectedSeat(reservation.seatIndex);
    // Highlight all blocks in the reservation range
    const startIdx = timeSlots.indexOf(reservation.startTime);
    const endIdx = timeSlots.indexOf(reservation.endTime) - 1;
    const newSelectedSlots: {[key: string]: boolean} = {};
    for (let i = startIdx; i <= endIdx; i++) {
      newSelectedSlots[`${reservation.unitIndex}-${reservation.seatIndex}-${timeSlots[i]}`] = true;
    }
    setSelectedSlots(newSelectedSlots);
    setIsModalOpen(true);
  };

  const handleDeleteReservation = () => {
    if (!editReservation) return;
    const updatedReservations = reservations.filter(r =>
      !(
        r.unitIndex === editReservation.unitIndex &&
        r.seatIndex === editReservation.seatIndex &&
        r.startTime === editReservation.startTime &&
        r.endTime === editReservation.endTime &&
        r.date === editReservation.date &&
        r.watercraftType === editReservation.watercraftType
      )
    );
    localStorage.setItem('reservations', JSON.stringify(updatedReservations));
    setReservations(updatedReservations);
    clearSelection();
    setEditReservation(null);
    onReservationChange();
    toast.success('Reservation deleted.');
  };

  const timeSlots = generateTimeSlots();

  // Add mouseup listener to the container to handle mouseup outside button
  useEffect(() => {
    if (!dragging) return;
    const handleUp = () => handleMouseUp();
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, [dragging]);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {Array.from({ length: watercraft.quantity || 1 }).map((_, unitIndex) => (
            <div key={unitIndex} className="mb-6">
              <h5 className="text-lg font-semibold mb-2">
                {watercraft.type} {watercraft.quantity ? `#${unitIndex + 1}` : ''}
              </h5>
              {/* Seat headers */}
              <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `120px repeat(${watercraft.capacity}, minmax(0, 1fr))` }}>
                <div></div>
                {Array.from({ length: watercraft.capacity }).map((_, seatIndex) => (
                  <div key={`header-${seatIndex}`} className="h-8 text-xs font-medium flex items-center justify-center border-b">
                    Seat {seatIndex + 1}
                  </div>
                ))}
              </div>
              {/* Time slots grid */}
              {timeSlots.map((time, timeIndex) => (
                <div key={`row-${time}`} className="grid gap-1 items-center" style={{ gridTemplateColumns: `120px repeat(${watercraft.capacity}, minmax(0, 1fr))` }}>
                  <div className="h-8 flex items-center justify-center text-xs font-medium">
                    {time}
                  </div>
                  {Array.from({ length: watercraft.capacity }).map((_, seatIndex) => {
                    const isBooked = isSlotBooked(unitIndex, seatIndex, time);
                    const isSelected = selectedSlots[`${unitIndex}-${seatIndex}-${time}`];
                    // Find reservation for this block
                    const reservation = reservations.find(r =>
                      r.unitIndex === unitIndex &&
                      r.seatIndex === seatIndex &&
                      r.date === date &&
                      r.watercraftType === watercraft.type &&
                      time >= r.startTime && time < r.endTime
                    );
                    // Show name only in the top (earliest) block of the reservation
                    let showName = false;
                    if (reservation && reservation.startTime === time) {
                      showName = true;
                    }
                    return (
                      <button
                        key={`${unitIndex}-${seatIndex}-${time}`}
                        onMouseDown={() => handleMouseDown(unitIndex, seatIndex, timeIndex)}
                        onMouseEnter={() => handleMouseEnter(unitIndex, seatIndex, timeIndex)}
                        onMouseUp={handleMouseUp}
                        onClick={showName && reservation ? (e) => { e.preventDefault(); openEditModal(reservation); } : undefined}
                        className={`h-8 border rounded transition-colors ${
                          isBooked
                            ? 'bg-blue-500 text-white cursor-not-allowed'
                            : isSelected
                              ? 'bg-primary text-white'
                              : 'bg-gray-50 hover:bg-gray-100'
                        } flex items-center justify-center text-xs font-medium relative`}
                        disabled={isBooked && !showName}
                      >
                        {showName && reservation ? reservation.firstName : ''}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
            {/* Tooltip icon - only in edit mode */}
            {editReservation && (
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-400 text-gray-600 bg-white hover:bg-gray-100 focus:outline-none"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onFocus={() => setShowTooltip(true)}
                  onBlur={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(v => !v)}
                >
                  <span className="font-bold text-base">i</span>
                </button>
                {showTooltip && (
                  <div className="absolute right-0 mt-2 w-64 p-3 bg-gray-800 text-white text-xs rounded shadow-lg z-50">
                    If you'd like to adjust the time of your reservation, delete the reservation completely and then create a new reservation.
                  </div>
                )}
              </div>
            )}
            <h3 className="text-lg font-semibold mb-4">{editReservation ? 'Edit Reservation' : 'Make Reservation'}</h3>
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
              {editReservation && (
                <button
                  onClick={handleDeleteReservation}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete Reservation
                </button>
              )}
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
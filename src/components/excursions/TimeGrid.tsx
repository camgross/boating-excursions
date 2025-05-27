'use client';

import React, { useState, useEffect } from 'react';
import { Watercraft, Reservation } from '@/types/excursions';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface TimeGridProps {
  watercraft: Watercraft;
  date: string;
  onReservationChange: () => void;
  reservations: Reservation[];
}

const TimeGrid: React.FC<TimeGridProps> = ({ watercraft, date, onReservationChange, reservations }) => {
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

  // Helper to normalize time to 'HH:mm'
  const normalizeTime = (t: string) => t.length === 5 ? t : t.slice(0,5);

  const isSlotBooked = (unitIndex: number, seatIndex: number, time: string) => {
    const slotTime = normalizeTime(time);
    const match = reservations.find(reservation => {
      const startTime = normalizeTime(reservation.startTime);
      const endTime = normalizeTime(reservation.endTime);
      return (
        reservation.unitIndex === unitIndex &&
        reservation.seatIndex === seatIndex &&
        reservation.date === date &&
        reservation.watercraftType === watercraft.type &&
        slotTime >= startTime &&
        slotTime < endTime
      );
    });
    if (match) {
      console.log('Slot booked by reservation:', match, { unitIndex, seatIndex, slotTime });
    }
    return !!match;
  };

  const handleMouseDown = (unitIndex: number, seatIndex: number, timeIndex: number) => {
    console.log('Slot clicked:', { unitIndex, seatIndex, timeIndex, time: timeSlots[timeIndex] });
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

  // Helper to check if two time intervals overlap (allow back-to-back)
  const isOverlap = (startA: string, endA: string, startB: string, endB: string) => {
    const sA = normalizeTime(startA);
    const eA = normalizeTime(endA);
    const sB = normalizeTime(startB);
    const eB = normalizeTime(endB);
    return sA < eB && sB < eA;
  };

  const handleSaveReservation = async () => {
    // Helper to check if a reservation is the one being edited
    const isEditingThisReservation = (r: Reservation) =>
      editReservation &&
      r.unitIndex === editReservation.unitIndex &&
      r.seatIndex === editReservation.seatIndex &&
      r.startTime === editReservation.startTime &&
      r.endTime === editReservation.endTime &&
      r.date === editReservation.date &&
      r.watercraftType === editReservation.watercraftType;

    console.log('handleSaveReservation called with:', {
      editReservation,
      selectedUnit,
      selectedSeat,
      selectedStartTime,
      selectedEndTime,
      reservationName,
      date,
      watercraftId: watercraft.id
    });

    // Check if any required fields are missing
    const missingFields = [];
    if (selectedUnit === null) missingFields.push('selectedUnit');
    if (selectedSeat === null) missingFields.push('selectedSeat');
    if (!selectedStartTime) missingFields.push('selectedStartTime');
    if (!selectedEndTime) missingFields.push('selectedEndTime');
    if (!reservationName) missingFields.push('reservationName');
    if (!date) missingFields.push('date');
    if (!watercraft.id) missingFields.push('watercraftId');

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // At this point, we know all required fields are present
    const unitNumber = selectedUnit as number;
    const seatNumber = selectedSeat as number;
    const startTime = selectedStartTime as string;
    let endTime = selectedEndTime as string;

    // If the reservation is a single slot, set endTime to the next slot
    if (startTime === endTime) {
      const idx = timeSlots.indexOf(startTime);
      if (idx === timeSlots.length - 1) {
        // Last slot, use schedule's end time
        const { endTime: scheduleEndTime } = getOperatingHours();
        endTime = scheduleEndTime;
      } else {
        endTime = timeSlots[idx + 1];
      }
    }

    // If the selection covers more than one slot, set endTime to the slot after the last selected slot
    const startIdx = timeSlots.indexOf(startTime);
    const endIdx = timeSlots.indexOf(endTime);
    if (endIdx > startIdx) {
      if (endIdx === timeSlots.length - 1) {
        // Last slot, use schedule's end time
        const { endTime: scheduleEndTime } = getOperatingHours();
        endTime = scheduleEndTime;
      } else {
        endTime = timeSlots[endIdx + 1];
      }
    }

    // If the selected end time is the last slot, set endTime to the schedule's true end time
    if (endTime === timeSlots[timeSlots.length - 1]) {
      const { endTime: scheduleEndTime } = getOperatingHours();
      endTime = scheduleEndTime;
    }

    // Debug logging for overlap check
    reservations.forEach(r => {
      if (
        r.unitIndex === unitNumber &&
        r.seatIndex === seatNumber &&
        r.date === date &&
        r.watercraftType === watercraft.type
      ) {
        console.log('Comparing with existing reservation:', {
          rStart: r.startTime,
          rEnd: r.endTime,
          newStart: startTime,
          newEnd: endTime,
          overlap: isOverlap(r.startTime, r.endTime, startTime, endTime)
        });
      }
    });

    // Check for overlapping reservations for the same seat/unit
    const hasOverlap = reservations.some(r =>
      r.unitIndex === unitNumber &&
      r.seatIndex === seatNumber &&
      r.date === date &&
      r.watercraftType === watercraft.type &&
      isOverlap(r.startTime, r.endTime, startTime, endTime) &&
      !isEditingThisReservation(r)
    );

    if (hasOverlap) {
      console.error('Overlapping reservation found for same seat/unit');
      toast.error('This time slot overlaps with an existing reservation for this seat.');
      return;
    }

    // Check for overlapping reservations for the same user across all boats/seats
    // Use all reservations for the date, not just the current watercraft
    const allReservationsForDate = reservations.filter(r => r.date === date);
    const hasUserOverlap = allReservationsForDate.some(r =>
      r.firstName.toLowerCase() === reservationName.toLowerCase() && // Case-insensitive check
      isOverlap(r.startTime, r.endTime, startTime, endTime) &&
      !isEditingThisReservation(r)
    );

    if (hasUserOverlap) {
      console.error('Overlapping reservation found for same user');
      toast.error('You already have a reservation during this time.');
      return;
    }

    try {
      if (editReservation) {
        console.log('Updating existing reservation:', editReservation.id);
        const { data, error } = await supabase
          .from('reservations')
          .update({
            first_name: reservationName,
            start_time: startTime,
            end_time: endTime,
            unit_number: unitNumber + 1,
            seat_number: seatNumber + 1,
            watercraft_type_id: watercraft.id
          })
          .eq('id', editReservation.id)
          .select();

        if (error) {
          console.error('Error updating reservation:', error);
          throw error;
        }

        console.log('Updated reservation:', data);
        toast.success('Reservation updated successfully.');
      } else {
        console.log('Creating new reservation with data:', {
          first_name: reservationName,
          start_time: startTime,
          end_time: endTime,
          unit_number: unitNumber + 1,
          seat_number: seatNumber + 1,
          watercraft_type_id: watercraft.id,
          date: date,
          user_id: null // Explicitly set user_id to null for new reservations
        });

        const { data, error } = await supabase
          .from('reservations')
          .insert({
            first_name: reservationName,
            start_time: startTime,
            end_time: endTime,
            unit_number: unitNumber + 1,
            seat_number: seatNumber + 1,
            watercraft_type_id: watercraft.id,
            date: date,
            user_id: null // Explicitly set user_id to null for new reservations
          })
          .select();

        if (error) {
          console.error('Error creating reservation:', error);
          throw error;
        }

        console.log('Created reservation:', data);
        toast.success('Reservation created successfully.');
      }

      onReservationChange();
      clearSelection();
    } catch (error) {
      console.error('Error saving reservation:', error);
      toast.error('Failed to save reservation. Please try again.');
    }
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

  const handleDeleteReservation = async () => {
    if (!editReservation) return;
    
    try {
      console.log('Attempting to delete reservation:', editReservation);
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', editReservation.id);

      if (error) {
        console.error('Error deleting reservation:', error);
        throw error;
      }

      console.log('Successfully deleted reservation with id:', editReservation.id);
      onReservationChange();
      toast.success('Reservation deleted.');
      clearSelection();
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Failed to delete reservation. Please try again.');
    }
  };

  const getReservationSequence = (unitIndex: number, seatIndex: number, time: string) => {
    // Get all reservations for this seat in chronological order
    const seatReservations = reservations
      .filter(r =>
        r.unitIndex === unitIndex &&
        r.seatIndex === seatIndex &&
        r.date === date &&
        r.watercraftType === watercraft.type
      )
      .sort((a, b) => normalizeTime(a.startTime).localeCompare(normalizeTime(b.startTime)));

    // Find which reservation number this time slot belongs to
    let sequence = 0;
    for (const r of seatReservations) {
      if (normalizeTime(time) >= normalizeTime(r.startTime) && normalizeTime(time) < normalizeTime(r.endTime)) {
        return sequence;
      }
      sequence++;
    }
    return -1; // Not part of any reservation
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
                    const sequence = getReservationSequence(unitIndex, seatIndex, time);
                    // Find reservation for this block
                    const reservation = reservations.find(r =>
                      r.unitIndex === unitIndex &&
                      r.seatIndex === seatIndex &&
                      r.date === date &&
                      r.watercraftType === watercraft.type &&
                      normalizeTime(time) >= normalizeTime(r.startTime) && normalizeTime(time) < normalizeTime(r.endTime)
                    );
                    // Show name only in the top (earliest) block of the reservation
                    let showName = false;
                    if (reservation && normalizeTime(reservation.startTime) === normalizeTime(time)) {
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
                            ? sequence >= 0  // Only check sequence if it's a booked slot
                              ? sequence % 2 === 0
                                ? 'bg-blue-500 text-white cursor-pointer'
                                : 'bg-indigo-500 text-white cursor-pointer'
                              : 'bg-blue-500 text-white cursor-pointer'  // Fallback for any edge cases
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
            <h2 className="text-xl font-bold mb-4">
              {editReservation ? 'Edit Reservation' : 'New Reservation'}
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              console.log('Form submitted');
              await handleSaveReservation();
            }}>
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
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCancelReservation}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                {editReservation && (
                  <button
                    type="button"
                    onClick={handleDeleteReservation}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Delete Reservation
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  Save Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeGrid;
'use client';

import React, { useState, useEffect } from 'react';
import { Watercraft, Reservation } from '@/types/excursions';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import TimeGridOnboardingOverlay from './TimeGridOnboardingOverlay';

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
    console.log('[isSlotBooked] Checking slot:', {
      unitIndex,
      seatIndex,
      slotTime,
      date,
      watercraftType: watercraft.type,
      reservations: reservations.map(r => ({
        unitIndex: r.unitIndex,
        seatIndex: r.seatIndex,
        date: r.date,
        watercraftType: r.watercraftType,
        startTime: r.startTime,
        endTime: r.endTime
      }))
    });
    const match = reservations.find(reservation => {
      const startTime = normalizeTime(reservation.startTime);
      const endTime = normalizeTime(reservation.endTime);
      const isMatch = (
        reservation.unitIndex === unitIndex &&
        reservation.seatIndex === seatIndex &&
        reservation.date === date &&
        reservation.watercraftType === watercraft.type &&
        slotTime >= startTime &&
        slotTime < endTime
      );
      if (isMatch) {
        console.log('[isSlotBooked] Found matching reservation:', {
          reservation,
          slotTime,
          startTime,
          endTime
        });
      }
      return isMatch;
    });
    if (match) {
      console.log('[isSlotBooked] Slot is booked by reservation:', match);
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
    setEditReservation(null);
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

    // If the reservation is a single slot, set endTime to 15 minutes after startTime
    if (startTime === endTime) {
      const idx = timeSlots.indexOf(startTime);
      if (idx !== -1) {
        const [endHour, endMinute] = timeSlots[idx].split(':').map(Number);
        let endDate = new Date(0, 0, 0, endHour, endMinute);
        endDate.setMinutes(endDate.getMinutes() + 15);
        const pad = (n: number) => n.toString().padStart(2, '0');
        endTime = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
      }
    } else {
      // If the selection covers more than one slot, set endTime to the end of the last selected slot
      const endIdx = timeSlots.indexOf(endTime);
      if (endIdx !== -1) {
        const [endHour, endMinute] = timeSlots[endIdx].split(':').map(Number);
        let endDate = new Date(0, 0, 0, endHour, endMinute);
        endDate.setMinutes(endDate.getMinutes() + 15);
        const pad = (n: number) => n.toString().padStart(2, '0');
        endTime = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
      }
    }

    // Debug logging for overlap check
    reservations.forEach(r => {
      if (
        r.unitIndex === unitNumber &&
        r.seatIndex === seatNumber &&
        r.date === date &&
        r.watercraftType === watercraft.type
      ) {
        const sA = normalizeTime(r.startTime);
        const eA = normalizeTime(r.endTime);
        const sB = normalizeTime(startTime);
        const eB = normalizeTime(endTime);
        const overlap = isOverlap(r.startTime, r.endTime, startTime, endTime);
        console.log('[OVERLAP DEBUG]', {
          existing: { sA, eA },
          newRes: { sB, eB },
          overlap,
          r,
          new: { unitNumber, seatNumber, date, watercraftType: watercraft.type, startTime, endTime }
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

    // Debug logging for all user reservations and the new reservation
    const userReservations = allReservationsForDate.filter(r => r.firstName.toLowerCase() === reservationName.toLowerCase());
    console.log('[USER OVERLAP DEBUG] Checking for overlaps for:', reservationName);
    console.log('[USER OVERLAP DEBUG] New reservation:', { startTime, endTime });
    userReservations.forEach(r => {
      console.log('[USER OVERLAP DEBUG] Existing reservation:', {
        startTime: r.startTime,
        endTime: r.endTime,
        watercraftType: r.watercraftType,
        unitIndex: r.unitIndex,
        seatIndex: r.seatIndex
      });
    });

    const hasUserOverlap = allReservationsForDate.some(r =>
      r.firstName.toLowerCase() === reservationName.toLowerCase() && // Case-insensitive check
      isOverlap(r.startTime, r.endTime, startTime, endTime) &&
      !isEditingThisReservation(r)
    );

    if (hasUserOverlap) {
      // Find the first overlapping reservation for details
      const duplicate = allReservationsForDate.find(r =>
        r.firstName.toLowerCase() === reservationName.toLowerCase() &&
        isOverlap(r.startTime, r.endTime, startTime, endTime) &&
        !isEditingThisReservation(r)
      );
      let dayName = '';
      try {
        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      } catch {}
      const watercraftName = duplicate?.watercraftType || '';
      const seatNum = duplicate ? (duplicate.seatIndex + 1) : '';
      toast.error(
        `Duplicate reservation detected!\nDay: ${dayName}\nWatercraft: ${watercraftName}\nSeat: ${seatNum}`,
        { duration: 7000 }
      );
      // Optionally allow Esc to close all toasts
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') toast.dismiss();
      };
      window.addEventListener('keydown', handleEsc);
      setTimeout(() => {
        window.removeEventListener('keydown', handleEsc);
      }, 7000);
      return;
    }

    try {
      // Fetch the authenticated user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to make a reservation.');
        return;
      }
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
          user_id: user.id // Set user_id to the authenticated user's ID
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
            user_id: user.id // Set user_id to the authenticated user's ID
          })
          .select();

        if (error) {
          console.error('Error creating reservation:', error);
          throw error;
        }

        console.log('Created reservation response:', { data, error });
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
    setSelectedEndTime(reservation.endTime);
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
    // Permission logic
    let canDelete = false;
    if (isAdmin) {
      canDelete = true;
    } else if (currentUser) {
      // User created the reservation
      if (editReservation.userId && editReservation.userId === currentUser.id) {
        canDelete = true;
      } else {
        // User is the boater (first name and last initial match)
        const userFirst = (currentUser.user_metadata?.first_name || '').toLowerCase();
        const userLast = (currentUser.user_metadata?.last_name || '').toLowerCase();
        const resFirst = (editReservation.firstName || '').toLowerCase();
        // Try to extract last initial from reservation firstName (e.g., 'JohnD' -> 'd')
        let resLastInitial = '';
        if (editReservation.firstName && editReservation.firstName.length > 0) {
          const match = editReservation.firstName.match(/^([a-zA-Z]+)([a-zA-Z])$/);
          if (match) {
            resLastInitial = match[2].toLowerCase();
          }
        }
        if (
          userFirst && resFirst && userFirst === resFirst.replace(/[^a-z]/g, '') &&
          userLast && resLastInitial && userLast[0] === resLastInitial
        ) {
          canDelete = true;
        }
      }
    }
    if (!canDelete) {
      toast.error('You do not have permission to delete this reservation.');
      return;
    }
    try {
      console.log('Attempting to delete reservation:', editReservation);
      const { data, error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', editReservation.id)
        .select();
      if (error) {
        console.error('Error deleting reservation:', error);
        throw error;
      }
      if (Array.isArray(data) && data.length > 0) {
        console.log('Successfully deleted reservation with id:', editReservation.id);
        onReservationChange();
        toast.success('Reservation deleted.');
        clearSelection();
      } else {
        toast.error('You do not have permission to delete this reservation or it does not exist.');
      }
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

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('hasSeenTimeGridOnboarding') !== 'true') {
      setShowOnboarding(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenTimeGridOnboarding', 'true');
    }
  };

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from('users').select('first_name, last_name');
      if (error) {
        console.error('Error fetching users:', error);
        setUserOptions([]);
      } else {
        const options = (data || []).map((u: any) => ({
          value: `${u.first_name}${u.last_name ? u.last_name[0] : ''}`,
          label: `${u.first_name}${u.last_name ? u.last_name[0] : ''}`,
        }));
        setUserOptions(options);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      // Example: check for admin role in user metadata or email
      // Adjust this logic to match your actual admin detection
      if (user && (user.role === 'admin' || (user.email && user.email.endsWith('@admin.com')))) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
    fetchCurrentUser();
  }, []);

  return (
    <div className="space-y-4">
      {showOnboarding && <TimeGridOnboardingOverlay onClose={handleCloseOnboarding} />}
      {/* Mobile layout: sticky time column + horizontally scrollable seat columns */}
      <div className="block sm:hidden">
        {Array.from({ length: watercraft.quantity || 1 }).map((_, unitIndex) => (
          <div key={unitIndex} className="mb-6">
            <h5 className="text-base font-semibold mb-2">
              {watercraft.type} {watercraft.quantity ? `#${unitIndex + 1}` : ''}
            </h5>
            <div className="flex w-full">
              {/* Sticky time labels */}
              <div className="flex flex-col sticky left-0 z-10 bg-white border-r" style={{ minWidth: 60 }}>
                <div className="h-8"></div>
                {timeSlots.map((time) => (
                  <div key={`mobile-time-${time}`} className="h-8 flex items-center justify-center text-xs font-medium border-b">
                    {time}
                  </div>
                ))}
              </div>
              {/* Horizontally scrollable seat columns */}
              <div className="overflow-x-auto w-full">
                <div className="flex min-w-[120px]" style={{ width: Math.max(2, Math.min(2, watercraft.capacity)) * 90 }}>
                  {Array.from({ length: watercraft.capacity }).map((_, seatIndex) => (
                    <div key={`mobile-seatcol-${seatIndex}`} className="flex flex-col min-w-[90px] max-w-[90px]">
                      <div className="h-8 text-xs font-medium flex items-center justify-center border-b">
                        Seat {seatIndex + 1}
                      </div>
                      {timeSlots.map((time, timeIndex) => {
                        const isBooked = isSlotBooked(unitIndex, seatIndex, time);
                        const isSelected = selectedSlots[`${unitIndex}-${seatIndex}-${time}`];
                        const sequence = getReservationSequence(unitIndex, seatIndex, time);
                        const reservation = reservations.find(r =>
                          r.unitIndex === unitIndex &&
                          r.seatIndex === seatIndex &&
                          r.date === date &&
                          r.watercraftType === watercraft.type &&
                          normalizeTime(time) >= normalizeTime(r.startTime) && normalizeTime(time) < normalizeTime(r.endTime)
                        );
                        let showName = false;
                        if (reservation && normalizeTime(reservation.startTime) === normalizeTime(time)) {
                          showName = true;
                        }
                        return (
                          <button
                            key={`mobile-${unitIndex}-${seatIndex}-${time}`}
                            onMouseDown={() => handleMouseDown(unitIndex, seatIndex, timeIndex)}
                            onMouseEnter={() => handleMouseEnter(unitIndex, seatIndex, timeIndex)}
                            onMouseUp={handleMouseUp}
                            onTouchStart={() => handleMouseDown(unitIndex, seatIndex, timeIndex)}
                            onTouchMove={(e) => {
                              e.preventDefault();
                              const touch = e.touches[0];
                              const element = document.elementFromPoint(touch.clientX, touch.clientY);
                              if (element) {
                                const [unit, seat, time] = element.getAttribute('data-slot')?.split('-') || [];
                                if (unit && seat && time) {
                                  handleMouseEnter(parseInt(unit), parseInt(seat), timeSlots.indexOf(time));
                                }
                              }
                            }}
                            onTouchEnd={handleMouseUp}
                            onClick={showName && reservation ? (e) => { e.preventDefault(); openEditModal(reservation); } : undefined}
                            data-slot={`${unitIndex}-${seatIndex}-${time}`}
                            className={`h-8 border rounded transition-colors ${
                              isBooked
                                ? sequence >= 0
                                  ? sequence % 2 === 0
                                    ? 'bg-blue-500 text-white cursor-pointer'
                                    : 'bg-indigo-500 text-white cursor-pointer'
                                  : 'bg-blue-500 text-white cursor-pointer'
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
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Desktop/laptop layout: original grid */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-max px-4 sm:px-0">
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
                      const reservation = reservations.find(r =>
                        r.unitIndex === unitIndex &&
                        r.seatIndex === seatIndex &&
                        r.date === date &&
                        r.watercraftType === watercraft.type &&
                        normalizeTime(time) >= normalizeTime(r.startTime) && normalizeTime(time) < normalizeTime(r.endTime)
                      );
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
                          onTouchStart={() => handleMouseDown(unitIndex, seatIndex, timeIndex)}
                          onTouchMove={(e) => {
                            e.preventDefault();
                            const touch = e.touches[0];
                            const element = document.elementFromPoint(touch.clientX, touch.clientY);
                            if (element) {
                              const [unit, seat, time] = element.getAttribute('data-slot')?.split('-') || [];
                              if (unit && seat && time) {
                                handleMouseEnter(parseInt(unit), parseInt(seat), timeSlots.indexOf(time));
                              }
                            }
                          }}
                          onTouchEnd={handleMouseUp}
                          onClick={showName && reservation ? (e) => { e.preventDefault(); openEditModal(reservation); } : undefined}
                          data-slot={`${unitIndex}-${seatIndex}-${time}`}
                          className={`h-8 sm:h-10 border rounded transition-colors ${
                            isBooked
                              ? sequence >= 0  // Only check sequence if it's a booked slot
                                ? sequence % 2 === 0
                                  ? 'bg-blue-500 text-white cursor-pointer'
                                  : 'bg-indigo-500 text-white cursor-pointer'
                                : 'bg-blue-500 text-white cursor-pointer'  // Fallback for any edge cases
                              : isSelected
                                ? 'bg-primary text-white'
                                : 'bg-gray-50 hover:bg-gray-100'
                          } flex items-center justify-center text-xs sm:text-sm font-medium relative`}
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
      </div>
      {/* Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md relative">
            {/* Close button */}
            <button
              onClick={handleCancelReservation}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600"
            >
              ×
            </button>
            {/* Tooltip icon - only in edit mode */}
            {editReservation && (
              <div className="absolute top-4 right-12">
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-400 text-gray-600 bg-white hover:bg-gray-100 focus:outline-none"
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
            <h2 className="text-lg sm:text-xl font-bold mb-4 pr-8">
              {editReservation ? 'Edit Reservation' : 'New Reservation'}
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              console.log('Form submitted');
              await handleSaveReservation();
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <select
                  value={reservationName}
                  onChange={e => setReservationName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-base"
                  required
                >
                  <option value="" disabled>Select a boater</option>
                  {userOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={handleCancelReservation}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                {editReservation && (
                  <button
                    type="button"
                    onClick={handleDeleteReservation}
                    className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Delete Reservation
                  </button>
                )}
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
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
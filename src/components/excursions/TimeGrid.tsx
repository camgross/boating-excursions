'use client';

import React, { useState, useRef } from 'react';
import { Watercraft, TimeSlot } from '@/types/excursions';

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
  const gridRef = useRef<HTMLDivElement>(null);

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

  const handleMouseDown = (slotTime: string, unitIndex: number) => {
    setIsDragging(true);
    setStartSlot(`${unitIndex}-${slotTime}`);
    setTempSlots({ [`${unitIndex}-${slotTime}`]: true });
  };

  const handleMouseEnter = (slotTime: string, unitIndex: number) => {
    if (isDragging && startSlot) {
      const [startUnitIndex, startTime] = startSlot.split('-');
      const currentSlot = `${unitIndex}-${slotTime}`;
      
      if (startUnitIndex === unitIndex.toString()) {
        const newTempSlots = { ...tempSlots };
        const timeSlots = generateTimeSlots();
        const startIndex = timeSlots.indexOf(startTime);
        const endIndex = timeSlots.indexOf(slotTime);
        
        const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
        
        for (let i = min; i <= max; i++) {
          newTempSlots[`${unitIndex}-${timeSlots[i]}`] = true;
        }
        
        setTempSlots(newTempSlots);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setStartSlot(null);
  };

  const handleConfirm = () => {
    setSelectedSlots(tempSlots);
    setTempSlots({});
  };

  const handleCancel = () => {
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
          {watercraft.timeSlots.map((unit, unitIndex) => (
            <div key={unitIndex} className="mb-6">
              <h5 className="text-lg font-semibold mb-2">
                {watercraft.details.type} 
                {watercraft.details.quantity ? ` #${unitIndex + 1}` : ''}
              </h5>
              <div className="grid grid-cols-16 gap-1">
                {timeSlots.map((time) => (
                  <button
                    key={`${unitIndex}-${time}`}
                    onMouseDown={() => handleMouseDown(time, unitIndex)}
                    onMouseEnter={() => handleMouseEnter(time, unitIndex)}
                    className={`p-2 text-sm border rounded transition-colors ${
                      tempSlots[`${unitIndex}-${time}`] || selectedSlots[`${unitIndex}-${time}`]
                        ? 'bg-primary text-white'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end gap-4 mt-4">
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
};

export default TimeGrid; 
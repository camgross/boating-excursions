'use client';

import React, { useState } from 'react';
import TimeGrid from './TimeGrid';
import { Watercraft, Reservation } from '@/types/excursions';
import { getFormattedDate } from './AvailableExcursions';

interface DayScheduleProps {
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  watercraft: { [key: string]: { details: Watercraft; timeSlots: any[][] } };
  reservations: Reservation[];
}

const DaySchedule: React.FC<DayScheduleProps> = ({ date, dayOfWeek, startTime, endTime, watercraft, reservations }) => {
  const handleReservationChange = () => {
    // No-op or refetch logic can be added here if needed
  };

  const watercraftType = Object.keys(watercraft)[0];
  const watercraftDetails = watercraft[watercraftType];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">
        {dayOfWeek}, {getFormattedDate(date)}
      </h3>
      <div className="space-y-8">
        <div>
          <h4 className="text-lg font-medium mb-4">{watercraftDetails.details.type}</h4>
          <TimeGrid
            watercraft={watercraftDetails.details}
            date={date}
            onReservationChange={handleReservationChange}
            reservations={reservations}
          />
        </div>
      </div>
    </div>
  );
};

export default DaySchedule; 
'use client';

import React, { useState } from 'react';
import TimeGrid from './TimeGrid';
import { Watercraft, Reservation } from '@/types/excursions';

interface DayScheduleProps {
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  watercraft: { [key: string]: { details: Watercraft; timeSlots: any[][] } };
}

const DaySchedule: React.FC<DayScheduleProps> = ({ date, dayOfWeek, startTime, endTime, watercraft }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const handleReservationChange = () => {
    const savedReservations = localStorage.getItem('reservations');
    if (savedReservations) {
      setReservations(JSON.parse(savedReservations));
    }
  };

  const watercraftType = Object.keys(watercraft)[0];
  const watercraftDetails = watercraft[watercraftType];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">
        {dayOfWeek}, {new Date(date).toLocaleDateString()}
      </h3>
      <div className="space-y-8">
        <div>
          <h4 className="text-lg font-medium mb-4">{watercraftType}</h4>
          <TimeGrid
            watercraft={watercraftDetails.details}
            date={date}
            onReservationChange={handleReservationChange}
          />
        </div>
      </div>
    </div>
  );
};

export default DaySchedule; 
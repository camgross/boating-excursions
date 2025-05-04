'use client';

import React, { useState } from 'react';
import { DailySchedule, Watercraft } from '@/types/excursions';
import TimeGrid from './TimeGrid';

interface DayScheduleProps {
  schedule: DailySchedule;
  isSelected: boolean;
  onSelect: () => void;
}

const DaySchedule: React.FC<DayScheduleProps> = ({ schedule, isSelected, onSelect }) => {
  const [selectedWatercraft, setSelectedWatercraft] = useState<string | null>(null);

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold">
          {schedule.dayOfWeek} - {new Date(schedule.date).toLocaleDateString()}
        </h3>
        <button
          onClick={onSelect}
          className={`px-6 py-2 rounded-lg transition-colors ${
            isSelected ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {isSelected ? 'Selected' : 'Select Day'}
        </button>
      </div>

      {isSelected && (
        <div className="space-y-6">
          <div className="flex gap-4 flex-wrap">
            {Object.entries(schedule.watercraft).map(([key, craft]) => (
              <button
                key={key}
                onClick={() => setSelectedWatercraft(key)}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  selectedWatercraft === key 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="font-semibold">{craft.details.type}</div>
                <div className="text-sm">
                  Capacity: {craft.details.capacity} persons
                  {craft.details.quantity && ` (${craft.details.quantity} available)`}
                </div>
              </button>
            ))}
          </div>

          {selectedWatercraft && (
            <div className="mt-6">
              <h4 className="text-xl font-semibold mb-4">
                {schedule.watercraft[selectedWatercraft].details.type} Schedule
              </h4>
              <TimeGrid
                watercraft={schedule.watercraft[selectedWatercraft]}
                startTime={schedule.startTime}
                endTime={schedule.endTime}
                date={schedule.date}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DaySchedule; 
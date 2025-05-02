interface ExcursionCardProps {
  title: string;
  description: string;
  duration: number;
  maxParticipants: number;
  availableSpots: number;
}

export default function ExcursionCard({
  title,
  description,
  duration,
  maxParticipants,
  availableSpots,
}: ExcursionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Duration:</span> {duration} hours
        </div>
        <div>
          <span className="font-medium">Max Participants:</span> {maxParticipants}
        </div>
        <div>
          <span className="font-medium">Available Spots:</span> {availableSpots}
        </div>
      </div>
      <button className="mt-4 w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90">
        Book Now
      </button>
    </div>
  )
} 
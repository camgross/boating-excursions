import ExcursionCard from '@/components/excursions/ExcursionCard'

const excursions = [
  {
    id: 1,
    title: 'Morning Island Hopping',
    description: 'Explore beautiful islands and hidden coves in the morning light',
    duration: 5,
    maxParticipants: 8,
    availableSpots: 6,
  },
  {
    id: 2,
    title: 'Sunset Cruise',
    description: 'Enjoy a relaxing evening cruise with stunning sunset views',
    duration: 4,
    maxParticipants: 6,
    availableSpots: 4,
  },
]

export default function ExcursionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Available Excursions</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {excursions.map((excursion) => (
          <ExcursionCard
            key={excursion.id}
            title={excursion.title}
            description={excursion.description}
            duration={excursion.duration}
            maxParticipants={excursion.maxParticipants}
            availableSpots={excursion.availableSpots}
          />
        ))}
      </div>
    </div>
  )
} 
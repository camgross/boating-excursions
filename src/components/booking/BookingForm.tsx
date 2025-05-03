interface BookingFormProps {
  excursionId: number;
  excursionTitle: string;
}

export default function BookingForm({ excursionId, excursionTitle }: BookingFormProps) {
  return (
    <form className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Book {excursionTitle}</h2>
      
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-1">
          Number of Participants
        </label>
        <input
          type="number"
          id="participants"
          name="participants"
          min="1"
          max="8"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Preferred Date
        </label>
        <input
          type="date"
          id="date"
          name="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90"
      >
        Submit Booking
      </button>
    </form>
  )
} 
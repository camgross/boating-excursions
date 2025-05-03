export default function CustomSuggestion() {
  return (
    <form className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Suggest a Custom Excursion</h2>
      
      <div className="mb-4">
        <label htmlFor="suggestion-title" className="block text-sm font-medium text-gray-700 mb-1">
          Excursion Title
        </label>
        <input
          type="text"
          id="suggestion-title"
          name="suggestion-title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="suggestion-details" className="block text-sm font-medium text-gray-700 mb-1">
          Excursion Details
        </label>
        <textarea
          id="suggestion-details"
          name="suggestion-details"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="suggestion-duration" className="block text-sm font-medium text-gray-700 mb-1">
          Preferred Duration (hours)
        </label>
        <input
          type="number"
          id="suggestion-duration"
          name="suggestion-duration"
          min="1"
          max="8"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="suggestion-participants" className="block text-sm font-medium text-gray-700 mb-1">
          Number of Participants
        </label>
        <input
          type="number"
          id="suggestion-participants"
          name="suggestion-participants"
          min="1"
          max="12"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90"
      >
        Submit Suggestion
      </button>
    </form>
  )
} 
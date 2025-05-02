export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Welcome to Boating Excursions
      </h1>
      <p className="text-xl text-center mb-8">
        Book your perfect boating adventure for an unforgettable vacation experience
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Available Excursions</h2>
          <p className="text-gray-600">
            Choose from our carefully curated selection of boating adventures
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Custom Suggestions</h2>
          <p className="text-gray-600">
            Have a specific adventure in mind? Let us know!
          </p>
        </div>
      </div>
    </div>
  )
} 
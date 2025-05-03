import BookingForm from '@/components/booking/BookingForm'

export default function BookingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Book Your Excursion</h1>
      <div className="max-w-2xl mx-auto">
        <BookingForm
          excursionId={1}
          excursionTitle="Morning Island Hopping"
        />
      </div>
    </div>
  )
} 
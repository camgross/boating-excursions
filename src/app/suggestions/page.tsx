import CustomSuggestion from '@/components/booking/CustomSuggestion'

export default function SuggestionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Suggest a Custom Excursion</h1>
      <div className="max-w-2xl mx-auto">
        <CustomSuggestion />
      </div>
    </div>
  )
} 
import OrderForm from '@/components/OrderForm';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Accugen Dental Lab</h1>
          <p className="text-gray-500 mt-1 text-sm">Submit a new lab order</p>
        </div>

        <OrderForm />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-center mb-6">
          Papyr
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Offline-first handwritten digital ledger
        </p>
        <div className="w-96 h-64 border-2 border-dashed border-gray-300 rounded-lg">
          {/* Canvas will go here */}
          Canvas Placeholder
        </div>
      </div>
    </main>
  );
}
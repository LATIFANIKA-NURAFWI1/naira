export default function FeaturesPage() {
  return (
    <div className="fade-in">
      <h1 className="text-3xl font-bold text-primary-dark">Fitur Utama NafasBaru</h1>
      <p className="mt-2 text-gray-600">Tiga pilar: Challenge, Finansial, Kesehatan.</p>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <div className="card p-6">
          <div className="text-energy font-semibold">Challenge Tracker</div>
          <ul className="mt-3 text-sm list-disc ml-5 space-y-2 text-gray-700">
            <li>Durasi: 1, 3, 5, 7, 14, 30 hari.</li>
            <li>Progress bar dan milestone harian.</li>
            <li>Reward virtual (badge/medal).</li>
          </ul>
        </div>
        <div className="card p-6">
          <div className="text-energy font-semibold">Money Tracking</div>
          <ul className="mt-3 text-sm list-disc ml-5 space-y-2 text-gray-700">
            <li>Hitung otomatis uang yang dihemat.</li>
            <li>Visualisasi counter/grafik sederhana.</li>
            <li>Tersimpan per user di database.</li>
          </ul>
        </div>
        <div className="card p-6">
          <div className="text-energy font-semibold">Health Tracking</div>
          <ul className="mt-3 text-sm list-disc ml-5 space-y-2 text-gray-700">
            <li>Timeline pemulihan kesehatan.</li>
            <li>Tips gaya hidup sehat.</li>
            <li>Milestone disimpan per user.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

"use client";
import NoSmokeQuestEmbed from '../../components/NoSmokeQuestEmbed';

export default function ChallengePage() {
  return (
    <div className="fade-in">
      <h1 className="text-3xl font-bold text-primary-dark">No Smoke Quest</h1>
      <p className="text-gray-600 mt-1">Tantangan 30 hari bebas asap. Pantau progres, kumpulkan poin, dan raih badge.</p>
      <div className="card p-0 mt-6 overflow-hidden">
        <NoSmokeQuestEmbed />
      </div>
    </div>
  );
}

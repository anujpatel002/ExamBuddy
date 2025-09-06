import { FiAward } from 'react-icons/fi';

interface Score {
  name: string;
  score: number;
}

interface ScoreboardProps {
  scores: Score[];
}

const Scoreboard = ({ scores }: ScoreboardProps) => {
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Final Scores</h2>
      <ul className="space-y-3">
        {sortedScores.map((player, index) => (
          <li
            key={player.name}
            className={`flex items-center justify-between p-3 rounded-lg ${
              index === 0 ? 'bg-yellow-100' : 'bg-gray-100'
            }`}
          >
            <div className="flex items-center">
              <span className="font-bold text-lg w-8">{index + 1}.</span>
              <span className="text-gray-800">{player.name}</span>
              {index === 0 && <FiAward className="ml-2 text-yellow-500" />}
            </div>
            <span className="font-bold text-indigo-600">{player.score} Points</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Scoreboard;
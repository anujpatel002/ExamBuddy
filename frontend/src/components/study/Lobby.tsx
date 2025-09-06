import { FiUser } from 'react-icons/fi';
import Button from '../ui/Button';

interface Member { name: string; }

interface LobbyProps {
  members: Member[];
  isHost: boolean;
  onStartQuiz: () => void;
}

const Lobby = ({ members, isHost, onStartQuiz }: LobbyProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Waiting Lobby</h2>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Participants ({members.length}):</h3>
        <ul className="space-y-2">
          {members.map((member, index) => (
            <li key={index} className="flex items-center bg-gray-100 p-2 rounded">
              <FiUser className="mr-2 text-gray-600" />
              <span>{member.name}</span>
            </li>
          ))}
        </ul>
      </div>
      {isHost ? (
        <Button onClick={onStartQuiz}>Start Quiz for Everyone</Button>
      ) : (
        <p className="text-gray-600">Waiting for the host to start the quiz...</p>
      )}
    </div>
  );
};

export default Lobby;
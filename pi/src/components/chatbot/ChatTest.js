import React, { useState } from 'react';
import ChatRoom from './ChatRoom';
import './ChatTest.css';

const ChatTest = () => {
  const [roomId, setRoomId] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      setIsJoined(true);
    }
  };

  if (isJoined) {
    return <ChatRoom roomId={roomId} />;
  }

  return (
    <div className="chat-test">
      <div className="join-form">
        <h2>Rejoindre un Chat Room</h2>
        <form onSubmit={handleJoinRoom}>
          <div className="form-group">
            <label htmlFor="roomId">ID de la Room:</label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Entrez l'ID de la room"
              required
            />
          </div>
          <button type="submit">Rejoindre</button>
        </form>
      </div>
    </div>
  );
};

export default ChatTest; 
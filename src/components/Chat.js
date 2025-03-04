import { useState, useRef, useEffect } from 'react';
import './Chat.css';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [nickname, setNickname] = useState('');
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [messageError, setMessageError] = useState('');
  const messagesEndRef = useRef(null);

  // Simple list of inappropriate words to check against (English and Russian)
  const inappropriateWords = [
    // English words
    'fuck', 'shit', 'ass', 'bitch', 'dick', 'pussy', 'cunt', 
    'asshole', 'bastard', 'whore', 'slut',
    
    // Russian obscene words
    'хуй', 'пизда', 'ебать', 'блядь', 'хуесос', 'пидор', 'пидорас',
    'залупа', 'мудак', 'говно', 'жопа', 'сука', 'ебал', 'ебаный',
    'хер', 'хрен', 'дрочить', 'пиздец', 'ебанутый', 'ебля', 'хуйня',
    'пиздюк', 'долбоёб', 'гандон', 'манда', 'елда', 'шлюха'
  ];

  // Improved function to check if text contains inappropriate words
  const containsInappropriateWords = (text) => {
    const lowerText = text.toLowerCase();
    
    // Check for exact matches and variations
    return inappropriateWords.some(word => {
      // Direct inclusion check
      if (lowerText.includes(word)) return true;
      
      // Check for variations with special characters or numbers
      const cleanText = lowerText.replace(/[^a-zA-Zа-яА-Я]/g, '');
      if (cleanText.includes(word)) return true;
      
      // Check for letter substitutions (e.g., '0' for 'o', '4' for 'a')
      const normalizedText = lowerText
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/7/g, 't');
      
      return normalizedText.includes(word);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessageError('');
    
    if (!nickname) {
      setShowNicknameModal(true);
      return;
    }
    
    if (inputMessage.trim()) {
      // Check for inappropriate content
      if (containsInappropriateWords(inputMessage)) {
        setMessageError('Your message contains inappropriate language.');
        return;
      }
      
      setMessages([...messages, {
        id: Date.now(),
        text: inputMessage,
        user: nickname,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setInputMessage('');
    }
  };

  const handleNicknameSubmit = (e) => {
    e.preventDefault();
    setNicknameError('');
    
    const trimmedNickname = nickname.trim();
    
    // Check if nickname is empty
    if (!trimmedNickname) {
      setNicknameError('please enter a nickname.');
      return;
    }
    
    // Check if nickname is too short
    if (trimmedNickname.length < 3) {
      setNicknameError('nickname must be at least 3 characters.');
      return;
    }
    
    // Check for inappropriate nickname
    if (containsInappropriateWords(trimmedNickname)) {
      setNicknameError('please choose an appropriate nickname.');
      return;
    }
    
    // Check if nickname is already in use
    const isNicknameInUse = messages.some(message => 
      message.user.toLowerCase() === trimmedNickname.toLowerCase()
    );
    
    if (isNicknameInUse) {
      setNicknameError('this nickname is already in use.');
      return;
    }
    
    // If all checks pass, set the nickname and close the modal
    setNickname(trimmedNickname);
    setShowNicknameModal(false);
  };

  const handleInputFocus = () => {
    if (!nickname) {
      setShowNicknameModal(true);
    }
  };

  return (
    <>
      {showNicknameModal && (
        <div className="nickname-modal">
          <div className="nickname-content">
            <div className="nickname-header">
              <h2>choose your nickname</h2>
              <button 
                className="close-button" 
                onClick={() => setShowNicknameModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleNicknameSubmit}>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="enter your nickname..."
                className="nickname-input"
                autoFocus
              />
              {nicknameError && <p className="error-message">{nicknameError}</p>}
              <button type="submit" className="nickname-button">
                join chat
              </button>
            </form>
          </div>
        </div>
      )}
      
      <button 
        className={`chat-toggle ${!isVisible ? 'chat-hidden' : ''}`}
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? '→' : '←'}
      </button>
      
      <div className={`chat-container ${!isVisible ? 'hidden' : ''}`}>
        <div className="chat-header">
          <h2>live chat</h2>
          {nickname && <span className="user-nickname">{nickname}</span>}
        </div>
        
        <div className="messages-container">
          {messages.map(message => (
            <div key={message.id} className="message">
              <div className="message-header">
                <span className="username">{message.user}</span>
                <span className="timestamp">{message.timestamp}</span>
              </div>
              <div className="message-content">
                {message.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onFocus={handleInputFocus}
            placeholder="type a message..."
            className="chat-input"
          />
          {messageError && <p className="error-message message-error">{messageError}</p>}
          <button type="submit" className="chat-send-button">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="white" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}

export default Chat; 
import { useState, useRef, useEffect } from 'react';
import './App.css';
import logo from './assets/logo.png';
import Chat from './components/Chat';
import Tetris from './components/Tetris';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [currentSong, setCurrentSong] = useState({
    title: "Unknown Title",
    artist: "Unknown Artist"
  });
  const [showSongInfo, setShowSongInfo] = useState(false);
  const [showTetris, setShowTetris] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const logoClickTimerRef = useRef(null);
  const audioRef = useRef(null);
  const preloadAudioRef = useRef(null);
  const streamUrl = "https://stream.zeno.fm/lfjlhbowo4qvv";

  const [upNext, setUpNext] = useState({
    title: "Unknown Title",
    artist: "Unknown Artist"
  });

  // Add some sample upcoming shows
  const [upcomingShows, setUpcomingShows] = useState([
    { time: "12:00", title: "Morning Jazz", artist: "DJ Smooth" },
    { time: "14:00", title: "Afternoon Classics", artist: "Maria Stevens" },
    { time: "16:00", title: "Rock Hour", artist: "The Amplifiers" },
    { time: "18:00", title: "Electronic Beats", artist: "Pulse" },
    { time: "20:00", title: "Evening Chill", artist: "Ambient Waves" }
  ]);

  // Preload audio in background
  useEffect(() => {
    // Create a hidden audio element for preloading
    if (!preloadAudioRef.current) {
      preloadAudioRef.current = new Audio(streamUrl);
      preloadAudioRef.current.preload = 'auto';
      preloadAudioRef.current.volume = 0; // Mute it
      
      // Start loading the stream but immediately pause
      preloadAudioRef.current.load();
      
      // Set up event listeners
      preloadAudioRef.current.addEventListener('canplaythrough', () => {
        setIsPreloaded(true);
        console.log('Stream preloaded and ready');
      });
      
      // Periodically "touch" the preload audio to keep it fresh
      const keepAliveInterval = setInterval(() => {
        if (preloadAudioRef.current && !isPlaying) {
          // Brief play and pause to refresh the buffer
          preloadAudioRef.current.play().then(() => {
            setTimeout(() => {
              preloadAudioRef.current.pause();
            }, 100);
          }).catch(e => {
            console.log('Preload refresh failed:', e);
          });
        }
      }, 30000); // Every 30 seconds
      
      return () => {
        clearInterval(keepAliveInterval);
        if (preloadAudioRef.current) {
          preloadAudioRef.current.pause();
          preloadAudioRef.current.src = '';
        }
      };
    }
  }, []);

  const togglePlay = () => {
    // Prevent toggle if loading
    if (isLoading) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setShowSongInfo(false);
    } else {
      setIsLoading(true);
      
      // If we have a preloaded stream, use it
      if (isPreloaded && preloadAudioRef.current) {
        // Transfer the preloaded stream to the main audio element
        audioRef.current.src = streamUrl;
        audioRef.current.currentTime = preloadAudioRef.current.currentTime;
        audioRef.current.play().catch(error => {
          console.error("Playback failed:", error);
          setIsLoading(false);
          setIsPlaying(false);
          setShowSongInfo(false);
        });
        
        // Start preloading again for next time
        preloadAudioRef.current.pause();
        preloadAudioRef.current.load();
      } else {
        // Fallback to normal play if preload isn't ready
        audioRef.current.src = streamUrl;
        audioRef.current.load();
        audioRef.current.play().catch(error => {
          console.error("Playback failed:", error);
          setIsLoading(false);
          setIsPlaying(false);
          setShowSongInfo(false);
        });
      }
    }
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Check if the pressed key is spacebar and the target is not an input field
      if (event.code === 'Space' && event.target.tagName !== 'INPUT') {
        event.preventDefault(); // Prevent page scroll
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isPlaying, isLoading]); // Add isLoading to dependencies

  useEffect(() => {
    let timer;
    if (isLoading && !isPlaying) {
      timer = setTimeout(() => {
        setIsPlaying(true);
        setShowSongInfo(true);
      }, 300);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Handle logo clicks for Tetris Easter egg
  const handleLogoClick = (e) => {
    e.preventDefault(); // Prevent page refresh
    
    setLogoClicks(prev => prev + 1);
    
    // Clear any existing timer
    if (logoClickTimerRef.current) {
      clearTimeout(logoClickTimerRef.current);
    }
    
    // If this is the third click, show Tetris
    if (logoClicks === 2) {
      setShowTetris(true);
      setLogoClicks(0);
    } else {
      // Reset clicks after 500ms
      logoClickTimerRef.current = setTimeout(() => {
        setLogoClicks(0);
      }, 500);
    }
  };

  return (
    <div className="App">
      <audio 
        ref={audioRef} 
        src={streamUrl}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
          setShowSongInfo(true);
        }}
        onPause={() => {
          setIsPlaying(false);
          setShowSongInfo(false);
        }}
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
          setShowSongInfo(false);
        }}
      />

      {showTetris ? (
        <div className="tetris-container">
          <button className="close-tetris" onClick={() => setShowTetris(false)}>
            close game
          </button>
          <Tetris />
          
          {isPlaying && (
            <div className="mini-player">
              <button 
                className="mini-play-button"
                onClick={togglePlay}
                aria-label="Pause"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" fill="white" />
                  <rect x="14" y="4" width="4" height="16" fill="white" />
                </svg>
              </button>
              <div className="mini-song-info">
                <p>{currentSong.title}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="main-content">
          <div className="logo-container">
            <a href="#" onClick={handleLogoClick} title="Radio Logo">
              <img src={logo} alt="Radio Logo" className="logo" />
            </a>
          </div>
          
          <div className="up-next-bar">
            <span className="up-next-label">up next</span>
            <div className="up-next-info">
              <div className="marquee-container">
                {upcomingShows.map((show, index) => (
                  <span key={index} className="upcoming-show">
                    <span className="show-time">{show.time}</span>
                    <span className="show-title">{show.title}</span>
                    <span className="show-artist">with {show.artist}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="player-container">
            <button 
              className={`play-button ${isLoading ? 'loading' : ''}`}
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-placeholder"></span>
              ) : isPlaying ? (
                <svg width="50" height="50" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" fill="white" />
                  <rect x="14" y="4" width="4" height="16" fill="white" />
                </svg>
              ) : (
                <svg width="50" height="50" viewBox="0 0 24 24">
                  <path d="M8,5 L19,12 L8,19 Z" fill="white" />
                </svg>
              )}
            </button>
          </div>

          {isLoading ? (
            <div className="song-info loading-message">
              <h2 className="song-title">it's coming</h2>
              <p className="song-artist">loading stream...</p>
            </div>
          ) : showSongInfo && isPlaying ? (
            <div className="song-info">
              <h2 className="song-title">{currentSong.title}</h2>
              <p className="song-artist">{currentSong.artist}</p>
            </div>
          ) : (
            <div className="song-info press-play">
              <h2 className="song-title">press play</h2>
              <p className="song-artist">to start listening</p>
            </div>
          )}
        </div>
      )}
      
      <Chat />
    </div>
  );
}

export default App;

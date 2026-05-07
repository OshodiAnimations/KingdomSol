'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  Participant,
  Track,
  VideoPresets,
  createLocalTracks,
  LocalTrack,
  RemoteTrack,
  TrackPublication,
  RemoteTrackPublication,
} from 'livekit-client';

interface VideoTileProps {
  participant: Participant | null;
  playerName: string;
  isLocal?: boolean;
  isCurrentTurn?: boolean;
  accentColor?: string;
  size?: 'sm' | 'md' | 'lg';
  isMuted?: boolean;
  isCameraOff?: boolean;
}

function VideoTile({ participant, playerName, isLocal, isCurrentTurn, accentColor = '#E8B84B', size = 'md', isMuted, isCameraOff }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);

  const dims = {
    sm: { w: 80, h: 60, fontSize: 9 },
    md: { w: 110, h: 82, fontSize: 11 },
    lg: { w: 140, h: 105, fontSize: 13 },
  }[size];

  useEffect(() => {
    if (!participant || !videoRef.current) return;

    const attachVideo = () => {
      const videoPublication = isLocal
        ? (participant as LocalParticipant).getTrackPublication(Track.Source.Camera)
        : Array.from((participant as RemoteParticipant).trackPublications.values())
            .find(pub => pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera);

      if (videoPublication?.track) {
        videoPublication.track.attach(videoRef.current!);
        setHasVideo(true);
      }
    };

    attachVideo();

    participant.on('trackPublished', attachVideo);
    participant.on('trackSubscribed', attachVideo);
    participant.on('trackUnsubscribed', () => setHasVideo(false));
    participant.on('trackUnpublished', () => setHasVideo(false));

    return () => {
      participant.off('trackPublished', attachVideo);
      participant.off('trackSubscribed', attachVideo);
    };
  }, [participant, isLocal]);

  const initials = playerName.slice(0, 2).toUpperCase();

  return (
    <div style={{
      width: dims.w, height: dims.h, borderRadius: 10, overflow: 'hidden',
      position: 'relative', flexShrink: 0,
      border: `2px solid ${isCurrentTurn ? accentColor : 'rgba(255,255,255,0.12)'}`,
      boxShadow: isCurrentTurn ? `0 0 16px ${accentColor}66` : '0 2px 8px rgba(0,0,0,0.4)',
      transition: 'border-color 0.3s, box-shadow 0.3s',
      background: '#0D0A08',
    }}>
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        muted={isLocal || isMuted}
        playsInline
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          display: hasVideo && !isCameraOff ? 'block' : 'none',
          transform: isLocal ? 'scaleX(-1)' : 'none', // mirror local video
        }}
      />

      {/* Fallback avatar when no video */}
      {(!hasVideo || isCameraOff) && (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `radial-gradient(circle at 40% 35%, ${accentColor}33, rgba(13,10,8,0.95))`,
        }}>
          <div style={{
            width: dims.w * 0.45, height: dims.w * 0.45, borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor}66, ${accentColor}22)`,
            border: `1.5px solid ${accentColor}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: dims.fontSize * 1.4,
            fontWeight: 900, color: accentColor, letterSpacing: '0.04em',
          }}>
            {initials}
          </div>
        </div>
      )}

      {/* Player name bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
        padding: '6px 6px 4px',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: dims.fontSize,
          fontWeight: 900, color: '#F5E6C8', letterSpacing: '0.03em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
          flex: 1,
        }}>
          {isLocal ? `${playerName} (you)` : playerName}
        </span>
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {isMuted && <span style={{ fontSize: dims.fontSize - 1, opacity: 0.7 }}>🔇</span>}
          {isCameraOff && <span style={{ fontSize: dims.fontSize - 1, opacity: 0.7 }}>📷</span>}
        </div>
      </div>

      {/* Speaking indicator */}
      {isCurrentTurn && (
        <div style={{
          position: 'absolute', top: 4, right: 4,
          width: 8, height: 8, borderRadius: '50%',
          background: accentColor,
          boxShadow: `0 0 8px ${accentColor}`,
          animation: 'livepulse 1.2s ease-in-out infinite',
        }} />
      )}

      {/* LOCAL label */}
      {isLocal && (
        <div style={{
          position: 'absolute', top: 4, left: 4,
          padding: '1px 5px', borderRadius: 3,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700,
          color: 'rgba(245,230,200,0.6)', letterSpacing: '0.06em',
        }}>YOU</div>
      )}
    </div>
  );
}

// ── Reaction system ───────────────────────────────────────────────────────────

const REACTIONS = ['😂', '😮', '😤', '👑', '🔥', '💀', '🤝', '⚔️'];

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

// ── Main VideoChat component ──────────────────────────────────────────────────

interface VideoChatProps {
  roomCode: string;
  playerName: string;
  playerId: string;
  players: Array<{ id: string; name: string; accentColor?: string }>;
  currentPlayerId: string; // whose turn it is
  isEnabled: boolean;
  onToggle: () => void;
}

export function VideoChat({
  roomCode, playerName, playerId, players,
  currentPlayerId, isEnabled, onToggle,
}: VideoChatProps) {
  const [room] = useState(() => new Room({
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: {
      resolution: VideoPresets.h180.resolution, // low res for bandwidth
    },
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  }));

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [showReactions, setShowReactions] = useState(false);

  const connect = useCallback(async () => {
    if (connecting || connected) return;
    setConnecting(true);
    setError(null);

    try {
      // Get token from our API
      const res = await fetch('/api/livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerName, playerId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get token');
      }

      const { token, wsUrl } = await res.json();

      // Room events
      room.on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
        setRemoteParticipants(prev => [...prev.filter(x => x.sid !== p.sid), p]);
      });
      room.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
        setRemoteParticipants(prev => prev.filter(x => x.sid !== p.sid));
      });
      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload));
          if (msg.type === 'reaction') {
            addFloatingReaction(msg.emoji);
          }
        } catch {}
      });
      room.on(RoomEvent.TrackSubscribed, () => {
        setRemoteParticipants(Array.from(room.remoteParticipants.values()));
      });

      await room.connect(wsUrl, token);
      await room.localParticipant.enableCameraAndMicrophone();

      setLocalParticipant(room.localParticipant);
      setRemoteParticipants(Array.from(room.remoteParticipants.values()));
      setConnected(true);
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setConnecting(false);
    }
  }, [room, roomCode, playerName, playerId, connecting, connected]);

  const disconnect = useCallback(async () => {
    await room.disconnect();
    setConnected(false);
    setLocalParticipant(null);
    setRemoteParticipants([]);
  }, [room]);

  const toggleMic = useCallback(async () => {
    await room.localParticipant.setMicrophoneEnabled(!isMicOn);
    setIsMicOn(!isMicOn);
  }, [room, isMicOn]);

  const toggleCam = useCallback(async () => {
    await room.localParticipant.setCameraEnabled(!isCamOn);
    setIsCamOn(!isCamOn);
  }, [room, isCamOn]);

  const sendReaction = useCallback(async (emoji: string) => {
    addFloatingReaction(emoji);
    setShowReactions(false);
    if (connected && room.localParticipant) {
      const data = new TextEncoder().encode(JSON.stringify({ type: 'reaction', emoji }));
      await room.localParticipant.publishData(data, { reliable: true });
    }
  }, [connected, room]);

  const addFloatingReaction = (emoji: string) => {
    const id = `r-${Date.now()}-${Math.random()}`;
    const x = 20 + Math.random() * 60;
    setFloatingReactions(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 2500);
  };

  // Connect when enabled
  useEffect(() => {
    if (isEnabled && !connected && !connecting) connect();
    if (!isEnabled && connected) disconnect();
  }, [isEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { room.disconnect(); };
  }, [room]);

  if (!isEnabled) {
    return (
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
          background: 'rgba(153,69,255,0.12)', border: '1.5px solid rgba(153,69,255,0.3)',
          color: '#9945FF', fontFamily: 'var(--font-display)', fontSize: 11,
          fontWeight: 900, letterSpacing: '0.06em',
        }}
      >
        📹 JOIN VIDEO
      </button>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Floating reactions */}
      {floatingReactions.map(r => (
        <div key={r.id} style={{
          position: 'fixed', bottom: '30%', left: `${r.x}%`,
          fontSize: 32, zIndex: 999, pointerEvents: 'none',
          animation: 'reaction-float 2.5s ease-out forwards',
        }}>
          {r.emoji}
        </div>
      ))}

      {/* Video container */}
      <div style={{
        display: 'flex', gap: 6, alignItems: 'flex-start',
        flexWrap: 'wrap' as const,
      }}>
        {/* Local video */}
        {localParticipant && (
          <VideoTile
            participant={localParticipant}
            playerName={playerName}
            isLocal
            isCurrentTurn={currentPlayerId === playerId}
            accentColor="#E8B84B"
            size="md"
            isMuted={!isMicOn}
            isCameraOff={!isCamOn}
          />
        )}

        {/* Remote participants */}
        {remoteParticipants.map(p => {
          const player = players.find(pl => pl.id === p.identity);
          return (
            <VideoTile
              key={p.sid}
              participant={p}
              playerName={player?.name || p.name || p.identity}
              isCurrentTurn={currentPlayerId === p.identity}
              accentColor={player?.accentColor || '#9945FF'}
              size="md"
            />
          );
        })}

        {/* Connecting state */}
        {connecting && (
          <div style={{
            width: 110, height: 82, borderRadius: 10, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(153,69,255,0.08)', border: '2px solid rgba(153,69,255,0.25)',
            gap: 6,
          }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #9945FF', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'rgba(153,69,255,0.7)', fontWeight: 700 }}>CONNECTING</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            width: 110, height: 82, borderRadius: 10, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,68,68,0.08)', border: '1.5px solid rgba(255,68,68,0.2)',
            padding: 8, gap: 4,
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 8, color: '#FF8888', textAlign: 'center', fontWeight: 700 }}>
              {error.includes('configured') ? 'Video not set up' : 'Connection failed'}
            </span>
          </div>
        )}
      </div>

      {/* Controls bar */}
      {connected && (
        <div style={{
          display: 'flex', gap: 5, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' as const,
        }}>
          <button onClick={toggleMic} style={{
            padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
            background: isMicOn ? 'rgba(20,241,149,0.1)' : 'rgba(255,68,68,0.1)',
            border: `1.5px solid ${isMicOn ? 'rgba(20,241,149,0.35)' : 'rgba(255,68,68,0.35)'}`,
            color: isMicOn ? '#14F195' : '#FF6666',
            fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 900,
          }}>
            {isMicOn ? '🎤 MIC' : '🔇 MUTED'}
          </button>

          <button onClick={toggleCam} style={{
            padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
            background: isCamOn ? 'rgba(20,241,149,0.1)' : 'rgba(255,68,68,0.1)',
            border: `1.5px solid ${isCamOn ? 'rgba(20,241,149,0.35)' : 'rgba(255,68,68,0.35)'}`,
            color: isCamOn ? '#14F195' : '#FF6666',
            fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 900,
          }}>
            {isCamOn ? '📹 CAM' : '📷 OFF'}
          </button>

          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowReactions(!showReactions)} style={{
              padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
              background: 'rgba(232,184,75,0.1)', border: '1.5px solid rgba(232,184,75,0.3)',
              color: '#E8B84B', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 900,
            }}>
              😊 REACT
            </button>
            {showReactions && (
              <div style={{
                position: 'absolute', bottom: '110%', left: 0,
                display: 'flex', gap: 4, padding: '6px 8px', borderRadius: 10,
                background: 'rgba(26,20,16,0.97)', border: '1.5px solid rgba(232,184,75,0.2)',
                backdropFilter: 'blur(12px)', zIndex: 100,
                boxShadow: '0 -8px 24px rgba(0,0,0,0.4)',
              }}>
                {REACTIONS.map(emoji => (
                  <button key={emoji} onClick={() => sendReaction(emoji)} style={{
                    fontSize: 20, background: 'none', border: 'none', cursor: 'pointer',
                    padding: '2px 4px', borderRadius: 6, transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => { disconnect(); onToggle(); }} style={{
            padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
            background: 'rgba(255,68,68,0.08)', border: '1.5px solid rgba(255,68,68,0.2)',
            color: '#FF6666', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 900,
          }}>
            ✕ LEAVE
          </button>
        </div>
      )}

      <style>{`
        @keyframes reaction-float {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          15% { opacity: 1; transform: translateY(-20px) scale(1.2); }
          80% { opacity: 1; transform: translateY(-80px) scale(1); }
          100% { opacity: 0; transform: translateY(-120px) scale(0.8); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface PlayerStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalPercentage: number;
  freeThrowPercentage: number;
  threePointsMade: number;
}

interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  stats: PlayerStats;
}

export default function CreateProjectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projectionName, setProjectionName] = useState('');
  const [description, setDescription] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const handleSaveProjection = async () => {
    if (!projectionName.trim()) {
      alert('Please enter a projection name');
      return;
    }

    if (players.length === 0) {
      alert('Please add at least one player');
      return;
    }

    setIsLoading(true);
    
    const projectionData = {
      name: projectionName,
      description: description,
      players: players,
      createdBy: session.user?.email || 'admin',
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/user-projections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save projection');
      }

      const savedProjection = await response.json();
      alert('Projection saved successfully!');
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error saving projection:', error);
      alert('Error saving projection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addPlayer = () => {
    const newPlayer: Player = {
      id: Date.now(),
      name: '',
      position: '',
      team: '',
      stats: {
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fieldGoalPercentage: 0,
        freeThrowPercentage: 0,
        threePointsMade: 0
      }
    };
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (playerId: number) => {
    setPlayers(players.filter(player => player.id !== playerId));
  };

  const updatePlayer = (playerId: number, field: keyof Omit<Player, 'id' | 'stats'>, value: string) => {
    setPlayers(players.map(player => 
      player.id === playerId 
        ? { ...player, [field]: value }
        : player
    ));
  };

  const updatePlayerStat = (playerId: number, stat: keyof PlayerStats, value: string) => {
    setPlayers(players.map(player => 
      player.id === playerId 
        ? { ...player, stats: { ...player.stats, [stat]: parseFloat(value) || 0 } }
        : player
    ));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
            Create New Projection
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Build your custom fantasy basketball projection with player stats and rankings.
          </p>
        </div>

        {/* Projection Details */}
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>
            Projection Details
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '4px' }}>
                Projection Name *
              </label>
              <input
                type="text"
                value={projectionName}
                onChange={(e) => setProjectionName(e.target.value)}
                placeholder="e.g., 2024-25 Season Projections"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '4px' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your projection methodology or notes..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Players Section */}
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#333' }}>
              Players ({players.length})
            </h2>
            <button
              onClick={addPlayer}
              style={{
                backgroundColor: '#4f81ff',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              + Add Player
            </button>
          </div>

          {players.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No players added yet. Click "Add Player" to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {players.map((player) => (
                <PlayerEditor
                  key={player.id}
                  player={player}
                  onUpdate={updatePlayer}
                  onUpdateStat={updatePlayerStat}
                  onRemove={removePlayer}
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveProjection}
            disabled={!projectionName.trim() || players.length === 0 || isLoading}
            style={{
              backgroundColor: projectionName.trim() && players.length > 0 ? '#4f81ff' : '#ccc',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: projectionName.trim() && players.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            {isLoading ? 'Saving...' : 'Save Projection'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Player Editor Component
interface PlayerEditorProps {
  player: Player;
  onUpdate: (playerId: number, field: keyof Omit<Player, 'id' | 'stats'>, value: string) => void;
  onUpdateStat: (playerId: number, stat: keyof PlayerStats, value: string) => void;
  onRemove: (playerId: number) => void;
}

function PlayerEditor({ player, onUpdate, onUpdateStat, onRemove }: PlayerEditorProps) {
  return (
    <div style={{ 
      border: '1px solid #e9ecef', 
      borderRadius: '8px', 
      padding: '16px',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', flex: 1 }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#333', marginBottom: '4px' }}>
              Player Name *
            </label>
            <input
              type="text"
              value={player.name}
              onChange={(e) => onUpdate(player.id, 'name', e.target.value)}
              placeholder="e.g., LeBron James"
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#333', marginBottom: '4px' }}>
              Position
            </label>
            <select
              value={player.position}
              onChange={(e) => onUpdate(player.id, 'position', e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">Select Position</option>
              <option value="PG">Point Guard</option>
              <option value="SG">Shooting Guard</option>
              <option value="SF">Small Forward</option>
              <option value="PF">Power Forward</option>
              <option value="C">Center</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#333', marginBottom: '4px' }}>
              Team
            </label>
            <input
              type="text"
              value={player.team}
              onChange={(e) => onUpdate(player.id, 'team', e.target.value)}
              placeholder="e.g., LAL"
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
        <button
          onClick={() => onRemove(player.id)}
          style={{
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            marginLeft: '12px'
          }}
        >
          Remove
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
        {Object.entries(player.stats).map(([stat, value]) => (
          <div key={stat}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#333', marginBottom: '4px' }}>
              {stat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => onUpdateStat(player.id, stat as keyof PlayerStats, e.target.value)}
              step="0.1"
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

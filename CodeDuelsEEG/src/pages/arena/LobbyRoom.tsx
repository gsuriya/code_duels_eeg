import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { database } from '../../shared/config/firebase'; 
import { ref, onValue, update, get } from 'firebase/database';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import LandingHeader from '../../shared/components/LandingHeader';
import PremiumHeader from '../../shared/components/PremiumHeader';
import LandingFooter from '../../shared/components/LandingFooter';
import { Loader2, UserCheck, PlayCircle, Copy, Check } from 'lucide-react';
import { toast } from '../../components/ui/use-toast';
import { Alert, AlertCircle, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Input } from '../../components/ui/input';
import { UserCircle } from 'lucide-react';

interface LobbyData {
  hostId: string;
  hostUsername: string;
  opponentId?: string;
  opponentUsername?: string;
  status: 'waiting' | 'ready' | 'in_progress' | 'completed';
  createdAt: number;
  difficulty: string;
  matchId?: string;
}

export default function LobbyRoom() {
  const { lobbyCode } = useParams<{ lobbyCode: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [lobbyData, setLobbyData] = useState<LobbyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPremium, setIsPremium] = useState(() => {
    // Initialize from localStorage
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      return profile.isPremium || false;
    }
    return false;
  });

  // Determine if the current user is the host
  const isHost = user && lobbyData && user.uid === lobbyData.hostId;
  
  // Check if the lobby is ready to start (has an opponent)
  const isReady = lobbyData?.opponentId && lobbyData?.opponentUsername && (lobbyData?.status === 'ready' || lobbyData?.status === 'waiting');

  // Set up listener for lobby data changes
  useEffect(() => {
    if (!lobbyCode) return;

    setLoading(true);
    const lobbyRef = ref(database, `lobbies/${lobbyCode}`);
    
    const unsubscribe = onValue(lobbyRef, (snapshot) => {
      setLoading(false);
      
      if (!snapshot.exists()) {
        setError('Lobby not found');
        navigate('/find-match');
        return;
      }
      
      const data = snapshot.val();
      console.log('Lobby data received in LobbyRoom:', data);
      console.log('Current lobby status:', data.status);
      setLobbyData(data);
      
      // If the match is in progress, navigate to the match
      if (data.status === 'in_progress' && data.matchId) {
        navigate(`/match/${data.matchId}`);
      }
    }, (error) => {
      console.error('Error fetching lobby data:', error);
      setLoading(false);
      setError('Failed to load lobby data');
    });

    return () => unsubscribe();
  }, [lobbyCode, navigate]);

  const copyLobbyCode = () => {
    if (lobbyCode) {
      navigator.clipboard.writeText(lobbyCode);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Lobby code copied to clipboard' });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startMatch = async () => {
    if (!lobbyCode || !isHost) {
      return;
    }

    // Double check that we have an opponent
    if (!lobbyData?.opponentId || !lobbyData?.opponentUsername) {
      toast({
        title: "Cannot Start Match",
        description: "You need an opponent to start a match.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Starting match for lobby", lobbyCode);
      const lobbyRef = ref(database, `lobbies/${lobbyCode}`);
      
      // Generate a unique match ID
      const matchId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      
      console.log("Generated match ID:", matchId);
      
      // Update the lobby with the match ID and change status to in_progress
      await update(lobbyRef, {
        status: 'in_progress',
        matchId
      });
      
      console.log('Match started!', matchId);
      
      // The navigate will happen automatically when the lobby data updates
      // but let's explicitly navigate just in case
      navigate(`/match/${matchId}`);
    } catch (error: any) {
      console.error('Error starting match:', error);
      toast({
        title: "Error Starting Match",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        {isPremium ? <PremiumHeader /> : <LandingHeader />}
        <main className="flex-grow container mx-auto py-6 px-4 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Loading Lobby...</h2>
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        {isPremium ? <PremiumHeader /> : <LandingHeader />}
        <main className="flex-grow container mx-auto py-6 px-4 flex items-center justify-center">
          <Card className="p-6 max-w-md w-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-500 mb-4">Error</h2>
              <p>{error}</p>
              <Button 
                onClick={() => navigate('/find-match')} 
                className="mt-6"
              >
                Back to Find Match
              </Button>
            </div>
          </Card>
        </main>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {isPremium ? <PremiumHeader /> : <LandingHeader />}
      
      <main className="flex-grow container mx-auto py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">Lobby Room</h1>
                <div className="flex items-center mt-2">
                  <span className="text-muted-foreground mr-2">Code:</span>
                  <Badge variant="outline" className="mr-2 font-mono text-base py-1">
                    {lobbyCode}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-2 h-8" 
                    onClick={copyLobbyCode}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Badge variant={lobbyData?.status === 'waiting' ? 'default' : 'success'} className="text-sm px-2.5 py-1">
                {lobbyData?.status === 'waiting' ? 'Waiting for Opponent' : 'Ready to Start'}
              </Badge>
            </div>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-3">Match Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-secondary/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Difficulty</h3>
                    <p className="font-medium">{lobbyData?.difficulty || 'Medium'}</p>
                  </div>
                  <div className="bg-secondary/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Created</h3>
                    <p className="font-medium">
                      {lobbyData?.createdAt 
                        ? new Date(lobbyData.createdAt).toLocaleTimeString() 
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4">Players</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                      <span className="font-bold text-sm">{lobbyData?.hostUsername?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium">{lobbyData?.hostUsername}</p>
                      <p className="text-sm text-muted-foreground">Host</p>
                    </div>
                  </div>
                  
                  {lobbyData?.opponentUsername ? (
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-secondary/30 rounded-full flex items-center justify-center mr-3">
                        <span className="font-bold text-sm">{lobbyData.opponentUsername.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex items-center">
                        <div>
                          <p className="font-medium">{lobbyData.opponentUsername}</p>
                          <p className="text-sm text-muted-foreground">Opponent</p>
                        </div>
                        <UserCheck className="ml-3 text-green-500 h-5 w-5" />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <p className="text-muted-foreground">Waiting for opponent to join...</p>
                      <p className="text-sm mt-1">Share your lobby code: <span className="font-mono font-medium">{lobbyCode}</span></p>
                    </div>
                  )}
                </div>
              </div>
              
              {isHost && (
                <div className="border-t pt-6">
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    size="lg"
                    disabled={!lobbyData?.opponentId}
                    onClick={startMatch}
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Start Match
                  </Button>
                  {!lobbyData?.opponentId && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Waiting for an opponent to join before you can start the match
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
} 
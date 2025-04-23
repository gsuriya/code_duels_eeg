import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { useAdmin } from '@shared/context/AdminContext';
import { Button } from '@ui/button';
import { Card } from '@ui/data/card';
import { Badge } from '@ui/data/badge';
import LandingHeader from '@shared/components/LandingHeader';
import PremiumHeader from '@shared/components/PremiumHeader';
import UserHeader from '@shared/components/UserHeader';
import GuestHeader from '@shared/components/GuestHeader';
import LandingFooter from '@shared/components/LandingFooter';
import { Loader2, Users, XCircle, Shield, Crown } from 'lucide-react';
import { useToast } from '@shared/hooks/ui/use-toast';
// Supabase import
import { supabase } from '@shared/config/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Define a type for lobby data using Supabase conventions (snake_case)
interface LobbyData {
  code: string;
  host_id: string;
  creator_name?: string;
  opponent_id: string | null;
  opponent_name?: string | null;
  created_at: string; // Supabase typically returns ISO string timestamps
  status: 'waiting' | 'ready' | 'starting' | 'cancelled';
  // Add other potential fields: problem_id, settings, etc.
}

export default function Lobby() {
  const { lobbyCode } = useParams<{ lobbyCode: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();

  // Determine premium status (similar logic to FindMatch)
  const [isPremium, setIsPremium] = useState(() => {
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      return profile.isPremium || isAdmin;
    }
    return false;
  });

  // State for lobby status
  const [isLoading, setIsLoading] = useState(true);
  const [lobbyDetails, setLobbyDetails] = useState<LobbyData | null>(null);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isHost, setIsHost] = useState(false); // State to track if current user is host
  const [isStartingGame, setIsStartingGame] = useState(false); // Loading state for start button
  
  // Add connection status debugging
  const [connectionStatus, setConnectionStatus] = useState<{
    main: string;
    backup: string;
    direct: string;
    lastUpdate: string | null;
    lastPoll: string | null;
  }>({
    main: 'Not connected',
    backup: 'Not connected',
    direct: 'Not connected',
    lastUpdate: null,
    lastPoll: null
  });
  const isDev = process.env.NODE_ENV === 'development';

  // Add debug effect to log state changes
  useEffect(() => {
    console.group('🔍 LOBBY STATE DEBUG');
    console.log('Current user:', user?.uid);
    console.log('Lobby details:', lobbyDetails);
    console.log('Is host:', isHost);
    console.log('Status:', lobbyDetails?.status);
    console.log('Should show start button:', isHost && lobbyDetails?.status === 'ready');
    console.log('Connection status:', connectionStatus);
    console.groupEnd();
  }, [user, lobbyDetails, isHost, connectionStatus]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast({ title: "Please login to access the lobby.", variant: "destructive" });
      navigate('/login');
      return;
    }

    if (!lobbyCode) {
        toast({ title: "Invalid Lobby URL", variant: "destructive" });
        navigate('/find-match');
        return;
    }

    let realtimeChannel: RealtimeChannel | null = null;
    let directChannel: RealtimeChannel | null = null;
    let backupChannel: RealtimeChannel | null = null; 
    let broadcastDebugInterval: NodeJS.Timeout | null = null;

    const fetchAndSubscribe = async () => {
      setIsLoading(true);
      setErrorState(null);

      try {
        // Initial fetch of lobby data
        console.log(`Fetching initial data for lobby: ${lobbyCode}`);
        const { data, error } = await supabase
          .from('lobbies')
          .select('*')
          .eq('code', lobbyCode)
          .single();

        if (error) {
          console.error('Error fetching lobby:', error);
          setErrorState(error.message);
          toast({
            variant: "destructive",
            title: "Failed to fetch lobby details",
            description: error.message
          });
          return;
        }

        if (!data) {
          console.error('No lobby found with code:', lobbyCode);
          setErrorState('Lobby not found');
          toast({
            variant: "destructive",
            title: "Lobby not found"
          });
          return;
        }

        console.group('🎮 INITIAL LOBBY DATA');
        console.log('Full lobby data:', JSON.stringify(data, null, 2));
        console.log('Current user ID:', user?.uid);
        console.log('Host ID in data:', data.host_id);
        console.log('Types - Host ID:', typeof data.host_id, 'User ID:', typeof user?.uid);
        console.log('Strict equality check:', data.host_id === user?.uid);
        console.groupEnd();

        // Set initial host status
        const initialIsHost = data.host_id === user?.uid;
        console.group('👑 INITIAL HOST STATUS');
        console.log('Setting initial host status:', initialIsHost);
        console.log('Host ID:', data.host_id);
        console.log('User ID:', user?.uid);
        console.log('Strict equality check:', data.host_id === user?.uid);
        console.groupEnd();

        setIsHost(initialIsHost);
        setLobbyDetails(data);
        
        // Fix host status determination - explicitly check host_id with strict equality
        const currentIsHost = data.host_id === user?.uid;
        setIsHost(currentIsHost);
        
        console.group('👑 HOST STATUS CHECK');
        console.log(`Host ID from lobby: ${data.host_id}`);
        console.log(`Current user ID: ${user?.uid}`);
        console.log(`Is current user the host? ${currentIsHost}`);
        console.log(`User object:`, user);
        console.groupEnd();
        
        // Force status to 'ready' if opponent has joined but status is still 'waiting'
        if (data.opponent_id && data.status === 'waiting' && data.host_id === user?.uid) {
          console.group('🔄 STATUS UPDATE CHECK');
          console.log('Opponent has joined, current status:', data.status);
          console.log('Host check for update:', {
            isHost: currentIsHost,
            hostId: data.host_id,
            userId: user?.uid,
            strictEqual: data.host_id === user?.uid
          });
          console.groupEnd();

          const { error: updateError } = await supabase
            .from('lobbies')
            .update({ status: 'ready' })
            .eq('code', lobbyCode);
            
          if (updateError) {
            console.error('Error fixing lobby status:', updateError);
          } else {
            console.log('✅ Successfully updated lobby status to "ready"');
            setLobbyDetails(prev => prev ? { ...prev, status: 'ready' } : null);
          }
        }

        // Setup Realtime Subscription - use Supabase standard format
        console.group(`🔌 LOBBY SUBSCRIPTION SETUP - ${lobbyCode}`);
        console.log(`Setting up Supabase subscription for lobby: ${lobbyCode}`);
        console.log(`Current user ID: ${user?.uid}`);
        console.log(`Initial lobby details:`, data);
        console.log(`DEBUG: Timestamp = ${new Date().toISOString()}`);
        console.log(`DEBUG: User role = ${currentIsHost ? 'HOST' : 'OPPONENT'}`);
        console.groupEnd();
        
        // Create the channel with official format (public:[table]:[filter_value])
        realtimeChannel = supabase.channel(`public:lobbies:${lobbyCode}`, {
          config: {
            broadcast: { self: true },
            presence: { key: user?.uid || 'guest' }
          }
        })
          .on('presence', { event: 'sync' }, () => {
            console.log('Presence sync event received');
            setConnectionStatus(prev => ({
              ...prev,
              main: 'Connected',
              lastUpdate: new Date().toISOString()
            }));
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('New presence:', key, newPresences);
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('Left presence:', key, leftPresences);
          })
          .on('broadcast', { event: 'ping' }, ({ payload }) => {
            console.log('Received ping:', payload);
          })
          .on(
            'postgres_changes',
            { 
              event: '*',
              schema: 'public',
              table: 'lobbies',
              filter: `code=eq.${lobbyCode}`
            },
            async (payload) => {
              console.group(`🔄 SUPABASE UPDATE EVENT - ${lobbyCode}`);
              console.log(`CRITICAL EVENT LOG: UPDATE received at ${new Date().toISOString()}`);
              console.log(`User ID: ${user?.uid}, Current Role: ${isHost ? 'HOST' : 'OPPONENT'}`);
              console.log(`FULL PAYLOAD:`, JSON.stringify(payload, null, 2));
              
              // Double-check we have new data
              if (!payload.new) {
                console.warn("⚠️ Received update event with no new data");
                console.groupEnd();
                return;
              }
              
              const updatedLobby = payload.new as LobbyData;
              console.group('🔄 LOBBY UPDATE CHECK');
              console.log("Previous lobby state:", JSON.stringify(lobbyDetails, null, 2));
              console.log("New lobby state:", JSON.stringify(updatedLobby, null, 2));
              console.log("Current user ID:", user?.uid);
              console.log("Host ID in update:", updatedLobby.host_id);
              console.log("Opponent ID in update:", updatedLobby.opponent_id);
              console.log("Current status:", updatedLobby.status);
              console.groupEnd();

              // Update lobby details immediately
              setLobbyDetails(updatedLobby);
              
              // Update host status based on the new data
              const newIsHost = updatedLobby.host_id === user?.uid;
              if (newIsHost !== isHost) {
                console.log(`Updating host status from ${isHost} to ${newIsHost}`);
                setIsHost(newIsHost);
              }

              // Log the conditions for showing the start button
              console.group('🎮 START BUTTON CONDITIONS');
              console.log('Is Host:', newIsHost);
              console.log('Status:', updatedLobby.status);
              console.log('Should show button:', newIsHost && updatedLobby.status === 'ready');
              console.groupEnd();

              // Force a re-fetch of the lobby data to ensure we have the latest state
              const { data: freshData, error: refreshError } = await supabase
                .from('lobbies')
                .select('*')
                .eq('code', lobbyCode)
                .single();

              if (!refreshError && freshData) {
                console.log('Fresh lobby data fetched:', freshData);
                setLobbyDetails(freshData);
              }
            }
          );

        // Subscribe to the channel
        await realtimeChannel.subscribe((status) => {
          console.log(`Channel subscription status: ${status}`);
        });
        
        // Try an additional approach as backup
        // Sometimes channels with filters don't work correctly, so let's also try direct broadcast approach
        directChannel = supabase.channel(`lobby_events_${lobbyCode}`, {
          config: {
            broadcast: {
              self: true, // receive own broadcasts (for dev testing)
            },
          },
        });
        
        // Set up listener for a direct channel
        directChannel
          .on('broadcast', { event: 'opponent_joined' }, (payload) => {
            console.group('🎮 DIRECT CHANNEL: opponent_joined event');
            console.log(`Timestamp: ${new Date().toISOString()}`);
            console.log('Payload:', payload);
            
            // Only handle if this is relevant to our lobby
            if (payload.payload && payload.payload.lobbyCode === lobbyCode) {
              console.log('Received opponent joined direct notification');
              // Force refetch the latest lobby data
              void (async () => {
                try {
                  const { data, error } = await supabase
                    .from('lobbies')
                    .select('*')
                    .eq('code', lobbyCode)
                    .maybeSingle();
                    
                  if (error) throw error;
                  if (data) {
                    console.log('Fetched fresh lobby data after opponent joined:', data);
                    setLobbyDetails(data as LobbyData);
                    setIsHost(user?.uid === data.host_id);
                    console.log(`👑 DIRECT CHANNEL HOST STATUS - Current user: ${user?.uid}, Host ID: ${data.host_id}, isHost: ${user?.uid === data.host_id}`);
                  }
                } catch (error) {
                  console.error('Error fetching lobby after opponent joined:', error);
                }
              })();
            }
            console.groupEnd();
          })
          .on('broadcast', { event: 'opponent_left' }, (payload) => {
            console.group(`=== DIRECT BROADCAST: opponent_left ===`);
            console.log(`Timestamp: ${new Date().toISOString()}`);
            console.log('Payload:', JSON.stringify(payload, null, 2));
            
            // Handle opponent left event
            if (payload.payload && payload.payload.lobbyCode === lobbyCode) {
              console.log('Received opponent left direct notification');
              // Force refetch the latest lobby data
              void (async () => {
                try {
                  const { data, error } = await supabase
                    .from('lobbies')
                    .select('*')
                    .eq('code', lobbyCode)
                    .maybeSingle();
                    
                  if (error) throw error;
                  if (data) {
                    console.log('Fetched fresh lobby data after opponent left:', data);
                    setLobbyDetails(data as LobbyData);
                  }
                } catch (error) {
                  console.error('Error fetching lobby after opponent left:', error);
                }
              })();
            }
            console.groupEnd();
          })
          .on('broadcast', { event: 'game_starting' }, (payload) => {
            console.group(`=== DIRECT BROADCAST: game_starting ===`);
            console.log(`Timestamp: ${new Date().toISOString()}`);
            console.log('Payload:', JSON.stringify(payload, null, 2));
            
            // Handle game starting event
            if (payload.payload && payload.payload.lobbyCode === lobbyCode) {
              console.log('Received game starting direct notification');
              navigate(`/battle/${lobbyCode}`);
            }
            console.groupEnd();
          })
          .subscribe((status) => {
            console.group(`=== DIRECT CHANNEL SUBSCRIPTION STATUS ===`);
            console.log(`Timestamp: ${new Date().toISOString()}`); 
            console.log(`Status:`, status);
            console.log(`Channel:`, directChannel);
            console.groupEnd();
          });
          
        // Handle tracking the two channels
        setChannel(realtimeChannel);
        
        // Enable broadcast debugging in console
        console.log(`DEBUG: Setting up broadcast debugging - lobby:${lobbyCode}`);
        broadcastDebugInterval = setInterval(() => {
          if (isHost && directChannel) {
            console.log(`DEBUG: Host sending test broadcast ping - ${new Date().toISOString()}`);
            // Try to broadcast ping on the direct channel
            try {
              console.log(`Broadcasting ping to opponent on direct channel`);
              (async () => {
                try {
                  await directChannel.send({
                    type: 'broadcast',
                    event: 'ping',
                    payload: { 
                      timestamp: new Date().toISOString(),
                      lobbyCode 
                    }
                  });
                  console.log(`Successfully sent ping broadcast`);
                } catch (err) {
                  console.error('Error sending ping broadcast:', err);
                }
              })();
            } catch (e) {
              console.error('Error broadcasting ping:', e);
            }
          }
        }, 10000); // ping every 10 seconds
        
        // Create a second backup channel with different naming pattern
        backupChannel = supabase.channel(`lobby-${lobbyCode}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen for all events
              schema: 'public',
              table: 'lobbies',
              filter: `code=eq.${lobbyCode}`
            },
            (payload) => {
              console.group(`🔁 BACKUP SUBSCRIPTION EVENT - ${lobbyCode}`);
              console.log(`Event: ${payload.eventType}`);
              console.log(`Timestamp: ${new Date().toISOString()}`);
              console.log(`Full payload:`, payload);
              
              if (payload.eventType === 'UPDATE' && payload.new) {
                console.log(`🔄 Backup channel received UPDATE`);
                const updatedLobby = payload.new as LobbyData;
                
                // Only update if something has changed
                if (JSON.stringify(updatedLobby) !== JSON.stringify(lobbyDetails)) {
                  console.log(`🔄 Backup channel detected state change:`, {
                    current: lobbyDetails,
                    new: updatedLobby
                  });
                  setLobbyDetails(updatedLobby);
                }
              }
              console.groupEnd();
            }
          )
          .subscribe();

      } catch (error: any) {
        console.error("Error in fetchAndSubscribe:", error);
        setErrorState(error.message);
        toast({ title: "Error Loading Lobby", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false); // Make sure loading state is cleared regardless of success or failure
      }
    };

    fetchAndSubscribe();

    // Cleanup function
    return () => {
      if (realtimeChannel) {
        console.log('Cleaning up realtime channel...');
        supabase.removeChannel(realtimeChannel);
      }
      if (directChannel) {
        console.log('Cleaning up direct channel...');
        supabase.removeChannel(directChannel);
      }
      if (backupChannel) {
        console.log('Cleaning up backup channel...');
        supabase.removeChannel(backupChannel);
      }
      if (broadcastDebugInterval) {
        console.log('Cleaning up broadcast debug interval...');
        clearInterval(broadcastDebugInterval);
      }
    };
  }, [lobbyCode, user, isAuthenticated, navigate, toast]);

  const handleLeaveLobby = async () => {
    if (!lobbyCode || !user || !lobbyDetails) return;

    let shouldDelete = false;
    let updatePayload: Partial<LobbyData> | null = null;

    try {
       if (user.uid === lobbyDetails.host_id) {
        // Creator leaves - delete the lobby
        shouldDelete = true;
        toast({ title: "Lobby Cancelled", description: "You have left and cancelled the lobby." });
      } else if (user.uid === lobbyDetails.opponent_id) {
        // Opponent leaves - update opponent fields to null and status to waiting
        updatePayload = { opponent_id: null, opponent_name: null, status: 'waiting' };
        toast({ title: "Left Lobby", description: `You have left lobby ${lobbyCode}.` });
        
        // Log additional details for debugging
        console.group('Opponent leaving lobby');
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log(`Lobby code: ${lobbyCode}`);
        console.log(`User ID: ${user.uid}`);
        console.log(`Current lobby details:`, lobbyDetails);
        console.log(`Update payload:`, updatePayload);
        console.groupEnd();
      } else {
        // Spectator or error case - just navigate
        toast({ title: "Leaving Lobby", description: `Leaving lobby ${lobbyCode}.` });
        navigate('/find-match');
        return;
      }

      // Perform DB operation
      if (shouldDelete) {
          console.log(`Attempting to delete lobby: ${lobbyCode}`);
          const { error } = await supabase.from('lobbies').delete().eq('code', lobbyCode);
          if (error) throw error;
          console.log(`Lobby ${lobbyCode} deleted via Supabase.`);
      } else if (updatePayload) {
           console.log(`Attempting to update lobby (opponent leaving): ${lobbyCode}`);
           const { error } = await supabase.from('lobbies').update(updatePayload).eq('code', lobbyCode);
           if (error) throw error;
           console.log(`Lobby ${lobbyCode} updated via Supabase.`);
           
           // Try to broadcast on the direct channel when opponent leaves
           try {
             console.log(`Broadcasting opponent_left event on direct channel`);
             // Using the IIFE pattern consistent with other places in the file
             (async () => {
               try {
                 const eventChannel = supabase.channel(`lobby_events_${lobbyCode}`);
                 await eventChannel.subscribe();
                 console.log(`Created and subscribed to event channel for opponent_left`);
                 
                 await eventChannel.send({
                   type: 'broadcast',
                   event: 'opponent_left',
                   payload: { 
                     timestamp: new Date().toISOString(),
                     lobbyCode,
                     opponentId: user.uid
                   }
                 });
                 console.log(`Successfully sent opponent_left broadcast`);
                 supabase.removeChannel(eventChannel);
               } catch (err) {
                 console.error('Error sending opponent_left broadcast:', err);
               }
             })();
           } catch (e) {
             console.error('Error creating broadcast channel for opponent_left:', e);
           }
      }
      
      // Navigate away AFTER successful DB operation or if just navigating
      navigate('/find-match');

    } catch (error: any) {
        console.error("Error leaving Supabase lobby: ", error);
        toast({ title: "Error Leaving Lobby", description: error.message || "Could not update lobby status.", variant: "destructive" });
        // Still try to navigate away even if DB operation failed
        navigate('/find-match');
    }
  };

  const handleStartGame = async () => {
    // Debug for start game conditions
    console.group('🚀 START GAME CONDITIONS CHECK');
    console.log(`lobbyCode exists: ${!!lobbyCode}`);
    console.log(`isHost: ${isHost}`);
    console.log(`Current user: ${user?.uid}`);
    console.log(`Host ID: ${lobbyDetails?.host_id}`);
    console.log(`Lobby status: ${lobbyDetails?.status}`);
    console.log(`Opponent ID: ${lobbyDetails?.opponent_id}`);
    console.log(`All conditions met: ${!!lobbyCode && isHost && lobbyDetails?.status === 'ready'}`);
    console.groupEnd();
    
    if (!lobbyCode || !isHost || lobbyDetails?.status !== 'ready') return;

    setIsStartingGame(true);
    try {
        console.log(`Host attempting to start game for lobby: ${lobbyCode}`);
        
        // First update the lobby status
        const { error: updateError } = await supabase
            .from('lobbies')
            .update({ status: 'starting' })
            .eq('code', lobbyCode)
            .eq('status', 'ready');

        if (updateError) {
            throw updateError;
        }

        // Then broadcast the game_starting event
        console.log('Broadcasting game_starting event...');
        const eventChannel = supabase.channel(`lobby_events_${lobbyCode}`);
        await eventChannel.subscribe();
        
        await eventChannel.send({
            type: 'broadcast',
            event: 'game_starting',
            payload: {
                lobbyCode,
                timestamp: new Date().toISOString()
            }
        });

        // Clean up the channel
        await supabase.removeChannel(eventChannel);
        
        console.log(`Lobby ${lobbyCode} status updated to 'starting' and broadcast sent.`);
        
        // Navigate to the battle page
        navigate(`/battle/${lobbyCode}`);

    } catch (error: any) {
        console.error("Error starting game: ", error);
        toast({ 
            title: "Error Starting Game", 
            description: error.message || "Could not start the game.", 
            variant: "destructive" 
        });
        setIsStartingGame(false);
    }
};

  // Determine which header to display
  const renderHeader = () => {
    if (!isAuthenticated) return <GuestHeader />;
    if (isPremium) return <PremiumHeader />;
    return <UserHeader />;
  };

  // Debug for render time button conditions
  console.group('🎮 RENDER TIME BUTTON CONDITIONS');
  console.log(`isHost: ${isHost}`);
  console.log(`lobbyDetails.status: ${lobbyDetails?.status}`);
  console.log(`Should show start button: ${isHost && lobbyDetails?.status === 'ready'}`);
  console.groupEnd();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        {renderHeader()}
        <main className="flex-grow flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Loading Lobby...
        </main>
        <LandingFooter />
      </div>
    );
  }

  if (errorState || !lobbyDetails) {
    // Show error message if errorState is set or lobbyDetails are null after loading
    return (
      <div className="min-h-screen flex flex-col">
        {renderHeader()}
        <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
           <XCircle className="h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-semibold mb-2">{errorState ? "Lobby Error" : "Lobby Not Found"}</h1>
          <p className="text-muted-foreground mb-6">
            {errorState || `Could not find details for lobby code: ${lobbyCode}`}
          </p>
          <Button onClick={() => navigate('/find-match')}>Find or Create Lobby</Button>
        </main>
        <LandingFooter />
      </div>
    );
  }


  // Main Lobby UI rendering using lobbyDetails (updated field names)
  const opponentJoined = !!lobbyDetails.opponent_id;
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/40">
      {renderHeader()}

      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Lobby: <span className="font-mono text-primary tracking-wider">{lobbyCode}</span></h1>
            <p className="text-muted-foreground">
              {lobbyDetails.status === 'waiting' ? 'Waiting for your opponent to join the duel.' : lobbyDetails.status === 'ready' ? 'Opponent joined! Waiting for host to start...' : 'Match starting...'}
            </p>
          </div>
           <div className="flex items-center gap-3 mt-4 sm:mt-0">
             {isPremium && (
              <Badge className="bg-green-500/80 hover:bg-green-600/80 text-white px-3 py-1.5 text-sm cursor-default">
                 {isAdmin ? (
                  <>
                    <Shield className="h-5 w-5 mr-1.5" />
                    Admin Access
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-1" />
                    Premium Active
                  </>
                )}
              </Badge>
            )}
             <Button variant="outline" size="sm" onClick={handleLeaveLobby}>
               <XCircle className="h-4 w-4 mr-1.5" />
               Leave Lobby
             </Button>
           </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="p-6 shadow-lg">
            <div className="flex flex-col items-center justify-center space-y-6">

              {/* Player Slots */}
              <div className="flex justify-around w-full text-center">
                 {/* Player 1 (Creator/Host) */}
                <div className="flex flex-col items-center space-y-2">
                   <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                     <Users className="h-8 w-8 text-primary" />
                   </div>
                   {/* Use host_id field name */}
                   <span className="font-semibold text-sm">{lobbyDetails.creator_name || 'Host'} {lobbyDetails.host_id === user?.uid ? '(You)' : ''}</span>
                   <Badge variant="outline" className="border-green-500 text-green-600">Ready</Badge>
                 </div>

                 {/* Versus Indicator */}
                 <div className="flex items-center">
                   <span className="text-2xl font-bold text-muted-foreground">VS</span>
                 </div>

                 {/* Player 2 (Opponent) */}
                 <div className="flex flex-col items-center space-y-2">
                   <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${opponentJoined ? 'bg-secondary/10 border-secondary' : 'bg-muted/50 border-dashed border-muted-foreground animate-pulse'}`}>
                     {opponentJoined ? (
                       <Users className="h-8 w-8 text-secondary" />
                     ) : (
                       <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                     )}
                   </div>
                   {/* Use snake_case field names */}
                   <span className={`font-semibold text-sm ${opponentJoined ? '' : 'text-muted-foreground'}`}>
                     {opponentJoined ? `${lobbyDetails.opponent_name || 'Opponent'} ${lobbyDetails.opponent_id === user?.uid ? '(You)' : ''}` : 'Waiting...'}
                   </span>
                   {opponentJoined ? (
                     <Badge variant="outline" className="border-green-500 text-green-600">Ready</Badge>
                   ) : (
                     <Badge variant="outline">Joining...</Badge>
                   )}
                 </div>
              </div>

              {/* Status Message */}
              <div className="text-center">
                 {lobbyDetails.status === 'ready' ? (
                   <p className="text-blue-600 font-semibold">Opponent has joined! Waiting for host to start the game.</p>
                 ) : lobbyDetails.status === 'waiting' ? (
                   <p className="text-muted-foreground animate-pulse">Waiting for an opponent to join using code <span className="font-mono font-semibold text-primary">{lobbyCode}</span>...</p>
                 ) : lobbyDetails.status === 'starting' ? (
                   <p className="text-green-600 font-semibold animate-pulse">Match starting soon...</p>
                 ) : (
                   <p className="text-muted-foreground">Lobby status: {lobbyDetails.status}</p>
                 )}
              </div>

              {/* Start Game Button (Conditional) */}
              {isHost && lobbyDetails.status === 'ready' && (
                <Button
                  size="lg"
                  className="w-full mt-4 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  onClick={handleStartGame}
                  disabled={isStartingGame}
                >
                  {isStartingGame ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    'Start Game'
                  )}
                </Button>
              )}

              {/* Message for opponent while waiting for host to start */}
              {!isHost && lobbyDetails.status === 'ready' && (
                 <p className="text-center text-muted-foreground mt-4">Waiting for the host ({lobbyDetails.creator_name || 'Host'}) to start the game...</p>
              )}

            </div>
          </Card>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

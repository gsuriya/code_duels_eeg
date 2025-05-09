import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { useAdmin } from '@shared/context/AdminContext';
import { Button } from '@ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@ui/data/card';
import { Badge } from '@ui/data/badge';
import { Loader2, Users, Crown, Shield, BookOpen, Play, Check, X, ArrowRight } from 'lucide-react';
import { useToast } from '@shared/hooks/ui/use-toast';
import { supabase } from '@shared/config/supabase';
import { Problem, TestCase } from '@/problems/problemTypes';
import { getRandomEasyProblem, submitSolution, getProblemById, getRandomProblem } from '@/problems/problemService';
import CodeEditor from '@shared/components/CodeEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/form/select';
import { RealtimeChannel } from '@supabase/supabase-js';
import { debounce } from 'lodash';
import { Progress } from '@ui/data/progress';
import Terminal from '@shared/components/Terminal';
import inspect from 'util';

// Helper function to format duration
function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;

  if (ms < 1000) {
    // Show milliseconds if less than 1 second
    return `${ms.toFixed(0)} ms`; 
  }

  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = (totalSeconds % 60);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }
  // Only show seconds if > 0 or if it's the only unit left (after hours/minutes)
  if (seconds > 0 || parts.length === 0) { 
    // Show one decimal place for seconds only if hours/minutes are not shown
    const precision = (hours > 0 || minutes > 0) ? 0 : 1; 
    parts.push(`${seconds.toFixed(precision)} second${seconds !== 1 ? 's' : ''}`);
  }

  // Handle edge case where calculation results in empty parts (shouldn't happen with ms check)
  if (parts.length === 0) { 
      return "0 seconds";
  }

  return parts.join(', ');
}

// Simple Health Bar Component
interface HealthBarProps {
  playerName: string;
  currentHealth: number;
  maxHealth: number;
  isUser?: boolean; // To potentially style differently later
}

const HealthBar: React.FC<HealthBarProps> = ({ playerName, currentHealth, maxHealth, isUser }) => {
  const healthPercentage = maxHealth > 0 ? (currentHealth / maxHealth) * 100 : 0;

  return (
    <div className={`w-64 p-2 border rounded-lg ${isUser ? 'border-blue-500' : 'border-red-500'} bg-background/80 shadow-sm`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">{playerName}</span>
        <span className="text-xs font-mono">{currentHealth} / {maxHealth} HP</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full ${isUser ? 'bg-blue-600' : 'bg-red-600'}`} 
          style={{ width: `${healthPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Types for battle state
interface BattleState {
  lobbyCode: string;
  hostId: string;
  opponentId: string;
  status: 'preparing' | 'in_progress' | 'completed';
  winner?: string;
  problemId?: string;
}

// Define supported languages
type SupportedLanguage = 'javascript' | 'python' | 'java';
const supportedLanguages: SupportedLanguage[] = ['javascript', 'python', 'java'];

const MAX_HEALTH = 100; // Maximum health for each player

// Helper to compute damage based on duration (ms) and problem difficulty
function computeDamage(durationMs: number, difficulty: 'easy' | 'medium' | 'hard' = 'easy'): number {
  const secs = durationMs / 1000;
  
  // Base damage values according to time
  let baseDamage = 0;
  if (secs <= 120) baseDamage = 25; // <=2 minutes
  else if (secs <= 180) baseDamage = 20; // <=3 minutes
  else if (secs <= 300) baseDamage = 15; // <=5 minutes
  else if (secs <= 480) baseDamage = 10; // <=8 minutes
  else if (secs <= 600) baseDamage = 8; // <=10 minutes
  else baseDamage = 5; // slower than 10 minutes
  
  // Difficulty multipliers
  const difficultyMultiplier = difficulty === 'easy' ? 1 : 
                              difficulty === 'medium' ? 1.5 : 
                              2.5; // hard problems
  
  // Calculate final damage
  // This ensures a hard problem solved in under 10 minutes does ~50 damage
  return Math.round(baseDamage * difficultyMultiplier);
}

export default function Battle() {
  const { lobbyCode } = useParams<{ lobbyCode: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  
  // State
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('python');
  const [myCode, setMyCode] = useState<string>('');
  const [battleChannel, setBattleChannel] = useState<RealtimeChannel | null>(null);
  
  // Game result states
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [hasLost, setHasLost] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winnerName, setWinnerName] = useState<string>('');
  
  // Premium status
  const [isPremium] = useState(() => {
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      return profile.isPremium || isAdmin;
    }
    return false;
  });

  // New states for test results
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<{
    passed: boolean;
    message: string;
    testCasesPassed: number;
    totalTestCases: number;
    details: {
      id: number;
      passed: boolean;
      input: any;
      expected: any;
      output?: any;
      error?: string;
    }[];
  } | null>(null);
  const editorRef = useRef<any>(null);
  const [terminalOutput, setTerminalOutput] = useState<Array<{
    content: string;
    type?: 'error' | 'success' | 'info' | 'default';
  }>>([]);
  
  // Add state for active terminal tab
  const [activeTerminalTab, setActiveTerminalTab] = useState<'output' | 'testcases'>('output');

  // Use useRef for start time to avoid stale closures in runCode
  const startTimeRef = useRef<number | null>(null);

  // Add this after other useRef declarations (around line 131)
  const currentProblemRef = useRef<Problem | null>(null);

  // Debounced function to broadcast code updates
  const broadcastCodeUpdate = useCallback(debounce((channel: RealtimeChannel | null, code: string) => {
    if (channel && user?.uid) {
      console.log('Broadcasting code update...');
      channel.send({
        type: 'broadcast',
        event: 'code_update',
        payload: {
          userId: user.uid,
          code: code
        }
      });
    }
  }, 500), [user]);

  const [playerHealth, setPlayerHealth] = useState<number>(MAX_HEALTH);
  const [opponentHealth, setOpponentHealth] = useState<number>(MAX_HEALTH);
  
  // Add state to track solved problems
  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(new Set());

  // Add a ref to track the previous problem ID
  const previousProblemIdRef = useRef<string | null>(null);

  // Add a helper function to get a random problem that hasn't been solved yet
  const getUniqueRandomProblem = useCallback((): Problem => {
    // If we don't have many solved problems yet, just get a random problem
    if (solvedProblemIds.size < 3) {
      // Get any random problem first
      const newProblem = getRandomProblem();
      
      // If by chance we've solved this one, try once more
      if (solvedProblemIds.has(newProblem.id)) {
        let anotherProblem;
        do {
          anotherProblem = getRandomProblem();
        } while (anotherProblem.id === newProblem.id);
        return anotherProblem;
      }
      
      return newProblem;
    }
    
    // Try to find a problem that hasn't been solved yet (max 10 attempts)
    let attempts = 0;
    let newProblem: Problem;
    
    do {
      newProblem = getRandomProblem();
      attempts++;
      // If we've tried 20 times and still can't find a new problem, 
      // we've probably solved most available problems
      if (attempts >= 20) {
        console.log("Could not find unsolved problem after 20 attempts, resetting solved problem tracking");
        setSolvedProblemIds(new Set());
        return getRandomProblem();
      }
    } while (solvedProblemIds.has(newProblem.id));
    
    console.log(`Found unsolved problem ${newProblem.id} after ${attempts} attempts`);
    return newProblem;
  }, [solvedProblemIds]);

  // Broadcast test results (now includes damage) to opponent
  const broadcastDamage = useCallback((damage: number, difficulty: 'easy' | 'medium' | 'hard' = 'easy') => {
    if (battleChannel && user?.uid) {
      console.log('Broadcasting DAMAGE dealt:', damage, 'for difficulty:', difficulty);
      
      // Store current problem ID before damage is dealt
      previousProblemIdRef.current = currentProblemRef.current?.id || selectedProblem?.id;
      
      battleChannel.send({
        type: 'broadcast',
        event: 'test_results',
        payload: {
          userId: user.uid,
          damage,
          difficulty,
          timestamp: Date.now()
        }
      });
    }
  }, [battleChannel, user, currentProblemRef, selectedProblem]);

  // Broadcast a new problem ID after a user solves a problem
  const broadcastProblem = useCallback((problemId: string) => {
    // Ensure gameOver is false when broadcasting a new problem
    setGameOver(false);
    
    if (battleChannel && user?.uid) {
      console.log('Broadcasting NEW PROBLEM:', problemId);
      battleChannel.send({
        type: 'broadcast',
        event: 'problem_selected',
        payload: {
          userId: user.uid,
          problemId,
          timestamp: Date.now()
        }
      });
    }
  }, [battleChannel, user]);

  // Listener for damage dealt by opponent
  useEffect(() => {
    if (!battleChannel || !user?.uid) return;

    const handleDamage = (payload: any) => {
      const { userId: senderId, damage, difficulty } = payload.payload;
      if (senderId === user.uid) {
        // This is damage we dealt, so update opponent health on our side
        setOpponentHealth(prev => {
          const newVal = Math.max(prev - damage, 0);
          if (newVal === 0) {
            setHasWon(true);
            setGameOver(true);
            toast({ title: 'Victory!', description: 'Opponent health reached 0', variant: 'default' });
          }
          return newVal;
        });
        return;
      }

      console.log('Received DAMAGE from opponent:', damage, 'for difficulty:', difficulty || 'unknown');
      
      // Store current problem ID before updating health
      const currentProblemId = currentProblemRef.current?.id || selectedProblem?.id;
      
      setPlayerHealth(prev => {
        const newHealth = Math.max(prev - damage, 0);
        if (newHealth === 0) {
          setHasLost(true);
          setGameOver(true);
          toast({ title: 'Defeated', description: 'Your health reached 0!', variant: 'destructive' });
        }
        return newHealth;
      });
      
      // Check if we need to force a problem change
      // This is a safeguard in case the problem didn't change after damage was dealt
      setTimeout(() => {
        const afterDamageProblemId = currentProblemRef.current?.id || selectedProblem?.id;
        
        if (afterDamageProblemId === currentProblemId) {
          console.log("PROBLEM STUCK: Problem didn't change after damage was dealt. Forcing problem change.");
          
          // Force a new problem only if the game isn't over
          if (!gameOver && !hasWon && !hasLost) {
            const newProblem = getUniqueRandomProblem();
            console.log("Forcing switch to new problem:", newProblem.id);
            resetProblemState(newProblem, currentLanguage);
            toast({
              title: 'Problem Updated',
              description: 'Switched to a new problem to continue the battle.',
              variant: 'default'
            });
          }
        }
      }, 1000); // Give a slight delay to ensure the normal problem change would have happened
    };

    battleChannel.on('broadcast', { event: 'test_results' }, handleDamage);

    // No reliable off method in current SDK; rely on channel.unsubscribe elsewhere
  }, [battleChannel, user, toast, currentLanguage, gameOver, hasWon, hasLost]);

  // Check after we complete a problem if the problem actually changed
  useEffect(() => {
    // This effect runs after we've dealt damage and the problem should have changed
    if (previousProblemIdRef.current) {
      // Wait a bit to ensure the problem has had time to change
      const timeoutId = setTimeout(() => {
        const currentProblemId = currentProblemRef.current?.id || selectedProblem?.id;
        
        // If still on the same problem after we dealt damage
        if (currentProblemId && currentProblemId === previousProblemIdRef.current) {
          console.log("PROBLEM STUCK: Problem didn't change after we dealt damage. Forcing problem change.");
          
          // Only force a change if not in game over state
          if (!gameOver && !hasWon && !hasLost) {
            const newProblem = getUniqueRandomProblem();
            console.log("Forcing switch to new problem:", newProblem.id);
            resetProblemState(newProblem, currentLanguage);
            toast({
              title: 'Problem Updated',
              description: 'Switched to a new problem to continue the battle.',
              variant: 'default'
            });
          }
        }
        
        // Reset the previous problem ID reference after check
        previousProblemIdRef.current = null;
      }, 1500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [opponentHealth, playerHealth, gameOver, hasWon, hasLost, getUniqueRandomProblem, currentLanguage]);

  // Modify useEffect for listener (add after existing damage listener) - create a new effect
  useEffect(() => {
    if (!battleChannel || !user?.uid) return;

    const handleProblemSelected = (payload: any) => {
      const { userId: senderId, problemId } = payload.payload;
      if (!problemId) return;
      if (senderId === user.uid) return; // ignore our own broadcast (we already reset locally)
      try {
        const problem = getProblemById(problemId);
        console.log('Received NEW PROBLEM from opponent:', problemId);
        resetProblemState(problem, currentLanguage);
      } catch (e) {
        console.error('Error handling new problem broadcast:', e);
      }
    };

    battleChannel.on('broadcast', { event: 'problem_selected' }, handleProblemSelected);

    return () => {
      // removal not needed; channel unsubscribes elsewhere
    };
  }, [battleChannel, user, currentLanguage]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast({ title: "Please login to access the battle", variant: "destructive" });
      navigate('/login');
      return;
    }

    if (!lobbyCode) {
      toast({ title: "Invalid Battle URL", variant: "destructive" });
      navigate('/find-match');
      return;
    }

    const setupBattle = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch initial lobby data
        const { data: lobbyData, error: lobbyError } = await supabase
          .from('lobbies')
          .select('*')
          .eq('code', lobbyCode)
          .single();

        if (lobbyError) throw lobbyError;

        // Check if the game is already completed
        if (lobbyData.status === 'completed' && lobbyData.winner_id) {
          console.log(`Game already completed. Winner: ${lobbyData.winner_id}`);
          
          // Check if the current user is the winner
          if (lobbyData.winner_id === user?.uid) {
            setHasWon(true);
            setGameOver(true);
          } else {
            setHasLost(true);
            setWinnerName(lobbyData.winner_name || 'Opponent');
            setGameOver(true);
          }
        }

        // Determine if user is host
        const userIsHost = user?.uid === lobbyData.host_id;
        setIsHost(userIsHost);

        // Set up channel with both players subscribed
        const channel = supabase.channel(`battle_${lobbyCode}`, {
          config: {
            broadcast: { self: true }, // Include self in broadcasts
            presence: { key: user?.uid || 'guest' }
          }
        });

        // Define problem selection listener for challenger
        if (!userIsHost) {
          console.log("Challenger: Setting up problem selection listener");
          channel.on('broadcast', { event: 'problem_selected' }, (payload) => {
            try {
              const problemId = payload.payload.problemId;
              if (problemId) {
                console.log(`Challenger: Received problem ID ${problemId} from host`);
                const problem = getProblemById(problemId);
                console.log(`Challenger: Using problem ${problem.title}`);
                
                setSelectedProblem(problem);
                
                // Set code after problem is determined
                const initialCode = problem.starterCode[currentLanguage] || '';
                setMyCode(initialCode);
              }
            } catch (e) {
              console.error("Error processing problem selection:", e);
              setError("Error processing problem from host");
            }
          });
        }

        // Subscribe to database changes for lobby status
        const lobbySubscription = supabase
          .channel('lobby_status_changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'lobbies',
              filter: `code=eq.${lobbyCode}`
            },
            (payload) => {
              console.log('Lobby update received:', payload);
              
              // Check if game completed
              if (payload.new.status === 'completed' && payload.new.winner_id) {
                const winnerId = payload.new.winner_id;
                const winnerName = payload.new.winner_name || 'Opponent';
                
                if (winnerId === user?.uid) {
                  console.log('You won the game!');
                  setHasWon(true);
                } else {
                  console.log(`${winnerName} won the game.`);
                  setHasLost(true);
                  setWinnerName(winnerName);
                }
                
                setGameOver(true);
                
                // Show appropriate toast
                if (winnerId === user?.uid) {
                  toast({
                    title: "Victory!",
                    description: "You've successfully solved all test cases!",
                    variant: "default"
                  });
                } else {
                  toast({
                    title: "Battle Lost",
                    description: `${winnerName} has completed all test cases!`,
                    variant: "destructive"
                  });
                }
              }
            }
          )
          .subscribe();

        // Subscribe to the channel
        await channel.subscribe(status => {
          console.log(`Battle channel status: ${status}`);
          
          // For host: Send problem ID after successful subscription
          if (status === 'SUBSCRIBED' && userIsHost) {
            // Select problem after successful subscription
            setTimeout(() => {
              try {
                const problem = getRandomEasyProblem();
                console.log(`Host: Selected problem ${problem.title} (${problem.id})`);
                
                // First set locally
                setSelectedProblem(problem);
                
                // Set initial code
                const initialCode = problem.starterCode[currentLanguage] || '';
                setMyCode(initialCode);
                
                // Then broadcast to challenger with a delay to ensure subscription
                console.log(`Host: Broadcasting problem ID ${problem.id} to challenger`);
                channel.send({
                  type: 'broadcast',
                  event: 'problem_selected',
                  payload: {
                    userId: user.uid,
                    problemId: problem.id,
                    timestamp: new Date().toISOString()
                  }
                });
              } catch (e) {
                console.error("Host: Error selecting problem:", e);
                setError("Error selecting problem");
              }
            }, 1000); // Wait 1 second after subscription before sending
          }
        });
        
        setBattleChannel(channel);

        // Set up initial battle state
        const initialBattleState: BattleState = {
          lobbyCode,
          hostId: lobbyData.host_id,
          opponentId: lobbyData.opponent_id,
          status: 'preparing'
        };

        setBattleState(initialBattleState);
        setIsLoading(false);
        
        // Cleanup function
        return () => {
          console.log('Cleaning up battle resources');
          if (channel) {
            channel.unsubscribe();
            supabase.removeChannel(channel);
          }
          
          if (lobbySubscription) {
            supabase.removeChannel(lobbySubscription);
          }
        };
      } catch (error: any) {
        console.error('Error setting up battle:', error);
        setError(error.message);
        toast({
          title: "Error Setting Up Battle",
          description: error.message,
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };

    setupBattle();
  }, [lobbyCode, user, isAuthenticated, navigate, toast, currentLanguage]);

  // Handle language change
  const handleLanguageChange = (value: string) => {
    const newLang = value as SupportedLanguage;
    setCurrentLanguage(newLang);
    // Reset code to starter code for the new language
    const newStarterCode = selectedProblem?.starterCode[newLang] || '';
    setMyCode(newStarterCode);
  };

  // Handle code changes in the editor
  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    console.log('Code changed:', {
      newCode,
      length: newCode.length,
      lines: newCode.split('\n')
    });
    setMyCode(newCode);
    broadcastCodeUpdate(battleChannel, newCode);
  };

  // Handle code editor mount
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Get initial value from editor
    const initialValue = editor.getValue();
    if (initialValue) {
      setMyCode(initialValue);
    }
    
    // Add keyboard shortcut (Cmd+Enter or Ctrl+Enter)
    editor.addCommand(
      // Monaco.KeyMod.CtrlCmd | Monaco.KeyCode.Enter
      // Using numeric values since we don't have direct Monaco imports
      2048 | 3, // CtrlCmd | Enter
      () => {
        runCode();
      }
    );
  };

  // Add a new ref for the run button
  const runButtonRef = useRef<HTMLButtonElement>(null);

  // Modify the resetProblemState function to log state variables
  const resetProblemState = (newProblem: Problem, language: SupportedLanguage) => {
    // Store the new problem in the ref for immediate access
    currentProblemRef.current = newProblem;
    
    // Log state before reset
    console.log("BUTTON DEBUG - Before Reset:", {
      isRunning,
      gameOver,
      hasWon,
      hasLost,
      buttonRef: runButtonRef.current,
      buttonEnabled: runButtonRef.current ? !runButtonRef.current.disabled : 'unknown',
      buttonClickable: runButtonRef.current ? runButtonRef.current.style.pointerEvents : 'unknown',
      overlayPresent: document.querySelector('.absolute.inset-0') !== null
    });
    
    // Reset UI state
    setTestResults(null);
    setTerminalOutput([{
      content: 'Code execution output will appear here...',
      type: 'default'
    }]);
    setActiveTerminalTab('output');
    
    // Make sure gameOver is set to false when getting a new problem
    // This ensures the Run button stays enabled
    setGameOver(false);
    
    // Set new problem and code in React state (async)
    setSelectedProblem(newProblem);
    const initialCode = newProblem.starterCode[language] || '';
    setMyCode(initialCode);
    
    // Reset timer
    startTimeRef.current = Date.now();
    
    // If editor is mounted, update it
    if (editorRef.current) {
      editorRef.current.setValue(initialCode);
    }

    // Schedule a log after state updates
    setTimeout(() => {
      console.log("BUTTON DEBUG - After Reset:", {
        newProblemId: newProblem.id,
        isRunning,
        gameOver,
        hasWon,
        hasLost,
        buttonRef: runButtonRef.current,
        buttonEnabled: runButtonRef.current ? !runButtonRef.current.disabled : 'unknown',
        buttonClickable: runButtonRef.current ? runButtonRef.current.style.pointerEvents : 'unknown',
        overlayPresent: document.querySelector('.absolute.inset-0') !== null
      });
    }, 100);
  };

  // Add a global hook to the runCode function so it can be triggered by Cmd+Enter even when UI is blocked
  useEffect(() => {
    // Create a global access to the runCode function
    (window as any).triggerRunCode = () => {
      console.log("MANUAL TRIGGER: Running code via global trigger");
      // Reset isRunning if it's stuck
      if (isRunning) {
        setIsRunning(false);
      }
      // Small delay before running code
      setTimeout(() => runCode(), 50);
    };

    // Add a global key handler for Cmd+Enter
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        console.log("MANUAL TRIGGER: Cmd+Enter pressed");
        (window as any).triggerRunCode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      delete (window as any).triggerRunCode;
    };
  }, []);

  // Make the runCode function resilient to blocked UI states
  const runCode = async () => {
    console.log("BUTTON DEBUG - runCode function called", {
      time: new Date().toISOString(),
      gameOver,
      isRunning
    });
    
    // Force isRunning to false first, to ensure we can start fresh
    setIsRunning(false);
    // Small delay to ensure state updates
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Continue with normal function
    setIsRunning(true);
    setTerminalOutput([]);
    
    try {
      // Get the latest code directly from the editor
      const latestCode = editorRef.current?.getValue() || myCode;
      
      // IMPORTANT: Get the most up-to-date problem - either from the ref or state
      // This ensures we always use the latest problem regardless of React's state update timing
      const effectiveProblem = currentProblemRef.current || selectedProblem;
      const currentProblemID = effectiveProblem?.id;
      
      if (!currentProblemID) {
        setTerminalOutput([{
          content: 'Error: No problem selected',
          type: 'error'
        }]);
        setIsRunning(false);
        return;
      }
      
      // Clone the problem to avoid reference issues
      const currentProblem = {...effectiveProblem};
      console.log(`Running code for problem: ${currentProblemID}`);
      
      // Create wrapper code based on problem type and language
      let wrapperCode = '';
      if (currentLanguage === 'python') {
        wrapperCode = `
${latestCode}

error_occurred = False
error_message = ""

def execute_user_code():
    global error_occurred, error_message
    if error_occurred: return
    try:
        solution = Solution()
        # Run the solution with a sample input
        sample_input = ${JSON.stringify(currentProblem.testCases[0].input)}
        
        # Get the function name from the problem ID using leetcode convention
        function_name_map = {
            'two-sum': 'twoSum',
            'best-time-to-buy-and-sell-stock': 'maxProfit',
            'contains-duplicate': 'containsDuplicate',
            'product-of-array-except-self': 'productExceptSelf',
            'maximum-subarray': 'maxSubArray',
            'maximum-product-subarray': 'maxProduct',
            'find-minimum-in-rotated-sorted-array': 'findMin',
            'search-in-rotated-sorted-array': 'search',
            '3sum': 'threeSum',
            'container-with-most-water': 'maxArea'
            # Keep existing mappings if needed
            # 'palindrome-number': 'isPalindrome',
            # 'roman-to-integer': 'romanToInt',
            # 'valid-parentheses': 'isValid',
            # 'merge-two-sorted-lists': 'mergeTwoLists',
            # 'climbing-stairs': 'climbStairs',
        }
        function_name = function_name_map.get('${currentProblemID}')  # <<-- Use our stable ID
        if not function_name:
            # Fallback should ideally not be needed if map is complete
            print(chr(10) + "__FIRST_ERROR__")
            print("Error: Could not determine function name for problem ID: ${currentProblemID}")
            error_occurred = True
            error_message = "Internal error: Function name mapping missing."

        # Get the function from the solution class
        if not error_occurred:
            try:
                func = getattr(solution, function_name)
            except AttributeError:
                print(chr(10) + "__FIRST_ERROR__")
                print(f"Error: Function '{function_name}' not found in Solution class for problem ID '${currentProblemID}'.")
                error_occurred = True
                error_message = f"Function '{function_name}' not implemented."

        # Call the function with appropriate arguments
        if not error_occurred:
            # Updated argument handling using functionSignature
            # Inject the parameter names as a Python list
            param_names = ${JSON.stringify(currentProblem.functionSignature.params.map(p => p.name))}
            args_to_pass = [sample_input[p_name] for p_name in param_names if p_name in sample_input]

            if len(args_to_pass) == len(param_names):
                 result = func(*args_to_pass)
                 print("Function output: " + str(result))
            else:
                 print(chr(10) + "__FIRST_ERROR__")
                 print(f"Error: Mismatch between expected parameters ({param_names}) and provided input keys ({list(sample_input.keys())}) for problem ID '${currentProblemID}'.")
                 error_occurred = True
                 error_message = "Input/parameter mismatch."

    except Exception as e:
        if not error_occurred: # Only capture if not already handled
            error_occurred = True
            error_message = "Error executing code: " + str(e)
            print(chr(10) + "__FIRST_ERROR__")
            print(error_message)

def run_tests():
    global error_occurred, error_message
    if error_occurred: return
    try:
        solution = Solution()
        test_cases = ${JSON.stringify(currentProblem.testCases.map(tc => tc.input))}
        expected_outputs = [${currentProblem.testCases.map(tc =>
          typeof tc.expectedOutput === 'boolean'
            ? tc.expectedOutput ? 'True' : 'False'
            : JSON.stringify(tc.expectedOutput)
        ).join(',')}]
        passed = 0
        total = len(test_cases)
        first_test_error_details = None
        test_results_details = []

        # Get the function name from the problem ID using leetcode convention
        function_name_map = {
            'two-sum': 'twoSum',
            'best-time-to-buy-and-sell-stock': 'maxProfit',
            'contains-duplicate': 'containsDuplicate',
            'product-of-array-except-self': 'productExceptSelf',
            'maximum-subarray': 'maxSubArray',
            'maximum-product-subarray': 'maxProduct',
            'find-minimum-in-rotated-sorted-array': 'findMin',
            'search-in-rotated-sorted-array': 'search',
            '3sum': 'threeSum',
            'container-with-most-water': 'maxArea'
             # Keep existing mappings if needed
            # 'palindrome-number': 'isPalindrome',
            # 'roman-to-integer': 'romanToInt',
            # 'valid-parentheses': 'isValid',
            # 'merge-two-sorted-lists': 'mergeTwoLists',
            # 'climbing-stairs': 'climbStairs',
        }
        function_name = function_name_map.get('${currentProblemID}')
        if not function_name:
            # Fallback should ideally not be needed
            print(chr(10) + "__FIRST_ERROR__")
            print("Error: Could not determine function name for problem ID: ${currentProblemID}")
            error_occurred = True
            error_message = "Internal error: Function name mapping missing."
            return # Stop test execution

        # Get the function from the solution class
        try:
            func = getattr(solution, function_name)
        except AttributeError:
            print(chr(10) + "__FIRST_ERROR__")
            print(f"Error: Function '{function_name}' not found in Solution class for problem ID '${currentProblemID}'.")
            error_occurred = True
            error_message = f"Function '{function_name}' not implemented."
            return # Stop test execution

        # Inject the parameter names as a Python list
        param_names = ${JSON.stringify(currentProblem.functionSignature.params.map(p => p.name))}

        for i, (test, expected) in enumerate(zip(test_cases, expected_outputs)):
            if error_occurred: break # Stop if execute_user_code failed earlier
            result_val = None
            error_val = None
            match_status = False
            try:
                # Call the function with appropriate arguments using functionSignature
                args_to_pass = [test[p_name] for p_name in param_names if p_name in test]

                if len(args_to_pass) == len(param_names):
                    result_val = func(*args_to_pass)
                else:
                    raise ValueError(f"Input/parameter mismatch for test case {i+1}. Expected {param_names}, got {list(test.keys())}")

                # Compare results (improved comparison logic might be needed)
                # Simple comparison for now
                if isinstance(expected, list) and isinstance(result_val, list):
                     # Handle potential list comparison issues (e.g., order for 3sum)
                     if '${currentProblemID}' == '3sum':
                         # Sort both lists of lists before comparing for 3sum
                         sorted_result = sorted([sorted(triplet) for triplet in result_val])
                         sorted_expected = sorted([sorted(triplet) for triplet in expected])
                         match_status = sorted_result == sorted_expected
                     else:
                         # Default list comparison (order matters)
                         match_status = result_val == expected
                elif isinstance(expected, bool):
                     match_status = result_val == expected
                else:
                     match_status = result_val == expected

                if match_status:
                    passed += 1

            except Exception as e:
                error_val = str(e)
                # Capture the first error encountered during tests
                if first_test_error_details is None:
                    first_test_error_details = (i + 1, error_val)
                    # Don't set global error_occurred here, let the loop finish
                    # but record the details for the summary.

            test_results_details.append({
                'test_num': i + 1,
                'input': test,
                'expected': expected,
                'actual': result_val,
                'error': error_val, # Record error per test case
                'passed': match_status and error_val is None # Must pass AND have no error
            })

        # After loop, if a test error occurred, report the first one
        if first_test_error_details is not None and not error_occurred:
             error_occurred = True
             test_num, error_msg = first_test_error_details
             error_message = f"Error in test case {test_num}: {error_msg}"
             print(chr(10) + "__FIRST_ERROR__")
             print(error_message)
             # Don't return here, print summary below

        if not error_occurred:
            print(chr(10) + "__TEST_DETAILS__")
            for res in test_results_details:
                print("Test case " + str(res['test_num']) + ":")
                print("Input: " + str(res['input']))
                print("Expected: " + str(res['expected']))
                if res['error']:
                    print("Error: " + str(res['error']))
                else:
                    print("Output: " + str(res['actual']))
                # Adjust PASS/FAIL based on error presence
                status = 'PASS' if res['passed'] else 'FAIL'
                print("Status: [" + status + "]")
                print("")
            print(chr(10) + "__TEST_RESULTS_SUMMARY__")
            # Ensure passed count matches the details where passed is true and error is null
            final_passed_count = sum(1 for res in test_results_details if res['passed'])
            print(str(final_passed_count) + "/" + str(total))

    except Exception as e:
        # Catch errors during the setup of run_tests itself
        if not error_occurred:
            error_occurred = True
            error_message = "Error running tests: " + str(e)
            print(chr(10) + "__FIRST_ERROR__")
            print(error_message)

# --- Execution Order --- #
execute_user_code()
run_tests()`;
      } else if (currentLanguage === 'javascript') {
        wrapperCode = `
${latestCode}

function executeUserCode() {
    try {
        const solution = new Solution();
        // Run the solution with a sample input
        const sampleInput = ${JSON.stringify(currentProblem.testCases[0].input)};
        
        // Get the function name from the problem ID using leetcode convention
        const functionNameMap = {
            'two-sum': 'twoSum',
            'palindrome-number': 'isPalindrome',
            'roman-to-integer': 'romanToInt',
            'valid-parentheses': 'isValid',
            'merge-two-sorted-lists': 'mergeTwoLists',
            'contains-duplicate': 'containsDuplicate',
            'maximum-subarray': 'maxSubArray',
            'climbing-stairs': 'climbStairs',
            'best-time-to-buy-and-sell-stock': 'maxProfit'
        };
        
        const functionName = functionNameMap['${currentProblemID}'] || '${currentProblemID}'.split('-')
            .map((word, i) => i === 0 ? word : word[0].toUpperCase() + word.slice(1))
            .join('');
        
        // Call the function with appropriate arguments
        let result;
        if ('${currentProblemID}' === 'two-sum') {
            result = solution[functionName](sampleInput.nums, sampleInput.target);
        } else {
            // For all other problems, pass the first key's value from the input
            const firstKey = Object.keys(sampleInput)[0];
            result = solution[functionName](sampleInput[firstKey]);
        }
        console.log("Function output:", result);
    } catch (e) {
        console.log("\\n__FIRST_ERROR__");
        console.log("Error executing code:", e.message);
        throw e;  // Re-throw to stop execution
    }
}

function runTests() {
    const solution = new Solution();
    const testCases = ${JSON.stringify(currentProblem.testCases.map(tc => tc.input))};
    const expectedOutputs = ${JSON.stringify(currentProblem.testCases.map(tc => tc.expectedOutput))};
    let passed = 0;
    const total = testCases.length;
    
    // Get the function name from the problem ID using leetcode convention
    const functionNameMap = {
        'two-sum': 'twoSum',
        'palindrome-number': 'isPalindrome',
        'roman-to-integer': 'romanToInt',
        'valid-parentheses': 'isValid',
        'merge-two-sorted-lists': 'mergeTwoLists',
        'contains-duplicate': 'containsDuplicate',
        'maximum-subarray': 'maxSubArray',
        'climbing-stairs': 'climbStairs',
        'best-time-to-buy-and-sell-stock': 'maxProfit'
    };
    
    const functionName = functionNameMap['${currentProblemID}'] || '${currentProblemID}'.split('-')
        .map((word, i) => i === 0 ? word : word[0].toUpperCase() + word.slice(1))
        .join('');
    
    for (let i = 0; i < testCases.length; i++) {
        try {
            const test = testCases[i];
            const expected = expectedOutputs[i];
            let result;
            
            // Call the function with appropriate arguments
            if ('${currentProblemID}' === 'two-sum') {
                result = solution[functionName](test.nums, test.target);
            } else {
                // For all other problems, pass the first key's value from the input
                const firstKey = Object.keys(test)[0];
                result = solution[functionName](test[firstKey]);
            }
            
            // Compare results
            const matches = JSON.stringify(result) === JSON.stringify(expected);
            if (matches) passed++;
            
        } catch (e) {
            console.log("\\n__FIRST_ERROR__");
            console.log("Error in test case " + (i + 1) + ":", e.message);
            return;  // Stop on first error
        }
    }
    
    console.log("\\n__TEST_RESULTS_SUMMARY__");
    console.log(passed + "/" + total);
}

try {
    executeUserCode();
    runTests();
} catch (e) {
    // Errors are already logged
}`;
      } else if (currentLanguage === 'java') {
        wrapperCode = `
public class Main {
    ${latestCode}
    
    public static void main(String[] args) {
        Solution solution = new Solution();
        
        // Execute user code with sample input
        try {
            if ("${currentProblemID}".equals("two-sum")) {
                int[] nums = ${JSON.stringify(currentProblem.testCases[0].input.nums)};
                int target = ${currentProblem.testCases[0].input.target};
                int[] result = solution.twoSum(nums, target);
                System.out.println("Function output: " + java.util.Arrays.toString(result));
            } else if ("${currentProblemID}".equals("valid-parentheses")) {
                String s = ${JSON.stringify(currentProblem.testCases[0].input.s)};
                boolean result = solution.isValid(s);
                System.out.println("Function output: " + result);
            } else if ("${currentProblemID}".equals("merge-two-sorted-lists")) {
                int[] list1 = ${JSON.stringify(currentProblem.testCases[0].input.list1)};
                int[] list2 = ${JSON.stringify(currentProblem.testCases[0].input.list2)};
                int[] result = solution.mergeTwoLists(list1, list2);
                System.out.println("Function output: " + java.util.Arrays.toString(result));
            }
        } catch (Exception e) {
            System.out.println("Function output: Error - " + e.getMessage());
        }
        
        // Run tests
        int passed = 0;
        int total = ${currentProblem.testCases.length};
        
        for (int i = 0; i < total; i++) {
            try {
                boolean matches = false;
                
                if ("${currentProblemID}".equals("two-sum")) {
                    int[] nums = ${JSON.stringify(currentProblem.testCases.map(tc => tc.input.nums))};
                    int target = ${JSON.stringify(currentProblem.testCases.map(tc => tc.input.target))};
                    int[] expected = ${JSON.stringify(currentProblem.testCases.map(tc => tc.expectedOutput))};
                    int[] result = solution.twoSum(nums, target);
                    matches = java.util.Arrays.equals(result, expected);
                } else if ("${currentProblemID}".equals("valid-parentheses")) {
                    String s = ${JSON.stringify(currentProblem.testCases.map(tc => tc.input.s))};
                    boolean expected = ${JSON.stringify(currentProblem.testCases.map(tc => tc.expectedOutput))};
                    boolean result = solution.isValid(s);
                    matches = result == expected;
                } else if ("${currentProblemID}".equals("merge-two-sorted-lists")) {
                    int[] list1 = ${JSON.stringify(currentProblem.testCases.map(tc => tc.input.list1))};
                    int[] list2 = ${JSON.stringify(currentProblem.testCases.map(tc => tc.input.list2))};
                    int[] expected = ${JSON.stringify(currentProblem.testCases.map(tc => tc.expectedOutput))};
                    int[] result = solution.mergeTwoLists(list1, list2);
                    matches = java.util.Arrays.equals(result, expected);
                }
                
                if (matches) passed++;
            } catch (Exception e) {
                continue;
            }
        }
        
        System.out.println("\n__TEST_RESULTS_SUMMARY__");
        System.out.println(passed + "/" + total);
    }
}`;
      }
      
      console.log("Wrapped code being sent to Judge0:", wrapperCode);
      
      try {
        // NEW: Check if problem changed during our preparation - abort if it did
        if (currentProblemID !== selectedProblem?.id) {
          console.log("Problem changed during execution, aborting current run");
          setIsRunning(false);
          return;
        }
        
        // Call Judge0 API through our Supabase Edge Function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            code: wrapperCode,
            language: currentLanguage
          })
        });
        
        // New: second check if problem changed while waiting for API response
        if (currentProblemID !== selectedProblem?.id) {
          console.log("Problem changed during API call, aborting result processing");
          setIsRunning(false);
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('HTTP Error Response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("Judge0 API Response:", data);

        // Terminal Output Processing  
        const terminalMessages: Array<{ content: string; type?: 'error' | 'success' | 'info' | 'default' }> = [];
        let isErrorState = false;

        // Handle all errors first
        if (data.compile_output) {
          terminalMessages.push({
            content: `Compilation Error:\n${data.compile_output}`,
            type: 'error'
          });
          isErrorState = true;
        }

        if (data.stderr) {
          // Add stderr to terminal messages
          const errorMessage = data.stderr.trim();
          if (errorMessage) {
            terminalMessages.push({
              content: `Runtime Error:\n${errorMessage}`,
              type: 'error'
            });
            isErrorState = true;
          }
        }

        if (data.stdout && !isErrorState) {
          const errorMarker = "__FIRST_ERROR__";
          const detailsMarker = "\n__TEST_DETAILS__";
          const summaryMarker = "\n__TEST_RESULTS_SUMMARY__";
          
          const errorIndex = data.stdout.indexOf(errorMarker);
          const detailsIndex = data.stdout.indexOf(detailsMarker);
          
          if (errorIndex !== -1) {
            // Error occurred during Python execution/tests
            const errorMessage = data.stdout.substring(errorIndex + errorMarker.length).trim();
            if (errorMessage) {
              terminalMessages.push({
                content: errorMessage, 
                type: 'error'
              });
              isErrorState = true;
            }
          } else if (detailsIndex !== -1 && !isErrorState) {
            // Only process successful test details if there are no errors
            const functionOutputText = data.stdout.substring(0, detailsIndex).trim();
            if (functionOutputText) {
              console.log("Function Output (not displayed in Output tab):", functionOutputText);
            }

            const detailsAndSummary = data.stdout.substring(detailsIndex + detailsMarker.length);
            const summaryIndex = detailsAndSummary.indexOf(summaryMarker);
            const testDetails = detailsAndSummary.substring(0, summaryIndex).trim();
            const summaryLine = detailsAndSummary.substring(summaryIndex + summaryMarker.length).trim();

            // Do NOT add function output to terminal messages - Output tab should be empty on success
            
            // Only parse test details if there are no errors
            try {
              const testLines = testDetails.split('\n\n').filter(block => block.trim().length > 0);
              const parsedResults = testLines.map((testCase, index) => { 
                // ... (robust parsing logic) ...
                const lines = testCase.split('\n');
                let testNum = index + 1;
                let input = {};
                let expected = null;
                let output = null;
                let error = null;
                let passed = false;
                
                try {
                  const testNumMatch = lines[0]?.match(/Test case (\d+):/);
                  if (testNumMatch && testNumMatch[1]) {
                    testNum = parseInt(testNumMatch[1]);
                  }
                  
                  const inputMatch = lines[1]?.match(/Input: (.*)/);
                  if (inputMatch && inputMatch[1]) {
                    try { input = JSON.parse(inputMatch[1]); } catch { input = {}; console.warn("Could not parse input string") }
                  }
                  
                  const expectedMatch = lines[2]?.match(/Expected: (.*)/);
                  if (expectedMatch && expectedMatch[1]) {
                    try { expected = JSON.parse(expectedMatch[1]); } catch { expected = expectedMatch[1]; } // Handle bools/strings
                  }
                  
                  const outputLine = lines[3];
                  if (outputLine?.includes('Error:')) {
                    error = outputLine.substring(outputLine.indexOf(':')+1).trim();
                  } else if (outputLine?.includes('Output:')) {
                    try { output = JSON.parse(outputLine.substring(outputLine.indexOf(':')+1)); } catch { output = outputLine.substring(outputLine.indexOf(':')+1).trim(); }
                  }
                  
                  const statusLine = lines[4];
                  if (statusLine?.includes('[PASS]')) {
                    passed = true;
                  }
                  
                } catch (parseError) {
                  console.error(`Error parsing test case ${testNum}:`, parseError, testCase);
                  error = "Error parsing test result";
                }
                
                return {
                  id: testNum,
                  input,
                  expected,
                  ...(error ? { error } : { output }),
                  passed
                };
              });
              
              const summaryMatch = summaryLine.match(/(\d+)\/(\d+)/);
              const passedCount = summaryMatch ? parseInt(summaryMatch[1]) : 0;
              const totalCount = summaryMatch ? parseInt(summaryMatch[2]) : parsedResults.length;

              const newTestResults = {
                passed: passedCount === totalCount,
                message: passedCount === totalCount ? 'All test cases passed!' : 'Some test cases failed.',
                testCasesPassed: passedCount,
                totalTestCases: totalCount,
                details: parsedResults
              };
              
              console.log("Test Results Summary:", {
                passedCount,
                totalCount,
                allPassed: passedCount === totalCount,
                testResults: newTestResults
              });
              
              setTestResults(newTestResults);
              
              // Ensure gameOver is DEFINITELY set to false in the code section that handles all test cases passing
              // This is where we reload a new problem
              if (passedCount === totalCount && totalCount > 0) {
                const endTime = Date.now();
                const currentStartTime = startTimeRef.current;
                const durationMs = currentStartTime ? endTime - currentStartTime : 0;
                const formattedDuration = formatDuration(durationMs);
                
                // Get the current problem from the currentProblemRef or selectedProblem
                // This ensures we're using the actual problem the user is currently working on
                const currentProblem = currentProblemRef.current || selectedProblem;
                
                // Get the difficulty from the current problem
                const currentDifficulty = currentProblem?.difficulty || 'easy';
                const damageDealt = computeDamage(durationMs, currentDifficulty);

                // Add extra logging to confirm gameOver state before and after damage is dealt
                console.log("BUTTON DEBUG - All tests passed:", {
                  gameOverBefore: gameOver,
                  hasWonBefore: hasWon,
                  hasLostBefore: hasLost,
                  currentProblem: currentProblem?.id,
                  difficulty: currentDifficulty
                });

                // Track this problem as solved 
                if (currentProblem?.id) {
                  setSolvedProblemIds(prev => {
                    const newSet = new Set(prev);
                    newSet.add(currentProblem.id);
                    return newSet;
                  });
                  
                  console.log(`Added problem ${currentProblem.id} to solved problems, total solved: ${solvedProblemIds.size + 1}`);
                }

                // EXPLICITLY ensure gameOver is false since we're continuing the game
                setGameOver(false);

                // Broadcast damage to opponent (also updates our opponent health locally in listener)
                broadcastDamage(damageDealt, currentDifficulty);

                // Get a unique problem that hasn't been solved yet
                const newProblem = getUniqueRandomProblem();
                
                // Update the current problem reference and state
                resetProblemState(newProblem, currentLanguage);

                // Log game state after problem reset
                console.log("BUTTON DEBUG - After problem reset:", {
                  gameOverAfter: gameOver,
                  hasWonAfter: hasWon,
                  hasLostAfter: hasLost,
                  newProblemLoaded: true,
                  newProblemId: newProblem.id,
                  prevProblemId: currentProblem?.id
                });

                toast({
                  title: 'Problem Solved!',
                  description: `Dealt ${damageDealt} damage for solving a ${currentDifficulty} problem in ${formattedDuration}. Next problem loaded!`,
                  variant: 'default'
                });

                // End the current runCode flow after resetting for next problem
                setIsRunning(false);
                return;
              }

            } catch(parsingError) {
               console.error("Error processing test details:", parsingError);
               terminalMessages.push({ content: "Error displaying test results.", type: 'error' });
               isErrorState = true; // Treat parsing failure as an error state
            }
            
          } else if (!isErrorState) {
            // Only add stdout to terminal if it wasn't handled as test results or error
            // and if no error state was already set
            if (data.stdout.trim()) {
                terminalMessages.push({
                  content: data.stdout,
                  type: 'default'
                });
            }
          }
        }

        // Set terminal output (may be empty for successful runs)
        setTerminalOutput(terminalMessages);
        
        // ALWAYS show Output tab for any errors, and Test Cases tab otherwise
        if (isErrorState) {
          setActiveTerminalTab('output');
          console.log("Setting tab to OUTPUT due to errors");
        } else {
          // If no errors, always show Test Cases tab if we have test results
          // This ensures consistent behavior across all problems
          if (data.stdout && data.stdout.includes("__TEST_RESULTS_SUMMARY__")) {
            setTestResults(prevResults => {
              if (!prevResults) {
                // Create a default test results object if parsing failed but we have summary
                const summaryMatch = data.stdout.match(/(\d+)\/(\d+)/);
                if (summaryMatch) {
                  const passedCount = parseInt(summaryMatch[1]);
                  const totalCount = parseInt(summaryMatch[2]);
                  return {
                    passed: passedCount === totalCount,
                    message: passedCount === totalCount ? 'All test cases passed!' : 'Some test cases failed.',
                    testCasesPassed: passedCount,
                    totalTestCases: totalCount,
                    details: []
                  };
                }
              }
              return prevResults;
            });
            setActiveTerminalTab('testcases');
            console.log("Setting tab to TEST CASES - successfully ran tests");
          } else {
            // Fallback to output tab if there are no test results at all
            setActiveTerminalTab('output');
            console.log("Setting tab to OUTPUT - no test results available");
          }
        }

      } catch (error) {
        console.error('Error running code:', error);
        setTerminalOutput([{ 
          content: `Error running code: ${error.message || 'An unknown error occurred'}`,
          type: 'error'
        }]);
        setActiveTerminalTab('output'); // Switch to output tab on error
        
        toast({
          title: "Execution Error",
          description: error.message || "An error occurred while running your code",
          variant: "destructive"
        });
      } finally {
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Error running code:', error);
      setTerminalOutput([{ 
        content: `Error running code: ${error.message || 'An unknown error occurred'}`,
        type: 'error'
      }]);
      setActiveTerminalTab('output'); // Switch to output tab on error
      
      toast({
        title: "Execution Error",
        description: error.message || "An error occurred while running your code",
        variant: "destructive"
      });
    }
  };
  
  // Broadcast test results to opponent
  const broadcastTestResults = useCallback((results: any) => {
    if (battleChannel && user?.uid) {
      console.log('Broadcasting test results...');
      battleChannel.send({
        type: 'broadcast',
        event: 'test_results',
        payload: {
          userId: user.uid,
          testsPassed: results.testCasesPassed,
          totalTests: results.totalTestCases,
          timestamp: Date.now()
        }
      });
    }
  }, [battleChannel, user]);

  // Add a helper function to get a specific problem by ID
  const getSpecificProblem = (problemId: string): Problem => {
    // Import from the problemService file
    const { getRandomEasyProblem, getProblemById } = require('@/problems/problemService');
    
    try {
      const problem = getProblemById(problemId);
      return problem;
    } catch (error) {
      console.error(`Error getting problem with ID ${problemId}:`, error);
      // Fallback to a random problem if the specific one can't be found
      return getRandomEasyProblem();
    }
  };

  // Add a helper function to get a fixed fallback problem to increase chance of match
  const getFixedFallbackProblem = (): Problem => {
    // Always return the "Two Sum" problem as fallback for consistency
    // This increases chances both players get the same problem even on failure
    return getProblemById('two-sum');
  };

  // Effect to set start time when battle begins
  useEffect(() => {
    // Use the ref here
    if (battleState && selectedProblem && startTimeRef.current === null) {
      const now = Date.now();
      console.log("Setting start time for problem:", selectedProblem.id, "at timestamp:", now);
      startTimeRef.current = now; // Set the ref's current value
    }
    // Dependency array only needs things that determine *when* to set the time
  }, [battleState, selectedProblem]); // Removed startTimeRef dependency

  // Add this useEffect to monitor gameOver state
  useEffect(() => {
    console.log("BUTTON DEBUG - gameOver state changed:", {
      gameOver,
      hasWon,
      hasLost,
      playerHealth,
      opponentHealth,
      currentProblemId: currentProblemRef.current?.id || selectedProblem?.id
    });

    // If gameOver is true but health isn't zero, something's wrong - force it back to false
    if (gameOver && playerHealth > 0 && opponentHealth > 0 && !hasWon && !hasLost) {
      console.warn("BUTTON DEBUG - Invalid gameOver state detected, forcing to false");
      setGameOver(false);
    }
  }, [gameOver, hasWon, hasLost, playerHealth, opponentHealth, selectedProblem]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up your battle...</p>
        </div>
      </div>
    );
  }

  if (error || !battleState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Battle Error</h2>
          <p className="text-muted-foreground mb-4">{error || 'Could not initialize battle'}</p>
          <Button onClick={() => navigate('/find-match')}>Return to Lobby</Button>
        </Card>
      </div>
    );
  }

  // Ensure we have a problem before rendering the battle UI
  if (!selectedProblem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading problem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/10 flex flex-col">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">
              Battle: <span className="font-mono text-primary text-sm">{lobbyCode}</span>
            </h1>
            <Badge variant={isHost ? "default" : "secondary"} className="font-mono text-xs px-2 py-0.5">
              {isHost ? 'Host' : 'Challenger'}
            </Badge>
            
            {/* Game Status Badge */}
            {hasWon && (
              <Badge variant="success" className="ml-2 animate-pulse">
                <Crown className="h-3 w-3 mr-1" />
                Victory!
              </Badge>
            )}
            {hasLost && (
              <Badge variant="destructive" className="ml-2">
                <X className="h-3 w-3 mr-1" />
                Defeated
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isPremium && (
              <Badge variant="outline">
                 {isAdmin ? (
                  <>
                    <Shield className="h-3.5 w-3.5 mr-1" />
                    Admin
                  </>
                ) : (
                  <>
                    <Crown className="h-3.5 w-3.5 mr-1" />
                    Premium
                  </>
                )}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate('/find-match')}>
              Leave Battle
            </Button>
          </div>
        </div>
      </header>

      {/* Health Bars Container */}
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <HealthBar playerName="You" currentHealth={playerHealth} maxHealth={MAX_HEALTH} isUser={true} />
        <HealthBar playerName="Opponent" currentHealth={opponentHealth} maxHealth={MAX_HEALTH} isUser={false} />
      </div>

      {/* Main Battle Area - Full Width Code Editor */}
      <main className="flex-grow container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Problem Description */}
        <div className="lg:col-span-1 space-y-4">
           <Card className="overflow-hidden sticky top-[60px]"> {/* Adjust top offset based on header height */} 
             <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-xl flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-primary"/> 
                  {selectedProblem.title}
                </CardTitle>
                <Badge 
                  variant={
                    selectedProblem.difficulty === 'easy' ? 'success' : 
                    selectedProblem.difficulty === 'medium' ? 'warning' : 
                    'destructive'
                  }
                  className="capitalize w-fit"
                >
                  {selectedProblem.difficulty}
                </Badge>
             </CardHeader>
             <CardContent className="pt-4 max-h-[calc(100vh-150px)] overflow-y-auto"> {/* Adjust max-height */} 
                 {/* Use a markdown renderer here eventually */}
                 <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedProblem.description.replace(/\n/g, '<br />') }}></div> 
                 
                 {selectedProblem.constraints && selectedProblem.constraints.length > 0 && (
                    <div className="mt-4">
                        <h3 className="font-semibold text-sm mb-1">Constraints:</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {selectedProblem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                    </div>
                 )}
                 
                 {/* Add Example Test Cases Display */}
                 <div className="mt-4">
                    <h3 className="font-semibold text-sm mb-2">Examples:</h3>
                    {selectedProblem.testCases.filter(tc => tc.isExample).map((tc, i) => (
                       <div key={tc.id} className="mb-3 p-3 bg-muted/50 rounded-md border">
                          <p className="text-xs font-semibold mb-1">Example {i + 1}:</p>
                          <pre className="text-xs bg-background p-2 rounded overflow-x-auto"><code>Input: nums = {JSON.stringify(tc.input.nums)}, target = {tc.input.target}\nOutput: {JSON.stringify(tc.expectedOutput)}</code></pre>
                          {tc.explanation && <p className="text-xs text-muted-foreground mt-1">{tc.explanation}</p>}
                       </div>
                    ))}
                 </div>
             </CardContent>
           </Card>
        </div>

        {/* Right Column: Code Editor and Terminal */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Your Code</h2>
                  {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <Select
                  value={currentLanguage}
                  onValueChange={(value: SupportedLanguage) => setCurrentLanguage(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map(lang => (
                      <SelectItem key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="flex-grow p-0 grid grid-rows-[1fr,auto]">
              <div className="relative min-h-[400px] border-b">
                <CodeEditor
                  language={currentLanguage}
                  value={myCode}
                  onChange={handleCodeChange}
                  onMount={handleEditorDidMount}
                />
                
                {/* Game Over Overlay */}
                {gameOver && (
                  <div 
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10"
                    style={{ pointerEvents: 'none' }} // This allows clicks to pass through to elements beneath
                  >
                    <div className="text-center p-6 rounded-lg" style={{ pointerEvents: 'auto' }}> {/* Re-enable pointer events only for this div */}
                      {hasWon ? (
                        <>
                          <Crown className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                          <h2 className="text-2xl font-bold text-amber-500 mb-2">Victory!</h2>
                          <p className="text-lg mb-4">You've solved all test cases.</p>
                        </>
                      ) : (
                        <>
                          <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
                          <h2 className="text-2xl font-bold text-destructive mb-2">Defeated</h2>
                          <p className="text-lg mb-4">{winnerName} solved all test cases first.</p>
                        </>
                      )}
                      <Button 
                        onClick={() => navigate('/find-match')} 
                        variant="outline"
                        className="mt-4"
                      >
                        Find New Match
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Terminal Section */}
              <div className="h-[30vh] p-4">
                <Terminal
                  key={selectedProblem.id}
                  output={terminalOutput}
                  testResults={testResults}
                  activeTab={activeTerminalTab}
                  setActiveTab={setActiveTerminalTab}
                />
              </div>
            </CardContent>

            <CardFooter className="border-t p-4 bg-muted/20">
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <Button 
                    ref={runButtonRef}
                    onClick={(e) => {
                      console.log("BUTTON DEBUG - Click Attempted:", {
                        target: e.target,
                        currentTarget: e.currentTarget,
                        gameOver,
                        isRunning,
                        hasWon,
                        hasLost,
                        event: e
                      });
                      
                      // Force button to be clickable programmatically
                      if (isRunning) {
                        setIsRunning(false);
                        setTimeout(() => runCode(), 50);
                      } else {
                        runCode();
                      }
                    }}
                    className="gap-2 relative z-50" // Higher z-index to ensure it's above overlays
                    size="sm"
                    style={{ pointerEvents: 'auto' }} // Ensure pointer events work
                  >
                    {isRunning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Run Code
                    <span className="text-xs text-muted-foreground ml-1">(Cmd+Enter)</span>
                  </Button>
                  
                  {/* Game status text */}
                  {gameOver && (
                    <div className="text-sm">
                      {hasWon ? (
                        <span className="text-green-500 font-medium">You won the battle!</span>
                      ) : (
                        <span className="text-destructive font-medium">Battle ended</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Test Results Progress Bar */}
                {testResults && (
                  <div className="space-y-3 text-sm">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${testResults.passed ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${(testResults.testCasesPassed / testResults.totalTestCases) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
} 
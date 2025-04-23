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
import { Problem, Difficulty, TestCase } from '@/problems/problemTypes';
import { getRandomEasyProblem } from '@/problems/problemService';
import CodeEditor from '@shared/components/CodeEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/form/select';
import { RealtimeChannel } from '@supabase/supabase-js';
import { debounce } from 'lodash';
import { Progress } from '@ui/data/progress';
import Terminal from '@shared/components/Terminal';

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
  }>>([{
    content: 'Code execution output will appear here...'
  }]);

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

    // Set up channel instance
    const channel = supabase.channel(`battle_${lobbyCode}`, {
      config: {
        broadcast: { self: false },
        presence: { key: user?.uid || 'guest' }
      }
    });

    // Set up channel handlers before subscribing
    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Battle presence synced');
      });

    // Single subscription
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

        // --- Select a Problem --- 
        const problem = getRandomEasyProblem();
        setSelectedProblem(problem);
        console.log(`Selected problem for battle ${lobbyCode}: ${problem.title}`);
        // ------------------------

        // Set initial code based on default language
        const initialCode = problem.starterCode[currentLanguage] || '';
        setMyCode(initialCode);

        // Set up initial battle state
        const initialBattleState: BattleState = {
          lobbyCode,
          hostId: lobbyData.host_id,
          opponentId: lobbyData.opponent_id,
          status: 'preparing',
          problemId: problem.id
        };

        setBattleState(initialBattleState);
        setIsHost(user?.uid === lobbyData.host_id);

        // Subscribe only once
        await channel.subscribe((status) => {
          console.log(`Battle channel subscription status: ${status}`);
        });

        setBattleChannel(channel);

      } catch (error: any) {
        console.error('Error setting up battle:', error);
        setError(error.message);
        toast({
          title: "Error Setting Up Battle",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    setupBattle();

    // Cleanup
    return () => {
      console.log('Cleaning up battle subscriptions');
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      }
    };
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

  // Function to run the code
  const runCode = async () => {
    setIsRunning(true);
    setTerminalOutput([]); // Clear previous output
    
    try {
      // Get the latest code directly from the editor
      const latestCode = editorRef.current?.getValue() || myCode;
      
      // Call Judge0 API through our Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          code: latestCode,
          language: currentLanguage
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const output: Array<{ content: string; type?: 'error' | 'success' | 'info' | 'default' }> = [];
      
      // Add stdout if there is any
      if (result.stdout && result.stdout.trim()) {
        output.push({ content: result.stdout.trim(), type: 'success' });
      }
      
      // Add compile errors if any
      if (result.compile_output) {
        output.push({ 
          content: result.compile_output.trim() || '[Empty]',
          type: 'error'
        });
      }
      
      // Add runtime errors if any
      if (result.stderr) {
        output.push({ 
          content: result.stderr.trim() || '[Empty]',
          type: 'error'
        });
      }
      
      // Add error message if any
      if (result.error) {
        output.push({ 
          content: result.error,
          type: 'error'
        });
      }
      
      setTerminalOutput(output);

    } catch (error: any) {
      console.error('Error running code:', error);
      setTerminalOutput([{ 
        content: `Error running code: ${error.message || 'An unknown error occurred'}`,
        type: 'error'
      }]);
      
      toast({
        title: "Execution Error",
        description: error.message || "An error occurred while running your code",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
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

  if (error || !battleState || !selectedProblem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Battle Error</h2>
          <p className="text-muted-foreground mb-4">{error || 'Could not initialize battle or load problem'}</p>
          <Button onClick={() => navigate('/find-match')}>Return to Lobby</Button>
        </Card>
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

      {/* Main Battle Area - Full Width Code Editor */}
      <main className="flex-grow container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Problem Description */}
        <div className="lg:col-span-1 space-y-4">
           <Card className="overflow-hidden sticky top-[60px]"> {/* Adjust top offset based on header height */} 
             <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary"/> 
                  {selectedProblem.title}
                </CardTitle>
                <div className="mt-1">
                  <Badge 
                    variant={
                      selectedProblem.difficulty === 'easy' ? 'success' : 
                      selectedProblem.difficulty === 'medium' ? 'warning' : 
                      'destructive'
                    }
                    className="capitalize"
                  >
                    {selectedProblem.difficulty}
                  </Badge>
                </div>
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
              </div>
              
              {/* Terminal Section */}
              <div className="p-4">
                <Terminal output={terminalOutput} />
              </div>
            </CardContent>

            <CardFooter className="border-t p-4 bg-muted/20">
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <Button 
                    onClick={runCode}
                    disabled={isRunning}
                    className="gap-2" 
                    size="sm"
                  >
                    {isRunning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Run Code
                    <span className="text-xs text-muted-foreground ml-1">(Cmd+Enter)</span>
                  </Button>
                </div>
                
                {/* Test Results */}
                {testResults && (
                  <div className="space-y-3 text-sm">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${testResults.passed ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${(testResults.testCasesPassed / testResults.totalTestCases) * 100}%` }}
                      ></div>
                    </div>
                    
                    {/* Show test case details */}
                    <div className="space-y-2 mt-2">
                      {testResults.details
                        .filter(result => result.id <= 3) // Only show example test cases
                        .map(result => (
                          <div 
                            key={result.id}
                            className={`p-2 text-xs rounded-md flex items-start gap-2 ${
                              result.passed 
                                ? 'bg-green-500/10 border border-green-500/20' 
                                : 'bg-red-500/10 border border-red-500/20'
                            }`}
                          >
                            <div className={`mt-0.5 ${result.passed ? 'text-green-500' : 'text-red-500'}`}>
                              {result.passed ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="font-mono">
                                <span className="text-muted-foreground">Input:</span>{' '}
                                <span>{JSON.stringify(result.input)}</span>
                              </div>
                              <div className="font-mono mt-1">
                                <span className="text-muted-foreground">Expected:</span>{' '}
                                <span>{JSON.stringify(result.expected)}</span>
                              </div>
                              {!result.passed && result.output !== undefined && (
                                <div className="font-mono mt-1">
                                  <span className="text-muted-foreground">Output:</span>{' '}
                                  <span className="text-red-400">{JSON.stringify(result.output)}</span>
                                </div>
                              )}
                              {result.error && (
                                <div className="font-mono mt-1 text-red-400 break-all">
                                  Error: {result.error}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
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
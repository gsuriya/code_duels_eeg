import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { useAdmin } from '@shared/context/AdminContext';
import { Button } from '@ui/button';
import { Card, CardHeader, CardDescription, CardContent } from '@ui/data/card';
import { Badge } from '@ui/data/badge';
import LandingHeader from '@shared/components/LandingHeader';
import PremiumHeader from '@shared/components/PremiumHeader';
import UserHeader from '@shared/components/UserHeader';
import GuestHeader from '@shared/components/GuestHeader';
import LandingFooter from '@shared/components/LandingFooter';
import { Search, Trophy, LogIn, UserPlus, Crown, Shield } from 'lucide-react';

const mockOpponents = [
  { id: '1', username: 'CodeMaster', tier: 'Diamond', rating: 1850, winRate: '68%', online: true },
  { id: '2', username: 'AlgorithmWizard', tier: 'Platinum', rating: 1650, winRate: '62%', online: true },
  { id: '3', username: 'SyntaxNinja', tier: 'Gold', rating: 1450, winRate: '55%', online: true },
  { id: '4', username: 'ByteBoss', tier: 'Bronze', rating: 1050, winRate: '42%', online: true },
];

export default function FindMatch() {
  const { isAuthenticated } = useAuth();
  const { isAdmin } = useAdmin();
  const [isPremium, setIsPremium] = useState(() => {
    // Initialize from localStorage
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      return profile.isPremium || isAdmin;
    }
    return false;
  });
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (searching) {
      const timer = setTimeout(() => {
        setSearching(false);
        navigate(`/battle`);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [searching, navigate]);

  const startSearch = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSearching(true);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Diamond': return 'bg-blue-500';
      case 'Platinum': return 'bg-gray-400';
      case 'Gold': return 'bg-yellow-500';
      case 'Bronze': return 'bg-amber-700';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {isPremium ? <PremiumHeader /> : <LandingHeader />}
      
      <main className="flex-grow container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Find a Match</h1>
            <p className="text-muted-foreground">Challenge other coders in real-time</p>
          </div>
          
          <div className="flex items-center gap-3">
            {isPremium && (
              <Badge variant="default" className="bg-green-500/80 hover:bg-green-600/80 text-white px-3 py-1.5 text-sm">
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
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <CardHeader>
              <CardDescription>
                <h2 className="text-xl font-semibold mb-4">Select Difficulty</h2>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Button 
                className="w-full text-lg py-6 mt-4 bg-green-600 hover:bg-green-700 text-white font-bold"
                size="lg"
                disabled={searching}
                onClick={startSearch}
              >
                {searching ? (
                  <>
                    <Search className="mr-2 h-4 w-4 animate-spin" />
                    Finding Match...
                  </>
                ) : (
                  'Start Matchmaking'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
} 
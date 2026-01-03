import React from 'react';
import { motion } from 'framer-motion';
import { X, Wifi, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
interface MultiplayerMenuProps {
  onClose: () => void;
}
export function MultiplayerMenu({ onClose }: MultiplayerMenuProps) {
  const joinQueue = useMultiplayerStore(s => s.joinQueue);
  const leaveQueue = useMultiplayerStore(s => s.leaveQueue);
  const isQueuing = useMultiplayerStore(s => s.isQueuing);
  const status = useMultiplayerStore(s => s.status);
  const reset = useMultiplayerStore(s => s.reset);
  const handleClose = () => {
    if (isQueuing) {
        leaveQueue();
    }
    if (status !== 'connected') {
        reset();
    }
    onClose();
  };
  // Auto-close on connection
  React.useEffect(() => {
    if (status === 'connected') {
        setTimeout(() => onClose(), 1000);
    }
  }, [status, onClose]);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-slate-900 border-slate-700 text-white shadow-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-800/50">
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Wifi className="w-6 h-6 text-blue-400" />
                MULTIPLAYER
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-6 h-6" />
            </Button>
          </CardHeader>
          <CardContent className="p-8 flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">Online Matchmaking</h3>
                <p className="text-slate-400">Find an opponent and battle for glory!</p>
            </div>
            {isQueuing ? (
                <div className="w-full flex flex-col items-center gap-6 py-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                        <Loader2 className="w-16 h-16 text-blue-400 animate-spin relative z-10" />
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-blue-300 animate-pulse">SEARCHING FOR OPPONENT...</p>
                        <p className="text-sm text-slate-500 mt-1">This might take a moment</p>
                    </div>
                    <Button 
                        variant="destructive" 
                        className="w-full max-w-[200px] mt-2"
                        onClick={leaveQueue}
                    >
                        CANCEL
                    </Button>
                </div>
            ) : (
                <Button
                    size="lg"
                    className="w-full h-20 text-2xl font-black italic bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] border-t border-white/20 transition-all hover:scale-105 active:scale-95"
                    onClick={joinQueue}
                >
                    <Search className="mr-3 w-8 h-8" /> FIND MATCH
                </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
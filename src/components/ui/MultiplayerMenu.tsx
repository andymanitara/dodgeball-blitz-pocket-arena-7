import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Loader2, X, Search, Globe, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { toast } from 'sonner';
interface MultiplayerMenuProps {
  onClose: () => void;
}
export function MultiplayerMenu({ onClose }: MultiplayerMenuProps) {
  const status = useMultiplayerStore(s => s.status);
  const isQueuing = useMultiplayerStore(s => s.isQueuing);
  const queueCount = useMultiplayerStore(s => s.queueCount);
  const setIsQueuing = useMultiplayerStore(s => s.setIsQueuing);
  const joinQueue = useMultiplayerStore(s => s.joinQueue);
  const leaveQueue = useMultiplayerStore(s => s.leaveQueue);
  const fetchQueueCount = useMultiplayerStore(s => s.fetchQueueCount);
  const peerId = useMultiplayerStore(s => s.peerId);
  const error = useMultiplayerStore(s => s.error);
  const clearError = useMultiplayerStore(s => s.clearError);
  // Auto-close when connected
  useEffect(() => {
    if (status === 'connected') {
      const timer = setTimeout(() => {
        onClose();
        toast.success('Match Found! Starting game...');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);
  useEffect(() => {
    if (isQueuing) {
      fetchQueueCount();
      const interval = setInterval(fetchQueueCount, 3000);
      return () => clearInterval(interval);
    }
  }, [isQueuing, fetchQueueCount]);
  useEffect(() => {
    if (error) {
      toast.error(error);
      // We don't clear error immediately here so it stays visible in the UI if needed
    }
  }, [error]);
  // Cleanup on unmount: Leave queue if still queuing
  useEffect(() => {
    return () => {
      const { isQueuing, peerId, leaveQueue, setIsQueuing } = useMultiplayerStore.getState();
      if (isQueuing && peerId) {
        console.log('MultiplayerMenu unmounted while queuing, leaving queue');
        leaveQueue(peerId);
        setIsQueuing(false);
        toast.info('Search cancelled');
      }
    };
  }, []);
  const handleFindMatch = async () => {
    if (!peerId) {
      toast.error('Cannot join queue: Not connected to server');
      return;
    }
    const matchFound = await joinQueue(peerId);
    if (matchFound) {
      toast.success('Match Found!');
    } else {
      toast.info('Joined matchmaking queue...');
    }
  };
  const handleCancel = () => {
    if (!peerId) {
      toast.error('Not connected');
      return;
    }
    leaveQueue(peerId);
    toast.info('Left matchmaking queue');
  };
  const handleRetryConnection = () => {
    // Force a reload to retry connection since PeerJS is initialized in a component
    window.location.reload();
  };
  // Determine UI State
  const isConnecting = !peerId && status !== 'error';
  const isConnectionError = status === 'error';
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-slate-900 border-slate-700 text-white shadow-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-800/50">
            <div className="flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-400" />
                <CardTitle className="text-2xl font-bold text-white">ONLINE MATCH</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-6 h-6" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-8 py-8 flex flex-col items-center text-center">
            {status === 'connected' ? (
                <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500">
                        <Users className="w-10 h-10 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-black text-green-400">MATCH FOUND!</h3>
                    <p className="text-slate-400">Preparing arena...</p>
                </div>
            ) : isConnectionError ? (
                <div className="flex flex-col items-center gap-6 w-full">
                    <div className="bg-red-500/10 p-6 rounded-full border border-red-500/20">
                        <WifiOff className="w-16 h-16 text-red-400" />
                    </div>
                    <div className="space-y-2 max-w-xs">
                        <h3 className="text-xl font-bold text-white">Connection Failed</h3>
                        <p className="text-red-300 text-sm">
                            {error || "Could not connect to matchmaking server."}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full max-w-xs border-slate-600 hover:bg-slate-800"
                        onClick={handleRetryConnection}
                    >
                        <RefreshCw className="mr-2 w-4 h-4" /> RETRY
                    </Button>
                </div>
            ) : isQueuing ? (
                <div className="flex flex-col items-center gap-6 w-full">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Search className="w-8 h-8 text-blue-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">Searching for opponent...</h3>
                        <p className="text-slate-400 text-sm">
                            Players in queue: <span className="text-blue-400 font-mono font-bold">{queueCount}</span>
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        size="lg"
                        className="w-full max-w-xs rounded-xl font-bold"
                        onClick={handleCancel}
                    >
                        CANCEL SEARCH
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-6 w-full">
                    <div className="bg-blue-500/10 p-6 rounded-full border border-blue-500/20 relative">
                        <Users className="w-16 h-16 text-blue-400" />
                        {isConnecting && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-full backdrop-blur-sm">
                                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                            </div>
                        )}
                    </div>
                    <div className="space-y-2 max-w-xs">
                        <h3 className="text-xl font-bold text-white">
                            {isConnecting ? "Connecting..." : "Ready to Battle?"}
                        </h3>
                        <p className="text-slate-400 text-sm">
                            {isConnecting
                                ? "Establishing connection to matchmaking server..."
                                : "Join the global queue and prove your skills against real players."}
                        </p>
                    </div>
                    <Button
                        size="lg"
                        disabled={isConnecting}
                        className="w-full max-w-xs h-16 text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        onClick={handleFindMatch}
                    >
                        {isConnecting ? (
                            <span className="flex items-center gap-2 text-base">
                                <Loader2 className="w-4 h-4 animate-spin" /> INITIALIZING...
                            </span>
                        ) : (
                            "FIND MATCH"
                        )}
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
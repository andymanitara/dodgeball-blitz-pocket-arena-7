import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, ArrowRight, Loader2, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { toast } from 'sonner';
interface MultiplayerMenuProps {
  onClose: () => void;
}
export function MultiplayerMenu({ onClose }: MultiplayerMenuProps) {
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const hostGame = useMultiplayerStore(s => s.hostGame);
  const joinGame = useMultiplayerStore(s => s.joinGame);
  const gameCode = useMultiplayerStore(s => s.gameCode);
  const status = useMultiplayerStore(s => s.status);
  const role = useMultiplayerStore(s => s.role);
  const reset = useMultiplayerStore(s => s.reset);
  const handleCopy = () => {
    if (gameCode) {
      navigator.clipboard.writeText(gameCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Code copied to clipboard');
    }
  };
  const handleJoin = () => {
    if (inputCode.length !== 6) {
      toast.error('Invalid code. Must be 6 characters.');
      return;
    }
    joinGame(inputCode.toUpperCase());
  };
  const handleHostTab = () => {
    if (role !== 'host') {
        hostGame();
    }
  };
  const handleClose = () => {
    if (status !== 'connected') {
        reset(); // Reset if closing without connecting
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
          <CardContent className="p-6">
            <Tabs defaultValue="join" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-800">
                <TabsTrigger value="join" onClick={() => reset()}>JOIN GAME</TabsTrigger>
                <TabsTrigger value="host" onClick={handleHostTab}>HOST GAME</TabsTrigger>
              </TabsList>
              <TabsContent value="join" className="space-y-4">
                <div className="text-center space-y-2 mb-6">
                    <h3 className="text-lg font-medium text-slate-300">Enter Friend's Code</h3>
                    <p className="text-sm text-slate-500">Ask your friend for their 6-digit Host Code</p>
                </div>
                <div className="flex gap-2">
                    <Input
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        className="text-center text-2xl font-mono tracking-widest uppercase bg-slate-950 border-slate-700 h-14"
                        maxLength={6}
                    />
                </div>
                <Button
                    onClick={handleJoin}
                    disabled={status === 'connecting' || inputCode.length < 6}
                    className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-500"
                >
                    {status === 'connecting' ? (
                        <><Loader2 className="mr-2 animate-spin" /> CONNECTING...</>
                    ) : (
                        <>JOIN MATCH <ArrowRight className="ml-2" /></>
                    )}
                </Button>
              </TabsContent>
              <TabsContent value="host" className="space-y-6">
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-medium text-slate-300">Your Host Code</h3>
                    <p className="text-sm text-slate-500">Share this code with your friend</p>
                </div>
                <div className="relative">
                    <div className="bg-slate-950 border-2 border-blue-500/30 rounded-xl p-6 text-center">
                        {gameCode ? (
                            <span className="text-4xl font-mono font-black tracking-[0.2em] text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">
                                {gameCode}
                            </span>
                        ) : (
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-500" />
                        )}
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1/2 -translate-y-1/2 right-4 hover:bg-slate-800"
                        onClick={handleCopy}
                        disabled={!gameCode}
                    >
                        {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-slate-400" />}
                    </Button>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-400 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Waiting for player to join...
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
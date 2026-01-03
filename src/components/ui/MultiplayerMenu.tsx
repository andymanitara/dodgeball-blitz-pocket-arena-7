import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, ArrowRight, Users, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { toast } from 'sonner';
interface MultiplayerMenuProps {
  onClose: () => void;
}
export function MultiplayerMenu({ onClose }: MultiplayerMenuProps) {
  const peerId = useMultiplayerStore(s => s.peerId);
  const status = useMultiplayerStore(s => s.status);
  const [targetId, setTargetId] = useState('');
  const handleCopy = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId);
      toast.success('Match Code copied!');
    }
  };
  const handleConnect = () => {
    if (!targetId.trim()) return;
    // Dispatch event for Manager to pick up
    window.dispatchEvent(new CustomEvent('connect-peer', { detail: targetId.trim() }));
  };
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-slate-900 border-slate-700 text-white shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-400" />
                <CardTitle className="text-2xl font-bold text-white">MULTIPLAYER</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-6 h-6" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-8 py-6">
            {/* Host Section */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Host a Match</h3>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Share this code with your friend:</p>
                    <div className="flex gap-2">
                        <div className="flex-1 bg-black/30 rounded-lg flex items-center px-3 font-mono text-lg text-blue-300 truncate">
                            {peerId || <Loader2 className="w-4 h-4 animate-spin" />}
                        </div>
                        <Button size="icon" variant="secondary" onClick={handleCopy} disabled={!peerId}>
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
            <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                </div>
                <span className="relative bg-slate-900 px-2 text-xs text-slate-500 uppercase">OR</span>
            </div>
            {/* Join Section */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Join a Match</h3>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Enter Match Code..." 
                        className="bg-slate-800 border-slate-700 text-white h-12 font-mono"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                    />
                    <Button 
                        className="h-12 w-12 bg-blue-600 hover:bg-blue-500"
                        onClick={handleConnect}
                        disabled={status === 'connecting'}
                    >
                        {status === 'connecting' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    </Button>
                </div>
            </div>
            {status === 'connecting' && (
                <div className="text-center text-yellow-400 animate-pulse text-sm font-medium">
                    Connecting to opponent...
                </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
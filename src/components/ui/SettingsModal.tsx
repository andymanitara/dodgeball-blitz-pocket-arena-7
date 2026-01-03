import React from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Music, Smartphone, Settings, Network, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useGameStore } from '@/store/useGameStore';
import { toast } from 'sonner';
interface SettingsModalProps {
  onClose: () => void;
}
export function SettingsModal({ onClose }: SettingsModalProps) {
  const settings = useGameStore(s => s.settings);
  const toggleSetting = useGameStore(s => s.toggleSetting);
  const resetSettings = useGameStore(s => s.resetSettings);
  const handleReset = () => {
    resetSettings();
    toast.success('Settings reset to defaults');
  };
  const handleFlushQueue = async () => {
    try {
        const res = await fetch('/api/queue', { method: 'DELETE' });
        if (res.ok) {
            toast.success('Queue flushed successfully. All players disconnected.');
        } else {
            toast.error('Failed to flush queue');
        }
    } catch (e) {
        toast.error('Error flushing queue');
        console.error(e);
    }
  };
  return (
    // Added pointer-events-auto to ensure clicks are captured
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm"
      >
        <Card className="bg-slate-900 border-slate-700 text-white shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-slate-400" />
                <CardTitle className="text-2xl font-bold text-white">SETTINGS</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-6 h-6" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 py-6">
            {/* Sound Effects */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-800 p-2 rounded-lg">
                        {settings.sound ? <Volume2 className="w-5 h-5 text-blue-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
                    </div>
                    <span className="font-medium text-lg">Sound Effects</span>
                </div>
                <Switch
                    checked={settings.sound}
                    onCheckedChange={() => toggleSetting('sound')}
                    className="data-[state=checked]:bg-blue-600"
                />
            </div>
            {/* Music */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-800 p-2 rounded-lg">
                        <Music className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="font-medium text-lg">Music</span>
                </div>
                <Switch
                    checked={settings.music}
                    onCheckedChange={() => toggleSetting('music')}
                    className="data-[state=checked]:bg-purple-600"
                />
            </div>
            {/* Vibration */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-800 p-2 rounded-lg">
                        <Smartphone className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="font-medium text-lg">Haptics</span>
                </div>
                <Switch
                    checked={settings.vibration}
                    onCheckedChange={() => toggleSetting('vibration')}
                    className="data-[state=checked]:bg-green-600"
                />
            </div>
            {/* Force Relay (Network Hardening) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-800 p-2 rounded-lg">
                            <Network className="w-5 h-5 text-yellow-400" />
                        </div>
                        <span className="font-medium text-lg">Force Relay Mode</span>
                    </div>
                    <Switch
                        checked={settings.forceRelay}
                        onCheckedChange={() => toggleSetting('forceRelay')}
                        className="data-[state=checked]:bg-yellow-600"
                    />
                </div>
                <p className="text-xs text-slate-500 ml-12">
                    Uses server connection. Fixes "Different WiFi" issues but increases latency.
                </p>
            </div>
            {/* Reset & Close Buttons */}
            <div className="pt-4 space-y-3">
                <Button
                    variant="secondary"
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600"
                    onClick={handleReset}
                >
                    <RotateCcw className="w-4 h-4 mr-2" /> Reset to Defaults
                </Button>
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-6 rounded-xl" onClick={onClose}>
                    Close
                </Button>
            </div>
            {/* Danger Zone */}
            <div className="pt-4 border-t border-slate-800 mt-4">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Danger Zone</span>
                </div>
                <Button
                    variant="destructive"
                    className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800"
                    onClick={handleFlushQueue}
                >
                    <Trash2 className="w-4 h-4 mr-2" /> Flush Matchmaking Queue
                </Button>
                <p className="text-[10px] text-slate-500 mt-2 text-center">
                    Disconnects all players and clears the server state. Use for debugging.
                </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
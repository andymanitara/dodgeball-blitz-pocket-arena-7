import React from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Music, Smartphone, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useGameStore } from '@/store/useGameStore';
interface SettingsModalProps {
  onClose: () => void;
}
export function SettingsModal({ onClose }: SettingsModalProps) {
  const settings = useGameStore(s => s.settings);
  const toggleSetting = useGameStore(s => s.toggleSetting);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
            <div className="pt-4">
                <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-6 rounded-xl" onClick={onClose}>
                Close
                </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
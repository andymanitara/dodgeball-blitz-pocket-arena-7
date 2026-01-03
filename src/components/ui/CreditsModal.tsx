import React from 'react';
import { motion } from 'framer-motion';
import { X, Heart, Code, Palette, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
interface CreditsModalProps {
  onClose: () => void;
}
export function CreditsModal({ onClose }: CreditsModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-slate-900 border-slate-700 text-white shadow-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-800/50">
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-500 fill-current" />
              CREDITS
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-6 h-6" />
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Development Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider text-sm">
                <Code className="w-4 h-4" />
                <span>Development & Design</span>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="font-black text-lg text-white mb-1">Aurelia</h3>
                <p className="text-slate-400 text-sm">Lead Architect & Engineering</p>
              </div>
            </div>
            {/* Art Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-wider text-sm">
                <Palette className="w-4 h-4" />
                <span>Visuals & 3D</span>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="font-bold text-white mb-1">React Three Fiber</h3>
                <p className="text-slate-400 text-sm">3D Engine & Ecosystem</p>
                <div className="mt-2 pt-2 border-t border-slate-700/50">
                  <h3 className="font-bold text-white mb-1">Lucide Icons</h3>
                  <p className="text-slate-400 text-sm">UI Iconography</p>
                </div>
              </div>
            </div>
            {/* Audio Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400 font-bold uppercase tracking-wider text-sm">
                <Music className="w-4 h-4" />
                <span>Audio</span>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="font-bold text-white mb-1">Tone.js</h3>
                <p className="text-slate-400 text-sm">Procedural Audio Synthesis</p>
              </div>
            </div>
            {/* Special Thanks */}
            <div className="pt-4 text-center">
              <p className="text-slate-500 text-xs italic">
                "Built with passion for the web."
              </p>
              <p className="text-slate-600 text-[10px] mt-1">
                v{import.meta.env.VITE_APP_VERSION || '1.1.0'}
              </p>
            </div>
            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-4 rounded-xl" onClick={onClose}>
              Close
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
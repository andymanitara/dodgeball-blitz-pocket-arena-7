import React from 'react';
import { motion } from 'framer-motion';
import { X, Gamepad2, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
interface HowToPlayModalProps {
  onClose: () => void;
}
export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    // Added pointer-events-auto to ensure clicks are captured
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-slate-900 border-slate-700 text-white shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-2xl font-bold text-blue-400 italic">HOW TO PLAY</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-6 h-6" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Goal Section */}
            <div className="flex gap-4 items-start">
              <div className="bg-yellow-500/20 p-3 rounded-xl">
                <Target className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">The Goal</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Hit your opponent 3 times to win a round. Be the first to win 2 rounds to claim victory!
                </p>
              </div>
            </div>
            {/* Controls Section */}
            <div className="flex gap-4 items-start">
              <div className="bg-blue-500/20 p-3 rounded-xl">
                <Gamepad2 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="w-full">
                <h3 className="font-bold text-lg mb-2">Controls</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <span className="block font-bold text-blue-300 mb-1">Left Stick</span>
                    <span className="text-slate-400">Move Character</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <span className="block font-bold text-red-400 mb-1">Red Button</span>
                    <span className="text-slate-400">Throw Ball</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 col-span-2">
                    <span className="block font-bold text-yellow-400 mb-1">Yellow Button</span>
                    <span className="text-slate-400">Dodge (Invincible Dash)</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Tips Section */}
            <div className="flex gap-4 items-start">
              <div className="bg-green-500/20 p-3 rounded-xl">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Pro Tip</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Walk over balls to pick them up automatically. You can only hold one ball at a time!
                </p>
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 text-lg rounded-xl mt-2" onClick={onClose}>
              GOT IT!
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
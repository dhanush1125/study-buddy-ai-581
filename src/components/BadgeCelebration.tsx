import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from '@/hooks/useAchievements';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeCelebrationProps {
  badge: Achievement | null;
  isOpen: boolean;
  onDismiss: () => void;
}

const tierColors = {
  bronze: 'from-amber-500 to-amber-700',
  silver: 'from-slate-300 to-slate-500',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-300 to-purple-500',
};

const tierGlows = {
  bronze: 'shadow-amber-500/50',
  silver: 'shadow-slate-400/50',
  gold: 'shadow-yellow-500/50',
  platinum: 'shadow-purple-500/50',
};

// Confetti particle component
const Confetti = ({ delay, color }: { delay: number; color: string }) => {
  const randomX = Math.random() * 100;
  const randomRotation = Math.random() * 360;
  const randomDuration = 2 + Math.random() * 2;

  return (
    <motion.div
      className={cn('absolute w-3 h-3 rounded-sm', color)}
      initial={{ 
        x: `${randomX}vw`, 
        y: -20, 
        rotate: 0,
        opacity: 1 
      }}
      animate={{ 
        y: '100vh', 
        rotate: randomRotation + 720,
        opacity: [1, 1, 0]
      }}
      transition={{ 
        duration: randomDuration, 
        delay,
        ease: 'linear'
      }}
    />
  );
};

export const BadgeCelebration = ({ badge, isOpen, onDismiss }: BadgeCelebrationProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; delay: number; color: string }>>([]);

  const generateConfetti = useCallback(() => {
    const colors = [
      'bg-yellow-400',
      'bg-pink-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
    ];
    
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    
    setConfetti(particles);
  }, []);

  useEffect(() => {
    if (isOpen && badge) {
      generateConfetti();
    }
  }, [isOpen, badge, generateConfetti]);

  if (!badge) return null;

  const tier = badge.tier || 'bronze';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-background/90 backdrop-blur-md"
            onClick={onDismiss}
          />

          {/* Confetti */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {confetti.map((particle) => (
              <Confetti key={particle.id} delay={particle.delay} color={particle.color} />
            ))}
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10"
            onClick={onDismiss}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Badge Card */}
          <motion.div
            className="relative z-10 flex flex-col items-center text-center px-8 py-12"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          >
            {/* Sparkle effects */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              <Sparkles className="absolute top-0 left-1/4 h-6 w-6 text-yellow-400" />
              <Sparkles className="absolute top-1/4 right-0 h-4 w-4 text-yellow-400" />
              <Sparkles className="absolute bottom-1/4 left-0 h-5 w-5 text-yellow-400" />
            </motion.div>

            {/* "New Badge!" text */}
            <motion.p
              className="text-sm font-medium text-primary mb-4 uppercase tracking-widest"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              🎉 New Badge Unlocked! 🎉
            </motion.p>

            {/* Badge Icon */}
            <motion.div
              className={cn(
                'relative w-32 h-32 rounded-full flex items-center justify-center',
                'bg-gradient-to-br shadow-2xl',
                tierColors[tier],
                tierGlows[tier]
              )}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* Glow ring */}
              <motion.div
                className={cn(
                  'absolute inset-0 rounded-full bg-gradient-to-br opacity-50',
                  tierColors[tier]
                )}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-6xl relative z-10">{badge.icon}</span>
            </motion.div>

            {/* Badge Name */}
            <motion.h2
              className="text-3xl font-bold mt-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {badge.name}
            </motion.h2>

            {/* Badge Description */}
            <motion.p
              className="text-muted-foreground mt-2 max-w-xs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {badge.description}
            </motion.p>

            {/* Tier badge */}
            <motion.div
              className={cn(
                'mt-4 px-4 py-1 rounded-full text-sm font-medium capitalize',
                'bg-gradient-to-r text-white',
                tierColors[tier]
              )}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              {tier} Tier
            </motion.div>

            {/* Continue button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                size="lg"
                className="mt-8 gap-2"
                onClick={onDismiss}
              >
                <Sparkles className="h-4 w-4" />
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import { motion } from 'framer-motion';
import { useT } from '@/i18n/useT';

interface Globe3DProps {
  onSpin: () => void;
  isSpinning: boolean;
}

export const Globe3D = ({ onSpin, isSpinning }: Globe3DProps) => {
  const { t } = useT();
  return (
    <div className="w-full h-[400px] relative flex items-center justify-center">
      {/* Animated Globe */}
      <motion.div
        className="relative w-64 h-64 rounded-full bg-gradient-to-br from-blue-400 via-green-400 to-blue-600 shadow-2xl cursor-pointer overflow-hidden"
        onClick={onSpin}
        animate={{
          rotateY: isSpinning ? 360 : 0,
        }}
        transition={{
          duration: isSpinning ? 2 : 0,
          ease: "easeInOut",
          repeat: isSpinning ? 1 : 0,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Globe texture overlay */}
        <div className="absolute inset-0 opacity-30">
          {/* Continents simulation */}
          <div className="absolute top-8 left-12 w-16 h-12 bg-green-600 rounded-full opacity-60"></div>
          <div className="absolute top-20 right-8 w-12 h-8 bg-green-600 rounded-full opacity-60"></div>
          <div className="absolute bottom-16 left-16 w-20 h-10 bg-green-600 rounded-full opacity-60"></div>
          <div className="absolute bottom-8 right-12 w-14 h-8 bg-green-600 rounded-full opacity-60"></div>
          
          {/* Grid lines */}
          <div className="absolute inset-0 border-2 border-white/20 rounded-full"></div>
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 transform -translate-y-1/2"></div>
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 transform -translate-x-1/2"></div>
        </div>

        {/* Shine effect */}
        <div className="absolute top-8 left-8 w-16 h-16 bg-white/30 rounded-full blur-xl"></div>
        
        {/* Click indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            className="bg-black/20 backdrop-blur-sm rounded-full p-4 transition-opacity hover:bg-black/30"
            animate={{
              scale: isSpinning ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: isSpinning ? Infinity : 0,
            }}
          >
            <div className="text-white text-center">
              <div className="text-3xl mb-1">
                {isSpinning ? '🌍' : '🎲'}
              </div>
              <div className="text-sm font-medium">
                {isSpinning ? t('globe.spinning') : t('globe.clickToSpin')}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating particles around globe */}
      {!isSpinning && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-400 rounded-full"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
import { motion } from 'motion/react';

export function LowPolyBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating clouds with parallax */}
      <motion.div 
        animate={{ 
          x: [0, 100, 0],
          y: [0, -10, 0]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: 'linear' 
        }}
        className="absolute top-20 left-10 w-32 h-16 bg-white/40 rounded-full blur-xl"
      ></motion.div>
      <motion.div 
        animate={{ 
          x: [0, -80, 0],
          y: [0, 15, 0]
        }}
        transition={{ 
          duration: 25, 
          repeat: Infinity, 
          ease: 'linear' 
        }}
        className="absolute top-40 right-20 w-40 h-20 bg-white/30 rounded-full blur-xl"
      ></motion.div>
      <motion.div 
        animate={{ 
          x: [0, 60, 0],
          y: [0, -8, 0]
        }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: 'linear' 
        }}
        className="absolute top-60 left-1/3 w-36 h-18 bg-white/35 rounded-full blur-xl"
      ></motion.div>
      
      {/* Low-poly shapes with floating animation */}
      <motion.div 
        animate={{ 
          y: [0, -15, 0],
          rotate: [45, 50, 45]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
        className="absolute top-32 right-1/4 w-16 h-16 bg-[#64B5F6]/20 transform rotate-45 rounded-lg"
      ></motion.div>
      <motion.div 
        animate={{ 
          y: [0, -12, 0],
          rotate: [12, 16, 12]
        }}
        transition={{ 
          duration: 8, 
          delay: 1,
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
        className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-[#EF6C00]/10 transform rotate-12 rounded-lg"
      ></motion.div>
      <motion.div 
        animate={{ 
          y: [0, -10, 0],
          rotate: [-12, -8, -12]
        }}
        transition={{ 
          duration: 10, 
          delay: 2,
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
        className="absolute top-1/2 right-1/3 w-12 h-12 bg-[#B0BEC5]/15 transform -rotate-12 rounded-lg"
      ></motion.div>
      
      {/* Gradient overlays */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#FFFDE7] to-transparent"></div>
    </div>
  );
}
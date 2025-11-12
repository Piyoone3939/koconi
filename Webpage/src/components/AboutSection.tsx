import { motion } from 'framer-motion';
import { MapPin, Camera, Box } from 'lucide-react';

export function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-28 lg:py-32 bg-gradient-to-b from-[#FFFDE7] to-[#B0BEC5]/10 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease: [0.645, 0.045, 0.355, 1] }}
            className="space-y-4 md:space-y-6"
          >
            <h2 
              className="text-[#EF6C00]"
              style={{ 
                fontSize: 'clamp(32px, 6vw, 48px)',
                fontFamily: "'Noto Sans JP', sans-serif" 
              }}
            >
              About Koconi
            </h2>
            
            <h3 
              className="text-[#7A8A93]"
              style={{ 
                fontSize: 'clamp(18px, 3.5vw, 24px)',
                fontFamily: "'Noto Sans JP', sans-serif",
                lineHeight: '1.6'
              }}
            >
              地図の上に思い出を建てよう — あなたの旅が形になるアプリ
            </h3>
            
            <div className="space-y-4">
              <p 
                className="text-[#7A8A93]"
                style={{ 
                  fontSize: 'clamp(15px, 2.8vw, 18px)',
                  fontFamily: "'Noto Sans JP', sans-serif",
                  lineHeight: '1.8'
                }}
              >
                Koconiは、あなたの旅や日常の記録を地図上に可視化するアプリです。
              </p>
              <p 
                className="text-[#7A8A93]"
                style={{ 
                  fontSize: 'clamp(15px, 2.8vw, 18px)',
                  fontFamily: "'Noto Sans JP', sans-serif",
                  lineHeight: '1.8'
                }}
              >
                写真を撮るだけで、AIがランドマークを見つけ出し、思い出を3Dとして"建てる"ことができます。
              </p>
            </div>
          </motion.div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.2, ease: [0.645, 0.045, 0.355, 1] }}
            className="relative"
          >
            <div className="relative w-full aspect-square max-w-md mx-auto">
              {/* Background gradient circle */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, 0]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: 'easeInOut' 
                }}
                className="absolute inset-0 bg-gradient-to-br from-[#64B5F6]/20 via-[#EF6C00]/10 to-[#B0BEC5]/20 rounded-full blur-2xl"
              />
              
              {/* Map base */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10 w-full h-full flex items-center justify-center"
              >
                <div className="w-4/5 h-4/5 bg-[#64B5F6]/30 rounded-3xl shadow-2xl flex items-center justify-center relative overflow-hidden">
                  {/* Grid pattern */}
                  <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-2 p-4 opacity-20">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="bg-white rounded-lg"></div>
                    ))}
                  </div>
                  
                  {/* Center illustration elements */}
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    {/* Camera icon */}
                    <motion.div
                      animate={{ 
                        y: [0, -8, 0],
                        rotate: [-5, 5, -5]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-16 h-16 md:w-20 md:h-20 bg-[#EF6C00]/90 rounded-2xl flex items-center justify-center shadow-xl"
                    >
                      <Camera className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </motion.div>
                    
                    {/* Arrow or connection */}
                    <motion.div
                      animate={{ scaleY: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-1 h-8 bg-[#B0BEC5]/50 rounded-full"
                    />
                    
                    {/* 3D Pin icon */}
                    <motion.div
                      animate={{ 
                        y: [0, 8, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 4, delay: 0.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl"
                    >
                      <MapPin className="w-7 h-7 md:w-8 md:h-8 text-[#64B5F6]" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
              
              {/* Floating 3D blocks */}
              <motion.div
                animate={{ 
                  y: [0, -15, 0],
                  x: [0, 10, 0],
                  rotate: [0, 10, 0]
                }}
                transition={{ duration: 5, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-4 right-4 md:top-8 md:right-8 w-12 h-12 md:w-16 md:h-16 bg-[#EF6C00]/40 rounded-xl shadow-lg"
                style={{ zIndex: 5 }}
              >
                <Box className="w-full h-full p-2 md:p-3 text-white" />
              </motion.div>
              
              <motion.div
                animate={{ 
                  y: [0, 12, 0],
                  x: [0, -8, 0],
                  rotate: [0, -15, 0]
                }}
                transition={{ duration: 6, delay: 0.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-8 left-4 md:bottom-12 md:left-8 w-10 h-10 md:w-14 md:h-14 bg-[#64B5F6]/40 rounded-xl shadow-lg"
                style={{ zIndex: 5 }}
              >
                <Box className="w-full h-full p-2 text-white" />
              </motion.div>
              
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  x: [0, 5, 0],
                  rotate: [0, 8, 0]
                }}
                transition={{ duration: 5.5, delay: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/3 left-2 md:left-4 w-8 h-8 md:w-12 md:h-12 bg-[#B0BEC5]/40 rounded-lg shadow-lg"
                style={{ zIndex: 5 }}
              >
                <Box className="w-full h-full p-1.5 md:p-2 text-white" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { Button } from './ui/button';
import { LowPolyBackground } from './LowPolyBackground';
import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] md:min-h-screen flex items-center justify-center overflow-hidden pt-16 md:pt-20">
      <div className ="absolute inset-0 -z-10">
      <LowPolyBackground />
      </div>
      
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24 lg:py-32 relative z-10">
        <div className="text-center space-y-4 md:space-y-6">
          <motion.h1 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-[#EF6C00] mb-3 md:mb-4 px-4" 
            style={{ 
              fontSize: 'clamp(32px, 8vw, 64px)',
              fontFamily: "'Noto Sans JP', sans-serif",
              lineHeight: '1.3'
            }}
          >
            地図の上に思い出を建てよう
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-[#7A8A93] mb-6 md:mb-8 px-4"
            style={{ 
              fontSize: 'clamp(16px, 3.5vw, 24px)',
              fontFamily: "'Noto Sans JP', sans-serif",
              lineHeight: '1.6'
            }}
          >
            写真・旅・AIでつながる3Dメモリーアプリ
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mt-8 md:mt-12 px-4"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="bg-[#EF6C00] hover:bg-[#E65100] text-white rounded-full px-6 md:px-8 py-4 md:py-6 shadow-xl w-full sm:w-auto text-sm md:text-base">
                App Storeからダウンロード
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="bg-white hover:bg-gray-50 text-[#EF6C00] rounded-full px-6 md:px-8 py-4 md:py-6 shadow-xl border-2 border-[#EF6C00] w-full sm:w-auto text-sm md:text-base">
                Google Playで手に入れよう
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Hero illustration with floating animation */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-8 md:mt-16 relative px-4"
        >
          <div className="w-full max-w-4xl mx-auto aspect-video md:aspect-video bg-linear-to-b from-[#64B5F6]/20 to-transparent rounded-2xl md:rounded-3xl flex items-center justify-center">
            <div className="text-center space-y-3 md:space-y-4">
              <motion.div 
                animate={{ 
                  y: [0, -12, 0],
                  rotate: [12, 8, 12]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: 'easeInOut' 
                }}
                className="w-20 h-20 md:w-32 md:h-32 bg-[#EF6C00]/20 rounded-2xl md:rounded-3xl mx-auto flex items-center justify-center"
              >
                <div className="w-12 h-12 md:w-20 md:h-20 bg-[#EF6C00] rounded-xl md:rounded-2xl transform rotate-12"></div>
              </motion.div>
              <div className="flex gap-2 md:gap-4 justify-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ 
                      duration: 3, 
                      delay: i * 0.3,
                      repeat: Infinity, 
                      ease: 'easeInOut' 
                    }}
                    className={`w-14 h-14 md:w-24 md:h-24 rounded-xl md:rounded-2xl ${
                      i === 0 ? 'bg-[#64B5F6]/30' : 
                      i === 1 ? 'bg-[#B0BEC5]/30' : 
                      'bg-[#EF6C00]/30'
                    }`}
                  ></motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

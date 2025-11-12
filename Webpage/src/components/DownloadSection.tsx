import { Button } from './ui/button';
import { Apple, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export function DownloadSection() {
  return (
    <section id="download" className="py-20 md:py-28 lg:py-32 bg-gradient-to-br from-[#64B5F6]/10 via-[#FFFDE7] to-[#EF6C00]/10">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1] }}
          className="text-center space-y-6 md:space-y-8"
        >
          <h2 
            className="text-[#EF6C00]"
            style={{ 
              fontSize: 'clamp(32px, 6vw, 48px)',
              fontFamily: "'Noto Sans JP', sans-serif" 
            }}
          >
            今すぐKoconiを体験
          </h2>
          
          <p 
            className="text-[#7A8A93] max-w-2xl mx-auto px-4"
            style={{ 
              fontSize: 'clamp(15px, 3vw, 18px)',
              fontFamily: "'Noto Sans JP', sans-serif",
              lineHeight: '1.7'
            }}
          >
            思い出を形に残す、新しい旅の記録を始めましょう。無料でダウンロードできます。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center flex-wrap pt-6 md:pt-8 px-4">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button className="bg-black hover:bg-gray-800 text-white rounded-xl md:rounded-2xl px-6 md:px-8 py-4 md:py-6 shadow-xl flex items-center gap-3 w-full sm:w-auto">
                <Apple className="w-5 h-5 md:w-6 md:h-6" />
                <div className="text-left">
                  <div className="text-xs opacity-80">Download on the</div>
                  <div className="text-base md:text-lg">App Store</div>
                </div>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button className="bg-black hover:bg-gray-800 text-white rounded-xl md:rounded-2xl px-6 md:px-8 py-4 md:py-6 shadow-xl flex items-center gap-3 w-full sm:w-auto">
                <Smartphone className="w-5 h-5 md:w-6 md:h-6" />
                <div className="text-left">
                  <div className="text-xs opacity-80">GET IT ON</div>
                  <div className="text-base md:text-lg">Google Play</div>
                </div>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

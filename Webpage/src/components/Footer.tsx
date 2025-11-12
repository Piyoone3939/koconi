import { Map, Twitter, Instagram, Github } from 'lucide-react';
import { motion } from 'motion/react';

export function Footer() {
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1 }}
      className="bg-black text-white py-6 md:py-8"
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          <motion.div 
            whileHover={{ rotate: 2 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <div className="w-7 h-7 md:w-8 md:h-8 bg-[#EF6C00] rounded-xl flex items-center justify-center">
              <Map className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span 
              className="text-white" 
              style={{ 
                fontSize: 'clamp(16px, 3vw, 18px)',
                fontFamily: "'Noto Sans JP', sans-serif" 
              }}
            >
              Koconi
            </span>
          </motion.div>
          
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
            <motion.a 
              whileHover={{ y: -2, color: '#64B5F6' }}
              transition={{ duration: 0.2 }}
              href="#terms" 
              className="text-gray-400 hover:text-[#64B5F6] transition-colors"
              style={{ fontSize: 'clamp(12px, 2.2vw, 13px)' }}
            >
              Terms
            </motion.a>
            <motion.a 
              whileHover={{ y: -2, color: '#64B5F6' }}
              transition={{ duration: 0.2 }}
              href="#privacy" 
              className="text-gray-400 hover:text-[#64B5F6] transition-colors"
              style={{ fontSize: 'clamp(12px, 2.2vw, 13px)' }}
            >
              Privacy
            </motion.a>
            <motion.a 
              whileHover={{ y: -2, color: '#64B5F6' }}
              transition={{ duration: 0.2 }}
              href="#contact" 
              className="text-gray-400 hover:text-[#64B5F6] transition-colors"
              style={{ fontSize: 'clamp(12px, 2.2vw, 13px)' }}
            >
              Contact
            </motion.a>
          </nav>
          
          <div className="flex gap-4 md:gap-5">
            <motion.a 
              whileHover={{ 
                scale: 1.15,
                filter: 'drop-shadow(0 0 8px rgba(100, 181, 246, 0.6))'
              }}
              transition={{ duration: 0.2 }}
              href="#twitter" 
              className="text-white hover:text-[#64B5F6] transition-colors"
            >
              <Twitter className="w-4 h-4 md:w-5 md:h-5" />
            </motion.a>
            <motion.a 
              whileHover={{ 
                scale: 1.15,
                filter: 'drop-shadow(0 0 8px rgba(100, 181, 246, 0.6))'
              }}
              transition={{ duration: 0.2 }}
              href="#instagram" 
              className="text-white hover:text-[#64B5F6] transition-colors"
            >
              <Instagram className="w-4 h-4 md:w-5 md:h-5" />
            </motion.a>
            <motion.a 
              whileHover={{ 
                scale: 1.15,
                filter: 'drop-shadow(0 0 8px rgba(100, 181, 246, 0.6))'
              }}
              transition={{ duration: 0.2 }}
              href="#github" 
              className="text-white hover:text-[#64B5F6] transition-colors"
            >
              <Github className="w-4 h-4 md:w-5 md:h-5" />
            </motion.a>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-4 md:mt-6 pt-4 md:pt-5 text-center">
          <p 
            className="text-gray-500"
            style={{ 
              fontFamily: "'Noto Sans JP', sans-serif",
              fontSize: 'clamp(11px, 2vw, 12px)'
            }}
          >
            © 2025 Koconi. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
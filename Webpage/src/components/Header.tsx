import { Map, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { motion, useScroll, useTransform } from 'motion/react';
import { useState } from 'react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.85]);
  const headerBlur = useTransform(scrollY, [0, 100], [0, 8]);

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{ 
        opacity: headerOpacity,
        backdropFilter: `blur(${headerBlur}px)` 
      }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#FFFDE7]/95 border-b border-[#EF6C00]/10"
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between">
        <motion.div 
          className="flex items-center gap-2"
          whileHover={{ rotate: 2 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#EF6C00] rounded-2xl flex items-center justify-center shadow-lg">
            <Map className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <span className="text-[#EF6C00]" style={{ fontSize: '20px', fontFamily: "'Noto Sans JP', sans-serif" }}>
            <span className="md:text-[24px]">Koconi</span>
          </span>
        </motion.div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <a href="#about" className="text-[#B0BEC5] hover:text-[#EF6C00] transition-colors">About</a>
          <a href="#features" className="text-[#B0BEC5] hover:text-[#EF6C00] transition-colors">Features</a>
          <a href="#download" className="text-[#B0BEC5] hover:text-[#EF6C00] transition-colors">Download</a>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button className="bg-[#EF6C00] hover:bg-[#E65100] text-white rounded-full px-4 lg:px-6 py-2 shadow-lg text-sm">
              今すぐ始める
            </Button>
          </motion.div>
        </nav>

        {/* Mobile Menu Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center text-[#EF6C00]"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{ 
          height: isMenuOpen ? 'auto' : 0,
          opacity: isMenuOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="md:hidden overflow-hidden bg-[#FFFDE7] border-t border-[#EF6C00]/10"
      >
        <nav className="flex flex-col gap-4 px-4 py-6">
          <a 
            href="#about" 
            onClick={() => setIsMenuOpen(false)}
            className="text-[#B0BEC5] hover:text-[#EF6C00] transition-colors py-2"
          >
            About
          </a>
          <a 
            href="#features" 
            onClick={() => setIsMenuOpen(false)}
            className="text-[#B0BEC5] hover:text-[#EF6C00] transition-colors py-2"
          >
            Features
          </a>
          <a 
            href="#download" 
            onClick={() => setIsMenuOpen(false)}
            className="text-[#B0BEC5] hover:text-[#EF6C00] transition-colors py-2"
          >
            Download
          </a>
          <Button 
            onClick={() => setIsMenuOpen(false)}
            className="bg-[#EF6C00] hover:bg-[#E65100] text-white rounded-full px-6 py-3 shadow-lg w-full"
          >
            今すぐ始める
          </Button>
        </nav>
      </motion.div>
    </motion.header>
  );
}
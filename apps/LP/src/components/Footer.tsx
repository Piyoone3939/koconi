import { Map, Twitter, Instagram, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer 
      className="bg-black text-white py-6 md:py-8"
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center gap-2 hover:opacity-80 transition">
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
            </div>
          </Link>
          
          {/* Nav */}
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link to="/terms" className="text-gray-400 hover:text-[#64B5F6] transition-colors cursor-pointer" style={{fontSize:'clamp(12px, 2.2vw, 13px)'}}>Terms</Link>
            <Link to="/privacy" className="text-gray-400 hover:text-[#64B5F6] transition-colors cursor-pointer" style={{fontSize:'clamp(12px, 2.2vw, 13px)'}}>Privacy</Link>
            <Link to="/contact" className="text-gray-400 hover:text-[#64B5F6] transition-colors cursor-pointer" style={{fontSize:'clamp(12px, 2.2vw, 13px)'}}>Contact</Link>
          </nav>
          
          {/* SNS */}
          <div className="flex gap-4 md:gap-5">
            <a href="#twitter" className="text-white hover:text-[#64B5F6] transition-colors">
              <Twitter className="w-4 h-4 md:w-5 md:h-5" />
            </a>
            <a href="#instagram" className="text-white hover:text-[#64B5F6] transition-colors">
              <Instagram className="w-4 h-4 md:w-5 md:h-5" />
            </a>
            <a href="#github" className="text-white hover:text-[#64B5F6] transition-colors">
              <Github className="w-4 h-4 md:w-5 md:h-5" />
            </a>
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
    </footer>
  );
}
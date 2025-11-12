import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

export function AlbumSection() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [30, -30]);

  const photos = [
    {
      url: 'https://images.unsplash.com/photo-1701456842118-25046a75483b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBwaG90b2dyYXBoeSUyMGxhbmRtYXJrc3xlbnwxfHx8fDE3NjI4NzY4NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      alt: 'Travel landmark'
    },
    {
      url: 'https://images.unsplash.com/photo-1611612793815-eed1294fcbeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1lcmElMjBwaG9uZSUyMHN1bnNldHxlbnwxfHx8fDE3NjI4NzY4Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      alt: 'Camera phone sunset'
    },
    {
      url: 'https://images.unsplash.com/photo-1668900030471-170e936b201a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMHNjZW5pY3xlbnwxfHx8fDE3NjI4NDU0MDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      alt: 'Mountain landscape'
    },
    {
      url: 'https://images.unsplash.com/photo-1652176862396-99e525e9f87b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc2t5bGluZSUyMHRyYXZlbHxlbnwxfHx8fDE3NjI4MjIwNTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      alt: 'City skyline'
    },
    {
      url: 'https://images.unsplash.com/photo-1661364119336-0b0cc8ab665a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMG9jZWFuJTIwdmFjYXRpb258ZW58MXx8fHwxNzYyODc2ODc4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      alt: 'Beach vacation'
    },
    {
      url: 'https://images.unsplash.com/photo-1628880219734-202e638c17ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3Jlc3QlMjBuYXR1cmUlMjBoaWtpbmd8ZW58MXx8fHwxNzYyNzc2OTg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      alt: 'Forest nature'
    }
  ];

  return (
    <section ref={sectionRef} className="py-20 md:py-28 lg:py-32 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1] }}
          className="text-center text-[#EF6C00] mb-4 md:mb-8"
          style={{ 
            fontSize: 'clamp(32px, 6vw, 48px)',
            fontFamily: "'Noto Sans JP', sans-serif" 
          }}
        >
          あなたの旅をアルバムに
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.645, 0.045, 0.355, 1] }}
          className="text-center text-[#7A8A93] mb-12 md:mb-16 max-w-2xl mx-auto px-4"
          style={{ 
            fontSize: 'clamp(15px, 3vw, 18px)',
            fontFamily: "'Noto Sans JP', sans-serif",
            lineHeight: '1.7'
          }}
        >
          撮影した写真がそのままギャラリーに。時系列で見返したり、場所ごとに整理したり。
        </motion.p>
        
        <motion.div 
          style={{ y }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12"
        >
          {photos.map((photo, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: [0.645, 0.045, 0.355, 1]
              }}
              whileHover={{ 
                scale: 1.05,
                zIndex: 10
              }}
              className="aspect-square rounded-xl md:rounded-2xl overflow-hidden shadow-lg transition-all relative group"
            >
              <ImageWithFallback 
                src={photo.url}
                alt={photo.alt}
                className="w-full h-full object-cover"
              />
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 md:p-4"
              >
                <span 
                  className="text-white text-sm md:text-base" 
                  style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                >
                  {photo.alt}
                </span>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.645, 0.045, 0.355, 1] }}
          className="text-center"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button className="bg-[#EF6C00] hover:bg-[#E65100] text-white rounded-full px-6 md:px-8 py-4 md:py-6 shadow-xl text-sm md:text-base">
              ギャラリーを見る
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
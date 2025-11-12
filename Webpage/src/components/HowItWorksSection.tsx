import { Camera, Sparkles, Map } from 'lucide-react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';

export function HowItWorksSection() {
  const steps = [
    {
      icon: Camera,
      title: '撮る',
      description: '旅先で写真を撮影',
      color: '#64B5F6'
    },
    {
      icon: Sparkles,
      title: 'AIが提案',
      description: 'ランドマークを自動検出',
      color: '#EF6C00'
    },
    {
      icon: Map,
      title: '建てる',
      description: 'マップに3Dで配置',
      color: '#B0BEC5'
    }
  ];

  return (
    <section className="py-20 md:py-28 lg:py-32 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1] }}
          className="text-center text-[#EF6C00] mb-10 md:mb-16"
          style={{ 
            fontSize: 'clamp(32px, 6vw, 48px)',
            fontFamily: "'Noto Sans JP', sans-serif" 
          }}
        >
          使い方はシンプル
        </motion.h2>
        
        {/* Desktop: Horizontal Layout */}
        <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-6 lg:gap-8">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ 
                  duration: 0.9, 
                  delay: index * 0.2,
                  ease: [0.645, 0.045, 0.355, 1]
                }}
                className="text-center"
              >
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl lg:rounded-3xl flex items-center justify-center mb-4 mx-auto shadow-lg"
                  style={{ backgroundColor: `${step.color}20` }}
                >
                  <step.icon className="w-12 h-12 lg:w-16 lg:h-16" style={{ color: step.color }} />
                </motion.div>
                <h3 
                  className="mb-2"
                  style={{ 
                    fontSize: 'clamp(24px, 4vw, 28px)',
                    fontFamily: "'Noto Sans JP', sans-serif", 
                    color: step.color 
                  }}
                >
                  {step.title}
                </h3>
                <p 
                  className="text-[#7A8A93]" 
                  style={{ 
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 'clamp(14px, 2vw, 16px)'
                  }}
                >
                  {step.description}
                </p>
              </motion.div>
              
              {index < steps.length - 1 && (
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: 'easeInOut' 
                  }}
                >
                  <ArrowRight className="w-8 h-8 text-[#B0BEC5] flex-shrink-0" />
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: Vertical Layout */}
        <div className="md:hidden space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.2,
                  ease: [0.645, 0.045, 0.355, 1]
                }}
                className="text-center w-full"
              >
                <motion.div 
                  whileTap={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="w-28 h-28 rounded-3xl flex items-center justify-center mb-4 mx-auto shadow-lg"
                  style={{ backgroundColor: `${step.color}20` }}
                >
                  <step.icon className="w-14 h-14" style={{ color: step.color }} />
                </motion.div>
                <h3 
                  className="mb-2"
                  style={{ 
                    fontSize: '26px',
                    fontFamily: "'Noto Sans JP', sans-serif", 
                    color: step.color 
                  }}
                >
                  {step.title}
                </h3>
                <p 
                  className="text-[#7A8A93]" 
                  style={{ 
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: '15px'
                  }}
                >
                  {step.description}
                </p>
              </motion.div>
              
              {index < steps.length - 1 && (
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: 'easeInOut' 
                  }}
                  className="my-4"
                >
                  <ArrowDown className="w-8 h-8 text-[#B0BEC5]" />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
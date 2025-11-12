import { MapPin, Camera, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export function FeaturesSection() {
  const features = [
    {
      icon: MapPin,
      title: '経路を塗る',
      description: 'あなたの旅の軌跡をマップ上に記録。訪れた場所を3Dで視覚化します。',
      color: '#64B5F6'
    },
    {
      icon: Camera,
      title: '写真で建てる',
      description: 'AIが写真からランドマークを検出。思い出が3Dモデルとしてマップに追加されます。',
      color: '#EF6C00'
    },
    {
      icon: Users,
      title: '思い出をシェア',
      description: '招待制のグループで旅の記憶を共有。大切な人とだけ思い出を分かち合えます。',
      color: '#B0BEC5'
    }
  ];

  return (
    <section id="features" className="py-20 md:py-28 lg:py-32 bg-gradient-to-b from-[#B0BEC5]/5 to-white">
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
          Koconiでできること
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.2,
                ease: [0.645, 0.045, 0.355, 1]
              }}
              whileHover={{ 
                y: -8,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
              className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-lg transition-all duration-300"
            >
              <motion.div 
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6"
                style={{ backgroundColor: `${feature.color}20` }}
              >
                <feature.icon className="w-7 h-7 md:w-8 md:h-8" style={{ color: feature.color }} />
              </motion.div>
              <h3 
                className="mb-3 md:mb-4"
                style={{ 
                  fontSize: 'clamp(20px, 4vw, 24px)',
                  fontFamily: "'Noto Sans JP', sans-serif", 
                  color: feature.color 
                }}
              >
                {feature.title}
              </h3>
              <p 
                className="text-[#7A8A93]" 
                style={{ 
                  fontFamily: "'Noto Sans JP', sans-serif",
                  fontSize: 'clamp(14px, 2.5vw, 16px)',
                  lineHeight: '1.7'
                }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

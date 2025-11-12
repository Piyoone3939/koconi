import { Shield, Lock, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

export function PrivacySection() {
  const privacyFeatures = [
    {
      icon: Shield,
      title: 'オンデバイスAI処理',
      description: '写真の解析はあなたの端末内で完結。外部サーバーに送信されません。'
    },
    {
      icon: UserCheck,
      title: '招待制の共有',
      description: 'あなたが許可した人とだけ思い出を共有。完全なプライバシーコントロール。'
    },
    {
      icon: Lock,
      title: '安全なデータ管理',
      description: 'エンドツーエンド暗号化で、あなたの大切な思い出を守ります。'
    }
  ];

  return (
    <section className="py-20 md:py-28 lg:py-32 bg-gradient-to-b from-white to-[#FFFDE7]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1] }}
          className="text-center text-[#EF6C00] mb-4 md:mb-8"
          style={{ 
            fontSize: 'clamp(28px, 6vw, 48px)',
            fontFamily: "'Noto Sans JP', sans-serif" 
          }}
        >
          プライバシーファースト設計
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
          あなたの思い出はあなただけのもの。Koconiは徹底したプライバシー保護で安心を提供します。
        </motion.p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {privacyFeatures.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.3,
                ease: [0.645, 0.045, 0.355, 1]
              }}
              className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-lg text-center"
            >
              <motion.div 
                animate={index === 2 ? { 
                  rotate: [-2, 2, -2]
                } : {}}
                transition={index === 2 ? { 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: 'easeInOut' 
                } : {}}
                className="w-14 h-14 md:w-16 md:h-16 bg-[#64B5F6]/20 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 mx-auto"
              >
                <feature.icon className="w-7 h-7 md:w-8 md:h-8 text-[#64B5F6]" />
              </motion.div>
              <h3 
                className="text-[#EF6C00] mb-3 md:mb-4"
                style={{ 
                  fontSize: 'clamp(18px, 3.5vw, 20px)',
                  fontFamily: "'Noto Sans JP', sans-serif" 
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
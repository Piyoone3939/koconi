import { Camera, Cpu, Map, Box } from "lucide-react";
import { motion } from "framer-motion";

export function AISection() {
  const centerIcon = {
    Icon: Cpu,
    label: "AI解析",
    color: "#EF6C00",
  };
  const orbitIcons = [
    { Icon: Camera, label: "写真", color: "#64B5F6", angle: 0 },
    {
      Icon: Map,
      label: "マップ",
      color: "#B0BEC5",
      angle: 120,
    },
    {
      Icon: Box,
      label: "3D配置",
      color: "#EF6C00",
      angle: 240,
    },
  ];

  const orbitRadiusPercent = 42;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1 }}
      className="py-20 md:py-28 lg:py-32 bg-linear-to-br from-[#FFFDE7] via-white to-[#B0BEC5]/10 relative overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        {/* タイトル */}
        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center text-[#EF6C00] mb-4 md:mb-8"
          style={{
            fontSize: "clamp(28px, 6vw, 48px)",
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          ローポリ×AIが思い出を形に
        </motion.h2>

        {/* 説明 */}
        <p
          className="text-center text-[#7A8A93] mb-12 md:mb-16 max-w-2xl mx-auto px-4"
          style={{
            fontSize: "clamp(15px, 3vw, 18px)",
            fontFamily: "'Noto Sans JP', sans-serif",
            lineHeight: "1.7",
          }}
        >
          最新のAI技術とレトロなローポリアートの融合で、あなたの思い出を温かく、美しく保存します。
        </p>

        {/* メイン構造 */}
        <div className="flex items-center justify-center min-h-[500px] sm:min-h-[550px] md:min-h-[600px] relative">
          {/* === CPUアイコン（真円・静止） === */}
          <div
            className="absolute flex items-center justify-center bg-[#EF6C00] rounded-full shadow-2xl"
            style={{
              width: "120px",
              height: "120px",
              aspectRatio: "1 / 1", // ← 真円固定
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            {/* 発光 */}
            <div className="absolute inset-0 rounded-full bg-[#EF6C00]/20 blur-3xl animate-pulse"></div>

            {/* 呼吸スケール */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex items-center justify-center w-full h-full"
            >
              <centerIcon.Icon
                className="text-white"
                style={{ width: "55%", height: "55%" }}
              />
            </motion.div>
          </div>

          {/* === 回転全体 === */}
          <motion.div
            className="relative flex items-center justify-center"
            style={{
              width: "min(420px, 90vw)",
              height: "min(420px, 90vw)",
              transformOrigin: "center center",
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 28,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {/* 外周リング */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#EF6C00]/20" />

            {/* パルスリング */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute rounded-full bg-linear-to-br from-[#EF6C00]/10 to-[#64B5F6]/10"
              style={{
                width: "75%",
                height: "75%",
                top: "12.5%",
                left: "12.5%",
              }}
            />

            {/* === 回転アイコンたち === */}
            {orbitIcons.map((item, index) => {
              const angleRad = (item.angle * Math.PI) / 180;
              const x = Math.cos(angleRad);
              const y = Math.sin(angleRad);
              const leftPercent = 50 + x * orbitRadiusPercent;
              const topPercent = 50 + y * orbitRadiusPercent;

              return (
                <motion.div
                  key={index}
                  className="absolute"
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                      rotate: {
                        duration: 28,
                        repeat: Infinity,
                        ease: "linear",
                      },
                    }}
                    className="relative"
                  >
                    <div
                      className="rounded-full flex items-center justify-center shadow-xl relative"
                      style={{
                        backgroundColor: item.color,
                        width: "clamp(64px, 18vw, 96px)",
                        height: "clamp(64px, 18vw, 96px)",
                        aspectRatio: "1 / 1", // ← 各アイコンも真円固定
                      }}
                    >
                      <item.Icon
                        style={{
                          color: '#FFFFFF',
                          width: "50%",
                          height: "50%",
                        }}
                      />
                    </div>
                    <div
                      className="absolute text-center w-full"
                      style={{
                        color: item.color,
                        fontSize: "clamp(12px, 3.2vw, 15px)",
                        fontFamily:
                          "'Noto Sans JP', sans-serif",
                        bottom: "-28px",
                      }}
                    >
                      {item.label}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

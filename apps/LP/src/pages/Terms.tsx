import { motion } from "framer-motion";
import { FileText, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Terms() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#FFFDE7] via-white to-[#B0BEC5]/10">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="pt-32 pb-16 md:pt-40 md:pb-20 px-4"
      >
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 mb-8"
          >
            <Link
              to="/"
              className="text-[#B0BEC5] hover:text-[#EF6C00] transition-colors"
              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              ホーム
            </Link>
            <ChevronRight className="w-4 h-4 text-[#B0BEC5]" />
            <span
              className="text-[#EF6C00]"
              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              利用規約
            </span>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="bg-[#EF6C00] p-4 rounded-2xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1
              className="text-[#EF6C00]"
              style={{
                fontSize: "clamp(32px, 6vw, 48px)",
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              利用規約
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-[#7A8A93] mb-12"
            style={{
              fontSize: "clamp(14px, 2.5vw, 16px)",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            最終更新日：2025年11月21日
          </motion.p>
        </div>
      </motion.section>

      {/* Content Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="pb-20 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
            <div
              className="prose prose-lg max-w-none"
              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              <Section title="第1条（はじめに）">
                <p>
                  この利用規約（以下「本規約」といいます）は、Koconi（以下「当アプリ」といいます）が提供するサービス（以下「本サービス」といいます）の利用条件を定めるものです。ユーザーの皆様には、本規約に従って本サービスをご利用いただきます。
                </p>
              </Section>

              <Section title="第2条（適用範囲）">
                <p>
                  本規約は、本サービスの利用に関わる当アプリとユーザーとの間の一切の関係に適用されます。
                </p>
                <p>
                  当アプリは、本サービスに関して、本規約のほか、ご利用にあたってのルール等、各種の定めをすることがあります。これらの定めは、その名称の如何に関わらず、本規約の一部を構成するものとします。
                </p>
              </Section>

              <Section title="第3条（アカウントの登録）">
                <ul>
                  <li>
                    ユーザーは、本サービスの利用に際してアカウント登録を行う場合、真実、正確かつ完全な情報を提供しなければなりません。
                  </li>
                  <li>
                    ユーザーは、登録情報に変更があった場合、速やかに変更内容を当アプリに通知するものとします。
                  </li>
                  <li>
                    ユーザーは、自己の責任において、パスワードおよびアカウント情報を管理するものとします。
                  </li>
                </ul>
              </Section>

              <Section title="第4条（サービスの内容）">
                <p>本サービスは、以下の機能を提供します：</p>
                <ul>
                  <li>写真からAIによる自動ランドマーク検出</li>
                  <li>検出されたランドマークの3Dローポリモデル化</li>
                  <li>思い出を3Dマップ上で可視化</li>
                  <li>写真とマップの統合管理</li>
                </ul>
              </Section>

              <Section title="第5条（禁止事項）">
                <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません：</p>
                <ul>
                  <li>法令または公序良俗に違反する行為</li>
                  <li>犯罪行為に関連する行為</li>
                  <li>
                    当アプリのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為
                  </li>
                  <li>当アプリのサービスの運営を妨害するおそれのある行為</li>
                  <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                  <li>他のユーザーに成りすます行為</li>
                  <li>
                    当アプリのサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為
                  </li>
                  <li>その他、当アプリが不適切と判断する行為</li>
                </ul>
              </Section>

              <Section title="第6条（知的財産権）">
                <p>
                  本サービスに関する著作権、商標権その他の知的財産権は、すべて当アプリまたは当アプリにライセンスを許諾している第三者に帰属します。
                </p>
                <p>
                  ユーザーが本サービスを利用してアップロードしたコンテンツの著作権は、ユーザーに帰属します。ただし、当アプリは、本サービスの提供、改善、プロモーション等の目的で、ユーザーコンテンツを使用できるものとします。
                </p>
              </Section>

              <Section title="第7条（サービスの変更・終了）">
                <p>
                  当アプリは、ユーザーへの事前の通知なく、本サービスの内容を変更、または本サービスの提供を中止もしくは終了することができるものとします。
                </p>
              </Section>

              <Section title="第8条（免責事項）">
                <ul>
                  <li>
                    当アプリは、本サービスに関して、その正確性、完全性、有用性等について、いかなる保証も行いません。
                  </li>
                  <li>
                    当アプリは、本サービスに起因してユーザーに生じたあらゆる損害について、一切の責任を負いません。
                  </li>
                  <li>
                    AI機能による検出結果の正確性について、当アプリは保証するものではありません。
                  </li>
                </ul>
              </Section>

              <Section title="第9条（規約の変更）">
                <p>
                  当アプリは、ユーザーへの事前の通知なく、本規約を変更することができるものとします。変更後の利用規約は、当アプリが定める方法により通知した時点で効力を生じるものとします。
                </p>
              </Section>

              <Section title="第10条（準拠法・管轄裁判所）">
                <p>本規約の解釈にあたっては、日本法を準拠法とします。</p>
                <p>
                  本サービスに関して紛争が生じた場合には、当アプリの所在地を管轄する裁判所を専属的合意管轄裁判所とします。
                </p>
              </Section>

              <Section title="第11条（お問い合わせ）">
                <p>
                  本規約に関するお問い合わせは、
                  <Link
                    to="/contact"
                    className="text-[#EF6C00] hover:text-[#64B5F6] transition-colors underline"
                  >
                    お問い合わせページ
                  </Link>
                  よりご連絡ください。
                </p>
              </Section>
            </div>
          </div>

          {/* Back to Home Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-12 text-center"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#EF6C00] text-white rounded-full hover:bg-[#64B5F6] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              ホームに戻る
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2
        className="text-[#EF6C00] mb-4"
        style={{
          fontSize: "clamp(20px, 4vw, 28px)",
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        {title}
      </h2>
      <div className="text-[#4A5568] leading-relaxed space-y-4">{children}</div>
    </div>
  );
}
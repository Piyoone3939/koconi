import { motion } from "framer-motion";
import { Shield, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Privacy() {
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
              プライバシーポリシー
            </span>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="bg-[#64B5F6] p-4 rounded-2xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1
              className="text-[#EF6C00]"
              style={{
                fontSize: "clamp(32px, 6vw, 48px)",
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              プライバシーポリシー
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
              <Section title="1. はじめに">
                <p>
                  Koconi（以下「当アプリ」といいます）は、ユーザーのプライバシーを尊重し、個人情報の保護に最大限の注意を払います。本プライバシーポリシーは、当アプリがどのようにユーザーの情報を収集、使用、共有、保護するかを説明するものです。
                </p>
              </Section>

              <Section title="2. 収集する情報">
                <h3 className="text-[#64B5F6] mt-6 mb-3">2.1 ユーザー提供情報</h3>
                <ul>
                  <li>アカウント情報（メールアドレス、ユーザー名など）</li>
                  <li>プロフィール情報</li>
                  <li>アップロードされた写真および画像データ</li>
                  <li>お問い合わせ内容</li>
                </ul>

                <h3 className="text-[#64B5F6] mt-6 mb-3">2.2 自動収集情報</h3>
                <ul>
                  <li>デバイス情報（OS、ブラウザタイプ、IPアドレスなど）</li>
                  <li>位置情報（ユーザーの許可を得た場合のみ）</li>
                  <li>アプリの使用状況データ</li>
                  <li>クラッシュレポートおよびパフォーマンスデータ</li>
                </ul>

                <h3 className="text-[#64B5F6] mt-6 mb-3">2.3 写真メタデータ</h3>
                <ul>
                  <li>位置情報（EXIF データ）</li>
                  <li>撮影日時</li>
                  <li>カメラ情報</li>
                </ul>
              </Section>

              <Section title="3. 情報の使用目的">
                <p>収集した情報は、以下の目的で使用されます：</p>
                <ul>
                  <li>本サービスの提供、維持、改善</li>
                  <li>AIによるランドマーク検出および3Dモデル生成</li>
                  <li>ユーザーサポートの提供</li>
                  <li>新機能の開発とサービス品質の向上</li>
                  <li>利用規約違反への対応</li>
                  <li>サービスに関する通知の送信</li>
                  <li>統計データの作成（個人を特定できない形式）</li>
                </ul>
              </Section>

              <Section title="4. AI処理とデータの取り扱い">
                <p>
                  当アプリは、AI技術を使用して写真からランドマークを検出し、3Dモデルを生成します：
                </p>
                <ul>
                  <li>
                    アップロードされた写真は、AI処理のためにサーバーに送信されます
                  </li>
                  <li>
                    AI処理は、画像認識モデルのトレーニングには使用されません（オプトイン設定を除く）
                  </li>
                  <li>
                    処理後の画像は、ユーザーが削除するまでサーバーに保管されます
                  </li>
                  <li>AI処理結果（検出されたランドマーク情報）は、ユーザーアカウントに紐付けて保存されます</li>
                </ul>
              </Section>

              <Section title="5. 情報の共有">
                <p>
                  当アプリは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません：
                </p>
                <ul>
                  <li>ユーザーの同意がある場合</li>
                  <li>法令に基づく場合</li>
                  <li>人の生命、身体または財産の保護のために必要がある場合</li>
                  <li>
                    サービス提供に必要な範囲で、業務委託先に提供する場合（AI処理プロバイダー、クラウドストレージなど）
                  </li>
                </ul>

                <h3 className="text-[#64B5F6] mt-6 mb-3">5.1 第三者サービス</h3>
                <p>当アプリは、以下の第三者サービスを使用しています：</p>
                <ul>
                  <li>クラウドストレージプロバイダー（写真の保存）</li>
                  <li>AI / 機械学習サービス（ランドマーク検出）</li>
                  <li>分析ツール（アプリ改善のため）</li>
                </ul>
              </Section>

              <Section title="6. データのセキュリティ">
                <p>
                  当アプリは、ユーザー情報の安全性を確保するため、以下の対策を講じています：
                </p>
                <ul>
                  <li>SSL/TLS暗号化通信</li>
                  <li>データベースの暗号化</li>
                  <li>アクセス制限とログ監視</li>
                  <li>定期的なセキュリティ監査</li>
                </ul>
              </Section>

              <Section title="7. ユーザーの権利">
                <p>ユーザーは、以下の権利を有します：</p>
                <ul>
                  <li>
                    <strong>アクセス権：</strong>自分の個人情報へのアクセスを要求できます
                  </li>
                  <li>
                    <strong>訂正権：</strong>不正確な個人情報の訂正を要求できます
                  </li>
                  <li>
                    <strong>削除権：</strong>自分の個人情報の削除を要求できます
                  </li>
                  <li>
                    <strong>データポータビリティ：</strong>自分のデータのエクスポートを要求できます
                  </li>
                  <li>
                    <strong>処理の制限：</strong>特定の処理の停止を要求できます
                  </li>
                </ul>
                <p>
                  これらの権利を行使するには、
                  <Link
                    to="/contact"
                    className="text-[#EF6C00] hover:text-[#64B5F6] transition-colors underline"
                  >
                    お問い合わせページ
                  </Link>
                  よりご連絡ください。
                </p>
              </Section>

              <Section title="8. Cookie とトラッキング技術">
                <p>
                  当アプリは、以下の目的でCookieおよび類似の技術を使用します：
                </p>
                <ul>
                  <li>ログイン状態の維持</li>
                  <li>ユーザー設定の保存</li>
                  <li>サービス利用状況の分析</li>
                  <li>広告の最適化（将来的に導入する可能性があります）</li>
                </ul>
                <p>
                  ブラウザの設定でCookieを無効にすることができますが、一部機能が利用できなくなる場合があります。
                </p>
              </Section>

              <Section title="9. 子供のプライバシー">
                <p>
                  当アプリは、13歳未満の子供から意図的に個人情報を収集することはありません。13歳未満の子供が個人情報を提供したことが判明した場合、速やかにその情報を削除します。
                </p>
              </Section>

              <Section title="10. データの保持期間">
                <p>
                  ユーザーの個人情報は、サービス提供に必要な期間、または法令で定められた期間保持されます。アカウントを削除した場合、通常30日以内にすべての個人情報が削除されます。
                </p>
              </Section>

              <Section title="11. 国際的なデータ転送">
                <p>
                  ユーザーの情報は、日本国外のサーバーに保存される場合があります。その場合、適切な保護措置を講じた上でデータを転送します。
                </p>
              </Section>

              <Section title="12. ポリシーの変更">
                <p>
                  当アプリは、本プライバシーポリシーを随時更新することがあります。重要な変更がある場合は、アプリ内通知またはメールでお知らせします。
                </p>
              </Section>

              <Section title="13. お問い合わせ">
                <p>
                  プライバシーに関するご質問やご懸念がある場合は、
                  <Link
                    to="/contact"
                    className="text-[#EF6C00] hover:text-[#64B5F6] transition-colors underline"
                  >
                    お問い合わせページ
                  </Link>
                  よりご連絡ください。
                </p>
                <p className="mt-4">
                  <strong>Koconi運営チーム</strong>
                  <br />
                  メール: privacy@koconi.app
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
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#64B5F6] text-white rounded-full hover:bg-[#EF6C00] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
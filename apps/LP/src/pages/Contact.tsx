import { motion } from "framer-motion";
import { Mail, MessageSquare, Send, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const CONTACT_ENDPOINT = import.meta.env.VITE_CONTACT_FORM_ENDPOINT as string | undefined;

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (CONTACT_ENDPOINT) {
        const res = await fetch(CONTACT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error(`送信に失敗しました (${res.status})`);
      } else {
        // エンドポイント未設定時は mailto: で開く
        const body = encodeURIComponent(
          `お名前: ${formData.name}\nメールアドレス: ${formData.email}\n種別: ${formData.subject}\n\n${formData.message}`
        );
        window.location.href = `mailto:support@koconi.com?subject=${encodeURIComponent(`[お問い合わせ] ${formData.subject}`)}&body=${body}`;
      }

      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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
              お問い合わせ
            </span>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="bg-[#B0BEC5] p-4 rounded-2xl shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1
              className="text-[#EF6C00]"
              style={{
                fontSize: "clamp(32px, 6vw, 48px)",
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              お問い合わせ
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
              lineHeight: "1.7",
            }}
          >
            Koconiに関するご質問、ご要望、不具合報告など、お気軽にお問い合わせください。通常2〜3営業日以内にご返信いたします。
          </motion.p>
        </div>
      </motion.section>

      {/* Contact Form Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="pb-20 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Contact Info Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="bg-[#EF6C00]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-[#EF6C00]" />
              </div>
              <h3
                className="text-[#EF6C00] mb-2"
                style={{
                  fontSize: "clamp(16px, 3vw, 18px)",
                  fontFamily: "'Noto Sans JP', sans-serif",
                }}
              >
                メール
              </h3>
              <p
                className="text-[#7A8A93]"
                style={{
                  fontSize: "clamp(13px, 2.5vw, 14px)",
                  fontFamily: "'Noto Sans JP', sans-serif",
                }}
              >
                support@koconi.com
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="bg-[#64B5F6]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-[#64B5F6]" />
              </div>
              <h3
                className="text-[#EF6C00] mb-2"
                style={{
                  fontSize: "clamp(16px, 3vw, 18px)",
                  fontFamily: "'Noto Sans JP', sans-serif",
                }}
              >
                対応時間
              </h3>
              <p
                className="text-[#7A8A93]"
                style={{
                  fontSize: "clamp(13px, 2.5vw, 14px)",
                  fontFamily: "'Noto Sans JP', sans-serif",
                }}
              >
                平日 10:00 - 18:00
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="bg-[#B0BEC5]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Send className="w-6 h-6 text-[#B0BEC5]" />
              </div>
              <h3
                className="text-[#EF6C00] mb-2"
                style={{
                  fontSize: "clamp(16px, 3vw, 18px)",
                  fontFamily: "'Noto Sans JP', sans-serif",
                }}
              >
                返信目安
              </h3>
              <p
                className="text-[#7A8A93]"
                style={{
                  fontSize: "clamp(13px, 2.5vw, 14px)",
                  fontFamily: "'Noto Sans JP', sans-serif",
                }}
              >
                2〜3営業日以内
              </p>
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="bg-white rounded-3xl shadow-xl p-8 md:p-12"
          >
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="bg-[#64B5F6]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send className="w-10 h-10 text-[#64B5F6]" />
                </div>
                <h3
                  className="text-[#EF6C00] mb-4"
                  style={{
                    fontSize: "clamp(22px, 4vw, 28px)",
                    fontFamily: "'Noto Sans JP', sans-serif",
                  }}
                >
                  送信完了しました
                </h3>
                <p
                  className="text-[#7A8A93]"
                  style={{
                    fontSize: "clamp(14px, 2.5vw, 16px)",
                    fontFamily: "'Noto Sans JP', sans-serif",
                  }}
                >
                  お問い合わせいただきありがとうございます。
                  <br />
                  2〜3営業日以内にご返信いたします。
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-[#4A5568] mb-2"
                      style={{
                        fontSize: "clamp(14px, 2.5vw, 16px)",
                        fontFamily: "'Noto Sans JP', sans-serif",
                      }}
                    >
                      お名前 <span className="text-[#EF6C00]">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#B0BEC5]/30 focus:border-[#EF6C00] focus:outline-none transition-colors"
                      style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                      placeholder="山田太郎"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-[#4A5568] mb-2"
                      style={{
                        fontSize: "clamp(14px, 2.5vw, 16px)",
                        fontFamily: "'Noto Sans JP', sans-serif",
                      }}
                    >
                      メールアドレス <span className="text-[#EF6C00]">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#B0BEC5]/30 focus:border-[#EF6C00] focus:outline-none transition-colors"
                      style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-[#4A5568] mb-2"
                    style={{
                      fontSize: "clamp(14px, 2.5vw, 16px)",
                      fontFamily: "'Noto Sans JP', sans-serif",
                    }}
                  >
                    お問い合わせ種別 <span className="text-[#EF6C00]">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#B0BEC5]/30 focus:border-[#EF6C00] focus:outline-none transition-colors"
                    style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                  >
                    <option value="">選択してください</option>
                    <option value="general">一般的なお問い合わせ</option>
                    <option value="bug">不具合報告</option>
                    <option value="feature">機能リクエスト</option>
                    <option value="account">アカウントについて</option>
                    <option value="privacy">プライバシーについて</option>
                    <option value="other">その他</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-[#4A5568] mb-2"
                    style={{
                      fontSize: "clamp(14px, 2.5vw, 16px)",
                      fontFamily: "'Noto Sans JP', sans-serif",
                    }}
                  >
                    お問い合わせ内容 <span className="text-[#EF6C00]">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#B0BEC5]/30 focus:border-[#EF6C00] focus:outline-none transition-colors resize-none"
                    style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                    placeholder="お問い合わせ内容をご記入ください"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agree"
                    required
                    className="mt-1 w-5 h-5 rounded border-2 border-[#B0BEC5]/30 text-[#EF6C00] focus:ring-[#EF6C00]"
                  />
                  <label
                    htmlFor="agree"
                    className="text-[#7A8A93]"
                    style={{
                      fontSize: "clamp(13px, 2.5vw, 14px)",
                      fontFamily: "'Noto Sans JP', sans-serif",
                    }}
                  >
                    <Link
                      to="/privacy"
                      className="text-[#EF6C00] hover:text-[#64B5F6] transition-colors underline"
                    >
                      プライバシーポリシー
                    </Link>
                    に同意します
                  </label>
                </div>

                {submitError ? (
                  <p
                    className="text-red-500 text-sm text-center"
                    style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                  >
                    {submitError}
                  </p>
                ) : null}

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={isSubmitting ? {} : { scale: 1.02 }}
                  whileTap={isSubmitting ? {} : { scale: 0.98 }}
                  className="w-full py-4 bg-[#EF6C00] text-white rounded-full hover:bg-[#64B5F6] transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    fontSize: "clamp(15px, 3vw, 18px)",
                    fontFamily: "'Noto Sans JP', sans-serif",
                  }}
                >
                  <Send className="w-5 h-5" />
                  {isSubmitting ? "送信中..." : "送信する"}
                </motion.button>
              </form>
            )}
          </motion.div>

          {/* Back to Home Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-12 text-center"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#B0BEC5] text-white rounded-full hover:bg-[#EF6C00] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
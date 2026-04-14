import React, { createContext, useCallback, useContext, useState } from "react";
import { STORAGE_KEYS, readStored, writeStored } from "@/utils/storage";

type Lang = "en" | "vi";

const translations = {
  // ── Tab bar ──
  tab_profile: { en: "Profile", vi: "Hồ sơ" },
  tab_discover: { en: "Discover", vi: "Khám phá" },
  tab_bridge: { en: "Bridge", vi: "Kết nối" },
  tab_qa: { en: "Q&A", vi: "Hỏi đáp" },
  tab_chat: { en: "Chat", vi: "Trò chuyện" },

  // ── Bridge / People ──
  bridge_header: { en: "SkillBridge", vi: "SkillBridge" },
  bridge_reset_title: { en: "Reset Demo State", vi: "Đặt lại bản demo" },
  bridge_reset_body: {
    en: "Restore starting demo setup with queued matches, active chats, and a fresh Bridge deck?",
    vi: "Khôi phục bản demo với hàng đợi kết nối, trò chuyện, và bộ thẻ mới?",
  },
  bridge_cancel: { en: "Cancel", vi: "Huỷ" },
  bridge_reset: { en: "Reset", vi: "Đặt lại" },
  profiles_left: { en: "profiles left", vi: "hồ sơ còn lại" },
  swipe_hint: {
    en: "Swipe right for a match or left to pass.",
    vi: "Vuốt phải để kết nối, trái để bỏ qua.",
  },
  no_more_matches: { en: "No more matches", vi: "Hết hồ sơ" },
  no_more_matches_hint: {
    en: "Check Discover or update your learning profile.",
    vi: "Xem Khám phá hoặc cập nhật hồ sơ học tập.",
  },
  overlay_skip: { en: "SKIP", vi: "BỎ QUA" },
  overlay_bridge: { en: "BRIDGE", vi: "KẾT NỐI" },
  matched_with: { en: "Matched with", vi: "Đã kết nối với" },
  open_chat_to_message: {
    en: "Open Chat to message.",
    vi: "Mở Trò chuyện để nhắn tin.",
  },
  waiting_mutual: {
    en: "Waiting for a mutual match with",
    vi: "Đang chờ kết nối từ",
  },
  skipped: { en: "skipped.", vi: "đã bỏ qua." },
  suggestions_refreshed: {
    en: "Suggestions refreshed. Previously skipped profiles can reappear.",
    vi: "Đã làm mới gợi ý. Hồ sơ đã bỏ qua có thể xuất hiện lại.",
  },
  can_teach: { en: "Can teach", vi: "Có thể dạy" },
  wants: { en: "Wants", vi: "Muốn học" },
  goal: { en: "Goal", vi: "Mục tiêu" },
  wants_to_learn: { en: "Wants to learn", vi: "Muốn học" },
  close: { en: "Close", vi: "Đóng" },

  // ── Discover ──
  discover_header: { en: "Discover", vi: "Khám phá" },
  discover_mvp_title: { en: "SkillBridge MVP", vi: "SkillBridge MVP" },
  discover_mvp_body: {
    en: "Find a learning partner, book a tutor, or save a verified resource.",
    vi: "Tìm bạn học, đặt gia sư, hoặc lưu tài liệu đã xác minh.",
  },
  discover_status_default: {
    en: "Choose a partner, tutor, or resource.",
    vi: "Chọn bạn học, gia sư, hoặc tài liệu.",
  },
  partners_title: {
    en: "Learning partners for you",
    vi: "Bạn học phù hợp với bạn",
  },
  partners_subtitle: {
    en: "People whose strengths and goals complement your own.",
    vi: "Những người có thế mạnh và mục tiêu bổ trợ cho bạn.",
  },
  same_goal_title: { en: "Same learning goal", vi: "Cùng mục tiêu học" },
  same_goal_subtitle: {
    en: "Learners working toward similar outcomes this week.",
    vi: "Người học đang hướng đến kết quả tương tự tuần này.",
  },
  tutor_title: { en: "Tutor marketplace", vi: "Sàn gia sư" },
  tutor_subtitle: {
    en: "Paid or skill-swap tutors you can book for focused help.",
    vi: "Gia sư trả phí hoặc trao đổi kỹ năng, đặt lịch hỗ trợ.",
  },
  resource_title: { en: "Verified resources", vi: "Tài liệu xác minh" },
  resource_subtitle: {
    en: "Starter materials for common goals, synced from Appwrite when configured.",
    vi: "Tài liệu khởi đầu cho các mục tiêu phổ biến.",
  },
  request_bridge: { en: "Request bridge", vi: "Gửi kết nối" },
  shortlist: { en: "Shortlist", vi: "Lưu lại" },
  save_resource: { en: "Save resource", vi: "Lưu tài liệu" },
  saved: { en: "Saved", vi: "Đã lưu" },
  bridge_request_saved: {
    en: "Bridge request saved for",
    vi: "Đã gửi kết nối đến",
  },
  tutor_shortlisted: {
    en: "added to your tutor shortlist.",
    vi: "đã thêm vào danh sách gia sư.",
  },
  resource_saved: {
    en: "saved to your library.",
    vi: "đã lưu vào thư viện.",
  },
  open: { en: "Open", vi: "Mở" },

  // ── Profile ──
  profile_header: { en: "Profile", vi: "Hồ sơ" },
  profile_default_name: { en: "SkillBridge Learner", vi: "Người học SkillBridge" },
  profile_default_goal: {
    en: "Add a learning goal to improve matches.",
    vi: "Thêm mục tiêu học tập để cải thiện kết nối.",
  },
  switch_account: { en: "Switch account", vi: "Đổi tài khoản" },
  sign_out: { en: "Sign out", vi: "Đăng xuất" },
  signing_out: { en: "Signing out...", vi: "Đang đăng xuất..." },
  profile_strength: {
    en: "Learning profile strength",
    vi: "Độ hoàn thiện hồ sơ",
  },
  profile_strength_hint: {
    en: "Complete your skills, availability, and goal to improve match quality.",
    vi: "Hoàn thiện kỹ năng, lịch rảnh, và mục tiêu để cải thiện kết nối.",
  },
  edit_profile: { en: "Edit learning profile", vi: "Chỉnh sửa hồ sơ" },
  placeholder_name: { en: "Display name", vi: "Tên hiển thị" },
  field_role: { en: "Role", vi: "Vai trò" },
  role_learner: { en: "Learner", vi: "Người học" },
  role_tutor: { en: "Tutor", vi: "Gia sư" },
  role_both: { en: "Both", vi: "Cả hai" },
  placeholder_teach: { en: "Skills you can teach", vi: "Kỹ năng bạn có thể dạy" },
  placeholder_learn: {
    en: "Skills you want to learn",
    vi: "Kỹ năng bạn muốn học",
  },
  placeholder_availability: { en: "Weekly availability", vi: "Lịch rảnh hàng tuần" },
  field_mode: { en: "Learning mode", vi: "Hình thức học" },
  mode_online: { en: "Online", vi: "Trực tuyến" },
  mode_inperson: { en: "In person", vi: "Trực tiếp" },
  mode_hybrid: { en: "Hybrid", vi: "Kết hợp" },
  field_level: { en: "Current level", vi: "Trình độ" },
  level_beginner: { en: "Beginner", vi: "Mới bắt đầu" },
  level_intermediate: { en: "Intermediate", vi: "Trung cấp" },
  level_advanced: { en: "Advanced", vi: "Nâng cao" },
  placeholder_location: { en: "Location or timezone", vi: "Địa điểm hoặc múi giờ" },
  placeholder_credentials: {
    en: "Credentials, proof, or teaching experience",
    vi: "Chứng chỉ, bằng cấp, kinh nghiệm giảng dạy",
  },
  placeholder_rate: { en: "Tutor hourly rate (optional)", vi: "Phí gia sư/giờ (tuỳ chọn)" },
  placeholder_goal: { en: "Learning goal", vi: "Mục tiêu học tập" },
  stat_can_teach: { en: "Can teach", vi: "Có thể dạy" },
  stat_add_skill: { en: "Add a skill", vi: "Thêm kỹ năng" },
  stat_learning: { en: "Learning", vi: "Đang học" },
  stat_add_goal_skill: { en: "Add a goal skill", vi: "Thêm kỹ năng mục tiêu" },
  stat_availability: { en: "Availability", vi: "Lịch rảnh" },
  stat_not_set: { en: "Not set yet", vi: "Chưa thiết lập" },
  stat_mode_level: { en: "Mode / level", vi: "Hình thức / Trình độ" },
  mvp_checklist: { en: "MVP checklist", vi: "Danh sách MVP" },
  step_role: { en: "Choose learner/tutor role", vi: "Chọn vai trò người học/gia sư" },
  step_teach: { en: "Add skills you can teach", vi: "Thêm kỹ năng bạn dạy được" },
  step_learn: {
    en: "Add skills you want to learn",
    vi: "Thêm kỹ năng bạn muốn học",
  },
  step_availability: { en: "Set weekly availability", vi: "Thiết lập lịch rảnh" },
  step_mode: { en: "Choose learning mode", vi: "Chọn hình thức học" },
  step_level: { en: "Set current level", vi: "Thiết lập trình độ" },
  step_goal: { en: "Write a learning goal", vi: "Viết mục tiêu học tập" },
  language: { en: "Language", vi: "Ngôn ngữ" },

  // ── Q&A ──
  qa_header: { en: "Q&A", vi: "Hỏi đáp" },
  ask_question: { en: "Ask a question", vi: "Đặt câu hỏi" },
  qa_placeholder: { en: "What do you need help with?", vi: "Bạn cần hỗ trợ gì?" },
  qa_tag_placeholder: { en: "Subject tag", vi: "Chủ đề" },
  post_question: { en: "Post question", vi: "Đăng câu hỏi" },
  recent_questions: { en: "Recent questions", vi: "Câu hỏi gần đây" },
  reply: { en: "reply", vi: "trả lời" },
  replies: { en: "replies", vi: "trả lời" },
  remove: { en: "Remove", vi: "Xoá" },
  answer_placeholder: {
    en: "Write a helpful answer...",
    vi: "Viết câu trả lời hữu ích...",
  },
  post_answer: { en: "Post answer", vi: "Đăng trả lời" },

  // ── Chat tab ──
  chat_header: { en: "Chat", vi: "Trò chuyện" },
  match_queue: { en: "Match queue", vi: "Hàng đợi kết nối" },
  match_queue_hint: {
    en: "Mutual matches waiting for the first message. Each one expires in 24 hours.",
    vi: "Kết nối đang chờ tin nhắn đầu tiên. Mỗi kết nối hết hạn sau 24 giờ.",
  },
  no_queued: { en: "No queued matches", vi: "Không có kết nối chờ" },
  no_queued_hint: {
    en: "Swipe right in Bridge. New mutual matches will appear here.",
    vi: "Vuốt phải trong Kết nối. Kết nối mới sẽ xuất hiện ở đây.",
  },
  tap_to_start: { en: "Tap to start", vi: "Nhấn để bắt đầu" },
  conversations: { en: "Conversations", vi: "Cuộc trò chuyện" },
  conversations_hint: {
    en: "Chats where at least one message has been sent.",
    vi: "Trò chuyện đã có ít nhất một tin nhắn.",
  },
  no_conversations: { en: "No conversations yet", vi: "Chưa có cuộc trò chuyện" },
  no_conversations_hint: {
    en: "Start a message from your match queue to move it here.",
    vi: "Gửi tin nhắn từ hàng đợi kết nối để bắt đầu.",
  },

  // ── Chat screen ──
  back: { en: "Back", vi: "Quay lại" },
  opening_chat: { en: "Opening chat...", vi: "Đang mở trò chuyện..." },
  opening_chat_hint: {
    en: "Syncing thread data so you can start messaging.",
    vi: "Đang đồng bộ dữ liệu để bạn có thể nhắn tin.",
  },
  no_thread: { en: "No match thread yet", vi: "Chưa có cuộc trò chuyện" },
  no_thread_hint: {
    en: "Swipe right on Bridge, wait for a mutual bridge, then open Match queue from Chat.",
    vi: "Vuốt phải trong Kết nối, chờ kết nối đôi, rồi mở hàng đợi từ Trò chuyện.",
  },
  learning_match: { en: "Learning match", vi: "Bạn học" },
  what_a_bridge: { en: "What a bridge!", vi: "Kết nối thành công!" },
  starter_hint: {
    en: "Start with one specific learning goal and propose a first session time.",
    vi: "Bắt đầu với một mục tiêu cụ thể và đề xuất thời gian buổi học đầu tiên.",
  },
  is_typing: { en: "is typing", vi: "đang nhập" },
  send_placeholder: { en: "Send a message...", vi: "Nhập tin nhắn..." },

  // ── Auth ──
  continue_learning: { en: "Continue Learning", vi: "Tiếp tục học" },
  signin_subtitle: {
    en: "Sign in to keep matches, tutors, and questions in sync.",
    vi: "Đăng nhập để đồng bộ kết nối, gia sư và câu hỏi.",
  },
  email: { en: "Email", vi: "Email" },
  email_placeholder: { en: "Enter your email", vi: "Nhập email của bạn" },
  password: { en: "Password", vi: "Mật khẩu" },
  password_placeholder: { en: "Enter your password", vi: "Nhập mật khẩu" },
  forgot: { en: "Forgot?", vi: "Quên?" },
  login: { en: "Login", vi: "Đăng nhập" },
  signing_in: { en: "Signing in...", vi: "Đang đăng nhập..." },
  new_to_sb: { en: "New to SkillBridge?", vi: "Chưa có tài khoản?" },
  sign_up: { en: "Sign Up", vi: "Đăng ký" },
  create_account: { en: "Create Account", vi: "Tạo tài khoản" },
  signup_subtitle: {
    en: "Build a learning profile for skill swaps, tutors, and Q&A.",
    vi: "Tạo hồ sơ học tập để trao đổi kỹ năng, tìm gia sư và hỏi đáp.",
  },
  name: { en: "Name", vi: "Tên" },
  name_placeholder: { en: "Enter your name", vi: "Nhập tên của bạn" },
  creating_account: { en: "Creating account...", vi: "Đang tạo tài khoản..." },
  already_here: { en: "Already learning here?", vi: "Đã có tài khoản?" },
  success: { en: "Success", vi: "Thành công" },
  signin_error: { en: "Sign In Error", vi: "Lỗi đăng nhập" },
  signup_error: { en: "Signup Error", vi: "Lỗi đăng ký" },
} as const;

type TranslationKey = keyof typeof translations;

type I18nContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => translations[key]?.en || key,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() =>
    readStored<Lang>("skillbridge_lang", "en")
  );

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    writeStored("skillbridge_lang", newLang);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[key]?.[lang] || translations[key]?.en || key,
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);

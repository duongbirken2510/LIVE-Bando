// =====================================================
//  CẤU HÌNH GAME "VIỆT NAM ĐẤT NƯỚC TA ƠI" - thay đổi nhỏ chỉ cần sửa file này
//  Câu đọc: `name` = tên người xem (đã làm sạch), `kenh` = tên kênh, `prov` = tên tỉnh
//  Ký hiệu câu đọc: "|" tách đoạn, "^" đầu đoạn = hô to. Không bao giờ đọc nguyên văn comment.
// =====================================================

import type { WishTopic } from '../live/chatter';

export const GAME = {
  title: 'VIỆT NAM ĐẤT NƯỚC TA ƠI',
  subtitle: 'Gõ tên tỉnh, thành quê bạn để bản đồ ghé thăm',

  defaultChannelName: 'kênh mình',

  // ---------- Vòng chơi ----------
  openMs: 15_000, // "Mở màn vòng": 15 giây đầu
  roundMs: 150_000, // 1 vòng 2 phút 30 giây (tính cả mở màn)
  summaryMs: 15_000, // "Tổng kết vòng" sau khi đồng hồ về 00:00

  // ---------- Điểm ----------
  pointsPerComment: 1,
  commentCooldownMs: 10_000, // mỗi người gọi 1 tỉnh: tối đa 1 điểm / 10 giây
  likesPerPoint: 15, // thả 15 tim = +1 điểm cho quê
  // Quà: xu -> điểm cho quê (tính theo tổng xu của lần tặng)
  giftPoints: (xu: number) => (xu >= 1000 ? 3000 : xu >= 100 ? 500 : xu >= 30 ? 100 : xu >= 5 ? 30 : xu >= 1 ? 3 : 0),
  giftTable: [
    ['1 – 4 xu', '+3'],
    ['5 – 29 xu', '+30'],
    ['30 – 99 xu', '+100'],
    ['100 – 999 xu', '+500'],
    ['Từ 1.000 xu', '+3.000'],
    ['Thả 15 tim', '+1'],
    ['Gọi tên quê', '+1'],
  ],

  // ---------- Bản đồ ghé thăm ----------
  priorityGiftCoins: 30, // quà từ 30 xu: "đọc trước", chen lên đầu hàng ghé thăm
  revisitMs: 30_000, // 1 tỉnh vừa ghé thì 30 giây sau mới ghé lại (trừ quà lớn)
  maxQueue: 6, // hàng chờ ghé thăm tối đa 6 tỉnh (quà lớn không tính)
  dwellMs: 3000, // đứng ở mỗi tỉnh ít nhất 3 giây
  giftDwellMs: 4500, // quà lớn đứng lâu hơn cho người tặng thấy mình
  homeAfterMs: 2500, // hết người gọi 2,5 giây thì bản đồ lùi về cả nước

  // ---------- Câu đọc khi ghé thăm ----------
  calledLines: [
    (name: string, prov: string) => `${prov} ơi! | Bạn ${name} gọi tên quê mình kìa.`,
    (name: string, prov: string) => `Bản đồ ghé ${prov}, quê của bạn ${name}.`,
    (name: string, prov: string) => `Bạn ${name} gọi ${prov}, mình ghé liền nè.`,
  ],
  calledWithOthers: (name: string, prov: string, others: number) => `Bạn ${name} với ${others} người nữa đang gọi ${prov}.`,
  giftLine: (name: string, gift: string, prov: string, pts: number) =>
    `Cảm ơn bạn ${name} tặng ${gift} cho ${prov}. | ${prov} được cộng ${pts} điểm.`,
  giftNoHome: (name: string, gift: string) =>
    `Cảm ơn bạn ${name} đã tặng ${gift}. | Bạn gõ tên quê mình để quà được cộng điểm cho quê nha.`,

  // ---------- Câu đọc theo vòng ----------
  roundStart: (no: number) => `^Vòng ${no} bắt đầu! | Cả nhà gõ tên tỉnh, thành quê mình để bản đồ ghé thăm nha.`,
  tenSecondsLeft: 'Còn mười giây! | ^Gọi tên quê mình lẹ lên nào!',
  summary: (no: number, top: { name: string; pts: number }[], champion: string | null) =>
    top.length
      ? [
          `Hết giờ vòng ${no}.`,
          `Quê đứng đầu là ${top[0].name} với ${top[0].pts} điểm${top[1] ? `, nhì là ${top[1].name}` : ''}${top[2] ? `, ba là ${top[2].name}` : ''}.`,
          champion ? `Người giữ lửa quê vòng này là bạn ${champion}.` : '',
        ]
          .filter(Boolean)
          .join(' | ')
      : `Hết giờ vòng ${no}. | Vòng này chưa có quê nào lên tiếng, vòng sau cả nhà gõ tên quê mình nha.`,

  // ---------- Chào người vào ----------
  greetEveryMs: 6000,
  namesPerGreeting: 3,
  greeting: (names: string, kenh: string) => `${kenh} chào ${names}. | Gõ tên quê mình để bản đồ ghé thăm nha.`,

  // ---------- Theo dõi kênh ----------
  thankFollow: (name: string, kenh: string) => `${kenh} cảm ơn bạn ${name} đã theo dõi kênh nha.`,

  // ---------- Comment có lời cầu chúc (không bao giờ đọc nguyên văn) ----------
  wishPerUserMs: 10 * 60_000,
  wishGlobalMs: 20_000,
  wishReplies: {
    exam: [(name: string) => `Chúc bạn ${name} học đâu nhớ đó, thi đâu đậu đó.`],
    health: [(name: string) => `Chúc bạn ${name} với người nhà mau khỏe, ăn ngon ngủ yên.`],
    love: [(name: string) => `Chúc bạn ${name} sớm gặp người thương mình thật lòng.`],
    family: [(name: string) => `Chúc nhà bạn ${name} luôn êm ấm, cha mẹ khỏe, con cái ngoan.`],
    work: [(name: string) => `Chúc bạn ${name} công việc thuận lợi, sớm được như ý.`],
    wealth: [(name: string) => `Chúc bạn ${name} làm ăn phát đạt, buôn may bán đắt.`],
    peace: [(name: string) => `Chúc bạn ${name} mọi chuyện bình an, thuận lợi.`],
  } as Record<WishTopic, ((name: string) => string)[]>,

  // ---------- Nhắc chia sẻ live ----------
  shareReminderEveryMs: 5 * 60_000,
  shareWithNames: (names: string, kenh: string) =>
    `${kenh} cảm ơn ${names} đã ghé chơi. | Mọi người bấm chia sẻ live cho người cùng quê vào gọi tên quê mình nha.`,
  shareLines: [
    'Rủ thêm người cùng quê vào đây đi cả nhà, bấm chia sẻ live là được.',
    'Quê mình muốn lên top thì chia sẻ live cho bạn bè cùng quê vào gọi tên nha.',
  ],

  // ---------- Live im quá lâu ----------
  idleAfterMs: 60_000,
  idleLines: [
    'Ai mới vào thì gõ tên tỉnh, thành quê mình, bản đồ sẽ bay tới tận nơi.',
    'Quê mình đang đứng thứ mấy rồi? Cả nhà gõ tên quê để kéo lên top nha.',
    'Hoàng Sa, Trường Sa là của Việt Nam. Cả nhà gõ tên quê mình để thắp sáng bản đồ nha.',
  ],
};

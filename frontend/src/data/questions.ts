// API返回的数据格式
export interface ApiOption {
  id: number;
  text: string;
}

export interface ApiQuestion {
  id: number;
  text: string;
  order_index: number;
  // options: ApiOption[];
  options: {
    id: number;    // 数据库ID (例如 101, 102)
    text: string;
    score: number; // 计分值 (1=E, 2=I, ...)
  }[];
}

export interface ApiTestResponse {
  title: string;
  description: string;
  id: number;
  test_type: string;
  questions: ApiQuestion[];
}

// 本地使用的数据格式（保留用于fallback）
export interface Question {
  id: number;
  text: string;
  scores: {
    yes: number;
    maybe: number;
    no: number;
  };
}

export const questions: Question[] = [
  { id: 1, text: "下决心后立即去做。", scores: { yes: 0, maybe: 1, no: 2 } },
  { id: 2, text: "往往凭老经验办事。", scores: { yes: 2, maybe: 1, no: 0 } },
  { id: 3, text: "对事情都有探索精神。", scores: { yes: 0, maybe: 2, no: 4 } },
  { id: 4, text: "说话慢而唠叨。", scores: { yes: 4, maybe: 2, no: 0 } },
  { id: 5, text: "健忘。", scores: { yes: 4, maybe: 2, no: 0 } },
  { id: 6, text: "怕烦心、怕做事，不想活动。", scores: { yes: 4, maybe: 2, no: 0 } },
  { id: 7, text: "喜欢参加各种运动。", scores: { yes: 0, maybe: 1, no: 2 } },
  { id: 8, text: "喜欢计较小事。", scores: { yes: 2, maybe: 1, no: 0 } },
  { id: 9, text: "日益固执起来。", scores: { yes: 4, maybe: 2, no: 0 } },
  { id: 10, text: "对什么事都有好奇心。", scores: { yes: 0, maybe: 1, no: 2 } },
  { id: 11, text: "有强烈的生活追求目标。", scores: { yes: 0, maybe: 2, no: 4 } },
  { id: 12, text: "难以控制感情。", scores: { yes: 0, maybe: 1, no: 2 } },
  { id: 13, text: "容易妒忌别人，易悲伤。", scores: { yes: 2, maybe: 1, no: 0 } },
  { id: 14, text: "见到不讲理的事不那么气愤了。", scores: { yes: 2, maybe: 1, no: 0 } },
  { id: 15, text: "不喜欢看推理小说。", scores: { yes: 2, maybe: 1, no: 0 } },
  { id: 16, text: "对电影和爱情小说日益丧失兴趣。", scores: { yes: 2, maybe: 1, no: 0 } },
  { id: 17, text: "做事情缺乏持久性。", scores: { yes: 4, maybe: 2, no: 0 } },
  { id: 18, text: "不爱改变旧习惯。", scores: { yes: 2, maybe: 1, no: 0 } },
  { id: 19, text: "喜欢回忆过去。", scores: { yes: 4, maybe: 2, no: 0 } },
  { id: 20, text: "学习新事物感到困难。", scores: { yes: 2, maybe: 1, no: 0 } },
  { id: 21, text: "十分注意自己的身体变化。", scores: { yes: 2, maybe: 1, no: 0 } },
  { id: 22, text: "生活兴趣的范围变小了。", scores: { yes: 4, maybe: 2, no: 0 } },
  { id: 23, text: "看书的速度加快。", scores: { yes: 0, maybe: 1, no: 2 } },
  { id: 24, text: "动作欠灵活。", scores: { yes: 2, maybe: 1, no: 0 } },
  { id: 25, text: "消除疲劳感很慢。", scores: { yes: 2, maybe: 1, no: 0 } },
  { id: 26, text: "晚上不如早晨和上午头脑清醒。", scores: { yes: 2, maybe: 1, no: 0 } },
  { id: 27, text: "对生活中的挫折感到烦恼。", scores: { yes: 2, maybe: 1, no: 0 } },
  { id: 28, text: "缺乏自信心。", scores: { yes: 2, maybe: 1, no: 0 } },
  { id: 29, text: "集中精力思考有困难。", scores: { yes: 4, maybe: 2, no: 0 } },
  { id: 30, text: "工作效率降低。", scores: { yes: 4, maybe: 2, no: 0 } },
];

export interface AgeRange {
  min: number;
  max: number | null;
  range: string;
  description: string;
  color: string;
}

export const ageRanges: AgeRange[] = [
  { 
    min: 75, 
    max: null, 
    range: "60岁以上",
    description: "您的心理年龄相对成熟稳重，建议保持积极的生活态度，多参与社交和智力活动。",
    color: "text-orange-600"
  },
  { 
    min: 65, 
    max: 74, 
    range: "50～59岁",
    description: "您的心理年龄趋于成熟，建议保持学习新事物的热情，多运动保持身心活力。",
    color: "text-amber-600"
  },
  { 
    min: 50, 
    max: 64, 
    range: "40～49岁",
    description: "您的心理年龄处于中年期，建议平衡工作与生活，培养兴趣爱好。",
    color: "text-blue-600"
  },
  { 
    min: 30, 
    max: 49, 
    range: "30～39岁",
    description: "您的心理年龄充满活力，建议继续保持好奇心和探索精神。",
    color: "text-green-600"
  },
  { 
    min: 0, 
    max: 29, 
    range: "20～29岁",
    description: "您的心理年龄非常年轻，充满朝气和活力，继续保持这份热情！",
    color: "text-emerald-600"
  },
];

export function calculateAgeRange(totalScore: number): AgeRange {
  return ageRanges.find(range => {
    if (range.max === null) {
      return totalScore >= range.min;
    }
    return totalScore >= range.min && totalScore <= range.max;
  }) || ageRanges[ageRanges.length - 1];
}

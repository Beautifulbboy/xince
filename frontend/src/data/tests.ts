import { Brain, Heart, Smile, Zap, Target, Users,HeartHandshake } from "lucide-react";

export interface Test {
  id: string;
  title: string;
  description: string;
  icon: any;
  questionsCount: number;
  estimatedTime: string;
  category: string;
  path: string;
  color: string;
}

export const tests: Test[] = [
  {
    id: "psychological-age",
    title: "心理年龄测试",
    description: "通过30道精心设计的问题，科学评估您的心理年龄状态",
    icon: Brain,
    questionsCount: 30,
    estimatedTime: "5-8分钟",
    category: "趣味测试",
    path: "/test/psychological-age",
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "mood-thermometer",
    title: "心情温度计",
    description: "简式健康量表(BSRS-5)，快速评估您的心理困扰程度",
    icon: Heart,
    questionsCount: 6,
    estimatedTime: "2-3分钟",
    category: "心理健康",
    path: "/test/mood-thermometer",
    color: "from-pink-500 to-rose-500"
  },
  {
    id: "fatalism",
    title: "宿命观量表",
    description: "评估您对命运、运气和自我掌控的态度倾向",
    icon: Smile,
    questionsCount: 16,
    estimatedTime: "3-5分钟",
    category: "心理分析",
    path: "/test/fatalism",
    color: "from-purple-500 to-indigo-500"
  },
  {
    id: "mbti",
    title: "MBTI性格测试",
    description: "发现你的性格类型，了解你的行为模式和潜在优势",
    icon: Zap,
    questionsCount: 28,
    estimatedTime: "15-20分钟",
    category: "性格分析",
    path: "/test/mbti",
    color: "from-orange-500 to-red-500"
  },
  {
    id: "jealousy",
    title: "亲密守护情景量表",
    description: "评估你在亲密关系中的边界敏感度与情绪反应模式",
    icon: HeartHandshake,
    questionsCount: 15,
    estimatedTime: "5-8分钟",
    category: "情感关系",
    path: "/test/jealousy",
    color: "from-green-500 to-emerald-500"
  },
  {
    id: "couple-relationship",
    title: "情侣关系问卷",
    description: "评估您与配偶在信任、亲密与协作方面的关系质量",
    icon: Users,
    questionsCount: 14,
    estimatedTime: "3-5分钟",
    category: "情感关系",
    path: "/test/couple-relationship",
    color: "from-teal-500 to-cyan-500"
  },
];

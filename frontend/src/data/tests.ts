import { Brain, Heart, Smile, Zap, Target, Users, HeartHandshake, HeartPulse, ShieldAlert } from "lucide-react";

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
    title: "心情温度计 (BSRS-5)",
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
    title: "宿命观量表 (MFSG)",
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
    title: "亲密守护情景量表 (LJSI)",
    description: "评估你在亲密关系中的边界敏感度与情绪反应模式",
    icon: HeartHandshake,
    questionsCount: 15,
    estimatedTime: "5-8分钟",
    category: "情感关系",
    path: "/test/jealousy",
    color: "from-pink-500 to-orange-500"
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
  {
    id: "beck-hopelessness",
    title: "贝克绝望量表 (BHS)",
    description: "评估您近期对未来的希望感与信心水平",
    icon: Heart,
    questionsCount: 20,
    estimatedTime: "3-5分钟",
    category: "心理健康",
    path: "/test/beck-hopelessness",
    color: "from-indigo-500 to-purple-500"
  },
  {
    id: "hpls",
    title: "健康促进生活方式量表 (HPLP)",
    description: "评估您在健康促进方面的行为特征",
    icon: HeartPulse,
    questionsCount: 40,
    estimatedTime: "5-8分钟",
    category: "心理健康",
    path: "/test/hpls",
    color: "from-green-500 to-emerald-500"
  },
  // 在 tests 数组中添加（或者替换之前的 mps 配置）：
  {
    id: "mps",
    title: "多维完美主义问卷 (MPS)",
    description: "测量完美主义倾向及其适应性，深入了解你的高标准与内心感受。",
    icon: Target,  // 确保你在文件头部引入了 Target 图标
    questionsCount: 29,
    estimatedTime: "5-10分钟",
    category: "性格分析", // 或者 "心理健康"
    path: "/test/mps",
    color: "from-purple-500 to-indigo-500" // 渐变色风格，与 hpls 保持一致
  },
  {
    id: "ipvs",
    title: "亲密关系 PUA 受害量表",
    description: "评估亲密关系中的权力操纵、情感勒索与价值否定情形，守护自我边界。",
    icon: ShieldAlert,
    questionsCount: 15,
    estimatedTime: "3-5分钟",
    category: "亲密关系",
    path: "/test/ipvs",
    color: "from-red-500 to-rose-500"
  },
];

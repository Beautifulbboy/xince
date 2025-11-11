import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuestionCard } from "@/components/QuestionCard";
import { ApiQuestion } from "@/data/questions";
import { ArrowLeft, Brain, Home, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Answer {
    question_id: number;
    selected_option_id: number;
    score_value: number;
}

interface MBTIResult {
    type: string;
    name: string;
    description: string;
    color: string;
    total_score: number; // 1222
    scores: Record<string, number>; // { E: 5, I: 2, S: 3, N: 4, ... }
}

const mbtiTypes: Record<string, { name: string; description: string }> = {
    ESTJ: { name: "大男人型", description: "讲实际、重现实、公事公办;由于有天生的商业或机械学头脑, 所以对抽象理论不感兴趣; 希望学习以使可以直接和立即应用。喜欢组织和参与活动; 通常能做优秀的领导人; 果断、迅速行动起来执行决定; 考虑日常事务的各种细节。" },
    ESTP: { name: "挑战型", description: "擅长于现场解决问题。喜欢行动, 对任何的进展都感到高兴。往往喜好机械的东西和运动, 并愿意朋友在旁边。善应变、容忍、重实效; 集中精力于取得成果。不喜多加解释。最喜好能干好、能掌握、能分析、能合一的交际事物。" },
    ESFJ: { name: "主人型", description: "热心、健谈、受欢迎, 有责任心的天生的合作者, 积极的委员会成员。要求和谐并可能长于创造和谐。经常为别人做好事。能得到鼓励和赞扬时工作最出色。主要的兴趣在于那些对人们的生活有直接和明显的影响的事情。" },
    ESFP: { name: "表演型", description: "开朗、随和、友善、喜欢一切并使事物由于他们的喜好而让别人感到更有兴趣。喜欢行动并力促事情发生。他们了解正在发生的事情并积极参与。认为记住事实比掌握理论更为容易。在需要丰富的知识和实际能力的情况下表现最佳。" },
    ENTJ: { name: "将军型", description: "直率、果断, 各种活动的领导者。发展和完成完整的体系去解决机构的问题。长于需要论据和机智的谈吐的任何事情, 如公开演讲之类。往往很有学识并喜好增加其知识。" },
    ENTP: { name: "发明家", description: "敏捷、有发明天才,长于许多事情。有鼓励性的伙伴、机警、直言。可能出于逗趣而争论问题的任何一个方面。在解决新的、挑战性的问题方面富于机智, 但可能忽视日常工作。易把兴趣从一点转移到另一点。能够轻而易举地为他们的要求找到合乎逻辑的理由。" },
    ENFJ: { name: "教育家", description: "敏感、负责任。真正地关心他人的所想所愿。处理事情时尽量适当考虑别人的感情。能提出建议或轻松而机智地领导小组讨论。喜社交、受欢迎、有同情心。对表扬和批评敏感。喜欢给人以方便并使人们发挥其潜力。" },
    ENFP: { name: "记者型", description: "极为热心、极富朝气、机敏、富于想象力。几乎能够做他们感兴趣的任何事情。对任何困难都能迅速给出解决办法并随时准备去帮助任何一个遇到难题的人。常常依据他们自己的能力去即席成事, 而不是事先准备。经常能对他们想做的任何事情找到令人信服的理由。" },
    ISTJ: { name: "公务型", description: "严肃、少言、依靠精力集中和有始有终。注重实践、有秩序、实事求是、有逻辑、现实、值得信赖。设法组织好每样事情。负责任、 他们自己决定该做什么并不愿反对和干扰、坚定不移地去完成它。" },
    ISTP: { name: "冒险家", description: "冷静的旁观者 - 少言、自制、以独有的好奇心和 出人意料的有创意的幽默观察和分析生活。往往对起因和结果感兴趣 ,也对机械的事物怎么及为什么奏效及用逻辑原理组织事实倾注兴趣。擅长抓住实际问题的核心并寻求解决办法。" },
    ISFJ: { name: "照顾型", description: "少言、友善、负责任又认真。尽心地工作以尽职责。可以使任何项目和群体更加稳定。周到、刻苦、准确。他们的兴趣通常不是技术性的。能对必要的细节有耐心、忠贞、体谅人、有洞察力、关心别人的想法。" },
    ISFP: { name: "艺术家", description: "羞怯、不事声张的友善、敏感、和谐、谦虚看待自己的能力。回避争论,不将自己的观点和价值观强加于人。一般说,无意于做领导工作,但常常是忠实的追随者,因为他们享受眼前的乐趣,所以事情做完经常松懈而不愿让过度的紧迫和费事来破坏这种享受。" },
    INTJ: { name: "专家型", description: "具有创造性的思想并大力推动他们自己的主意和目标。目光远大、对外部事件能迅速找到有意义的模式。在吸引他们的领域,他们有很好的能力去组织工作并将其进行到底。不轻信、具批判性、独立性、有决心, 对能力和行动有高的标准。" },
    INTP: { name: "学者型", description: "沉默寡言。特别喜欢理论上或科学方面的追求。喜爱用逻辑和分析解决问题。主要有兴趣于出主意, 不大喜欢聚会和闲聊天。倾向于有明确范围的爱好。谋求他们的某些特别的爱好能得到运用和有用的那些职业。" },
    INFJ: { name: "作家型", description: "依靠坚毅不拔取得成功,富创造力 , 希望做需要做和想要做的事情。全力投入自己的工作。沈静地坚强、责任心强、关心他人。因其坚定的原则而受尊重。由于他们在如何最好为公共利益服务等方面的明晰的洞察力,别人可能会尊重和追随他们。" },
    INFP: { name: "哲学家", description: "沈稳的观察者、理想主意、忠实、看重外在的生活和内在的价值的一致。有求知欲, 能迅速发出各种可能性, 常常起到促进实行一些主张的作用。只要某种价值观不受到威胁，他们都善应变、灵活和接受。愿意谅解别人和了解充分发挥人的潜力的方法。" }
};

function getMBTIResult(
    answers: Answer[],
    questionOrderMap: Record<number, number> // 这是一个 { question_id: order_index } 的映射
): MBTIResult {

    // 初始化原始分数统计
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    // 步骤 1: 遍历所有答案，按维度统计
    for (const answer of answers) {
        const orderIndex = questionOrderMap[answer.question_id]; // 获取题号 (1-28)
        const optionId = answer.selected_option_id; // 获取选项 (1-8)
        const scoreValue = answer.score_value;
        if (orderIndex >= 1 && orderIndex <= 7) { // E/I (题 1-7)
            if (scoreValue === 1) scores.E++; // 1=E
            if (scoreValue === 2) scores.I++; // 2=I
        } else if (orderIndex >= 8 && orderIndex <= 14) { // S/N (题 8-14)
            if (scoreValue === 4) scores.S++; // 4=S
            if (scoreValue === 3) scores.N++; // 3=N
        } else if (orderIndex >= 15 && orderIndex <= 21) { // T/F (题 15-21)
            if (scoreValue === 6) scores.T++; // 6=T
            if (scoreValue === 5) scores.F++; // 5=F
        } else if (orderIndex >= 22 && orderIndex <= 28) { // J/P (题 22-28)
            if (scoreValue === 7) scores.J++; // 7=J
            if (scoreValue === 8) scores.P++; // 8=P
        }
    }

    // 根据统计确定4字母类型
    const typeE = scores.E > scores.I ? 'E' : 'I';
    const typeS = scores.S > scores.N ? 'S' : 'N';
    const typeT = scores.T > scores.F ? 'T' : 'F';
    const typeJ = scores.J > scores.P ? 'J' : 'P';

    const type = typeE + typeS + typeT + typeJ;

    // 步骤 2: 将四字母类型转换为唯一的数字总分
    let total_score = 0;
    if (typeE === 'E') total_score += 1000;
    if (typeE === 'I') total_score += 2000;

    if (typeS === 'S') total_score += 100;
    if (typeS === 'N') total_score += 200;

    if (typeT === 'T') total_score += 10;
    if (typeT === 'F') total_score += 20;

    if (typeJ === 'J') total_score += 1;
    if (typeJ === 'P') total_score += 2;
    // 示例: "ISTJ" -> 2000 + 100 + 10 + 1 = 2111

    // 查找类型的描述
    const typeInfo = mbtiTypes[type] || { name: "未知类型", description: "无法计算您的类型。" };

    return {
        type,
        name: typeInfo.name,
        description: typeInfo.description,
        color: "from-orange-500 to-red-500",
        total_score: total_score, // 返回新的4位总分
        scores: scores, // 返回原始统计分数
    };
}

export default function MBTITest() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [started, setStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [scores, setScores] = useState<Record<string, number>>({
        E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0
    });
    const [finished, setFinished] = useState(false);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<ApiQuestion[]>([]);

    const [questionOrderMap, setQuestionOrderMap] = useState<Record<number, number>>({});

    const [testId, setTestId] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://192.168.1.244:8002/api/v1/tests/mbti?include_scores=true");
            if (!response.ok) throw new Error("Failed to fetch questions");
            const data = await response.json();

            const sortedQuestions = data.questions.sort((a: ApiQuestion, b: ApiQuestion) =>
                a.order_index - b.order_index
            );

            const qMap: Record<number, number> = {};
            sortedQuestions.forEach((q: ApiQuestion) => {
                qMap[q.id] = q.order_index;
            });
            setQuestionOrderMap(qMap);

            setQuestions(sortedQuestions);
            setTestId(data.id);
        } catch (error) {
            toast({
                title: "加载失败",
                description: "无法加载测试题目，请稍后重试",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStart = () => {
        setStarted(true);
        setCurrentQuestionIndex(0);
        setScores({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
        setFinished(false);
        setAnswers([]);
    };

    const handleAnswer = async (optionId: number) => {
        const currentQuestion = questions[currentQuestionIndex];
        const selectedOption = currentQuestion.options.find(opt => opt.id === optionId);
        // 根据optionId计分：E=1, I=2, N=3, S=4, F=5, T=6, J=7, P=8
        const scoreMap: Record<number, string> = {
            1: 'E', 2: 'I', 3: 'N', 4: 'S', 5: 'F', 6: 'T', 7: 'J', 8: 'P'
        };

        const letter = scoreMap[optionId];
        if (letter) {
            setScores(prev => ({
                ...prev,
                [letter]: prev[letter] + 1
            }));
        }

        const newAnswer: Answer = {
            question_id: currentQuestion.id,
            selected_option_id: optionId,
            score_value: selectedOption.score
        };

        const updatedAnswers = [...answers, newAnswer];
        setAnswers(updatedAnswers);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            await submitAnswers(updatedAnswers);
            setFinished(true);
        }
    };

    const submitAnswers = async (finalAnswers: Answer[]) => {
        try {
            await fetch(`http://192.168.1.244:8002/api/v1/tests/${testId}/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: "anonymous",
                    answers: finalAnswers
                }),
            });
        } catch (error) {
            console.error("Failed to submit answers:", error);
        }
    };

    const handleRestart = () => {
        setStarted(false);
        setCurrentQuestionIndex(0);
        setScores({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
        setFinished(false);
        setAnswers([]);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">加载中...</p>
                </div>
            </div>
        );
    }

    const result = finished ? getMBTIResult(answers, questionOrderMap) : null;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--gradient-subtle)]">
            {!started ? (
                <div className="w-full max-w-2xl animate-in fade-in-0 duration-500">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/")}
                        className="mb-6 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        返回首页
                    </Button>

                    <Card className="p-8 md:p-12 shadow-[var(--shadow-card)] border-border/50 bg-card/80 backdrop-blur-sm">
                        <div className="flex flex-col items-center space-y-8 text-center">
                            <div className="p-4 rounded-full bg-gradient-to-br from-orange-500 to-red-500 shadow-[var(--shadow-soft)]">
                                <Brain className="w-12 h-12 text-white" />
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-3xl md:text-4xl font-bold text-card-foreground">
                                    MBTI性格测试
                                </h1>
                                <p className="text-lg text-muted-foreground">
                                    发现你的性格类型
                                </p>
                            </div>

                            <div className="w-full space-y-6 text-card-foreground/90">
                                <p className="text-base leading-relaxed">
                                    MBTI是一种自我评核的性格问卷，在美国已广泛地受人采用，能帮助你了解自己属于那种性格类别。
                                </p>

                                <div className="bg-secondary/30 p-6 rounded-lg text-left">
                                    <h3 className="font-semibold text-lg mb-4 text-card-foreground">测试说明</h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                                1
                                            </span>
                                            <span>共28道题目，每题有2个选项</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                                2
                                            </span>
                                            <span>请根据您的真实感受选择更符合您的选项</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                                3
                                            </span>
                                            <span>完成后系统将自动计算并给出您的MBTI性格类型</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <Button
                                onClick={handleStart}
                                size="lg"
                                disabled={loading || questions.length === 0}
                                className="w-full max-w-sm h-14 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 transition-opacity shadow-[var(--shadow-soft)] disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        加载中...
                                    </>
                                ) : (
                                    "开始测试"
                                )}
                            </Button>

                            <p className="text-sm text-muted-foreground">
                                预计用时：15-20分钟
                            </p>
                        </div>
                    </Card>
                </div>
            ) : finished && result ? (
                <div className="w-full max-w-2xl animate-in fade-in-0 duration-500">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/")}
                        className="mb-6 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        返回首页
                    </Button>

                    <Card className="p-8 md:p-12 shadow-[var(--shadow-card)] border-border/50 bg-card/80 backdrop-blur-sm">
                        <div className="space-y-6">
                            <div className="text-center space-y-4">
                                <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${result.color} flex items-center justify-center`}>
                                    <Brain className="w-12 h-12 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-card-foreground mb-2">
                                        {result.type}
                                    </h2>
                                    <p className="text-xl text-muted-foreground">{result.name}</p>
                                </div>
                            </div>

                            <div className="space-y-4 p-6 bg-secondary/30 rounded-lg">
                                <h3 className="font-semibold text-lg text-card-foreground">性格分析</h3>
                                <p className="text-card-foreground/80 leading-relaxed whitespace-pre-line">
                                    {result.description}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={handleRestart}
                                    variant="outline"
                                    size="lg"
                                    className="flex-1"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    重新测试
                                </Button>
                                <Button
                                    onClick={() => navigate("/")}
                                    size="lg"
                                    className="flex-1"
                                >
                                    <Home className="w-5 h-5 mr-2" />
                                    返回首页
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="w-full animate-in fade-in-0 duration-300">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/")}
                        className="absolute top-4 left-4 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        返回首页
                    </Button>

                    <QuestionCard
                        question={questions[currentQuestionIndex]}
                        currentQuestion={currentQuestionIndex + 1}
                        totalQuestions={questions.length}
                        onAnswer={handleAnswer}
                    />
                </div>
            )}
        </div>
    );
}

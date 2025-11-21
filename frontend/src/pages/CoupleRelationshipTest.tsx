import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiQuestion, ApiTestResponse } from "@/data/questions";
import { Users, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";

interface Answer {
    question_id: number;
    selected_option_id: number;
}

interface ResultRange {
    min: number;
    max: number;
    title: string;
    description: string;
}

const resultRanges: ResultRange[] = [
    {
        min: 14,
        max: 46,
        title: "低于常模，建议关注",
        description: "本次测评结果显示，您在信任、情绪分享与相互理解方面承受一定压力。相处中更容易出现依赖揣测而非直接表达的情形，偶有怀疑或回避请求的反应，对「被欣赏/被支持」的主观体会也相对不足。在健康、财务、家务分工等关键议题上，彼此的知情度和共识度可能不够稳定。建议在不指责的前提下，建立每周一次的高质量沟通（约 20–30 分钟，聚焦「这周让我感到被支持的一件事 / 需要改进的一件事」），优先明确 1–2 个具体情境的可执行约定（如家务轮值表、固定财务月检视、就医信息共享），并使用「我的感受/需要/请求」句式减少防御与误解。同步增加积极反馈（每天至少一次具体称赞），观察 2–4 周内的变化并复盘，逐步累积正向互动。"
    },
    {
        min: 47,
        max: 63,
        title: "亲密稳健区",
        description: "整体关系处于一般—良好区间：能够体验到陪伴的愉快与被欣赏，也能在一定程度上把握彼此想法与性格；偶尔仍会出现表达不够直接或误读对方意图的情况。建议巩固已有优势并做小幅增益：保持每周一次 30 分钟的双向表达（先理解再回应），每月一次两人专属活动（不被工作/育儿打断），在健康与财务上维持信息透明与角色分工清单（谁负责记录、谁负责对账、复盘频率）。如短期内发现怀疑增多、负面评论变频、或回避提出需求的情况，请把下一次沟通聚焦在「如何让彼此更易于开口」，从具体行为而非动机推断入手，减少摩擦。"
    },
    {
        min: 64,
        max: 70,
        title: "亲密优势区",
        description: "您与伴侣在信任、亲密与协作上具备明显优势：彼此能觉察与回应对方需求，在健康、财务等关键议题上拥有较好的知情度与共识，遇到问题更倾向于共同解决而非互相指责。建议固化有效惯例并面向未来设定共享目标：持续每日的简短情感连接（例如「1 句感谢 + 30 秒拥抱」），维持每周高质量沟通与每月约会；就三年内的共同计划（财务储备、健康运动、亲密关系与家庭体验）设定里程碑与分工；为突发压力情境预备「冷静期 + 复盘框架」（暂停—情绪命名—需求澄清—下一步行动），以保持关系的韧性与活力。"
    }
];

// 反向计分题号
const reverseQuestions = [11, 12, 13, 14];

const CoupleRelationshipTest = () => {
    const navigate = useNavigate();
    const [started, setStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [finished, setFinished] = useState(false);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<ApiQuestion[]>([]);
    const [testId, setTestId] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/tests/crq`);
            if (!response.ok) throw new Error("获取题目失败");

            const data: ApiTestResponse = await response.json();
            setQuestions(data.questions.sort((a, b) => a.order_index - b.order_index));
            setTestId(data.id);
        } catch (error) {
            toast({
                title: "错误",
                description: "获取题目失败，请稍后重试",
                variant: "destructive",
            });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = () => {
        if (questions.length === 0) {
            toast({
                title: "提示",
                description: "题目加载中，请稍候...",
            });
            return;
        }
        setStarted(true);
        setCurrentQuestionIndex(0);
        setTotalScore(0);
        setFinished(false);
        setAnswers([]);
    };

    const calculateScore = (questionIndex: number, optionIndex: number): number => {
        const questionNumber = questionIndex + 1;
        const isReverse = reverseQuestions.includes(questionNumber);

        // 选项索引对应：0=非常不符合, 1=比较不符合, 2=不确定, 3=比较符合, 4=非常符合
        if (!isReverse) {
            // 正向计分：1, 2, 3, 4, 5
            return optionIndex + 1;
        } else {
            // 反向计分：5, 4, 3, 2, 1
            return 5 - optionIndex;
        }
    };

    const handleAnswer = (optionId: number) => {
        const currentQuestion = questions[currentQuestionIndex];
        const newAnswer: Answer = {
            question_id: currentQuestion.id,
            selected_option_id: optionId,
        };

        const newAnswers = [...answers, newAnswer];
        setAnswers(newAnswers);

        // 根据选项位置计算分数
        const optionIndex = currentQuestion.options.findIndex(opt => opt.id === optionId);
        const score = calculateScore(currentQuestionIndex, optionIndex);

        const newScore = totalScore + score;
        setTotalScore(newScore);

        if (currentQuestionIndex < questions.length - 1) {
            setTimeout(() => {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            }, 200);
        } else {
            setTimeout(() => {
                submitAnswers(newAnswers);
                setFinished(true);
            }, 200);
        }
    };

    const submitAnswers = async (finalAnswers: Answer[]) => {
        try {
            const response = await fetch(`${API_BASE_URL}/tests/${testId}/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: "anonymous",
                    answers: finalAnswers,
                }),
            });

            if (!response.ok) throw new Error("提交答案失败");

            toast({
                title: "成功",
                description: "测试结果已保存",
            });
        } catch (error) {
            console.error("提交答案失败:", error);
            toast({
                title: "提示",
                description: "答案保存失败，但您仍可以查看测试结果",
                variant: "destructive",
            });
        }
    };

    const handleRestart = () => {
        setStarted(false);
        setCurrentQuestionIndex(0);
        setTotalScore(0);
        setFinished(false);
        setAnswers([]);
    };

    const getResultRange = (score: number): ResultRange => {
        return resultRanges.find(range => score >= range.min && score <= range.max) || resultRanges[1];
    };

    if (!started) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--gradient-subtle)]">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="absolute top-4 left-4 gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    返回首页
                </Button>
                <div className="w-full max-w-2xl text-center space-y-8 animate-in fade-in-0 duration-700">
                    <div className="space-y-4">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-soft)]">
                            <Users className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                            情侣关系问卷
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                            评估您与配偶在信任、亲密与协作方面的关系质量
                        </p>
                    </div>

                    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 shadow-[var(--shadow-card)] border border-border/50 space-y-6 text-left">
                        <h2 className="text-xl font-semibold text-card-foreground">测试说明</h2>
                        <ul className="space-y-3 text-muted-foreground">
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                    1
                                </span>
                                <span>请根据您与配偶过去 3 个月的真实相处情况作答</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                    2
                                </span>
                                <span>共14道题目，每题有5个选项，请依据第一印象选择最符合的一项</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                    3
                                </span>
                                <span>题目叙述没有对错与好坏之分，请真实作答</span>
                            </li>
                        </ul>
                    </div>

                    <Button
                        onClick={handleStart}
                        size="lg"
                        disabled={loading || questions.length === 0}
                        className="w-full max-w-sm h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-[var(--shadow-soft)] disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                加载中...
                            </>
                        ) : (
                            "开始测试"
                        )}
                    </Button>

                    <p className="text-sm text-muted-foreground">
                        预计用时：3-5分钟
                    </p>
                </div>
            </div>
        );
    }

    if (finished) {
        const resultRange = getResultRange(totalScore);

        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--gradient-subtle)]">
                <Card className="w-full max-w-2xl mx-auto p-8 shadow-[var(--shadow-card)] border-border/50 bg-card/80 backdrop-blur-sm">
                    <div className="space-y-6">
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-soft)]">
                                <Users className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-card-foreground">测试完成</h2>
                            <div className="space-y-2">
                                <p className="text-muted-foreground">您的总分</p>
                                <p className="text-5xl font-bold text-primary">{totalScore}</p>
                                <p className="text-sm text-muted-foreground">（满分70分）</p>
                            </div>
                        </div>

                        <div className="space-y-4 py-6">
                            <div className="bg-primary/5 rounded-lg p-6 space-y-4">
                                <h3 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                                    {resultRange.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {resultRange.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                onClick={handleRestart}
                                variant="outline"
                                size="lg"
                                className="flex-1 h-12"
                            >
                                重新测试
                            </Button>
                            <Button
                                onClick={() => navigate("/")}
                                size="lg"
                                className="flex-1 h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                            >
                                返回首页
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--gradient-subtle)]">
            <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="absolute top-4 left-4 gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                返回首页
            </Button>
            <div className="w-full animate-in fade-in-0 duration-300">
                <QuestionCard
                    question={questions[currentQuestionIndex]}
                    currentQuestion={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                    onAnswer={handleAnswer}
                />
            </div>
        </div>
    );
};

export default CoupleRelationshipTest;

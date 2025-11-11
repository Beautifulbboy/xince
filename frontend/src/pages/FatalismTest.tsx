import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiQuestion, ApiTestResponse } from "@/data/questions";
import { Smile, ArrowLeft, Loader2, Home, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Answer {
    question_id: number;
    selected_option_id: number;
}

interface FatalismResult {
    level: string;
    title: string;
    description: string;
    color: string;
}

const getFatalismResult = (totalScore: number): FatalismResult => {
    if (totalScore <= 27) {
        return {
            level: "高自我掌控取向（高内控）",
            title: "高自我掌控取向",
            description: "您更倾向将结果归因为个人的选择、努力与策略执行，主观掌控感显著。面对目标，通常会主动设定路径与里程碑，并在进展受阻时通过调整方法、提升效率或学习新技能来恢复推进力。您对\"努力—结果\"的因果链保持稳定信念，较少依赖运气解释事件变化；在信息不完全时，也倾向以分析与实验来缩小不确定性。整体上表现为计划性强、行动取向明确、自我效能感高，能在多数情境下维持对局面的把握与推进。",
            color: "from-green-500 to-emerald-500"
        };
    } else if (totalScore <= 37) {
        return {
            level: "倾向自我掌控（偏内控）",
            title: "倾向自我掌控",
            description: "您总体相信\"事在人为\"，同时承认情境与偶然性对结果的影响。在重要决策上通常会先制定计划并亲自推动，但若外部条件发生明显变化，也能及时评估并适度修正路径。您对自身影响力有稳定预期，能在现实约束与个人意愿之间取得平衡；在资源受限或变量较多时，偶尔会以\"运气/时机\"来解释结果波动，但核心判断仍以可控行动为主轴。整体呈现为务实、灵活且能自我驱动的风格。",
            color: "from-blue-500 to-cyan-500"
        };
    } else if (totalScore <= 48) {
        return {
            level: "倾向外界影响（偏外控）",
            title: "倾向外界影响",
            description: "您更容易感知情境、制度、时机与他人决策等外部因素对结果的作用，个人努力的重要性依然存在，但相对次要。在复杂或高度不确定的情境下，您更愿意等待信息明朗、资源到位或\"窗口期\"出现，再启动关键行动；同时也较少将波动完全归咎于个人能力，而是从环境与运气角度理解起伏。这种取向有助于理解系统性限制并减少不必要的自责，但也意味着在推进关键事项时更依赖外部条件成熟与配套支持。",
            color: "from-orange-500 to-yellow-500"
        };
    } else {
        return {
            level: "高外界影响取向（高外控）",
            title: "高外界影响取向",
            description: "您通常把事件结果视为由环境、运气或更大的外在力量主导，个人对局面的直接掌控感相对较低。面对重大选择与突发情况时，更倾向\"顺其自然\"或依据他人/环境信号做出响应，对成功与挫折均以外部因素作为主要解释框架。您对不确定性的接受度较高，能以宿命/机运视角理解生活变化；在推进关键目标时，则更依赖外部机会、支持与情境变化来带动进展。整体呈现为对环境敏感、解释框架外向、以情境为先的认知与决策风格。",
            color: "from-red-500 to-pink-500"
        };
    }
};

export default function FatalismTest() {
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
            const response = await fetch("http://192.168.1.244:8002/api/v1/tests/mfsg");
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

    const handleAnswer = (optionId: number) => {
        const currentQuestion = questions[currentQuestionIndex];
        const newAnswer: Answer = {
            question_id: currentQuestion.id,
            selected_option_id: optionId,
        };

        const newAnswers = [...answers, newAnswer];
        setAnswers(newAnswers);

        // 根据选项计算分数（1-5分）
        const optionIndex = currentQuestion.options.findIndex(opt => opt.id === optionId);
        const score = optionIndex + 1;
        setTotalScore(totalScore + score);

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
            const response = await fetch(`http://192.168.1.244:8002/api/v1/tests/${testId}/submit`, {
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
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 shadow-[var(--shadow-soft)]">
                            <Smile className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                            宿命观量表
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                            评估您对命运、运气和自我掌控的态度倾向
                        </p>
                    </div>

                    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 shadow-[var(--shadow-card)] border border-border/50 space-y-6 text-left">
                        <h2 className="text-xl font-semibold text-card-foreground">测试说明</h2>
                        <ul className="space-y-3 text-muted-foreground">
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                    1
                                </span>
                                <span>下面一些描述或说法，请根据您自己实际情况进行选择</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                    2
                                </span>
                                <span>本测试共16道题目，每题只选一个答案</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                    3
                                </span>
                                <span>完成后系统将自动计算并给出您的自我掌控倾向</span>
                            </li>
                        </ul>
                    </div>

                    <Button
                        onClick={handleStart}
                        size="lg"
                        disabled={loading || questions.length === 0}
                        className="w-full max-w-sm h-14 text-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 transition-opacity shadow-[var(--shadow-soft)] disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
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
        const result = getFatalismResult(totalScore);

        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--gradient-subtle)]">
                <Card className="w-full max-w-2xl mx-auto p-8 shadow-[var(--shadow-card)] border-border/50 bg-card/80 backdrop-blur-sm animate-in fade-in-0 duration-700">
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500">
                            <Smile className="w-10 h-10 text-white" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-card-foreground">测试完成！</h2>
                            <p className="text-muted-foreground">感谢您完成全部16道题目</p>
                        </div>

                        <div className="py-6 space-y-3">
                            <div className={`text-5xl font-semibold ${result.color}`}>
                                {result.title}
                            </div>
                        </div>

                        <div className="p-6 bg-secondary/50 rounded-lg">
                            <h3 className="text-lg font-semibold text-card-foreground mb-3">
                                测评结果
                            </h3>
                            <p className="text-left text-muted-foreground leading-relaxed">
                                {result.description}
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                onClick={handleRestart}
                                variant="outline"
                                className="flex-1"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                重新测试
                            </Button>
                            <Button
                                onClick={() => navigate("/")}
                                className="flex-1"
                            >
                                <Home className="w-5 h-5 mr-2" />
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
}

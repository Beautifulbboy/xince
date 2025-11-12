import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionCard } from "@/components/QuestionCard";
import { ArrowLeft, RotateCcw, CheckCircle2, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config/api";

interface Answer {
    question_id: number;
    selected_option_id: number;
}

interface HopelessnessResult {
    level: string;
    description: string;
    color: string;
}

const getHopelessnessResult = (totalScore: number): HopelessnessResult => {
    if (totalScore >= 20 && totalScore <= 32) {
        return {
            level: "低绝望水平",
            description: "你对未来仍能保有亮光与方向，偶有阴天，但并不遮住你的脚步。请把这份稳定放在心上——它说明你在困难时依然能看见可行的路，这很不容易、也很珍贵。",
            color: "from-green-500 to-emerald-500"
        };
    } else if (totalScore >= 33 && totalScore <= 52) {
        return {
            level: "轻度绝望",
            description: "有时你会担心前路、觉得目标不在身边，但这些念头并没有占据全部。请也为自己看到：你仍在寻找可以把心安放的位置。情绪像天气，会来会去；而你并不等于这些天气。",
            color: "from-yellow-500 to-orange-500"
        };
    } else if (totalScore >= 53 && totalScore <= 76) {
        return {
            level: "中度绝望",
            description: "最近「看不到出口」的感觉更常出现，乐观与把握感容易被打散。先给自己一点点善意：你已经很努力了，感到疲惫并不代表你失败。你值得被理解与陪伴，也值得在他人目光里慢慢变得轻松。",
            color: "from-orange-500 to-red-500"
        };
    } else {
        return {
            level: "重度绝望",
            description: "当下也许像一段很长的黑夜，几乎所有努力都显得无力。请把这句话收下：你不是一个人。此刻的感受可以被看见、被相信、被理解；它们不会定义你的一生，也不会永远停在今天。若心里很难熬，请告诉一个你信任的人，让一句「我在这儿」先落到你身边；当你愿意时，专业的支持会耐心地站在你这边，和你一起等到天色变浅。",
            color: "from-red-600 to-rose-700"
        };
    }
};

const BeckHopelessnessTest = () => {
    const navigate = useNavigate();
    const [started, setStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [totalScore, setTotalScore] = useState(0);
    const [questions, setQuestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [testId, setTestId] = useState<number | null>(null);

    // 正向题目（需要反向计分）
    const positiveQuestions = [1, 3, 5, 6, 8, 10, 13, 15, 19];

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tests/bhs`);
            const data = await response.json();
            setQuestions(data.questions || []);
            setTestId(data.id);
        } catch (error) {
            console.error("Failed to fetch questions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateScore = (questionNumber: number, optionIndex: number): number => {
        // 正向题目（反向计分）：选项0→1分，1→2分，2→3分，3→4分，4→5分
        // 负向题目（顺向计分）：选项0→5分，1→4分，2→3分，3→2分，4→1分
        if (positiveQuestions.includes(questionNumber)) {
            return optionIndex + 1;
        } else {
            return 5 - optionIndex;
        }
    };

    const handleAnswer = (optionId: number) => {
        const currentQ = questions[currentQuestion];
        const selectedOption = currentQ.options.find((opt: any) => opt.id === optionId);
        const optionIndex = currentQ.options.indexOf(selectedOption);
        const questionNumber = currentQuestion + 1;
        const score = calculateScore(questionNumber, optionIndex);

        const newAnswers = [
            ...answers,
            { question_id: currentQ.id, selected_option_id: optionId }
        ];
        setAnswers(newAnswers);

        const newTotalScore = totalScore + score;
        setTotalScore(newTotalScore);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            submitAnswers(newAnswers);
        }
    };

    const submitAnswers = async (finalAnswers: Answer[]) => {
        try {
            await fetch(`${API_BASE_URL}/tests/${testId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: "anonymous",
                    answers: finalAnswers
                })
            });
        } catch (error) {
            console.error("Failed to submit answers:", error);
        } finally {
            setShowResult(true);
        }
    };

    const handleStart = () => {
        setStarted(true);
        setCurrentQuestion(0);
        setAnswers([]);
        setTotalScore(0);
        setShowResult(false);
    };

    const handleRestart = () => {
        setStarted(false);
        setCurrentQuestion(0);
        setAnswers([]);
        setTotalScore(0);
        setShowResult(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl">
                    <CardContent className="p-8">
                        <div className="text-center">加载中...</div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (showResult) {
        const result = getHopelessnessResult(totalScore);

        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/")}
                                className="gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                返回首页
                            </Button>
                        </div>
                        <div className="text-center space-y-4">
                            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${result.color} mb-4`}>
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </div>
                            <CardTitle className="text-3xl">测试完成</CardTitle>
                            <CardDescription className="text-lg">
                                您的总分：{totalScore} 分
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center space-y-4">
                            <div className={`inline-block px-6 py-3 rounded-full bg-gradient-to-r ${result.color} text-white font-semibold text-lg`}>
                                {result.level}
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                {result.description}
                            </p>
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    <strong>说明：</strong>本量表用于情绪理解与自我关怀，不作临床结论。
                                    若你或你关心的人出现持续强烈的无望感，或浮现伤害自己的想法，请立即联系可信赖的人与本地专业援助/紧急资源；在任何情况下，求助是一种勇气，你值得被好好照顾。
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 justify-center pt-6">
                            <Button onClick={handleRestart} variant="outline" className="gap-2">
                                <RotateCcw className="w-4 h-4" />
                                重新测试
                            </Button>
                            <Button onClick={() => navigate("/")} className="gap-2">
                                <Home className="w-4 h-4" />
                                返回首页
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!started) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/")}
                                className="gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                返回首页
                            </Button>
                        </div>
                        <CardTitle className="text-3xl text-center">贝克绝望量表</CardTitle>
                        <CardDescription className="text-center text-base">
                            评估您近期对未来的希望感与信心水平
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4 text-muted-foreground">
                            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                <h3 className="font-semibold text-foreground">指导语</h3>
                                <p className="text-sm">
                                    请根据您近两周真实的想法和感受作答。题目没有对错与好坏之分，请依据第一印象选择最符合的一项。每题必答。作答约需 3–5 分钟。
                                </p>
                            </div>
                            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                <h3 className="font-semibold text-foreground">测试说明</h3>
                                <ul className="text-sm space-y-1 list-disc list-inside">
                                    <li>共 20 道题目</li>
                                    <li>每题 5 个选项（完全符合 - 完全相反）</li>
                                    <li>预计用时：3-5 分钟</li>
                                    <li>本量表用于情绪理解与自我关怀，不作临床结论</li>
                                </ul>
                            </div>
                        </div>
                        <Button onClick={handleStart} size="lg" className="w-full">
                            开始测试
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="mb-6 flex justify-between items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/")}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        返回首页
                    </Button>
                </div>
                <QuestionCard
                    question={questions[currentQuestion]}
                    currentQuestion={currentQuestion + 1}
                    totalQuestions={questions.length}
                    onAnswer={handleAnswer}
                />
            </div>
        </div>
    );
};

export default BeckHopelessnessTest;

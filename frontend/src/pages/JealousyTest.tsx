import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionCard } from "@/components/QuestionCard";
import { ApiQuestion } from "@/data/questions";
import { toast } from "@/hooks/use-toast";
import { HeartHandshake, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

interface Answer {
    question_id: number;
    selected_option_id: number;
}

interface AnswerDetail {
    questionText: string;
    selectedScore: number;
    explanation: string;
}

interface JealousyResult {
    level: string;
    title: string;
    description: string;
    color: string;
    totalScore: number;
    avgScore: number;
}

// 每个问题每个选项的解释
const questionExplanations: Record<number, Record<number, string>> = {
    1: {
        1: "当公开社交场合出现近身互动时，你通常淡定自若，情绪稳定且不会因此怀疑关系。",
        2: "当公开社交场合出现近身互动时，你会短暂在意但很快恢复，把它视为普通社交的一部分。",
        3: "当公开社交场合出现近身互动时，你倾向先观察距离与分寸，再决定是否需要额外关注。",
        4: "当公开社交场合出现近身互动时，你会明显不快，并希望现场表现出更清晰的边界与克制。",
        5: "当公开社交场合出现近身互动时，你会强烈不快，往往立即中断交流或当面表达不适。"
    },
    2: {
        1: "当听到对他人魅力的夸赞时，你通常能以平常心对待，不把它与关系安全直接关联。",
        2: "当听到对他人魅力的夸赞时，你会略微在意但能迅速释怀，更多关注整体氛围是否得体。",
        3: "当听到对他人魅力的夸赞时，你会视语气、场合与频次而定，保持观望态度。",
        4: "当听到对他人魅力的夸赞时，你会明显不快，担心这类表达传递了模糊的亲密信号。",
        5: "当听到对他人魅力的夸赞时，你会强烈不快，并倾向认为这已触碰到你对尊重的底线。"
    },
    3: {
        1: "当他人表现出热络示好时，你通常稳住情绪，相信场面能被妥善拿捏。",
        2: "当他人表现出热络示好时，你会稍有波动但能自我调节，更看伴侣回应是否清楚。",
        3: "当他人表现出热络示好时，你会观察分寸与互动持续时间，再决定是否需要提醒。",
        4: "当他人表现出热络示好时，你会明显不快，并希望对方与伴侣及时拉开界限。",
        5: "当他人表现出热络示好时，你会强烈不快，倾向立刻干预或要求停止该互动。"
    },
    4: {
        1: "当看见与过去相关的物件时，你通常能淡然以对，不把它视作对当下的威胁。",
        2: "当看见与过去相关的物件时，你会略感介意但能很快释怀，接受其作为历史记录存在。",
        3: "当看见与过去相关的物件时，你会根据保存理由与透明度来决定是否需要进一步沟通。",
        4: "当看见与过去相关的物件时，你会明显不快，并希望明确界线以避免情感残留的困扰。",
        5: "当看见与过去相关的物件时，你会强烈不快，常将其视为对当前承诺的直接挑战。"
    },
    5: {
        1: "当看到较为活跃的社交互动时，你通常心态平稳，把它理解为开放而礼貌的交流。",
        2: "当看到较为活跃的社交互动时，你会稍微在意但能自我调整，不影响整体体验。",
        3: "当看到较为活跃的社交互动时，你会根据场合与互动尺度判断其是否仍属合宜范围。",
        4: "当看到较为活跃的社交互动时，你会明显不快，并希望对互动热度进行降温。",
        5: "当看到较为活跃的社交互动时，你会强烈不快，往往直接回避现场或提出严正质疑。"
    },
    6: {
        1: "当旁人出现暧昧示好时，你通常情绪稳定，关注的是回应是否得体而非情境本身。",
        2: "当旁人出现暧昧示好时，你会轻微在意但能自我安抚，等待清晰回应出现。",
        3: "当旁人出现暧昧示好时，你会观察对方姿态与回应边界，再决定是否需要出面提醒。",
        4: "当旁人出现暧昧示好时，你会明显不快，并期待当场给出明确而坚定的拒绝信号。",
        5: "当旁人出现暧昧示好时，你会强烈不快，倾向迅速制止并要求立刻划清界限。"
    },
    7: {
        1: "当旧识相见气氛愉快时，你一般能平和看待，把重点放在当下的互信上。",
        2: "当旧识相见气氛愉快时，你会轻微在意但可自行消化，只在细节不透明时提醒关注。",
        3: "当旧识相见气氛愉快时，你会依据交流是否公开与分寸得体来决定感受强弱。",
        4: "当旧识相见气氛愉快时，你会明显不快，并担心旧情相关的界面尚未彻底切割。",
        5: "当旧识相见气氛愉快时，你会强烈不快，容易将其视为潜在的情感回流风险。"
    },
    8: {
        1: "当注意力更多给到你身边的他人时，你通常能稳住心态，不把其解读为失衡。",
        2: "当注意力更多给到你身边的他人时，你会略有不适但可快速恢复到平衡状态。",
        3: "当注意力更多给到你身边的他人时，你会看关注的理由与时长是否合情合理。",
        4: "当注意力更多给到你身边的他人时，你会明显不快，感到自身被忽视或重要性下降。",
        5: "当注意力更多给到你身边的他人时，你会强烈不快，并倾向以沉默或离场表达不满。"
    },
    9: {
        1: "当谈笑在你出现后突然中断时，你通常先给出善意解释，不急于产生负面联想。",
        2: "当谈笑在你出现后突然中断时，你会略感在意但能放下，等待事后自然说明。",
        3: "当谈笑在你出现后突然中断时，你会依据后续解释的充分性来调整信任感。",
        4: "当谈笑在你出现后突然中断时，你会明显不快，并倾向推断其中存在刻意隐瞒。",
        5: "当谈笑在你出现后突然中断时，你会强烈不快，直接视其为不透明与回避的明确信号。"
    },
    10: {
        1: "当对方在公共场合久未露面时，你通常能耐心等待并保持情绪稳定。",
        2: "当对方在公共场合久未露面时，你会略感不安但不至于持续发酵，愿意给出时间缓冲。",
        3: "当对方在公共场合久未露面时，你会依据事后的解释是否合理来决定是否追问。",
        4: "当对方在公共场合久未露面时，你会明显不快，更期待实时沟通与行程透明。",
        5: "当对方在公共场合久未露面时，你会强烈不快，通常要求立即说明并恢复可见性。"
    },
    11: {
        1: "当出现带有玩笑意味的轻度暧昧时，你通常分辨得清，不会轻易夸大其影响。",
        2: "当出现带有玩笑意味的轻度暧昧时，你会小幅波动但能自我调适，关注是否点到为止。",
        3: "当出现带有玩笑意味的轻度暧昧时，你会看场景与界限提示是否到位再评估感受。",
        4: "当出现带有玩笑意味的轻度暧昧时，你会明显不快，并倾向将其视为接近越界的信号。",
        5: "当出现带有玩笑意味的轻度暧昧时，你会强烈不快，难以接受任何模糊不清的亲密暗示。"
    },
    12: {
        1: "当对方多次夜间独处外出时，你通常能以开放心态理解其放松需求。",
        2: "当对方多次夜间独处外出时，你会略有在意但可自我安抚，关注频次是否合理。",
        3: "当对方多次夜间独处外出时，你会依据去向说明、时段安排与安全性来调整态度。",
        4: "当对方多次夜间独处外出时，你会明显不快，更重视边界、节制与对关系的照顾度。",
        5: "当对方多次夜间独处外出时，你会强烈不快，往往直接把它视为对稳定与信任的不利信号。"
    },
    13: {
        1: "当听到别人对其吸引力的评价时，你通常能淡定接纳，不改变基本安全感。",
        2: "当听到别人对其吸引力的评价时，你会轻微波动但很快回到理性与平衡。",
        3: "当听到别人对其吸引力的评价时，你会依据表达的语境与分寸来决定在意程度。",
        4: "当听到别人对其吸引力的评价时，你会明显不快，担心由此引出不必要的暧昧联想。",
        5: "当听到别人对其吸引力的评价时，你会强烈不快，并倾向要求减少此类话题的出现。"
    },
    14: {
        1: "当涉及过往的私密信息时，你通常能尊重适度的边界而不产生焦虑。",
        2: "当涉及过往的私密信息时，你会略有在意但能等待后续自愿说明。",
        3: "当涉及过往的私密信息时，你会根据隐私理由是否充分与一致来决定是否介入。",
        4: "当涉及过往的私密信息时，你会明显不快，并倾向认为透明度不足影响了信任。",
        5: "当涉及过往的私密信息时，你会强烈不快，通常把它视为严重的界限问题需立即澄清。"
    },
    15: {
        1: "当面对与陌生人的高热度互动时，你一般能理解为礼貌与外向，不会过度解读。",
        2: "当面对与陌生人的高热度互动时，你会轻微不适但能很快平复，把重心放回整体氛围。",
        3: "当面对与陌生人的高热度互动时，你会依据场景、持续时间与距离感来综合判断。",
        4: "当面对与陌生人的高热度互动时，你会明显不快，担心礼貌边界被冲淡。",
        5: "当面对与陌生人的高热度互动时，你会强烈不快，往往直接中止互动并表达明确立场。"
    }
};

function getJealousyResult(totalScore: number): JealousyResult {
    const avgScore = Number((totalScore / 15).toFixed(2));

    if (totalScore <= 46) {
        return {
            level: "关系从容区",
            title: "关系从容区",
            description: "你整体反应更从容，较少因第三方互动起明显波动，通常以信任与清晰边界感维持关系稳定；对聚会寒暄、旧识重逢等情景的情绪起伏较轻。",
            color: "text-green-600",
            totalScore,
            avgScore
        };
    } else if (totalScore <= 53) {
        return {
            level: "一般在意区",
            title: "一般在意区",
            description: "你的在意程度与大多数人接近。面对他人对伴侣的关注或暧昧信号会有不快，但总体可控，更多体现为对亲密边界的自然警觉。",
            color: "text-blue-600",
            totalScore,
            avgScore
        };
    } else if (totalScore <= 59) {
        return {
            level: "偏高在意区",
            title: "偏高在意区",
            description: "你对关系边界更敏感，在调情、热情互动或不透明交流等情境下更容易出现显著不快，更关注'是否越界''互动透明度'。",
            color: "text-amber-600",
            totalScore,
            avgScore
        };
    } else {
        return {
            level: "明显在意区",
            title: "明显在意区",
            description: "你在多种触发情景下反应强，亲密警觉度高；对伴侣与第三方互动的安全感与透明度要求更高，倾向快速识别可能的越界信号。",
            color: "text-orange-600",
            totalScore,
            avgScore
        };
    }
}

export default function JealousyTest() {
    const navigate = useNavigate();
    const [hasStarted, setHasStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [questions, setQuestions] = useState<ApiQuestion[]>([]);
    const [testId, setTestId] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [answerDetails, setAnswerDetails] = useState<AnswerDetail[]>([]);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/tests/ljsi?include_scores=true`);

            if (!response.ok) {
                throw new Error("Failed to fetch questions");
            }

            const data = await response.json();
            const sortedQuestions = data.questions.sort((a: ApiQuestion, b: ApiQuestion) =>
                a.order_index - b.order_index
            );

            setQuestions(sortedQuestions);
            setTestId(data.id);
        } catch (error) {
            console.error("Error fetching questions:", error);
            toast({
                title: "加载失败",
                description: "无法加载测试题目，请刷新页面重试",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleStart = () => {
        setHasStarted(true);
        setCurrentQuestionIndex(0);
        setTotalScore(0);
        setIsFinished(false);
        setAnswers([]);
        setAnswerDetails([]);
    };

    const handleAnswer = async (optionId: number) => {
        const currentQuestion = questions[currentQuestionIndex];
        const selectedOption = currentQuestion.options.find(opt => opt.id === optionId);

        // if (!selectedOption?.score) return;

        const newAnswer: Answer = {
            question_id: currentQuestion.id,
            selected_option_id: optionId
        };

        const newAnswers = [...answers, newAnswer];
        setAnswers(newAnswers);

        // 保存答案详情用于结果展示
        const explanation = questionExplanations[currentQuestionIndex + 1]?.[selectedOption.score] || "";
        const newAnswerDetail: AnswerDetail = {
            questionText: currentQuestion.text,
            selectedScore: selectedOption.score,
            explanation
        };
        setAnswerDetails(prev => [...prev, newAnswerDetail]);

        const newTotalScore = totalScore + selectedOption.score;
        setTotalScore(newTotalScore);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            await submitAnswers(newAnswers);
            setIsFinished(true);
        }
    };

    const submitAnswers = async (finalAnswers: Answer[]) => {
        if (!testId) return;

        try {
            await fetch(`${API_BASE_URL}/tests/${testId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    user_id: "anonymous",
                    answers: finalAnswers }),
            });
        } catch (error) {
            console.error('Error submitting answers:', error);
        }
    };

    const handleRestart = () => {
        setHasStarted(false);
        setCurrentQuestionIndex(0);
        setTotalScore(0);
        setIsFinished(false);
        setAnswers([]);
        setAnswerDetails([]);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">加载中...</p>
                </div>
            </div>
        );
    }

    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
                <div className="max-w-3xl mx-auto">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/")}
                        className="mb-6"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        返回首页
                    </Button>

                    <Card className="backdrop-blur-sm bg-background/95 shadow-xl">
                        <CardHeader className="text-center space-y-4 pb-8">
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <HeartHandshake className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-bold mb-2">
                                    亲密守护情景量表
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Love-Jealousy Situations Index (LJSI)
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6 pb-8">
                            <div className="prose prose-sm max-w-none space-y-4">
                                <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                                    <h3 className="text-lg font-semibold text-foreground mb-3">测试说明</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        以下是一些亲密关系中的情景，请根据你看到或想到该情景时的真实感受作答。
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed">
                                        没有对错之分，请直觉作答，每题只选一个选项。
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-primary">{questions.length}</p>
                                        <p className="text-sm text-muted-foreground mt-1">题目数量</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-primary">5-8分钟</p>
                                        <p className="text-sm text-muted-foreground mt-1">预计时间</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleStart}
                                size="lg"
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                            >
                                开始测试
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (isFinished) {
        const result = getJealousyResult(totalScore);

        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
                <div className="max-w-3xl mx-auto space-y-6">
                    <Card className="backdrop-blur-sm bg-background/95 shadow-xl">
                        <CardHeader className="text-center space-y-4">
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <HeartHandshake className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl mb-2">测试完成！</CardTitle>
                                <CardDescription>以下是您的测试结果</CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">

                            <div className="space-y-4">
                                <div className="text-center">
                                    <h3 className={`text-4xl font-bold ${result.color} mb-3`}>
                                        {result.title}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {result.description}
                                    </p>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800 leading-relaxed">
                                        💡 大多数人都会在部分情景出现'在意/不快'的反应；你的结果反映的是亲密边界敏感度差异，并非对错。
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">你的答题分析</h3>
                                <div className="space-y-3">
                                    {answerDetails.map((detail, index) => (
                                        <div key={index} className="bg-muted/30 rounded-lg p-4 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-medium text-foreground flex-1">
                                                    {index + 1}. {detail.questionText}
                                                </p>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {detail.explanation}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button onClick={handleRestart} variant="outline" className="flex-1">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    重新测试
                                </Button>
                                <Button onClick={() => navigate("/")} className="flex-1">
                                    <Home className="w-5 h-5 mr-2" />
                                    返回首页
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/")}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        返回首页
                    </Button>
                </div>

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

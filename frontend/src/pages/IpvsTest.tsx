import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionCard } from "@/components/QuestionCard";
import { ApiQuestion } from "@/data/questions";
import { toast } from "@/hooks/use-toast";
import { ShieldAlert, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

// --- 类型定义 ---

interface Answer {
    question_id: number;
    selected_option_id: number;
}

interface IpvsAnswer {
    orderIndex: number;
    score: number;
}

interface SubDimensionResult {
    name: string;
    avgScore: number;
    level: string;
    description: string;
    color: string;
}

interface IpvsResult {
    totalAvg: number;
    totalLevel: string;
    totalDescription: string;
    totalColor: string;
    subDimensions: SubDimensionResult[];
}

// --- 维度题目索引映射 ---
const PM_INDICES = [1, 2, 3, 4];
const EB_INDICES = [5, 6, 7, 8, 9, 10, 11];
const VD_INDICES = [12, 13, 14, 15];

// --- 1. 总分反馈函数 ---
function getIpvsTotalFeedback(avg: number): { level: string; description: string; color: string } {
    if (avg < 1.5) {
        return {
            level: "关系健康",
            description: "你们的相处里很少出现控制、威胁或贬低的情形，关系的基本气氛是尊重、信任和轻松的。分歧出现时，多数时候仍能保有彼此的体面与好感。\n\n看到你在这段关系里感到安心和被理解，真是值得庆祝的事。愿这份被珍惜的感觉继续陪着你，也愿你一直记得：你值得这样稳定、明亮的亲密。",
            color: "text-green-600"
        };
    } else if (avg < 2.5) {
        return {
            level: "偶有波动",
            description: "这段关系里偶尔会冒出让你不太舒服的时刻，比如被审视或被不公平地怀疑，但更多时候仍能恢复到平和的节奏。\n\n这些波动并不否定你们之间的温度。你的在意说明你把亲密放在心上，你的感受也同样值得被温柔看见与接纳。",
            color: "text-blue-600"
        };
    } else if (avg < 3.5) {
        return {
            level: "压力显现",
            description: "一些不对等或带压力的相处方式开始变得常见，它可能会消耗你的情绪，让你时而怀疑自己的价值与判断。\n\n如果你会感到疲惫、委屈或摇摆，那是非常可以理解的。你的敏感是一种保护本能，也是在提醒：你值得被认真对待和温柔相待。",
            color: "text-amber-600"
        };
    } else if (avg < 4.5) {
        return {
            level: "高度预警",
            description: "控制、施压或否定的经历经常出现，关系的基调更像是在小心翼翼地维持，你需要花很多力气让自己撑住。\n\n若你常感到紧绷、惶然或心口沉重，这并不是你的问题。你已经很努力了，也值得被相信、被尊重、被好好爱。",
            color: "text-orange-600"
        };
    } else {
        return {
            level: "严重受害",
            description: "这些让人受伤的相处方式几乎时常发生，亲密感被不安与无力感覆盖，你或许连“我是不是不够好”都会反复自问。\n\n请把心放在柔软处——你没有做错什么。能走到这里读完这些话，已经很勇敢了。你天生配得上平等与善待，这点始终都不会改变。",
            color: "text-red-600"
        };
    }
}

// --- 2. 权力操纵反馈函数 ---
function getPMFeedback(avg: number): { level: string; description: string; color: string } {
    if (avg < 1.5) return { level: "自主且受尊重", description: "你在日常安排、社交与决定上大多保有自由与信任，关系像并肩的伙伴而不是上下的角色。被尊重的感觉很难得，也很珍贵。", color: "text-green-600" };
    if (avg < 2.5) return { level: "偶有越界", description: "偶尔会出现被要求报备、被规定做法的时刻，但整体仍能回到彼此尊重的轨道。你的在意说明你珍惜自己的边界。", color: "text-blue-600" };
    if (avg < 3.5) return { level: "空间挤压", description: "你的自主空间时常被挤压，像是在“被看着生活”，久而久之会让人委屈和心累。你值得拥有自在与安心。", color: "text-amber-600" };
    if (avg < 4.5) return { level: "规则不对等", description: "不对等的规则成了常态，你可能经常处在解释和被否定的循环里。你依然值得体面与尊重。", color: "text-orange-600" };
    return { level: "严重失衡", description: "权力明显失衡，你的日常像被审查与约束包围，自主感被不断削弱。你值得拥有选择与自由。", color: "text-red-600" };
}

// --- 3. 情感勒索反馈函数 ---
function getEBFeedback(avg: number): { level: string; description: string; color: string } {
    if (avg < 1.5) return { level: "沟通良性", description: "你们很少以“威胁、冷处理或内疚感”推动关系，更多是就事论事地交流。愿你持续被温柔理解与真心拥抱。", color: "text-green-600" };
    if (avg < 2.5) return { level: "偶有情绪化", description: "偶尔会出现以冷淡或暗示愧疚来表达不满的片段，但关系并未被其定义。你的感受是重要的。", color: "text-blue-600" };
    if (avg < 3.5) return { level: "施压显现", description: "施压与内疚感开始频繁，让你不自觉把“顺从”当成“爱”的证明，内心会越来越沉。你的感受是正常的。", color: "text-amber-600" };
    if (avg < 4.5) return { level: "情绪风暴", description: "威胁、失联、把责任全推给你的情况经常发生，你像在一场无休止的情绪风暴中独自站立。你并不需要用受苦来换取爱。", color: "text-orange-600" };
    return { level: "高压勒索", description: "几乎总是依靠施压与愧疚来推进关系，亲密被恐惧取代，自我逐渐被耗空。哪怕只是让自己安静待一会儿，也是在守护自己。", color: "text-red-600" };
}

// --- 4. 价值否定反馈函数 ---
function getVDFeedback(avg: number): { level: string; description: string; color: string } {
    if (avg < 1.5) return { level: "被欣赏", description: "你很少遭遇外貌、能力或人格方面的贬低，更多时候是被欣赏与被看见。愿你持续拥有这份被认可的光。", color: "text-green-600" };
    if (avg < 2.5) return { level: "偶有刺痛", description: "偶尔被比较或被质疑，会留下一点刺痛，但尚未成为关系底色。你的样子已经很好，价值不会因他人一句话抹去。", color: "text-blue-600" };
    if (avg < 3.5) return { level: "自我怀疑", description: "否定或嘲讽较常出现，你可能开始怀疑自己的判断与独特。请记得：你的努力和才华都依旧在那里。", color: "text-amber-600" };
    if (avg < 4.5) return { level: "尊严磨损", description: "贬低与羞辱经常发生，自尊与安全感被一层层磨薄。这不是你的脆弱，而是受伤后的保护。你值得被平等对待。", color: "text-orange-600" };
    return { level: "严重否定", description: "几乎总被否定或羞辱，像被一顶看不见的盖子压着喘不过气。能把自己放在第一位，本身就很勇敢。你的价值从未减少。", color: "text-red-600" };
}

// 计分辅助函数
function calculateAvgScore(indices: number[], answers: IpvsAnswer[]): number {
    const subset = answers.filter(ans => indices.includes(ans.orderIndex));
    if (subset.length === 0) return 0;
    const sum = subset.reduce((acc, curr) => acc + curr.score, 0);
    return sum / subset.length;
}

/**
 * IPVS 结果主计算函数
 */
function getIpvsResult(totalScore: number, answers: IpvsAnswer[]): IpvsResult {
    const totalAvg = totalScore / 15;
    const pmAvg = calculateAvgScore(PM_INDICES, answers);
    const ebAvg = calculateAvgScore(EB_INDICES, answers);
    const vdAvg = calculateAvgScore(VD_INDICES, answers);

    const totalFb = getIpvsTotalFeedback(totalAvg);
    const pmFb = getPMFeedback(pmAvg);
    const ebFb = getEBFeedback(ebAvg);
    const vdFb = getVDFeedback(vdAvg);

    return {
        totalAvg: totalAvg,
        totalLevel: totalFb.level,
        totalDescription: totalFb.description,
        totalColor: totalFb.color,
        subDimensions: [
            { name: "权力操纵 (Power)", avgScore: pmAvg, ...pmFb },
            { name: "情感勒索 (Emotional)", avgScore: ebAvg, ...ebFb },
            { name: "价值否定 (Value)", avgScore: vdAvg, ...vdFb },
        ]
    };
}

export default function IpvsTest() {
    const navigate = useNavigate();
    const [hasStarted, setHasStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [questions, setQuestions] = useState<ApiQuestion[]>([]);
    const [testId, setTestId] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]); 
    const [ipvsAnswers, setIpvsAnswers] = useState<IpvsAnswer[]>([]); 

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/tests/ipvs?include_scores=true`); 
            if (!response.ok) throw new Error("Failed to fetch questions");
            const data = await response.json();
            const sortedQuestions = data.questions.sort((a: ApiQuestion, b: ApiQuestion) => a.order_index - b.order_index);
            setQuestions(sortedQuestions);
            setTestId(data.id);
        } catch (error) {
            toast({ title: "加载失败", description: "无法加载题目", variant: "destructive" });
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
        setIpvsAnswers([]);
    };

    const handleAnswer = async (optionId: number) => {
        const currentQuestion = questions[currentQuestionIndex];
        const selectedOption = currentQuestion.options.find(opt => opt.id === optionId);
        if (!selectedOption) return;

        const newAnswer: Answer = { question_id: currentQuestion.id, selected_option_id: optionId };
        const newAnswers = [...answers, newAnswer];
        setAnswers(newAnswers);

        const newIpvsAnswer: IpvsAnswer = { orderIndex: currentQuestion.order_index, score: selectedOption.score };
        setIpvsAnswers(prev => [...prev, newIpvsAnswer]);

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: "anonymous", answers: finalAnswers }),
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
        setIpvsAnswers([]);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-red-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">加载中...</p>
                </div>
            </div>
        );
    }

    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50 py-8 px-4">
                <div className="max-w-3xl mx-auto">
                    <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" /> 返回首页
                    </Button>
                    <Card className="backdrop-blur-sm bg-background/95 shadow-xl">
                        <CardHeader className="text-center space-y-4 pb-8">
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <ShieldAlert className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-bold mb-2">亲密关系 PUA 受害量表</CardTitle>
                                <CardDescription className="text-base text-red-600">Intimacy PUA Victimisation Scale (IPVS)</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pb-8">
                            <div className="prose prose-sm max-w-none space-y-4">
                                <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                                    <h3 className="text-lg font-semibold text-foreground mb-3">测试说明</h3>
                                    <p className="text-muted-foreground leading-relaxed">请回想你目前或最近一段亲密关系的真实情况。选项无对错之分，请按第一直觉作答。</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-red-600">{questions.length}</p>
                                        <p className="text-sm text-muted-foreground mt-1">题目数量</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-red-600">3-5分钟</p>
                                        <p className="text-sm text-muted-foreground mt-1">预计时间</p>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleStart} size="lg" className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-90 text-white shadow-lg">开始测试</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (isFinished) {
        const result = getIpvsResult(totalScore, ipvsAnswers);
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50 py-8 px-4">
                <div className="max-w-3xl mx-auto space-y-6">
                    <Card className="backdrop-blur-sm bg-background/95 shadow-xl">
                        <CardHeader className="text-center space-y-4 pt-8">
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <ShieldAlert className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl mb-2">测评报告</CardTitle>
                                <CardDescription>关系安全感与边界评估</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 border-b pb-8">
                                <div className="text-center">
                                    <h3 className={`text-3xl font-bold ${result.totalColor} mb-4`}>{result.totalLevel}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">综合平均分：{result.totalAvg.toFixed(2)} / 5.00</p>
                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-left bg-muted/30 p-4 rounded-lg">{result.totalDescription}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-center">分维度详细分析</h3>
                                <div className="grid gap-4">
                                    {result.subDimensions.map((sub, index) => (
                                        <div key={index} className="bg-muted/30 rounded-xl p-5 space-y-3 border border-border/50">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-base font-bold text-foreground">{sub.name}</h4>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${sub.color} bg-white/50 border border-current/20`}>{sub.level} ({sub.avgScore.toFixed(2)})</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{sub.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <Button onClick={handleRestart} variant="outline" className="flex-1 h-12"><RefreshCw className="w-4 h-4 mr-2" />重新测试</Button>
                                <Button onClick={() => navigate("/")} className="flex-1 h-12 bg-gradient-to-r from-rose-500 to-red-600"><Home className="w-5 h-5 mr-2" />返回首页</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50 py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <Button variant="ghost" onClick={() => navigate("/")} className="text-rose-600 hover:text-rose-700 hover:bg-rose-100/50"><ArrowLeft className="mr-2 h-4 w-4" /> 返回首页</Button>
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
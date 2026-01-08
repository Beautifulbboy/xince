import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionCard } from "@/components/QuestionCard";
import { ApiQuestion } from "@/data/questions";
import { toast } from "@/hooks/use-toast";
import { Target, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

// 结构定义
interface Answer {
    question_id: number;
    selected_option_id: number;
}

interface MpsAnswer {
    orderIndex: number;
    score: number;
}

interface SubDimensionResult {
    name: string;
    score: number;
    level: string;
    description: string;
    color: string;
}

interface MpsResult {
    hstScore: number;
    adtScore: number;
    hstLevel: string;
    hstDescription: string;
    hstColor: string;
    adtLevel: string;
    adtDescription: string;
    adtColor: string;
    subDimensions: SubDimensionResult[];
}

// --- 计分维度映射 ---
const SOP_INDICES = [2, 4, 14, 15, 26];
const OOP_INDICES = [10, 11, 12, 19, 24];
const SPP_INDICES = [1, 6, 21, 25, 29];
const EMO_INDICES = [3, 5, 7, 9, 13, 17, 22, 23, 28];
const CB_INDICES = [8, 16, 18, 20, 27];

// 计分辅助函数
function calculateSubScore(indices: number[], answers: MpsAnswer[]): number {
    return answers
        .filter(ans => indices.includes(ans.orderIndex))
        .reduce((sum, ans) => sum + ans.score, 0);
}

// --- 反馈逻辑 ---

// 1. 高标准分量表总分 (HST)
function getHSTFeedback(score: number): { level: string; description: string; color: string } {
    if (score <= 39) {
        return {
            level: "低于常模",
            description: "你整体上不太会被“必须做到最好”这类标准推着走。你更可能用一种相对松弛的方式要求自己：重视把事情做完、做对，但不一定要把每个细节都逼到极致。\n这种状态通常意味着你在面对压力时更容易给自己留空间。即使结果不完美，你也更可能把它看作一次经历，而不是把它当作对自我价值的判定。",
            color: "text-blue-600"
        };
    } else if (score <= 53) {
        return {
            level: "常模范围",
            description: "你的“高标准”处处在多数人的典型水平：你会认真、会追求质量，也会希望自己表现得更好，但你并不总是被完美主义牵着走。\n你既有目标感，也保留了弹性。你对重要事情的在意是正常的，也不需要因为“还想更好”而否定自己。",
            color: "text-amber-600"
        };
    } else {
        return {
            level: "高于常模",
            description: "你对“标准”的敏感度明显更高：你很可能更习惯把事情做到接近理想，甚至把“更好”当作默认要求。对你来说，认真不是口号，而是一种持续的内在驱动力。\n如果你因此感到紧绷或疲惫，也并不说明你不够坚强；恰恰说明你承担的标准更重。你已经很努力了，你的感受值得被理解，而不是被苛责。",
            color: "text-purple-600"
        };
    }
}

// 2. 适应性分量表总分 (ADT) - 分数越高越不适应
function getADTFeedback(score: number): { level: string; description: string; color: string } {
    if (score <= 30) {
        return {
            level: "低于常模",
            description: "在追求高标准的过程中，你整体较少被强烈的焦虑、内耗或反复拉扯困住。即使遇到挫折，你更可能保持稳定，并能把注意力放回到“继续往前”。\n这并不代表你不在意，而是说明你更能把标准当作方向，而不是把它变成压力源。你的稳定感很珍贵，也很真实。",
            color: "text-green-600"
        };
    } else if (score <= 47) {
        return {
            level: "常模范围",
            description: "你的体验处在多数人的典型范围：你会在意结果，也会有紧张、反复思考或情绪波动的时候，但总体仍在可承受区间。\n这种状态非常常见。认真生活的人，本来就会在重要的事情上更敏感一些；你所感受到的波动，并不等同于“脆弱”，只是投入与在意的表现。",
            color: "text-amber-600"
        };
    } else {
        return {
            level: "高于常模",
            description: "你在追求标准时更容易体验到明显的内耗感：可能更担心出错、更难真正放下、更容易在完成后仍觉得“不够好”。对你来说，努力常常伴随较重的心理负担。\n请记住：这种辛苦并不代表你不行，反而常常意味着你太在意、太想把事情做好。你已经付出了很多——当你觉得累时，那不是你的问题，而是你确实背着更重的要求在走路。",
            color: "text-red-600"
        };
    }
}

// 子维度反馈逻辑 (SOP, OOP, SPP, EMO, CB)
function getSopFeedback(score: number) {
    if (score <= 15) return { level: "低于常模", color: "text-blue-600", description: "你对自己的要求整体偏温和，不太会用“必须完美”来逼迫自己。你更可能允许自己有试错、有不确定，并把成长看得比“零失误”更重要。你不需要靠苛刻来证明自己，你本来就值得被善待。" };
    if (score <= 22) return { level: "常模范围", color: "text-amber-600", description: "你对自己的要求处在多数人的典型水平：会在意质量，也会希望自己变得更好，但并不会总用高压方式对待自己。你认真、你努力，同时也能在很多时候接受“阶段性完成”。" };
    return { level: "高于常模", color: "text-purple-600", description: "你对自己的标准非常高，容易把“更好”当作默认目标。你可能更敏感地注意到不足，也更难对自己说“已经够了”。请允许自己承认：你已经做得很多了。" };
}

function getOopFeedback(score: number) {
    if (score <= 13) return { level: "低于常模", color: "text-blue-600", description: "你对他人的要求整体更宽松，不太会坚持别人必须按某种理想标准来表现。你更容易理解差异，也更愿意给对方空间。" };
    if (score <= 20) return { level: "常模范围", color: "text-amber-600", description: "你对他人的期待处在多数人的典型水平：在重要事情上你会希望对方可靠、认真，但你通常也能接受一定的不完美。" };
    return { level: "高于常模", color: "text-purple-600", description: "你对他人的标准明显更高，可能更在意对方是否“应该做到”、是否“足够好”。这种感受并不等于你在为难别人，很多时候只是因为你对责任与质量很看重。" };
}

function getSppFeedback(score: number) {
    if (score <= 7) return { level: "低于常模", color: "text-blue-600", description: "你较少被外界评价与目光左右，不太会把“别人怎么看”当作必须达标的压力。你更可能按自己的节奏行动。" };
    if (score <= 13) return { level: "常模范围", color: "text-amber-600", description: "你对外界期待的敏感度处在多数人的典型范围：你会在意评价与形象，但并不总是被它牵着走。" };
    return { level: "高于常模", color: "text-purple-600", description: "你对外界评价更敏感，可能更容易感觉“我不能出错”“大家都在看着我”。请你对自己温柔一点：这种紧张往往代表你很在意、很认真。" };
}

function getEmoFeedback(score: number) {
    if (score <= 16) return { level: "低于常模", color: "text-green-600", description: "在追求目标或面对挫折时，你整体较少被强烈情绪裹挟。你的波动通常更短、更可控。你的稳定感不是“麻木”，而是一种真实的心理韧性。" };
    if (score <= 29) return { level: "常模范围", color: "text-amber-600", description: "你的情绪体验处在多数人的典型范围：你会紧张、会担心、会烦躁，但通常仍能继续应对与推进。" };
    return { level: "高于常模", color: "text-red-600", description: "你在追求标准或遭遇不顺时，更容易出现明显的焦虑、烦闷、担忧或反复的情绪体验。请记住：情绪强烈并不等于你不行，很多时候只是因为你把事情看得很重。" };
}

function getCbFeedback(score: number) {
    if (score <= 12) return { level: "低于常模", color: "text-green-600", description: "你的思维与行为层面相对更灵活：不太会陷入反复纠结、反复检查或停不下来的自我质疑。你能认真，但不必靠折磨自己来获得安全感。" };
    if (score <= 19) return { level: "常模范围", color: "text-amber-600", description: "你的思维与行为模式处在多数人的典型范围：会反复想一想、再确认一下，重要的是，你仍能让生活继续向前。" };
    return { level: "高于常模", color: "text-red-600", description: "你更容易陷入明显的反复思考、反复确认或“总觉得还不够好”的循环。请你相信：这种停不下来的反复，常常是因为你太在意、太想把事情做对。" };
}

// 主计算函数
function getMpsResult(answers: MpsAnswer[]): MpsResult {
    const sop = calculateSubScore(SOP_INDICES, answers);
    const oop = calculateSubScore(OOP_INDICES, answers);
    const spp = calculateSubScore(SPP_INDICES, answers);
    const hst = sop + oop + spp;

    const emo = calculateSubScore(EMO_INDICES, answers);
    const cb = calculateSubScore(CB_INDICES, answers);
    const adt = emo + cb;

    const hstFb = getHSTFeedback(hst);
    const adtFb = getADTFeedback(adt);

    return {
        hstScore: hst,
        adtScore: adt,
        hstLevel: hstFb.level,
        hstDescription: hstFb.description,
        hstColor: hstFb.color,
        adtLevel: adtFb.level,
        adtDescription: adtFb.description,
        adtColor: adtFb.color,
        subDimensions: [
            { name: "自我完美主义 (SOP)", score: sop, ...getSopFeedback(sop) },
            { name: "他人完美主义 (OOP)", score: oop, ...getOopFeedback(oop) },
            { name: "社会完美主义 (SPP)", score: spp, ...getSppFeedback(spp) },
            { name: "情绪体验 (EMO)", score: emo, ...getEmoFeedback(emo) },
            { name: "认知行为 (CB)", score: cb, ...getCbFeedback(cb) },
        ]
    };
}

// --- 组件部分 ---
export default function MPSTest() {
    const navigate = useNavigate();
    const [hasStarted, setHasStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [questions, setQuestions] = useState<ApiQuestion[]>([]);
    const [testId, setTestId] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [mpsAnswers, setMpsAnswers] = useState<MpsAnswer[]>([]);

    useEffect(() => { fetchQuestions(); }, []);

    const fetchQuestions = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/tests/mps?include_scores=true`);
            if (!response.ok) throw new Error("Failed to fetch questions");
            const data = await response.json();
            setQuestions(data.questions.sort((a: any, b: any) => a.order_index - b.order_index));
            setTestId(data.id);
        } catch (error) {
            console.error(error);
            toast({ title: "加载失败", description: "无法加载题目", variant: "destructive" });
        } finally { setIsLoading(false); }
    };

    const handleStart = () => {
        setHasStarted(true);
        setCurrentQuestionIndex(0);
        setIsFinished(false);
        setAnswers([]);
        setMpsAnswers([]);
    };

    const handleAnswer = async (optionId: number) => {
        const currentQuestion = questions[currentQuestionIndex];
        const selectedOption = currentQuestion.options.find(opt => opt.id === optionId);
        if (!selectedOption) return;

        const newAnswer = { question_id: currentQuestion.id, selected_option_id: optionId };
        const newAnswers = [...answers, newAnswer];
        setAnswers(newAnswers);

        setMpsAnswers(prev => [...prev, { orderIndex: currentQuestion.order_index, score: selectedOption.score }]);

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
        } catch (error) { console.error('Error submitting:', error); }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div></div>;

    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-8 px-4">
                <div className="max-w-3xl mx-auto">
                    <Button variant="ghost" onClick={() => navigate("/")} className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" />返回首页</Button>
                    <Card className="backdrop-blur-sm bg-background/95 shadow-xl">
                        <CardHeader className="text-center space-y-4 pb-8">
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg"><Target className="h-10 w-10 text-white" /></div>
                            <div>
                                <CardTitle className="text-3xl font-bold mb-2">多维完美主义问卷 (MPS)</CardTitle>
                                <CardDescription className="text-base text-purple-600">Multidimensional Perfectionism Scale</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pb-8">
                            <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                                <h3 className="text-lg font-semibold mb-3">指导语</h3>
                                <p className="text-muted-foreground leading-relaxed">请你逐条阅读每个陈述，并在每题后选择一个最符合你真实情况的选项。答案没有对错之分，请尽量根据第一感觉作答。</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-primary">29</p><p className="text-sm text-muted-foreground">题目数量</p></div>
                                <div className="bg-muted/50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-primary">5-10分钟</p><p className="text-sm text-muted-foreground">预计时间</p></div>
                            </div>
                            <Button onClick={handleStart} size="lg" className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg">开始测试</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (isFinished) {
        const result = getMpsResult(mpsAnswers);
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-8 px-4">
                <div className="max-w-3xl mx-auto space-y-6">
                    <Card className="backdrop-blur-sm bg-background/95 shadow-xl">
                        <CardHeader className="text-center"><CardTitle className="text-2xl">测试完成！</CardTitle><CardDescription>完美主义倾向分析报告</CardDescription></CardHeader>
                        <CardContent className="space-y-6">
                            {/* HST 报告 */}
                            <div className="space-y-4 border-b pb-6">
                                <div className="text-center">
                                    <h3 className={`text-2xl font-bold ${result.hstColor} mb-2`}>高标准倾向: {result.hstScore}分</h3>
                                    <p className="text-muted-foreground text-sm whitespace-pre-line leading-relaxed">{result.hstDescription}</p>
                                </div>
                            </div>
                            {/* ADT 报告 */}
                            <div className="space-y-4 border-b pb-6">
                                <div className="text-center">
                                    <h3 className={`text-2xl font-bold ${result.adtColor} mb-2`}>适应性内耗: {result.adtScore}分</h3>
                                    <p className="text-muted-foreground text-sm whitespace-pre-line leading-relaxed">{result.adtDescription}</p>
                                </div>
                            </div>
                            {/* 各维度 */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-center">各维度详细反馈</h3>
                                <div className="grid gap-3">
                                    {result.subDimensions.map((sub, i) => (
                                        <div key={i} className="bg-muted/30 rounded-lg p-4 space-y-2">
                                            <h4 className="font-bold text-foreground">{sub.name} <span className={sub.color}>{sub.score}分</span></h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">{sub.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4"><Button onClick={() => setHasStarted(false)} variant="outline" className="flex-1"><RefreshCw className="h-4 w-4 mr-2" />重新测试</Button><Button onClick={() => navigate("/")} className="flex-1"><Home className="h-4 w-4 mr-2" />返回首页</Button></div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <Button variant="ghost" onClick={() => navigate("/")}><ArrowLeft className="mr-2 h-4 w-4" />返回首页</Button>
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
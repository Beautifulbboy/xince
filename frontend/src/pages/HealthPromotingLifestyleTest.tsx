import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionCard } from "@/components/QuestionCard";
import { ApiQuestion } from "@/data/questions";
import { toast } from "@/hooks/use-toast";
import { HeartPulse, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

// 用于提交给 API 的答案结构
interface Answer {
    question_id: number;
    selected_option_id: number;
}

// 用于在本地计算维度的答案结构
interface HplsAnswer {
    orderIndex: number;
    score: number;
}

// 单个维度的结果
interface SubDimensionResult {
    name: string;
    score: number;
    level: string;
    description: string;
    color: string;
}

// HPLS 总结果
interface HplsResult {
    totalScore: number;
    totalLevel: string;
    totalDescription: string;
    totalColor: string;
    subDimensions: SubDimensionResult[];
}

// --- 结果计算逻辑 ---

// 各维度题目序号 (按新序号)
const IR_INDICES = [4, 10, 17, 23, 30];
const SM_INDICES = [5, 11, 18, 25, 33];
const HR_INDICES = [1, 6, 12, 14, 19, 24, 28, 32, 35, 38, 40];
const N_INDICES = [3, 9, 16, 22, 27, 34];
const PA_INDICES = [2, 8, 15, 21, 26, 31, 37, 39];
const SG_INDICES = [7, 13, 20, 29, 36];

// 计分辅助函数
function calculateSubScore(indices: number[], answers: HplsAnswer[]): number {
    return answers
        .filter(ans => indices.includes(ans.orderIndex))
        .reduce((sum, ans) => sum + ans.score, 0);
}

// 1. 总分反馈
function getTotalScoreFeedback(score: number): { level: string; description: string; color: string } {
    if (score <= 69) {
        return {
            level: "较差",
            description: "你现在与健康相关的很多想法还停留在“知道但难以坚持”的阶段，节律像忽明忽暗的灯，亮的时候能带你走一段，忙起来又会被打断。这并不说明你意志力差，而是说明现实负荷确实很重、可用的时间和能量被持续分走了。\n从今天起，给自己一个可落地的起点：先把一天里最容易做的小动作固定下来，让身体和生活重新感到“可掌控”。当你把第一块小砖稳稳砌好，第二块会容易很多，情绪也会慢慢稳定，动力会在“看见变化”的瞬间自然回来。",
            color: "text-orange-600"
        };
    } else if (score <= 99) {
        return {
            level: "一般",
            description: "你已经拥有几项不错的健康习惯，只是它们像星星，时而明亮、时而被云遮住。整体状态不错，但在高压的时候仍会“失守”，饮食、运动或睡眠中的某一环常常拖了后腿。\n不妨挑一个你最在意、又最容易推进的点，专注于把它变成真正的“日常设置”。当这个点变稳了，再温和地带动另一个点。你会发现，一致性带来的确定感，会让你更愿意对自己友好，也更容易把生活安排成你喜欢的样子。",
            color: "text-amber-600"
        };
    } else if (score <= 129) {
        return {
            level: "良好",
            description: "你已经形成了相对稳定的健康节律，饮食、运动、压力管理或健康责任里总有一两项是亮点。你的身体和情绪总体表现出良好的恢复力，日常的忙碌并没有轻易打乱你对自我照顾的重视。\n接下来更像是“微调的艺术”：在维持主旋律的同时，为强项设置温柔的边界，避免用力过猛；为短板留出一点弹性空间，让它们在不被指责的氛围里慢慢变好。这样做既能守住手里的“确定”，又能持续看见新的进步。",
            color: "text-blue-600"
        };
    } else {
        return {
            level: "优秀",
            description: "你的健康行为已经内化为稳定、自然的生活方式：你会规划，也会倾听身体信号，能在忙碌与恢复之间切换自如。这是一份长期投资的回报，它让你更有底气面对不确定。\n也提醒你偶尔松一松：过度自律有时会悄悄透支愉悦与社交。给自己安排一点“无任务的白天”，把注意力放回兴趣、自然和重要的人身上。你会发现，真正持久的健康，总是与轻松、热爱和联结相伴。",
            color: "text-green-600"
        };
    }
}

// 2. 人际关系 (IR) 反馈
function getIRFeedback(score: number): { level: string; description: string; color: string } {
    if (score <= 8) {
        return { level: "较差", description: "你与他人的连接暂时偏少，赞美或求助不太容易说出口，很多感受更习惯自己消化。不是你不在乎关系，而是你在保护自己，或不确定如何开一个好头。\n先从一件最简单的事开始：把对身边人的一次真实欣赏说出来，或认认真真地回应一条信息。当你允许关系里多一点“被看见”和“被理解”，你会感觉到支持在慢慢聚拢，生活的温度也会随之升高。", color: "text-orange-600" };
    } else if (score <= 12) {
        return { level: "一般", description: "你有基础的连接与互动，但节奏容易被繁忙打乱，热络与疏离像潮汐一样来回。你在关系里的分寸感不错，只是还欠一点点稳定。\n把联系变成生活的一部分，而不是额外的任务：固定一个轻松的相处时刻，或者为共同的兴趣留一块小空间。关系的养分来自日常的点滴，当这些微小的片段多起来，亲密和信任就会稳稳扎根。", color: "text-amber-600" };
    } else if (score <= 16) {
        return { level: "良好", description: "你乐于给予和接收支持，互动自然而真诚。在重要的人面前，你愿意花时间，也愿意为对方“多走一步”。这份良好的互信，正在悄悄守护你的情绪与韧性。\n可以试着把心里的关心表达得再具体一些，或在出现分歧时多一点耐心的倾听。良好的关系不是没有冲突，而是有修复的能力。你已经走在很好的路上，继续这样用心，幸福会更可感。", color: "text-blue-600" };
    } else {
        return { level: "优秀", description: "你的人际网络温暖而可靠，给予与接纳在你身上形成了自然的循环。当需要的时候，你敢于求助；当被需要的时候，你也愿意在场。\n也请照顾好自己：帮助他人不必以牺牲为代价。适度的边界能让你在长期里保持热情和能量，而不会在无形中被消耗。这样，你的温柔与力量才能更长久地陪伴彼此。", color: "text-green-600" };
    }
}

// 3. 压力管理 (SM) 反馈
function getSMFeedback(score: number): { level: string; description: string; color: string } {
    if (score <= 8) {
        return { level: "较差", description: "压力像潮水，退下去又涌上来，你还没来得及休整，就被下一波推着走。你并非不想轻松一点，只是缺少一两个真正“为自己而设”的放松锚点。\n给自己一个可以每天靠近的小港湾：哪怕是十分钟的安静、一次缓慢呼吸、一次与身体对话。当你愿意停一停，情绪会逐渐可辨，生活会在你能掌控的节奏里重新排布。", color: "text-orange-600" };
    } else if (score <= 12) {
        return { level: "一般", description: "你已经会在部分场景中自我安抚，但规律性不够，恢复常常来得慢一些。你知道“该怎么做”，只是在忙碌里很难“每次都做到”。\n不必追求完美，把放松当作日程中与工作同等重要的一项。让它成为你生活的背景乐，而不是临时被想起的救火工具。慢慢地，你会感到疲惫不再积压，心也更愿意松开。", color: "text-amber-600" };
    } else if (score <= 16) {
        return { level: "良好", description: "你能区分哪些可以努力、哪些需要接纳，放松方式也比较稳定。压力来时，你能给自己适度的空间，这让你少了许多无谓的内耗。\n继续保持对自身信号的敏感，并为“高压周”准备一份简化版的生活安排：睡眠、饮食、运动都略微收束。你会发现，准备得越从容，越能把生活握在手心里。", color: "text-blue-600" };
    } else {
        return { level: "优秀", description: "你对压力的识别与应对已经形成体系，既能迅速调整，也能温柔自持。你明白，恢复不是奢侈，而是为了走更远。\n也请容许自己偶尔“什么都不做”。当身心真正得到休息，创造力与韧性会以更轻盈的姿态回到你身上。", color: "text-green-600" };
    }
}

// 4. 健康责任 (HR) 反馈
function getHRFeedback(score: number): { level: string; description: string; color: string } {
    if (score <= 19) {
        return { level: "较差", description: "你与医疗与健康信息的距离还比较远，很多时候是等到问题显性化才会处理。并非你不重视，而是“不知道从哪儿开始”更真切。\n从一件最简单、最具体的事开头：做一次应有的检查、整理一份家用常备清单、把重要的健康资料收进一个文件夹。当你迈出这一步，你会惊喜地发现安心感来自确定，而确定来自行动。", color: "text-orange-600" };
    } else if (score <= 27) {
        return { level: "一般", description: "你能在需要时求助专业人士，但平时较少做主动的记录与规划。健康责任像任务清单里的选做题，常常被更紧急的工作盖过去。\n把健康放回“常规设置”：给体检、复诊和疫苗各腾出一个固定的档期，像安排会议一样对待它们。你会感到，照顾自己不是浪费，而是让未来更省力的投资。", color: "text-amber-600" };
    } else if (score <= 35) {
        return { level: "良好", description: "你愿意主动学习健康知识，也会把建议落实到生活中。对你来说，理解与行动是一体两面，这让你在面对不适或疑问时更有底气。\n接下来可以关注信息的质量与消化度：选取可信来源，理解背后的理由，再转化为适合自己的做法。你的健康素养会因此更扎实，你的内心也会更笃定。", color: "text-blue-600" };
    } else { // >= 36
        return { level: "优秀", description: "你与专业世界的沟通顺畅，能把零散的建议整合成可执行的方案。你在为自己负责，这份成熟令人放心。\n保持敏锐，也保持节制。让自己不被海量信息裹挟，只接纳那些真正可验证、可落实、对你当下有用的内容。这样，清晰就会一直在。", color: "text-green-600" };
    }
}

// 5. 营养 (N) 反馈
function getNFeedback(score: number): { level: string; description: string; color: string } {
    if (score <= 10) {
        return { level: "较差", description: "你的饮食像一辆忙碌的车，油箱时满时空，质量也不稳定。不是你不想吃得好，而是节奏太快，常常只能“有什么吃什么”。\n为自己留出一点准备的时间：早餐先稳住，蔬果先到位，再慢慢看懂标签和搭配。当身体获得更稳定的能量，你会更愿意继续对自己好，饮食也会回馈给你一个更轻松的白天。", color: "text-orange-600" };
    } else if (score <= 15) {
        return { level: "一般", description: "你的结构基本合理，但在忙碌或社交时容易随意，蔬果、优质蛋白和加餐的平衡偶有走样。你知道大方向，只是细节还可以更从容。\n把“可复制的选择”放进行囊：几种习惯性的早餐、几款顺手的加餐、几家让你放心的外卖。当决定变简单，好的选择更容易发生，饮食也能成为你信任的伙伴。", color: "text-amber-600" };
    } else if (score <= 19) {
        return { level: "良好", description: "你已经能做到多样化和适度，懂得如何读标签并据此做选择。饮食给了你稳定的能量，也让你对身体的感觉更明晰。\n接下来不妨在“质量”上下些功夫：在健康与愉悦之间寻找更舒服的比例，让餐桌既有营养也有幸福感。你会发现，越放松，越能长久。", color: "text-blue-600" };
    } else { // >= 20
        return { level: "优秀", description: "你的膳食结构均衡而稳定，规则不是束缚，而是你为自己铺好的路。你清楚自己需要什么，也懂得如何把它放在每天的盘子里。\n别忘了给自己一些弹性：允许偶尔的随性与分享，让饮食服务于生活的丰盛，而不是与之对抗。那样，你会更爱你与食物之间这段关系。", color: "text-green-600" };
    }
}

// 6. 体育活动 (PA) 反馈
function getPAFeedback(score: number): { level: string; description: string; color: string } {
    if (score <= 14) {
        return { level: "较差", description: "运动在你的生活中还不够常驻，身体像在“省电模式”下运行，偶尔提速便容易疲惫。不是你不想动，而是你还没找到那种“让人愿意重复”的方式。\n先从能让你微微出汗的日常走起，让步数与拉伸成为今天就能做到的事。当你的身体重新想起轻快的感觉，运动会从任务变成选择，从负担变成礼物。", color: "text-orange-600" };
    } else if (score <= 20) {
        return { level: "一般", description: "你有一定的活动量，但强度、心率目标或力量训练还不够明确。身体在前进，只是还缺一个更清晰的方向盘。\n把关注点放在“感受更好”而非“做得更多”。找到适合你的节奏与项目，让心肺、力量与灵活性彼此配合。你会发现，运动真正的回报，是把你带回热爱生活的自己。", color: "text-amber-600" };
    } else if (score <= 26) {
        return { level: "良好", description: "你的运动计划清晰且稳定，身体正以你喜欢的方式变得可靠。你对自己有期待，也愿意为之投入。\n保持这份热情，同时也照看好恢复。当你愿意在进步与休息之间找到平衡，成绩会更稳、状态会更久，而运动会成为你生命里真正长情的伙伴。", color: "text-blue-600" };
    } else { // >= 27
        return { level: "优秀", description: "你对训练强度与目标的拿捏很成熟，监测与反馈帮你持续进步。你与自己的身体在合作，而不是较劲。\n适时为自己安排“卸载”的周期，让肌肉与神经系统在放松里重建。运动的尽头不是数字，而是一个自如、自在、可持续的你。", color: "text-green-600" };
    }
}

// 7. 精神成长 (SG) 反馈
function getSGFeedback(score: number): { level: string; description: string; color: string } {
    if (score <= 8) {
        return { level: "较差", description: "你与目标感、意义感之间暂时有些距离，很多时候是被外部推着走。并非你没有追求，而是你还没来得及把目光放回自己。\n从当下最在意的一件小事开始，让它在你的日历里占据一个具体的位置。当你为自己而做，并在小小的完成里看见价值，内在的火种会重新变亮。", color: "text-orange-600" };
    } else if (score <= 12) {
        return { level: "一般", description: "你有方向，也有热情，但落实常常松散，容易被日常的琐碎吞没。你知道什么重要，却不总能给它足够的时间。\n不妨把远处的灯塔拉近一些：把它拆成可以在两周内看见成果的小步骤。在一次次可见的进展里，你会越来越相信自己，也更愿意把时间花给真正重要的事。", color: "text-amber-600" };
    } else if (score <= 16) {
        return { level: "良好", description: "你对自己看重的事情有清晰的认识，也愿意持续投入。成长不再是口号，而是你每天在走的路。\n试着让“学习—输出—回馈”形成闭环：把所学讲给别人听，或者化成一个小作品。当意义能够被分享，你会更深地感受到自己在向前。", color: "text-blue-600" };
    } else { // >= 17
        return { level: "优秀", description: "你拥有强烈而稳定的目标感，能在变化中持续更新自己。你知道该走向哪里，也知道如何在路上照顾好自己。\n别忘了给自己留白。允许偶尔的停驻与游玩，让心在轻松里生长、在丰盛里丰盈。那样，你的方向更稳，你的步伐也更轻。", color: "text-green-600" };
    }
}


/**
 * HPLS 结果主计算函数
 */
function getHplsResult(totalScore: number, answers: HplsAnswer[]): HplsResult {
    // 1. 计算各维度分数
    const irScore = calculateSubScore(IR_INDICES, answers);
    const smScore = calculateSubScore(SM_INDICES, answers);
    const hrScore = calculateSubScore(HR_INDICES, answers);
    const nScore = calculateSubScore(N_INDICES, answers);
    const paScore = calculateSubScore(PA_INDICES, answers);
    const sgScore = calculateSubScore(SG_INDICES, answers);

    // 2. 获取总分和各维度反馈
    const totalFb = getTotalScoreFeedback(totalScore);
    const irFb = getIRFeedback(irScore);
    const smFb = getSMFeedback(smScore);
    const hrFb = getHRFeedback(hrScore);
    const nFb = getNFeedback(nScore);
    const paFb = getPAFeedback(paScore);
    const sgFb = getSGFeedback(sgScore);
    
    // 3. 组装结果对象
    return {
        totalScore: totalScore,
        totalLevel: totalFb.level,
        totalDescription: totalFb.description,
        totalColor: totalFb.color,
        subDimensions: [
            { name: "健康责任 (HR)", score: hrScore, ...hrFb },
            { name: "体育活动 (PA)", score: paScore, ...paFb },
            { name: "营养 (N)", score: nScore, ...nFb },
            { name: "精神成长 (SG)", score: sgScore, ...sgFb },
            { name: "人际关系 (IR)", score: irScore, ...irFb },
            { name: "压力管理 (SM)", score: smScore, ...smFb },
        ]
    };
}


export default function HplsTest() {
    const navigate = useNavigate();
    const [hasStarted, setHasStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [questions, setQuestions] = useState<ApiQuestion[]>([]);
    const [testId, setTestId] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]); // 用于提交 API
    const [hplsAnswers, setHplsAnswers] = useState<HplsAnswer[]>([]); // 用于计算维度

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            setIsLoading(true);
            // API 端点 /hpls 与量表 HPLS 一致，予以保留
            const response = await fetch(`${API_BASE_URL}/tests/hpls?include_scores=true`); 

            if (!response.ok) {
                throw new Error("Failed to fetch questions");
            }

            const data = await response.json();
            // 确保题目按 order_index 排序
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
        setHplsAnswers([]); // 重置 HPLS 答案
    };

    const handleAnswer = async (optionId: number) => {
        const currentQuestion = questions[currentQuestionIndex];
        const selectedOption = currentQuestion.options.find(opt => opt.id === optionId);

        if (!selectedOption) return; // 确保选项存在

        // 1. 保存用于提交 API 的答案
        const newAnswer: Answer = {
            question_id: currentQuestion.id,
            selected_option_id: optionId
        };
        const newAnswers = [...answers, newAnswer];
        setAnswers(newAnswers);

        // 2. 保存用于本地计算维度的答案 (使用 order_index 和 score)
        const newHplsAnswer: HplsAnswer = {
            orderIndex: currentQuestion.order_index,
            score: selectedOption.score,
        };
        setHplsAnswers(prev => [...prev, newHplsAnswer]);

        // 3. 累加总分
        const newTotalScore = totalScore + selectedOption.score;
        setTotalScore(newTotalScore);

        // 4. 切换到下一题或结束
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            await submitAnswers(newAnswers); // 提交 API
            setIsFinished(true); // 显示结果页
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
                    user_id: "anonymous", // 或者您系统的用户ID
                    answers: finalAnswers 
                }),
            });
        } catch (error) {
            console.error('Error submitting answers:', error);
            // 提交失败不应阻塞用户查看结果，这里可以只 log
        }
    };

    const handleRestart = () => {
        setHasStarted(false);
        setCurrentQuestionIndex(0);
        setTotalScore(0);
        setIsFinished(false);
        setAnswers([]);
        setHplsAnswers([]); // 重置 HPLS 答案
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
                            {/* 图标和颜色主题与 HPLS 匹配，予以保留 */}
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <HeartPulse className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-bold mb-2">
                                    健康促进生活方式量表 (HPLP)
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Health Promoting Lifestyle Profile (HPLP)
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6 pb-8">
                            <div className="prose prose-sm max-w-none space-y-4">
                                <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                                    <h3 className="text-lg font-semibold text-foreground mb-3">测试说明</h3>
                                    {/* 更新指导语 */}
                                    <p className="text-muted-foreground leading-relaxed">
                                        请根据您最近一段时间的真实情况作答。
                                    </p>
                                    <p className="text-muted-foreground leading-relaxed">
                                        题目无对错，请依据第一印象选择最符合的一项。每题必答。
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-primary">{questions.length}</p>
                                        <p className="text-sm text-muted-foreground mt-1">题目数量</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                                        {/* 40题，更新预计时间 */}
                                        <p className="text-2xl font-bold text-primary">10-15分钟</p>
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
        // 使用新的 HPLS 结果函数
        const result = getHplsResult(totalScore, hplsAnswers);

        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
                <div className="max-w-3xl mx-auto space-y-6">
                    <Card className="backdrop-blur-sm bg-background/95 shadow-xl">
                        <CardHeader className="text-center space-y-4">
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <HeartPulse className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl mb-2">测试完成！</CardTitle>
                                <CardDescription>以下是您的健康促进生活方式报告</CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">

                            {/* 1. 总分结果展示 */}
                            <div className="space-y-4 border-b pb-6">
                                <div className="text-center">
                                    <h3 className={`text-3xl font-bold ${result.totalColor} mb-3`}>
                                        你的总体健康生活方式: {result.totalLevel}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                        {result.totalDescription}
                                    </p>
                                </div>
                            </div>

                            {/* 2. 分维度结果展示 */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-center">你的分维度报告</h3>
                                <div className="space-y-3">
                                    {result.subDimensions.map((sub, index) => (
                                        <div key={index} className="bg-muted/30 rounded-lg p-4 space-y-2">
                                            <div className="flex justify-between items-start gap-4">
                                                <h4 className="text-base font-semibold text-foreground flex-1">
                                                    {sub.name} <span className={`${sub.color}`}>{sub.level}</span>
                                                </h4>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                                {sub.description}
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

    // 答题界面
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
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiQuestion, ApiTestResponse } from "@/data/questions";
import { Heart, ArrowLeft, Loader2, Home, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Answer {
  question_id: number;
  selected_option_id: number;
}

interface MoodResult {
  score: number;
  level: string;
  description: string;
  color: string;
  icon: typeof CheckCircle2;
}

const getMoodResult = (score: number): MoodResult => {
  if (score <= 5) {
    return {
      score,
      level: "身心适应良好",
      description: "没有明显困扰，请继续保持自己的好心情！",
      color: "text-green-600",
      icon: CheckCircle2,
    };
  } else if (score <= 9) {
    return {
      score,
      level: "轻度情绪困扰",
      description: "建议给予情绪支持，要注意调整一下自己的压力状况，试着多放松心情。",
      color: "text-blue-600",
      icon: AlertCircle,
    };
  } else if (score <= 14) {
    return {
      score,
      level: "中度情绪困扰",
      description: "建议寻求心理咨询或接受专业辅导。",
      color: "text-orange-600",
      icon: AlertCircle,
    };
  } else {
    return {
      score,
      level: "重度情绪困扰",
      description: "需高关怀，建议转介精神科治疗或寻求专业咨询。",
      color: "text-red-600",
      icon: AlertCircle,
    };
  }
};

const MoodThermometerTest = () => {
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
      const response = await fetch("http://192.168.1.244:8002/api/v1/tests/bsrs5");
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

    // 根据选项计算分数（0-4分）
    const optionIndex = currentQuestion.options.findIndex(opt => opt.id === optionId);
    const score = optionIndex >= 0 ? optionIndex : 0;
    
    // 只有前5题计入总分
    if (currentQuestionIndex < 5) {
      setTotalScore(totalScore + score);
    }

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
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 shadow-[var(--shadow-soft)]">
              <Heart className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              心情温度计
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              简式健康量表(BSRS-5)，快速评估您的心理困扰程度
            </p>
          </div>

          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 shadow-[var(--shadow-card)] border border-border/50 space-y-6 text-left">
            <h2 className="text-xl font-semibold text-card-foreground">测试说明</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  1
                </span>
                <span>请回想最近一星期中（包括今天）这些问题造成困扰或苦恼的程度</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  2
                </span>
                <span>本测试共5道题目</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  3
                </span>
                <span>本量表主要作为了解心理困扰程度的工具，并不作为诊断疾病之用</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={handleStart}
            size="lg"
            disabled={loading || questions.length === 0}
            className="w-full max-w-sm h-14 text-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 transition-opacity shadow-[var(--shadow-soft)] disabled:opacity-50"
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
            预计用时：2-3分钟
          </p>
        </div>
      </div>
    );
  }

  if (finished) {
    const result = getMoodResult(totalScore);
    const ResultIcon = result.icon;
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--gradient-subtle)]">
        <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in-0 duration-700">
          <Card className="p-8 shadow-[var(--shadow-card)] border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-500">
                <Heart className="w-10 h-10 text-white" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-card-foreground">测试完成！</h2>
                <p className="text-muted-foreground">感谢您完成全部5道题目</p>
              </div>

              <div className="py-6 space-y-3">
                <div className={`text-5xl font-semibold ${result.color}`}>
                  {result.level}
                </div>
              </div>

              <Card className="p-6 bg-secondary/50 border-border/30">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <ResultIcon className={`w-5 h-5 ${result.color} mt-0.5 flex-shrink-0`} />
                    <p className="text-left text-muted-foreground leading-relaxed">
                      {result.description}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="pt-4 flex gap-4">
                <Button
                  onClick={handleRestart}
                  size="lg"
                  variant="outline"
                  className="flex-1 h-14 text-lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重新测试
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  size="lg"
                  className="flex-1 h-14 text-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 transition-opacity shadow-[var(--shadow-soft)]"
                >
                  <Home className="w-5 h-5 mr-2" />
                  返回首页
                </Button>
              </div>
            </div>
          </Card>
        </div>
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

export default MoodThermometerTest;

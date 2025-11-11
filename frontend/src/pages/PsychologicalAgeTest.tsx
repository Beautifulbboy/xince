import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QuestionCard } from "@/components/QuestionCard";
import { ResultCard } from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import { calculateAgeRange, ApiQuestion, ApiTestResponse } from "@/data/questions";
import { Brain, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";

interface Answer {
  question_id: number;
  selected_option_id: number;
}

const Index = () => {
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
      const response = await fetch(`${API_BASE_URL}/tests/psychological_age`);
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

    // 计算分数（根据选项位置：是=0分，吃不准=1-2分，否=2-4分）
    const optionIndex = currentQuestion.options.findIndex(opt => opt.id === optionId);
    let score = 0;
    if (optionIndex === 0) score = 0; // 是
    else if (optionIndex === 1) score = 1; // 吃不准
    else if (optionIndex === 2) score = 2; // 否
    
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
          user_id: "anonymous", // 可以根据需要修改为实际用户ID
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
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-soft)]">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              心理年龄测试
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              通过30道精心设计的问题，科学评估您的心理年龄状态
            </p>
          </div>

          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 shadow-[var(--shadow-card)] border border-border/50 space-y-6 text-left">
            <h2 className="text-xl font-semibold text-card-foreground">测试说明</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  1
                </span>
                <span>本测试共包含30道题目，每题有三个选项</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  2
                </span>
                <span>请根据您的真实感受选择最符合的答案</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  3
                </span>
                <span>完成后系统将自动计算并给出您的心理年龄范围</span>
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
            预计用时：5-8分钟
          </p>
        </div>
      </div>
    );
  }

  if (finished) {
    const ageRange = calculateAgeRange(totalScore);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--gradient-subtle)]">
        <ResultCard
          totalScore={totalScore}
          ageRange={ageRange}
          onRestart={handleRestart}
        />
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

export default Index;

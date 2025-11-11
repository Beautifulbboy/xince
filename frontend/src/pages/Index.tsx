import { useState } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import { ResultCard } from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import { questions, calculateAgeRange } from "@/data/questions";
import { Brain } from "lucide-react";

const Index = () => {
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleStart = () => {
    setStarted(true);
    setCurrentQuestionIndex(0);
    setTotalScore(0);
    setFinished(false);
  };

  const handleAnswer = (score: number) => {
    const newScore = totalScore + score;
    setTotalScore(newScore);

    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 200);
    } else {
      setTimeout(() => {
        setFinished(true);
      }, 200);
    }
  };

  const handleRestart = () => {
    setStarted(false);
    setCurrentQuestionIndex(0);
    setTotalScore(0);
    setFinished(false);
  };

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--gradient-subtle)]">
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
            className="w-full max-w-sm h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-[var(--shadow-soft)]"
          >
            开始测试
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

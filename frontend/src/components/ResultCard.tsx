import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AgeRange } from "@/data/questions";
import { Brain, RefreshCw, TrendingDown, TrendingUp, Home } from "lucide-react";

interface ResultCardProps {
  totalScore: number;
  ageRange: AgeRange;
  onRestart: () => void;
}

export function ResultCard({ totalScore, ageRange, onRestart }: ResultCardProps) {
  const navigate = useNavigate();
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in-0 duration-700">
      <Card className="p-8 shadow-[var(--shadow-card)] border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent">
            <Brain className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-card-foreground">测试完成！</h2>
            <p className="text-muted-foreground">感谢您完成全部30道题目</p>
          </div>

          <div className="py-6 space-y-3">
            <p className="text-sm text-muted-foreground">您的心理年龄</p>
            <div className={`text-5xl font-bold ${ageRange.color}`}>
              {ageRange.range}
            </div>
          </div>

          <Card className="p-6 bg-secondary/50 border-border/30">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                {totalScore < 50 ? (
                  <TrendingUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-left text-muted-foreground leading-relaxed">
                  {ageRange.description}
                </p>
              </div>
            </div>
          </Card>

          <div className="pt-4 flex gap-4">
            <Button
              onClick={onRestart}
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
              className="flex-1 h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-[var(--shadow-soft)]"
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

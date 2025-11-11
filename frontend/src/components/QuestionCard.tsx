import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiQuestion } from "@/data/questions";

interface QuestionCardProps {
  question: ApiQuestion;
  currentQuestion: number;
  totalQuestions: number;
  onAnswer: (optionId: number) => void;
}

export function QuestionCard({ 
  question, 
  currentQuestion, 
  totalQuestions, 
  onAnswer 
}: QuestionCardProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto p-8 shadow-[var(--shadow-card)] border-border/50 bg-card/80 backdrop-blur-sm">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>问题 {currentQuestion} / {totalQuestions}</span>
            <span>{Math.round((currentQuestion / totalQuestions) * 100)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
              style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        <div className="py-6">
          <h2 className="text-2xl font-semibold text-card-foreground leading-relaxed">
            {question.text}
          </h2>
        </div>

        <div className="grid gap-3">
          {question.options.map((option) => (
            <Button
              key={option.id}
              onClick={() => onAnswer(option.id)}
              variant="outline"
              size="lg"
              className="w-full justify-start text-left h-auto min-h-[3.5rem] py-4 px-6 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 whitespace-normal"
            >
              <span className="font-medium leading-relaxed">{option.text}</span>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}

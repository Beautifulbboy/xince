import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tests } from "@/data/tests";
import { ArrowRight, Brain } from "lucide-react";
import React, { useEffect, useState } from 'react';
import { fetchPopularTests, type PopularTest } from '../api/popularTests';

const Home = () => {
  const [popularTests, setPopularTests] = useState<PopularTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTests = async () => {
      setIsLoading(true);
      const data = await fetchPopularTests();
      setPopularTests(data);
      setIsLoading(false);
    };
    loadTests();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--gradient-subtle)]">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[var(--shadow-soft)]">
              {/* <Brain className="w-6 h-6 text-white" /> */}
              <img src="../public/xince.png"></img>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              心测网
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="/tests" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              全部测试
            </a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              关于我们
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-6 animate-in fade-in-0 duration-700">
          <Badge variant="secondary" className="mb-4">
            专业心理测评平台
          </Badge>
          <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            探索内心世界
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              发现真实自我
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            基于心理学理论，提供科学、专业的心理测评服务，帮助您更好地认识自己
          </p>
        </div>
      </section>

      {/* Tests Grid */}
      <section id="tests" className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-3">
              <h3 className="text-3xl font-bold text-foreground">
                热门测试
              </h3>
            </div>
            <p className="text-muted-foreground">
              选择一个测试，开始探索之旅
            </p>
            <Link 
              to="/tests"
              className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:text-primary/80 transition-colors group"
            >
              点击查看全部测试
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularTests.map((test, index) => {
              const Icon = test.icon;
              return (
                <Card
                  key={test.id}
                  className="group relative overflow-hidden hover:shadow-[var(--shadow-elegant)] transition-all duration-300 hover:-translate-y-1 animate-in fade-in-0 slide-in-from-bottom-4 flex flex-col h-full"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${test.color} flex items-center justify-center shadow-lg mb-4`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    <div className="space-y-2 mb-4 flex-1">
                      <Badge variant="outline" className="text-xs">
                        {test.category}
                      </Badge>
                      <h4 className="text-xl font-semibold text-card-foreground group-hover:text-primary transition-colors">
                        {test.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {test.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span>📝 {test.questionsCount}题</span>
                      <span>⏱️ {test.estimatedTime}</span>
                    </div>

                    <Link to={test.path} className="block mt-auto">
                      <Button className="w-full group/btn bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                        开始测试
                        <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>

                  {/* Decorative gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${test.color} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h3 className="text-3xl font-bold text-foreground">
            为什么选择心测网？
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h4 className="font-semibold text-card-foreground">专业科学</h4>
              <p className="text-sm text-muted-foreground">
                基于权威心理学理论设计
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <h4 className="font-semibold text-card-foreground">隐私安全</h4>
              <p className="text-sm text-muted-foreground">
                您的测试结果完全保密
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="font-semibold text-card-foreground">简单快捷</h4>
              <p className="text-sm text-muted-foreground">
                无需注册，即刻开始测试
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4 bg-card/50">
        <div className="container mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>© 2024 心测网. 本平台测试结果仅供参考，不作为专业心理诊断依据</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;

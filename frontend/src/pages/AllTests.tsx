import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { tests } from "@/data/tests";
import { ArrowRight, Brain, Search, ArrowLeft } from "lucide-react";

const AllTests = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");

  // 获取所有分类
  const categories = useMemo(() => {
    const cats = Array.from(new Set(tests.map(test => test.category)));
    return ["全部", ...cats];
  }, []);

  // 筛选测试
  const filteredTests = useMemo(() => {
    return tests.filter(test => {
      const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          test.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "全部" || test.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

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
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Page Title */}
        <div className="text-center mb-12 animate-in fade-in-0 duration-700">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            全部测试
          </h2>
          <p className="text-lg text-muted-foreground">
            共 {tests.length} 个专业心理测试等你探索
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜索测试名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-card/80 backdrop-blur-sm border-border/50 shadow-[var(--shadow-soft)]"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    : ""
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-center text-muted-foreground">
          找到 <span className="text-foreground font-semibold">{filteredTests.length}</span> 个测试
        </div>

        {/* Tests Grid */}
        {filteredTests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test, index) => {
              const Icon = test.icon;
              return (
                <Card
                  key={test.id}
                  className="group relative overflow-hidden hover:shadow-[var(--shadow-elegant)] transition-all duration-300 hover:-translate-y-1 animate-in fade-in-0 slide-in-from-bottom-4 flex flex-col h-full"
                  style={{ animationDelay: `${index * 50}ms` }}
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
        ) : (
          <div className="text-center py-16 animate-in fade-in-0 duration-500">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              未找到相关测试
            </h3>
            <p className="text-muted-foreground mb-6">
              试试其他关键词或选择不同的分类
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("全部");
              }}
            >
              清空筛选条件
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4 bg-card/50 mt-16">
        <div className="container mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>© 2024 心测网. 本平台测试结果仅供参考，不作为专业心理诊断依据</p>
        </div>
      </footer>
    </div>
  );
};

export default AllTests;

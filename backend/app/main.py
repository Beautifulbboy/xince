from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request  # 1. 导入 Request

# 2. 导入 slowapi 相关模块
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware # <--- 导入中间件

from app.api.api import api_router
from app.core.config import settings

# 3. [关键] 初始化 Limiter 并设置 default_limits
# default_limits=["3/minute"] 会自动应用到所有 API
limiter = Limiter(key_func=get_remote_address, default_limits=["3/minute"])

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# 4. 将 limiter 注册到 app.state
app.state.limiter = limiter

# 5. 添加自定义的异常处理 (返回 429 错误)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 6. [关键] 添加 SlowAPIMiddleware
# 这个中间件会拦截 *所有* 进入的请求，并检查它们是否超出了 default_limits
app.add_middleware(SlowAPIMiddleware)


# 你的 CORS 中间件 (这部分你原来就有)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含你的 API 路由
app.include_router(api_router, prefix=settings.API_V1_STR)

# 7. (可选但推荐) 为根路径也显式加上限制
@app.get("/")
@limiter.limit("3/minute") 
async def read_root(request: Request): # 必须添加 request 参数
    """
    根路径健康检查
    """
    return {"status": "OK", "project": settings.PROJECT_NAME}
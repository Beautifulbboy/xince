// 1. [关键] 导入你现有的 API_BASE_URL
import { API_BASE_URL } from '../config/api'; 
// 2. 导入你的静态测试数据
import { tests, type Test } from '../data/tests';

/**
 * 1. 定义从后端 API (schemas.PopularTest) 返回的原始数据类型
 */
interface PopularTestDTO {
  id: number;
  test_type: string; // [关键] 这是来自数据库的 ID, e.g., "mbti-db-v2"
  title: string;
  description: string | null;
  session_count: number;
}

/**
 * 2. 定义我们最终合并后的数据类型
 */
export interface PopularTest extends Test {
  session_count: number;
}

/**
 * 3. 静态数据查找表 (Map)
 * 键: 前端的 test.id (e.g., "mbti")
 * 值: Test object (with icon, color, etc.)
 */
const testMetadataMap = new Map(tests.map(test => [test.id, test]));

/**
 * 4. [新] 翻译字典 / 映射表
 *
 * 在这里填入你的映射规则
 * 键: 从后端(数据库)来的 test_type
 * 值: 你在 tests.ts (前端) 中使用的 id
 */
const backendIdToFrontendIdMap = new Map<string, string>([
  // --- [MAPPING_HERE] ---
  // 示例:
  // [ "backend_test_type", "frontend_test_id" ],
  [ "psychological_age",    "psychological-age" ],
  [ "bsrs5",                "mood-thermometer" ],
  [ "mfsg",      "fatalism" ],
  [ "ljsi",      "jealousy" ],
  [ "crq",      "couple-relationship" ],
  [ "bhs",      "beck-hopelessness" ],

  // 你只需要在这里列出 *不匹配* 的项即可
  // ----------------------
]);

/**
 * 5. 导出一个异步函数，用于获取和合并数据
 */
export async function fetchPopularTests(): Promise<PopularTest[]> {
  try {
    // a. [核心] 手动将 API_BASE_URL 和端点路径拼接起来
    const fullUrl = `${API_BASE_URL}/tests/popular`;

    // b. 使用浏览器内置的 'fetch' 函数
    const response = await fetch(fullUrl);

    // c. 'fetch' 不会自动处理错误，所以我们必须手动检查
    if (!response.ok) {
      throw new Error(`网络请求失败: ${response.status}`);
    }

    // d. 手动将响应体解析为 JSON
    const popularTestsData = (await response.json()) as PopularTestDTO[];

    // e. 将后端数据与前端的静态元数据 (icons, colors) 合并
    const mergedTests = popularTestsData
      .map(popularData => {
        // e1. 获取后端的 ID
        const backendId = popularData.test_type;

        // e2. [核心] 通过映射表 "翻译" ID
        const frontendId = backendIdToFrontendIdMap.get(backendId) || backendId;

        // e3. 使用 "翻译" 后的 frontendId 去查找静态元数据
        const metadata = testMetadataMap.get(frontendId);

        // e4. 如果找到了, 合并两个对象
        if (metadata) {
          return {
            ...metadata, // 包含 icon, color, path, questionsCount...
            
            title: popularData.title, 
            description: popularData.description || metadata.description,
            session_count: popularData.session_count,
          };
        }

        // e5. 如果没找到, 则过滤掉
        console.warn(`热门测试: 无法找到 "${frontendId}" (来自 "${backendId}") 的前端元数据`);
        return null;
      })
      .filter(test => test !== null) as PopularTest[]; // 过滤掉 null

    return mergedTests;

  } catch (error) {
    console.error("无法获取热门测试:", error);
    return []; // 发生错误时返回一个空数组，防止UI崩溃
  }
}
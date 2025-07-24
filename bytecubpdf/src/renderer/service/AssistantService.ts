import { Assistant } from '@/renderer/model/assistant/AssistantDb';
import { assistantManager } from '@/renderer/service/manager/AssistantManager';
import { useMessage } from 'naive-ui';
const message = useMessage();
/**
 * 助手服务类，提供助手的增删改查功能
 */
export class AssistantService {
  /**
   * 创建新助手
   * @param assistant 助手信息
   * @returns 新创建的助手ID
   */
  public async createAssistant(assistant: Omit<Assistant, 'id'>): Promise<number> {
    try {
      // 验证必填字段
      if (!assistant.name) {
        throw new Error('助手名称不能为空');
      }
      // 保存新助手并获取ID
      const newId = await assistantManager.saveAssistant({
        ...assistant,
        is_enabled: assistant.is_enabled ?? 1
      });

      if (!newId) {
        throw new Error('创建助手失败');
      }

      message.success('助手创建成功');
      return newId;
    } catch (error) {
      message.error(`创建助手失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 更新助手信息
   * @param assistant 助手信息（必须包含id）
   */
  public async updateAssistant(assistant: Partial<Assistant> & { id: number }): Promise<void> {
    try {
      if (!assistant.id) {
        throw new Error('助手ID不能为空');
      }

      if (assistant.name === '') {
        throw new Error('助手名称不能为空');
      }

      await assistantManager.saveAssistant(assistant);
      message.success('助手更新成功');
    } catch (error) {
      message.error(`更新助手失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 删除助手
   * @param id 助手ID
   */
  public async deleteAssistant(id: number): Promise<void> {
    try {
      if (!id) {
        throw new Error('助手ID不能为空');
      }

      // 检查助手是否存在
      const assistant = await assistantManager.getAssistant(id);
      if (!assistant) {
        throw new Error('助手不存在');
      }

      await assistantManager.deleteAssistant(id);
      message.success('助手删除成功');
    } catch (error) {
      message.error(`删除助手失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 获取所有助手
   * @returns 助手列表
   */
  public async getAllAssistants(): Promise<Assistant[]> {
    try {
      return await assistantManager.getAssistants();
    } catch (error) {
      message.error(`获取助手列表失败: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  public async getAssistantByIdString(id: string): Promise<Assistant | null> {
    try {
      if (!id) return null;
      const idNumber = Number(id);
      if(isNaN(idNumber)) return null;
      return await assistantManager.getAssistant(idNumber);
    } catch (error) {
      message.error(`获取助手信息失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  /**
   * 根据ID获取助手
   * @param id 助手ID
   * @returns 助手信息或null
   */
  public async getAssistantById(id: number): Promise<Assistant | null> {
    try {
      if (!id) return null;
      return await assistantManager.getAssistant(id);
    } catch (error) {
      message.error(`获取助手信息失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * 搜索助手（分页）
   * @param page 页码
   * @param pageSize 每页条数
   * @param keyword 搜索关键词
   * @returns 助手列表和总条数
   */
  public async searchAssistants(page: number = 1, pageSize: number = 10, keyword?: string): Promise<{
    list: Assistant[],
    total: number
  }> {
    try {
      return await assistantManager.getAssistantsByPage(page, pageSize, keyword);
    } catch (error) {
      message.error(`搜索助手失败: ${error instanceof Error ? error.message : String(error)}`);
      return { list: [], total: 0 };
    }
  }

  /**
   * 更新助手排序
   * @param id 助手ID
   * @param newOrder 新排序号
   */
  public async updateAssistantOrder(id: number, newOrder: number): Promise<void> {
    try {
      const assistant = await assistantManager.getAssistant(id);
      if (!assistant) {
        throw new Error('助手不存在');
      }

      // 获取当前所有助手
      const assistants = await assistantManager.getAssistants();
      const currentOrder = assistant.order_number;

      // 调整排序
      for (const a of assistants) {
        if (a.id === id) {
          a.order_number = newOrder;
        } else if (newOrder > currentOrder && a.order_number > currentOrder && a.order_number <= newOrder) {
          a.order_number--;
        } else if (newOrder < currentOrder && a.order_number < currentOrder && a.order_number >= newOrder) {
          a.order_number++;
        }

        await assistantManager.saveAssistant(a);
      }

      message.success('排序更新成功');
    } catch (error) {
      message.error(`更新排序失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 切换助手启用/禁用状态
   * @param id 助手ID
   * @param isEnabled 是否启用
   */
  public async toggleAssistantStatus(id: number, isEnabled: boolean): Promise<void> {
    try {
      const assistant = await assistantManager.getAssistant(id);
      if (!assistant) {
        throw new Error('助手不存在');
      }

      await assistantManager.saveAssistant({
        ...assistant,
        is_enabled: isEnabled ? 1 : 0
      });

      message.success(isEnabled ? '助手已启用' : '助手已禁用');
    } catch (error) {
      message.error(`状态更新失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

export const assistantService = new AssistantService();
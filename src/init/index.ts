
import { CreateLocalStorage } from '@d680/localstorage-service'

import { createLogger } from './logger';


export const SERVICE_NAME = '影片信息刮削器';
export const getPictureDefaultPath = (): string => DEFAULT_PATH ? `${DEFAULT_PATH}/pictures` : '';

let DEFAULT_PATH: string = '';
/**
 * 初始化所有服务
 */
export async function init() {
    try {
        // 初始化 Logger
        await createLogger();

        const deviceFactory = await CreateLocalStorage();
        if (!deviceFactory)
            throw new Error('本地存储服务初始化失败');

        // 设置默认路径
        const defaultPath = await deviceFactory.getDefaultPath();
        if (!defaultPath) {
            throw new Error('未找到默认存储');
        }

        // 初始化默认存储路径
        DEFAULT_PATH = defaultPath;

    }
    catch (error) {
        console.error(`${SERVICE_NAME} 初始化失败: ${error}`);
        throw error;
    }
}







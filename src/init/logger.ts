import { Logger } from '@d680/log-service';
export type { Logger };

let dmmLoggerInstance: Logger | null = null;

// 初始化logger的异步函数
export const createLogger = async (): Promise<Logger> => {
    if (!dmmLoggerInstance) {
        dmmLoggerInstance = await Logger.init('影片信息刮削器')
    }
    return dmmLoggerInstance;
};

// 同步获取方法
export const getLogger = (): Logger => {
    if (!dmmLoggerInstance) {
        throw new Error('Logger对象未实例化');
    }
    return dmmLoggerInstance;
};


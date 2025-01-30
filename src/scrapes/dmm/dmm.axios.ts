import { createAxiosBuilder, IAxiosInstance, type ConfiguredBuilder } from '@d680/axios-proxy'
import { ProxySelector } from '@d680/shared'

const dmmCookie: Record<string, string> = {
    'age_check_done': '1'
}

let instance: IAxiosInstance | null = null;

/**
 * 获取dmm的axios实例
 * @returns 
 */
export const dmmAxiosBuilder = async (): Promise<IAxiosInstance> => {
    if (!instance) {
        instance = await createAxiosBuilder()
            // 使用日本代理
            .useProxy(ProxySelector.Japanese)
            .withHeaders({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            })
            // 设置dmm使用的cookie
            .withCookie(dmmCookie)
            // 设置请求超时时间
            .withTimeout(10000)
            .build();
    }
    return instance;
};

export const dmmDetailAxiosHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Host': 'www.dmm.co.jp',
    'Connection': 'keep-alive',
    'Cache-Control': 'max-age=0',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
};

export const dmmListAxiosHeaders = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Host': 'api.video.dmm.co.jp',
    'Connection': 'keep-alive'
};


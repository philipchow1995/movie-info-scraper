import { IPageResultWithItems } from '@d680/shared';
import { getLogger, Logger } from '../init/logger';
import { ISourceMovieInfoModel, MovieInfoScrapeSource } from '../model';
import { IBaseQuery } from '../interface/scraper';
import { IPageQueryParams } from './dmm/dmm.list';


export abstract class BaseListScrape {

    // 刮削源
    protected abstract readonly SOURCE: MovieInfoScrapeSource;

    // 日志
    protected readonly logger: Logger;

    // 每页数量
    protected abstract readonly perPage: number;

    // 最大重试次数
    protected abstract readonly maxRetry: number;

    // 重试延迟
    protected abstract readonly retryDelay: number;

    protected constructor() {
        this.logger = getLogger();
    }


    public abstract scrapeList(query: IBaseQuery): Promise<ISourceMovieInfoModel[]>;

    // 获取指定页
    public abstract getPage(query: IBaseQuery): Promise<IPageResultWithItems<ISourceMovieInfoModel>>;

    // 重试获取指定页
    protected async retryGetPage(query: IPageQueryParams): Promise<IPageResultWithItems<ISourceMovieInfoModel> | null> {
        for (let attempt = 0; attempt <= this.maxRetry; attempt++) {
            try {
                return await this.getPage(query);
            } catch (error) {
                if (attempt < this.maxRetry) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                } else {
                    throw error; // 在最后一次重试后抛出错误
                }
            }
        }
        return null; // 理论上不会到达这里
    }
}

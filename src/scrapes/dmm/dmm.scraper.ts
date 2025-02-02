import { getDateTime } from '@d680/shared';
import { MovieInfoScrapeSource } from '../../database/source.movie.model';
import { MovieInfoScrapeException } from '../../types/movie.exception';
import { DEFAULT_DMM_QUERY, IDmmQuery, DmmContentType } from './query';
import { DmmListScrape } from './dmm.list';

import { BaseScraper } from '../base.scraper';


/**
 * DMM刮削器
 */
export class DmmScraper extends BaseScraper {

    // 刮削源
    protected readonly SOURCE = MovieInfoScrapeSource.DMM;

    public static async init(): Promise<DmmScraper> {
        return new DmmScraper();
    }

    // 获取最新刮削数据
    async getNew(): Promise<void> {
        return;
    }

    async getDay(date: Date): Promise<void> {
        try {
            // 构造条件
            const query: IDmmQuery = {
                ...DEFAULT_DMM_QUERY,
                contentType: DmmContentType.TWO_DIMENSION,
                deliveryStartDate: date,
            }
            await this.getList(query);
        }
        catch (e) {
            throw new MovieInfoScrapeException(`Dmm刮削指定日${getDateTime(date)} 数据失败`, this.SOURCE, e);
        }
    }

    // 搜索刮削数据
    async search(keyword: string): Promise<void> {
        try {
            // 构造条件
            const query: IDmmQuery = {
                ...DEFAULT_DMM_QUERY,
                contentType: DmmContentType.TWO_DIMENSION,
                searchStr: keyword,
            }
            await this.getList(query);

        }
        catch (e) {
            throw new MovieInfoScrapeException('Dmm搜索刮削数据失败', this.SOURCE, e);
        }
    }

    // 条件搜索
    async getQuery(query: IDmmQuery): Promise<void> {
        try {
            await this.getList(query);
        }
        catch (e) {
            throw new MovieInfoScrapeException('Dmm构造刮削条件失败', this.SOURCE, e);
        }
    }
    // 获取详情
    async getDetailCode(code: string): Promise<void> {
        return;
    }

    // 获取详情
    async getDetailUrl(url: string): Promise<void> {
        return;
    }

    // 获取刮削列表
    private async getList(query: IDmmQuery): Promise<void> {
        try {
            const dmmListScrape = await DmmListScrape.init();
            const result = await dmmListScrape.scrapeList(query);

            // 调用基类方法处理结果
            await this.processResults(result);

        }
        catch (e) {
            throw new MovieInfoScrapeException('Dmm获取刮削列表失败', this.SOURCE, e);
        }
    }



}

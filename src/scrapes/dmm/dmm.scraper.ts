import { IMovieInfoScraper, IBaseQuery } from '../../interface/scraper';
import { ISourceMovieInfoDocument, MovieInfoScrapeSource } from '../../model';
import { MovieInfoScrapeException } from '../../types/movie.exception';
import * as DmmQuery from './query';

// Dmm 刮削查询条件接口
export interface IDmmQuery extends IBaseQuery {
    contentType?: DmmQuery.DmmContentType;
    sort?: DmmQuery.DmmSortType;
    releaseType?: DmmQuery.DmmReleaseType;
    deliveryStartDate?: Date;
    labelId?: number;
    markerId?: number;
    directorId?: number;
    actressId?: number;
    seriesId?: number;
    genreId?: number;
}

// Dmm 刮削查询条件默认值
export const DEFAULT_DMM_QUERY: IDmmQuery = {
    maxLimit: 0,
    contentType: DmmQuery.DmmContentType.TWO_DIMENSION,
    sort: DmmQuery.DmmSortType.REVIEW_RANK_SCORE,
    releaseType: DmmQuery.DmmReleaseType.ALL,
    searchStr: '',
    labelId: 0,
    markerId: 0,
    directorId: 0,
    actressId: 0,
    seriesId: 0,
    genreId: 0,
}

/**
 * DMM刮削器
 */
export class DmmScraper implements IMovieInfoScraper {

    // 刮削源
    private readonly SOURCE = MovieInfoScrapeSource.DMM;

    // 获取最新刮削数据
    async getNew(): Promise<ISourceMovieInfoDocument[]> {
        return [];
    }

    // 搜索刮削数据
    async search(keyword: string): Promise<ISourceMovieInfoDocument[]> {
        try {
            const query: IDmmQuery = {
                ...DEFAULT_DMM_QUERY,
                contentType: DmmQuery.DmmContentType.TWO_DIMENSION,
                searchStr: keyword,
            }
            return this.getList(query);
        }
        catch (e) {
            throw new MovieInfoScrapeException('Dmm搜索刮削数据失败', this.SOURCE, e);
        }
    }

    // 获取刮削列表
    async getList(query: IDmmQuery): Promise<ISourceMovieInfoDocument[]> {
        return [];
    }

    // 获取详情
    async getDetailCode(code: string): Promise<ISourceMovieInfoDocument | unknown> {
        return null;
    }

    // 获取详情
    async getDetailUrl(url: string): Promise<ISourceMovieInfoDocument | unknown> {
        return null;
    }
}

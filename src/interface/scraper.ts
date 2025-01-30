import { ISourceMovieInfoDocument, ISourceMovieInfoModel } from '../model';

// 通用查询条件构造
export interface IBaseQuery {
    // 搜索字符串
    searchStr?: string;
    // 最多返回数量
    maxLimit?: number;
    // 最大页数
    maxPage?: number;
}


// 统一刮削器接口

export interface IMovieInfoScraper {
    // 获取最新刮削数据
    getNew(): Promise<void>;
    // 获取刮削列表
    getQuery(query: IBaseQuery): Promise<void>;
    // 搜索刮削数据
    search(keyword: string): Promise<void>;
    // 获取详情
    getDetailUrl(url: string): Promise<void>;
    // 获取详情
    getDetailCode(code: string): Promise<void>;

}

// 列表刮削接口
export interface IMovieInfoScrapeList {
    // 刮削列表
    scrapeList(query: IBaseQuery): Promise<ISourceMovieInfoModel[]>;
}



// 详情刮削接口
export interface IMovieInfoScrapeDetail {
    // 刮削详情
    scrapeDetail(model: ISourceMovieInfoModel): Promise<ISourceMovieInfoModel | unknown>;
}


// 列表刮削接口
export interface IMovieInfoScrapeList {
    // 刮削列表
    scrapeList(query: IBaseQuery): Promise<ISourceMovieInfoModel[]>;
}





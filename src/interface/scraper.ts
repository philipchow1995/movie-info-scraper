import { ISourceMovieInfoDocument } from '../model';

// 通用查询条件构造
export interface IBaseQuery {
    // 搜索字符串
    searchStr: string;
    // 最多返回数量
    maxLimit: number;
}

// 统一刮削器接口
export interface IMovieInfoScraper {
    // 获取最新刮削数据
    getNew(): Promise<ISourceMovieInfoDocument[]>;
    // 获取刮削列表
    getList(query: IBaseQuery): Promise<ISourceMovieInfoDocument[]>;
    // 搜索刮削数据
    search(keyword: string): Promise<ISourceMovieInfoDocument[]>;
    // 获取详情
    getDetailUrl(url: string): Promise<ISourceMovieInfoDocument | unknown>;
    // 获取详情
    getDetailCode(code: string): Promise<ISourceMovieInfoDocument | unknown>;
}

// 列表刮削接口
export interface IMovieInfoScrapeList {
    // 刮削列表
    scrape(query: IBaseQuery): Promise<ISourceMovieInfoDocument[]>;
}

// 详情刮削接口
export interface IMovieInfoScrapeDetail {
    // 刮削详情
    scrape(url: string): Promise<ISourceMovieInfoDocument | unknown>;
}


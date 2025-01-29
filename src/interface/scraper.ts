import { ISourceMovieInfoDocument } from '../model';

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

/*
    通用查询条件构造
*/
export interface IBaseQuery {
    // 搜索字符串
    searchStr: string;
    // 最多返回数量
    maxLimit: number;
}
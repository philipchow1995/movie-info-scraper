import { IPageResult, IBasePageQuery, IPageResultWithItems, MoviePictureType, generateSnowflakeId, getDateTime } from '@d680/shared'
import { getLocalStorageId } from '../../init'
import { IMovieInfoScrapeList, IBaseQuery } from '../../interface/scraper'
import { MovieInfoScrapeException } from '../../types/movie.exception'
import { BaseListScrape } from '../base.list'
import { dmmAxiosBuilder, dmmListAxiosHeaders } from './dmm.axios'
import { ISourceMovieInfoModel, ISourceMovieGeneralModel, ISourceMovieReviewModel, MovieInfoScrapeSource, DEFAULT_SOURCE_MOVIE_INFO, MovieInfoScrapeStatus, ISourceMoviePictureModel, PictureScrapeStatus, SourceMovieInfoModel } from '../../model'
import { DMM_LIST_API_URL, IGraphqlMovie, IGraphqlActress, IGraphqlMovieImage, IGraphqlMovieReview, IGraphqlMaker, IDmmQuery, DmmContentType, DmmReleaseType, DEFAULT_VARIABLES, AV_SEARCH_QUERY } from './query'
import { getDmmCoverPicture, getDmmPostPicture } from './picture'
import { deDmmCode, getDmmDetailUrl, getDmmCodeFormatter } from './utils'

// 导入 mongoose
import mongoose from 'mongoose';
import { exitCode } from 'process'

// GraphQL返回的分页信息结果
interface IPageInfoModel {
    hasNext: boolean;
    limit: number;
    offset: number;
    totalCount: number;
}

// 分页查询参数 + 页码
export type IPageQueryParams = IDmmQuery & IBasePageQuery;

export class DmmListScrape extends BaseListScrape implements IMovieInfoScrapeList {

    // Dmm列表API地址
    private static readonly BASE_URL = DMM_LIST_API_URL;
    // 刮削源为DMM
    protected readonly SOURCE = MovieInfoScrapeSource.DMM;
    // 每页数量
    protected readonly perPage = 120;
    // 最大重试次数
    protected readonly maxRetry = 3;
    // 重试延迟
    protected readonly retryDelay = 2000;

    private constructor() {
        super();
    }

    public static async init(): Promise<DmmListScrape> {
        return new DmmListScrape();
    }

    // 刮削列表
    public async scrapeList(query: IDmmQuery): Promise<ISourceMovieInfoModel[]> {

        // 结果列表
        let resultList: ISourceMovieInfoModel[] = [];

        try {

            let isFinish = false;
            let i = 1;

            while (!isFinish) {
                let pageQuery: IPageQueryParams = { ...query, page: i, perPage: this.perPage };
                const pageData = await this.retryGetPage(pageQuery);
                if (!pageData)
                    throw new MovieInfoScrapeException(`获取第${i}页失败`, this.SOURCE, pageQuery);

                resultList.push(...pageData.items);

                isFinish = pageData.isLast || (query.maxPage && i >= query.maxPage) || (!!query.maxLimit && resultList.length >= query.maxLimit);

                if (query.maxLimit && resultList.length >= query.maxLimit)
                    resultList = resultList.slice(0, query.maxLimit);

                await this.getReport(pageQuery, pageData, resultList);

                i++;
            }

        }
        catch (error) {
            const msg = error instanceof Error ? error.message : error?.toString();
            throw new MovieInfoScrapeException(`刮削列表失败: ${msg}`, this.SOURCE, { Error: error, Data: query });
        }
        finally {
            return resultList;
        }
    }


    // 获取指定页
    public async getPage(query: IPageQueryParams): Promise<IPageResultWithItems<ISourceMovieInfoModel>> {
        try {
            const offset = query.perPage * (query.page - 1);
            const searchStr = query.searchStr ? {
                op: 'AND',
                words: query.searchStr
            } : undefined;

            const axios = await dmmAxiosBuilder();
            const i3_ref = query.searchStr ? 'search' : 'list';

            const response = await axios.post('https://api.video.dmm.co.jp/graphql', this.getGraphQlQuery(query), {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                    'Host': 'api.video.dmm.co.jp',
                    'Connection': 'keep-alive'
                }
            });

            if (response.data.errors) throw new Error(`GraphQL请求错误: ${JSON.stringify(response.data.errors)}`);

            const pageInfo = this.resolvePageInfo(response.data.data.legacySearchPPV.result.pageInfo);
            if (!pageInfo) throw new Error('获取分页信息失败');

            const items: IGraphqlMovie[] = response.data.data.legacySearchPPV.result.contents;
            if (!items) throw new Error('获取影片失败');

            const list = await Promise.all(items.map((item, index) => this.resolveMovieInfo(item, i3_ref, (pageInfo.currentPage - 1) * pageInfo.perPage + index + 1, 1)));

            const result: IPageResultWithItems<ISourceMovieInfoModel> = {
                ...pageInfo,
                items: list
            }
            return result;
        }
        catch (err) {
            const message = err instanceof Error ? `获取列表页失败: ${err.message}` : "未知错误";
            const error = new MovieInfoScrapeException(message, this.SOURCE, { Error: err, Data: query });
            throw error;
        }
    }

    /**
     * 解析分页信息
     * @param pageInfo 
     * @returns 
     */
    private resolvePageInfo(pageInfo: IPageInfoModel): IPageResult {
        try {
            const { hasNext, limit, offset, totalCount } = pageInfo;
            // 总页数
            const pageCount = Math.ceil(totalCount / limit);
            // 是否最后一页
            const isLast = !hasNext;

            // 当前页
            const currentPage = offset / limit + 1;
            // 每页数量
            const perPage = limit;
            // 当前页影片数
            const currentPageItems = isLast ? totalCount % limit : limit;

            return {
                currentPage: currentPage,
                perPage: perPage,
                total: totalCount,
                pageCount: pageCount,
                isLast: isLast,
                currentPageItems: currentPageItems,
            }

        }
        catch (err) {
            const message = err instanceof Error ? `获取分页信息失败: ${err.message}` : "未知错误";
            const error = new MovieInfoScrapeException(message, this.SOURCE, { Error: err, Data: pageInfo });
            throw error;
        }
    }



    // 解析影片信息
    private async resolveMovieInfo(data: IGraphqlMovie, i3_ref: string = "list", i3_ord: number = 0, i3_pst: number = 1): Promise<ISourceMovieInfoModel> {
        const result: ISourceMovieInfoModel = {
            ...DEFAULT_SOURCE_MOVIE_INFO,
            source: this.SOURCE,
            originalCode: data.id,
            status: MovieInfoScrapeStatus.PROCESSING,
        }

        try {
            // 解析番号            
            result.code = deDmmCode(data.id);

            // 检查是否已存在
            const existData = await SourceMovieInfoModel.findOne({
                code: result.code,
                source: this.SOURCE,
            });
            // 完成状态就直接返回
            if (existData?.status === MovieInfoScrapeStatus.COMPLETED)
                return { ...existData.toObject() };

            result.isExist = existData ? true : false;

            result.sourceUrl = getDmmDetailUrl(result.code, i3_ref, i3_ord, i3_pst);

            const codeFormatter = getDmmCodeFormatter(result.originalCode!);
            result.codeGroup = codeFormatter.group ?? '';
            result.groupNumber = codeFormatter.serialNumber ?? 0;

            result.title = data.title;
            result.books = data.bookmarkCount;
            result.isOnSale = data.isOnSale;

            result.actress = this.transActress(data.actresses);

            // 封面图片
            const coverPicture = getDmmCoverPicture(result.originalCode!);
            // 海报图片
            const postPicture = getDmmPostPicture(result.originalCode!);
            result.coverUrl = coverPicture.url;
            result.posterUrl = postPicture.url;
            result.pictures = this.transPictures(data.sampleImages);
            if (result.posterUrl)
                result.pictures.push(postPicture);
            if (result.coverUrl)
                result.pictures.push(coverPicture);

            // 评论评分
            result.reviewData = this.transReview(data.review);
            // 制作商
            result.marker = this.transMaker(data.maker);

            return result;
        }
        catch (err) {
            const message = err instanceof Error ? `解析列表影片信息错误: ${err.message}` : "未知错误";
            const error = new MovieInfoScrapeException(message, this.SOURCE, { Error: err, Data: data });
            result.messages?.push(message);
            await this.logger.errorDetail(message, result.code || result.originalCode || 'unknown', { Error: err, Data: data })
            return { ...result, status: MovieInfoScrapeStatus.FAILED };
        }

    }


    // 转换IGraphqlActress[]为IScrapeSourceActressModel[]
    private transActress = (graphqlActressData: IGraphqlActress[]): ISourceMovieGeneralModel[] => {
        return graphqlActressData.map(graphqlData => {
            return {
                id: generateSnowflakeId(),
                sourceId: graphqlData.id,
                source: MovieInfoScrapeSource.DMM,
                name: graphqlData.name,
            } as ISourceMovieGeneralModel;
        })
    }


    // 转换IGraphqlMovieImage[]为IScrapeMoviePictureDocument[]
    private transPictures = (graphqlPicturesDatas: IGraphqlMovieImage[]): ISourceMoviePictureModel[] => {
        return graphqlPicturesDatas.map(graphqlData => {
            return {
                id: generateSnowflakeId().toString(),
                storageId: getLocalStorageId(),
                seq: graphqlData.number,
                url: graphqlData.largeUrl,
                pictureType: MoviePictureType.剧照,
                status: PictureScrapeStatus.WAITING,
                sourceUrl: '',
                md5: '',
                width: 0,
                height: 0,
                size: 0,
                directoryName: '',
                fileName: '',
                extName: '',
                compressList: []
            } as ISourceMoviePictureModel;
        })
    }


    // 转换IGraphqlMovieReview为IScrapeSourceReviewModel
    private transReview = (graphqlReviewData: IGraphqlMovieReview): ISourceMovieReviewModel => {
        return {
            count: graphqlReviewData.count,
            rate: graphqlReviewData.average,
        } as ISourceMovieReviewModel;
    }


    // 转换IGraphqlMovieMaker为IScrapeSourceMakerModel
    private transMaker = (graphqlMakerData: IGraphqlMaker): ISourceMovieGeneralModel => {
        return {
            id: generateSnowflakeId(),
            sourceId: graphqlMakerData.id.toString(),
            source: MovieInfoScrapeSource.DMM,
            name: graphqlMakerData.name,
        } as ISourceMovieGeneralModel;

    }

    // 获取GraphQL查询条件
    private getGraphQlQuery(query: IPageQueryParams): string {
        try {
            // 计算起始影片偏移量 | 分页开始记录
            const offset = query.perPage * (query.page - 1);

            // 搜索条件构造
            const searchStr = query.searchStr ? {
                op: 'AND',
                words: query.searchStr
            } : undefined;

            // 指定日构造
            const deliveryStartDateStr = query.deliveryStartDate ? getDateTime(query.deliveryStartDate, 'yyyy-MM-dd') : undefined;

            // 指定发行状态
            const legacyReleaseStatus = query.releaseType === deliveryStartDateStr || DmmReleaseType.ALL
                ? undefined
                : query.releaseType;

            // 指定发行商构建
            const labelStr = query.labelId ? {
                op: 'AND',
                words: query.labelId
            } : undefined;

            // 指定制作商构建
            const markerStr = query.makerId ? {
                op: 'AND',
                words: query.makerId
            } : undefined;

            // 指定女优构建
            const actressStr = query.actressId ? {
                op: 'AND',
                words: query.actressId
            } : undefined;

            // 指定监督构建
            const directorStr = query.directorId ? {
                op: 'AND',
                words: query.directorId
            } : undefined;

            // 指定系列构建
            const seriesStr = query.seriesId ? {
                op: 'AND',
                words: query.seriesId
            } : undefined;

            // 指定标签构建
            const genreStr = query.genreId ? {
                op: 'AND',
                words: query.genreId
            } : undefined;

            const filter: any = {
                contentType: query.contentType ?? DmmContentType.TWO_DIMENSION
            };

            const variables = {
                ...DEFAULT_VARIABLES,
                filter: {
                    // 内容类型
                    contentType: query.contentType ?? DmmContentType.TWO_DIMENSION,
                    // 发行类型
                    legacyReleaseStatus: legacyReleaseStatus,
                    // 配信开始日
                    deliveryStartDate: deliveryStartDateStr,
                    // 发行商
                    labelIds: labelStr,
                    // 制作商
                    makerIds: markerStr,
                    // 女优
                    actressIds: actressStr,
                    // 监督
                    directorIds: directorStr,
                    // 系列
                    seriesIds: seriesStr,
                    // 标签
                    genreIds: genreStr,
                },
                offset: offset,
                limit: query.perPage,
                sort: query.sort ?? DEFAULT_VARIABLES.sort,
                query: searchStr
            };
            const data = JSON.stringify({
                query: AV_SEARCH_QUERY.loc?.source.body,
                variables: variables
            }) || "";

            return data;
        }
        catch (err) {
            const message = err instanceof Error ? `获取GraphQL查询条件失败: ${err.message}` : "未知错误";
            const error = new MovieInfoScrapeException(message, this.SOURCE, { Error: err, Data: query });
            throw error;
        }
    }

    private async getReport(pageQuery: IPageQueryParams, pageData: IPageResultWithItems<ISourceMovieInfoModel>, resultList: ISourceMovieInfoModel[]) {
        // 最大页
        const maxPage = pageQuery.maxPage || pageData.pageCount;
        // 刮削影片数量
        const maxLimit = pageQuery.maxLimit || pageData.total;
        // 错误数量
        const errorCount = resultList.filter(item => item.status === MovieInfoScrapeStatus.ERROR).length;
        const errMsg = errorCount > 0 ? `错误${errorCount}部` : '';
        await this.logger.infoWithConsole(`第${pageQuery.page}页/共${maxPage}页  | ${resultList.length}/${maxLimit} | ${errMsg}`, this.SOURCE);
    }
}

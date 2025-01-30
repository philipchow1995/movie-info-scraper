import { Schema, model, Connection, Model, Document, Types } from '@d680/db-client';
import { MovieInfoScrapeSource, MovieInfoScrapeStatus } from '../types/movie.enum';
export { MovieInfoScrapeSource, MovieInfoScrapeStatus };
import { ISourceMoviePictureModel, sourceMoviePictureSchema } from './picture';
export * from './picture';

/*
    刮削影片信息 Mongoose模型    
    @2025-01-27
*/

const modelName = 'SourceMovieInfo';
const collectionName = 'source_movie_info';

// 模型接口
export interface IScrapeMovieInfoModel extends Model<ISourceMovieInfoDocument> {
    findByCode(code: string): Promise<ISourceMovieInfoDocument[]>;
    findBySource(source: string): Promise<ISourceMovieInfoDocument[]>;
    findByTitle(name: string): Promise<ISourceMovieInfoDocument[]>;
}

/**
 * 来源评论刮削模型
 */
export interface ISourceMovieReviewModel {
    // 平均分
    rate: number,
    // 评论数量
    count: number
}

/**
 * 来源通用子项刮削模型 (DMM)
 */
export interface ISourceMovieGeneralModel {
    id: bigint;
    sourceId: string;
    source: MovieInfoScrapeSource;
    name: string;
}

export interface ISourceMovieInfoModel {
    // 是否已存在
    isExist: boolean;
    // 刮削状态 
    status: MovieInfoScrapeStatus,
    // 刮削源
    source: MovieInfoScrapeSource,
    // 刮削源URL
    sourceUrl?: string,
    // 刮削源番号
    code?: string,
    // 刮削源厂牌
    codeGroup?: string,
    // 刮削源厂牌前缀
    codeGroupPrefix?: string,

    // 刮削源厂牌编号
    groupNumber?: number,
    // 刮削源原始番号
    originalCode?: string,

    // 刮削源标题
    title?: string,
    // 刮削源订阅量|预览量
    books?: number,
    // 刮削源时长|秒
    duration?: number,
    // 刮削源描述
    description?: string,
    // 刮削源评分
    reviewData?: any,
    // 刮削源发行商
    publisher?: any,
    // 刮削源制作商
    marker?: any,
    // 刮削源导演
    director?: any,
    // 刮削源标签
    genres?: any,
    // 刮削源其他标签 | 如Dmm的AI关联标签
    otherGenres?: any,

    // 刮削源女优
    actress?: any,
    // 刮削源系列
    series?: any,

    // 刮削源封面
    coverUrl?: string,
    // 刮削源海报
    posterUrl?: string,
    // 刮削源图片
    pictures?: ISourceMoviePictureModel[],

    // 是否已上架(刮削来源)
    isOnSale?: boolean,

    // 是否启用
    isEnabled?: boolean,

    // 刮削消息
    messages?: any[],

    // html
    html?: string,

    // 配信日
    releaseAt?: Date,
    // 发行日
    publishAt?: Date,

    // 刮削时间
    collectedAt?: Date,
    // 创建时间
    createdAt?: Date,
    // 更新时间
    updateAt?: Date,
    // 删除时间
    deleteAt?: Date,
}

export const DEFAULT_SOURCE_MOVIE_INFO: ISourceMovieInfoModel = {
    isExist: false,
    status: MovieInfoScrapeStatus.WAITING,
    source: MovieInfoScrapeSource.UNKNOWN,
    sourceUrl: '',
    code: '',
    codeGroup: '',
    codeGroupPrefix: '',
    groupNumber: 0,
    originalCode: '',
    title: '',
    books: 0,
    duration: 0,
    description: '',
    reviewData: {},
    publisher: {},
    marker: {},
    director: {},
    actress: {},
    genres: {},
    otherGenres: {},
    series: {},

    coverUrl: '',
    posterUrl: '',
    pictures: [],
    isOnSale: false,
    isEnabled: false,
    messages: [],
    html: '',
    releaseAt: new Date(),
    publishAt: new Date(),
    collectedAt: new Date(),
    createdAt: new Date(),
    updateAt: new Date(0),
    deleteAt: new Date(0),
}



/**
 * 刮削影片信息模型
 */
export interface ISourceMovieInfoDocument extends Document, ISourceMovieInfoModel {
    _id: Types.ObjectId;
}

/**
 * 刮削影片信息模型Schema

 */
export const sourceMovieInfoSchema = new Schema<ISourceMovieInfoDocument>({
    // 刮削状态
    status: {
        type: String,
        required: true,
        enum: Object.values(MovieInfoScrapeStatus),
        default: MovieInfoScrapeStatus.PROCESSING,
        index: true,
        comment: '刮削状态'
    },
    // 刮削源
    source: {
        type: String,
        required: true,
        enum: Object.values(MovieInfoScrapeSource),
        index: true,
        comment: '刮削源'
    },
    // 刮削源URL
    sourceUrl: {
        type: String,
        required: true,
        default: '',
        comment: '刮削源URL',
        trim: true,
        maxlength: 1000
    },
    // 番号
    code: {
        type: String,
        required: true,
        comment: '番号',
        trim: true,
        maxlength: 50
    },
    codeGroup: {
        type: String,
        required: true,
        comment: '厂牌',
        trim: true,
        maxlength: 20
    },
    codeGroupPrefix: {
        type: String,
        default: '',
        comment: '厂牌前缀',
        trim: true,
        maxlength: 10
    },
    groupNumber: {
        type: Number,
        required: true,
        comment: '厂牌编号',
        default: 0
    },
    originalCode: {
        type: String,
        required: true,
        comment: '原始番号',
        trim: true,
        maxlength: 50
    },
    title: {
        type: String,
        required: true,
        comment: '标题',
        maxlength: 500,
        trim: true
    },
    books: {
        type: Number,
        comment: '订阅量|预览量',
        default: 0
    },
    duration: {
        type: Number,
        comment: '时长|秒',
        default: 0
    },
    description: {
        type: String,
        comment: '介绍',
        default: '',
        trim: true,
        maxlength: 10000
    },
    reviewData: {
        type: Schema.Types.Mixed,
        comment: '评分数据',
        default: {},
    },
    publisher: {
        type: [{ type: Schema.Types.Mixed }],
        comment: '发行商',
        default: []
    },
    marker: {
        type: [{ type: Schema.Types.Mixed }],
        comment: '制作商',
        default: []
    },
    director: {
        type: [{ type: Schema.Types.Mixed }],
        comment: '导演',
        default: []
    },
    actress: {
        type: [{ type: Schema.Types.Mixed }],
        comment: '女优',
        default: []
    },
    genres: {
        type: [{ type: Schema.Types.Mixed }],
        comment: '标签',
        default: []
    },
    otherGenres: {
        type: [{ type: Schema.Types.Mixed }],
        comment: '其他标签',
        default: []
    },
    series: {
        type: [{ type: Schema.Types.Mixed }],
        comment: '系列',
        default: []
    },

    coverUrl: {
        type: String,
        comment: '封面',
        default: '',
        trim: true,
        maxlength: 500
    },
    posterUrl: {
        type: String,
        default: '',
        comment: '海报',
        trim: true,
        maxlength: 500
    },
    pictures: {
        type: [sourceMoviePictureSchema],
        comment: '图片',
        default: []
    },
    isOnSale: {
        type: Boolean,
        comment: '是否已上架',
        default: false
    },
    isEnabled: {
        type: Boolean,
        comment: '是否启用',
        default: true
    },
    messages: {
        type: [{ type: Schema.Types.Mixed }],
        comment: '刮削消息',
        default: []
    },
    html: {
        type: String,
        comment: '刮削html源码',
        default: ''
    },
    releaseAt: {
        type: Date,
        comment: '配信日',
        default: new Date(0)
    },
    publishAt: {
        type: Date,
        comment: '发行日',
        default: new Date(0)
    },
    collectedAt: {
        type: Date,
        comment: '刮削时间',
        default: new Date(0)
    },
    createdAt: {
        type: Date,
        comment: '创建时间',
        default: new Date(0)
    },
    updateAt: {
        type: Date,
        required: true,
        comment: '更新时间',
        default: new Date(0)
    },
    deleteAt: {
        type: Date,
        comment: '删除时间',
        default: new Date(0)
    }
});

// 创建复合索引
// 番号+刮削源 唯一索引
sourceMovieInfoSchema.index({ code: 1, source: 1 }, { unique: true });

sourceMovieInfoSchema.statics.findByCode = function (code: string) {
    return this.find({ code: code }).sort({ collectedAt: -1 });
}

sourceMovieInfoSchema.statics.findBySource = function (source: string) {
    return this.find({ source: source }).sort({ collectedAt: -1 });
}

sourceMovieInfoSchema.statics.findByTitle = function (name: string) {
    return this.find({
        title: { $regex: name, $options: 'i' }  // i 选项表示不区分大小写
    }).sort({ collectedAt: -1 });
}

export type SourceMovieInfoModelType = typeof SourceMovieInfoModel;

export function createModel(connection?: Connection) {
    return (connection
        ? connection.model<ISourceMovieInfoDocument, SourceMovieInfoModelType>(modelName, sourceMovieInfoSchema, collectionName)
        : model<ISourceMovieInfoDocument, SourceMovieInfoModelType>(modelName, sourceMovieInfoSchema, collectionName));
}

export const SourceMovieInfoModel = model<ISourceMovieInfoDocument>(modelName, sourceMovieInfoSchema, collectionName);

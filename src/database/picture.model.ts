import { Schema, model, Connection, Model, Document, Types } from '@d680/db-client';
import { BaseProcessStatus, MoviePictureType, generateSnowflakeId } from '@d680/shared';
export { MoviePictureType };
import { IPictureEntity, IPictureCompressEntity, PictureCompressFormat } from '@d680/picture-client';

const modelName = 'picture';
const collectionName = 'picture';

const pictureLinkModelName = 'pictureLink';
const pictureLinkCollectionName = 'picture_link';

/**

 * 图片状态

 */
export enum PictureStatus {
    WAITING = BaseProcessStatus.WAITING,
    PROCESSING = BaseProcessStatus.PROCESSING,
    COMPLETED = BaseProcessStatus.COMPLETED,
    FAILED = BaseProcessStatus.FAILED,
    UNKNOWN = BaseProcessStatus.UNKNOWN
}

// 图片从属枚举
export enum PictureTargetType {
    MOVIE = 'MOVIE',
    ACTOR = 'ACTOR',
    OTHER = 'OTHER'
}

// 图片模型 DAO | IPictureEntity是picture-client处理下载及压缩后返回的实体对像，要把它的id去掉
export interface IPictureModel extends Omit<IPictureEntity, 'id'> {
    // 从属类型
    targetType?: PictureTargetType;
    // 从属ID
    targetId?: bigint;
    // 图片ID
    id: bigint;


    // 存储ID
    storageId: string;
    // 序号 | 在相同一组(targetId)中的排序顺序
    seq: number;
    // 图片URL
    url: string;
    // 图片类型
    pictureType: MoviePictureType;
    // 刮削状态
    status: PictureStatus;

    // 图片MD5
    md5?: string;
    // 图片目录
    directoryName?: string;
    // 图片文件名
    fileName?: string;
    // 图片扩展名
    extName?: string;
    // 图片大小
    size?: number;
    // 图片宽度
    width?: number;

    // 图片高度
    height?: number;
    // 图片完整路径
    fullPath?: string;
    // 压缩列表
    compressList?: IPictureCompressModel[];

}

// 图片模型默认值
export const DEFAULT_PICTURE_MODEL: IPictureModel = {
    id: generateSnowflakeId(),
    storageId: '',
    seq: 0,
    url: '',
    pictureType: MoviePictureType.剧照,

    status: PictureStatus.WAITING,
    md5: '',
    directoryName: '',
    fileName: '',
    extName: '',
    size: 0,
    width: 0,

    height: 0,
    compressList: [],
    sourceUrl: '',
}

// 导出默认值
export const getDefaultPictureModel = (): IPictureModel => {
    return DEFAULT_PICTURE_MODEL
}

// 图片压缩子图模型 | IPictureCompressEntity是picture-client处理压缩后返回的实体对像，要把它的id去掉
export interface IPictureCompressModel extends Omit<IPictureCompressEntity, 'id'> {
    // 压缩格式
    zipFormat: PictureCompressFormat;
    // 图片目录
    directoryName: string;
    // 图片文件名
    fileName: string;
    // 图片宽度
    width: number;
    // 图片高度
    height: number;
    // 图片大小
    size: number;
    // 是否添加水印
    hasWaterMark: boolean;
}

// 图片压缩子图模型默认值
export const DEFAULT_PICTURE_COMPRESS_MODEL: IPictureCompressModel = {
    zipFormat: PictureCompressFormat.FHD,
    directoryName: '',
    fileName: '',
    width: 0,
    height: 0,

    size: 0,
    hasWaterMark: false,
    parentId: '',
}

// 导出默认值
export const getDefaultPictureCompressModel = (): IPictureCompressModel => {
    return DEFAULT_PICTURE_COMPRESS_MODEL
}

// 图片Mongoose Document
export type IPictureDocument = IPictureModel & Document & { id: bigint };

// 图片模型Schema
export const pictureSchema = new Schema<IPictureDocument>({
    // 图片ID
    id: {

        type: Schema.Types.BigInt,
        required: true,
        unique: true
    },
    // 序号
    seq: {
        type: Number,
        required: true,
        comment: '序号'
    },
    // 图片URL
    url: {
        type: String,
        required: true,
        comment: '图片URL'
    },
    // 图片类型
    pictureType: {
        type: String,
        required: true,
        enum: Object.values(MoviePictureType),
        comment: '图片类型'
    },
    // 刮削状态
    status: {
        type: String,
        required: true,
        enum: Object.values(PictureStatus),
        default: PictureStatus.WAITING,
        comment: '刮削状态'
    },
    // 图片MD5

    md5: {
        type: String,
        comment: '图片MD5',
        default: ''
    },
    // 图片目录
    directoryName: {
        type: String,
        comment: '图片目录',
        default: ''
    },
    // 图片文件名
    fileName: {
        type: String,
        comment: '图片文件名',
        default: ''
    },
    // 图片扩展名
    extName: {
        type: String,
        comment: '图片扩展名',
        default: ''
    },
    // 图片大小
    size: {
        type: Number,
        comment: '图片大小',
        default: 0
    },
    // 图片宽度
    width: {
        type: Number,
        comment: '图片宽度',
        default: 0
    },
    // 图片高度
    height: {
        type: Number,
        comment: '图片高度',
        default: 0
    }
});

// 图片从属关系模型的Schema
const pictureLinkSchema = new Schema({
    targetId: {
        type: Types.ObjectId,
        required: true,
        comment: '从属ID'
    },
    targetType: {
        type: String,
        enum: Object.values(PictureTargetType),
        required: true,
        comment: '从属类型'
    },
    pictureId: {
        type: Types.ObjectId,
        ref: 'sourcePicture',
        required: true,
        comment: '图片ID'
    }
});

// 创建复合索引
pictureSchema.index({ pictureType: 1, status: 1 });

export const PictureLinkRepository = model(pictureLinkModelName, pictureLinkSchema, pictureLinkCollectionName);




export type PictureRepositoryType = typeof PictureRepository;

export const PictureRepository = model<IPictureDocument>(modelName, pictureSchema, collectionName);

// 方法
export function createModel(connection?: Connection) {
    return (connection
        ? connection.model<IPictureDocument, PictureRepositoryType>(modelName, pictureSchema, collectionName)
        : model<IPictureDocument, PictureRepositoryType>(modelName, pictureSchema, collectionName));
}
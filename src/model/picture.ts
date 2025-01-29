import { Schema } from '@d680/db-client';
import { MoviePictureType } from '@d680/shared';
export { MoviePictureType };

import { IPictureEntity, IPictureCompressEntity, PictureCompressFormat } from '@d680/picture-client';

/**
 * 刮削状态
 */
export enum PictureScrapeStatus {
    // 待处理
    WAITING = "WAITING",
    // 处理中
    PROCESSING = "PROCESSING",
    // 处理完成
    COMPLETED = "COMPLETED",
    // 处理失败
    FAILED = "FAILED",
    // 未知
    UNKNOWN = "UNKNOWN"
}

/**
 * 压缩模型
 */
export interface ISourceMoviePictureCompressDocument extends IPictureCompressEntity {
    // 压缩格式
    zipFormat: PictureCompressFormat;
    // 图片目录
    directoryName: string;
    // 图片文件名
    filename: string;
    // 图片宽度
    width: number;
    // 图片高度
    height: number;
    // 图片大小
    size: number;
    // 是否添加水印
    hasWaterMark: boolean;
}

/**
 * 图片刮削模型
 */
export interface ISourceMoviePictureDocument extends IPictureEntity {
    // 主键ID
    id: string;
    // 序号
    seq: number;
    // 图片URL
    url: string;
    // 图片类型
    pictureType: MoviePictureType;
    // 刮削状态
    status: PictureScrapeStatus;
    // 图片MD5
    md5: string;
    // 图片目录
    directoryName: string;
    // 图片文件名
    fileName: string;
    // 图片扩展名
    extName: string;
    // 图片大小
    size: number;
    // 图片宽度
    width: number;
    // 图片高度
    height: number;
    // 压缩列表
    compressList: ISourceMoviePictureCompressDocument[];
}




// 压缩模型的Schema
export const sourceMoviePictureCompressSchema = new Schema<ISourceMoviePictureCompressDocument>({
    // 压缩格式
    zipFormat: {
        type: String,
        required: true,
        enum: Object.values(PictureCompressFormat),
        comment: '压缩格式'
    },
    // 图片目录
    directoryName: {
        type: String,
        required: true,
        comment: '图片目录'
    },
    // 图片文件名
    filename: {
        type: String,
        required: true,
        comment: '图片文件名'
    },
    // 图片宽度
    width: {
        type: Number,
        required: true,
        comment: '图片宽度'
    },
    // 图片高度
    height: {
        type: Number,
        required: true,
        comment: '图片高度'
    },
    // 图片大小
    size: {
        type: Number,
        required: true,
        comment: '图片大小'
    },
    // 是否添加水印
    hasWaterMark: {
        type: Boolean,
        required: true,
        comment: '是否添加水印'
    }
}, { _id: false });


export const sourceMoviePictureSchema = new Schema<ISourceMoviePictureDocument>({
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
        enum: Object.values(PictureScrapeStatus),
        default: PictureScrapeStatus.WAITING,
        comment: '刮削状态'
    },
    // 图片MD5
    md5: {
        type: String,
        required: true,
        comment: '图片MD5'
    },
    // 图片目录
    directoryName: {
        type: String,
        required: true,
        comment: '图片目录'
    },
    // 图片文件名
    fileName: {
        type: String,
        required: true,
        comment: '图片文件名'
    },
    // 图片扩展名
    extName: {
        type: String,
        required: true,
        comment: '图片扩展名'
    },
    // 图片大小
    size: {
        type: Number,
        required: true,
        comment: '图片大小'
    },
    // 图片宽度
    width: {
        type: Number,
        required: true,
        comment: '图片宽度'
    },
    // 图片高度
    height: {
        type: Number,
        required: true,
        comment: '图片高度'
    },
    // 压缩列表
    compressList: {
        type: [sourceMoviePictureCompressSchema],
        comment: '压缩列表',
        default: []
    }
}, { _id: false })


// 创建复合索引
sourceMoviePictureSchema.index({ pictureType: 1, status: 1 });



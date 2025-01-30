import { Schema } from '@d680/db-client';
import { BaseProcessStatus, MoviePictureType } from '@d680/shared';
export { MoviePictureType };

import { IPictureEntity, IPictureCompressEntity, PictureCompressFormat } from '@d680/picture-client';

/**
 * 刮削状态
 */
export enum PictureScrapeStatus {
    WAITING = BaseProcessStatus.WAITING,
    PROCESSING = BaseProcessStatus.PROCESSING,
    COMPLETED = BaseProcessStatus.COMPLETED,
    FAILED = BaseProcessStatus.FAILED,
    UNKNOWN = BaseProcessStatus.UNKNOWN
}

/**
 * 图片刮削模型
 */
export interface ISourceMoviePictureModel extends IPictureEntity {
    // 主键ID
    id: string;
    // 存储ID
    storageId: string;
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
    compressList: ISourceMoviePictureCompressModel[];
}

/**
 * 图片压缩模型
 */
export interface ISourceMoviePictureCompressModel extends IPictureCompressEntity {
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

/**
 * 图片刮削Mongoose Document
 */
export interface ISourceMoviePictureDocument extends ISourceMoviePictureModel, Document { }

/**
 * 图片压缩Mongoose Document
 */

export interface ISourceMoviePictureCompressDocument extends ISourceMoviePictureCompressModel, Document { }


// 图片压缩模型的Schema

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
    fileName: {
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


// 图片刮削模型的Schema
export const sourceMoviePictureSchema = new Schema<ISourceMoviePictureDocument>({
    id: {
        type: String,
        required: true,
        comment: '主键ID'
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
        enum: Object.values(PictureScrapeStatus),
        default: PictureScrapeStatus.WAITING,
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



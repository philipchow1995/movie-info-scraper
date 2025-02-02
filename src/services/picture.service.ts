import fs from 'fs';
import path from 'path';
import { getCurrentDateTime, MoviePictureType } from '@d680/shared';
import { downloadPicture, pictureCompress, PictureCompressFormat } from '@d680/picture-client'
import { getPictureDefaultPath, getLocalStorageId } from '../init/index'
import { IPictureCompressModel, IPictureModel } from '../database/picture.model';
import { PictureException } from '../types/picture.expception';
import { MovieInfoScrapeSource } from '../types/movie.enum';
import { unlink } from 'fs/promises';


// 默认图片存储根目录
// const DEFAULT_PICTURE_PATH = getPictureDefaultPath();

// 默认存储器ID
// const DEFAULT_STORAGE_ID = getLocalStorageId();

// 压缩图片目录名
const COMPRESS_DIRECTORY_NAME = 'compress';

/**
 * 图片下载和处理
 */
export const ProcessPicture = async (code: string, source: MovieInfoScrapeSource, picture: IPictureModel, referer?: string, origin?: string): Promise<IPictureModel> => {
    let fullPath: string = '';
    try {
        // 图片存储目录规则是

        // 日期/番号/来源/
        // 比如 //192.168.1.67/test/pictures/20250130/abs-257/dmm/
        // 必须小写，无目录则创建目录
        const dateDirectoryName = getCurrentDateTime('yyyyMMdd');
        const directoryName = `${dateDirectoryName}/${code}/${source}`;
        const fullDirectory = path.join(getPictureDefaultPath(), directoryName).toLocaleLowerCase();

        // 使用异步方式检查和创建目录
        try {
            await fs.promises.access(fullDirectory);
        } catch {
            await fs.promises.mkdir(fullDirectory, { recursive: true });
        }

        // 图片文件名        
        picture.fileName = picture.pictureType === MoviePictureType.剧照
            ? `${picture.pictureType}_${picture.seq}.jpg`
            : `${picture.pictureType}.jpg`;

        fullPath = path.join(fullDirectory, picture.fileName).toLocaleLowerCase();
        const result = await downloadPicture(picture.url, fullPath, referer, origin);
        const { id, ...resultWithoutId } = result;
        picture = { ...picture, ...resultWithoutId, directoryName };

        // 压缩图片
        const compressResult = await compressPicture(picture);
        picture = { ...picture, ...compressResult };

        return picture;
    }
    catch (e) {
        // 如果处理失败，清理可能存在的文件
        await cleanupFiles(fullPath);
        const msg = e instanceof Error ? e.message : e?.toString() || '未知错误';
        throw new PictureException(msg, code, picture.url, fullPath, picture);
    }
}

/**
 * 压缩图片
 */
const compressPicture = async (picture: IPictureModel): Promise<IPictureCompressModel[]> => {
    if (!picture.directoryName) throw new Error('图片目录名不能为空');
    if (!picture.fileName) throw new Error('图片文件名不能为空');


    const fullDirectory = path.join(getPictureDefaultPath(), picture.directoryName);
    const fullCompressDirectory = path.join(fullDirectory, COMPRESS_DIRECTORY_NAME).toLocaleLowerCase();
    const fullSourceFilePath = path.join(fullDirectory, picture.fileName).toLocaleLowerCase();

    try {
        // 使用异步方式检查和创建目录
        try {
            await fs.promises.access(fullCompressDirectory);
        } catch {
            await fs.promises.mkdir(fullCompressDirectory, { recursive: true });
        }

        const result = await pictureCompress({
            sourcePath: fullSourceFilePath,
            targetPath: fullCompressDirectory,
            compressFormats: [PictureCompressFormat.FHD, PictureCompressFormat.HD, PictureCompressFormat.MD, PictureCompressFormat.THUMBNAIL],
            waterMarkPath: ''
        });
        return result;
    }
    catch (e) {
        // 如果压缩失败，清理压缩目录
        await cleanupFiles(fullCompressDirectory);
        const msg: string = e instanceof Error ? e.message : e?.toString() || '未知错误';
        throw new Error(msg);
    }
}

/**
 * 清理文件
 */
export const cleanupFiles = async (filePath: string): Promise<void> => {
    if (!filePath) return;

    try {
        const exists = await fs.promises.access(filePath).then(() => true).catch(() => false);
        if (!exists) return;

        const stat = await fs.promises.stat(filePath);
        if (stat.isDirectory()) {
            // 如果是目录，先尝试删除 Thumbs.db
            try {
                const thumbsPath = path.join(filePath, 'Thumbs.db');
                await fs.promises.access(thumbsPath);
                await fs.promises.unlink(thumbsPath);
                console.log(`已删除缩略图缓存: ${thumbsPath}`);
            } catch (err) {
                // 如果 Thumbs.db 不存在或删除失败，继续执行
            }

            // 递归删除目录
            await fs.promises.rm(filePath, { recursive: true, force: true });
        } else {
            // 如果是文件，直接删除
            await unlink(filePath);
        }
        console.log(`已清理: ${filePath}`);
    } catch (err) {
        console.error(`清理失败: ${filePath}`, err);
    }
}

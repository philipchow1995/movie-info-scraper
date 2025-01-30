/**
 * 图片异常
 */

export class PictureException extends Error {
    private readonly Url: string;
    private readonly Path: string;
    private readonly Code?: string;
    private readonly Data?: any;
    constructor(message: string, code: string, url: string, path: string, data?: any) {
        super(message);
        this.Code = code;
        this.Url = url;
        this.Path = path;
        this.Data = data;
    }
}

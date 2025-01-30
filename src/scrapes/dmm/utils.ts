import { load } from 'cheerio';

export const DMM_DETAIL_URL = 'https://www.dmm.co.jp/digital/videoa/-/detail/=/cid=';

export const getDmmCodeFromUrl = (url: string): string => {
    const match = url.match(/cid=([^/?&]+)/);
    return match ? match[1] : '';
}

/**
 * 将Dmm的番号转换为标准格式
 * @param code 1START00157 => START-157 | 140C02832 => C-2832 | h_1711crs00022ai => CRS-022
 * @returns 
 */
export function deDmmCode(code: string): string {
    try {
        // 处理C系列的特殊情况
        const cMatch = code.match(/^\d*c0*(\d{4})$/i);
        if (cMatch) {
            return `C-${parseInt(cMatch[1])}`;
        }

        // 移除常见的DMM前缀
        code = code.toLowerCase().replace(/^(?:h_\d+|)\s*/i, '');

        // 移除可能的其他数字前缀
        code = code.replace(/^(?:[a-z]\d+)/i, '');

        // 移除末尾的字母
        code = code.replace(/[a-z]+$/i, '');

        // 匹配字母部分和数字部分
        const pattern = /([a-z]+)(\d+)$/i;
        const match = code.match(pattern);

        if (!match) {
            return '';
        }

        // 提取字母部分和数字部分
        const letterPart = match[1].toUpperCase();
        const numberPart = match[2];

        // 转换数字部分（确保至少3位数）
        const number = parseInt(numberPart).toString().padStart(3, '0');

        // 返回标准格式
        return `${letterPart}-${number}`;
    } catch {
        return '';
    }
}

/**
 * 将Dmm的番号转换为Dmm的DVD码
 * @param code 
 * 1start00007 => 1start007
 * h_537gozz01577 => h_537gozz1577
 * atb12509 => atb12509
 * @returns 
 */
export function dmmCode2dmmDvdCode(code: string): string {
    try {
        // 处理C系列的特殊情况
        const cMatch = code.match(/^\d*c0*(\d{4})$/i);
        if (cMatch) {
            return code; // C系列保持不变
        }

        // 匹配前缀（包括h_数字）、字母部分和数字部分
        const pattern = /^((?:\d+|h_\d+)?)?([a-z]+)(\d+)$/i;
        const match = code.match(pattern);

        if (!match) {
            return code;
        }

        // 提取各部分
        const prefix = match[1] || ''; // 可能的前缀（包括h_数字）
        const letterPart = match[2];
        let numberPart = match[3];

        // 先转换为整数去掉所有前导零
        const num = parseInt(numberPart);
        const numStr = num.toString();

        // 如果原始长度大于3，直接使用去掉前导零的结果
        // 如果原始长度小于等于3，补零到3位
        numberPart = num < 100 ? numStr.padStart(3, '0') : numStr;

        // 组合DVD码格式
        return `${prefix}${letterPart}${numberPart}`.toLowerCase();
    } catch {
        return code;
    }
}


// 获取Dmm的详情页地址
export const getDmmDetailUrl = (dmmCode: string, i3_ref: string = 'list', i3_ord: number = 0, i3_pst: number = 1) => {
    if (!dmmCode)
        throw new Error('Dmm番号为空');

    let url = `${DMM_DETAIL_URL}${dmmCode}`;
    if (i3_ref)
        url += `?i3_ref=${i3_ref}`;
    if (i3_ord > 0)
        url += `?i3_ord=${i3_ord}`;
    if (i3_pst > 0)
        url += `?i3_pst=${i3_pst}`;
    return url;
}

// 番号组成格式
export interface ICodeFormatterModel {
    // 狗牌前纵
    prefix: string;
    // 狗牌
    group: string;
    // 分隔符
    // splitSymbol: string;
    // 编号
    serial: string;
    // 编号数字
    serialNumber: number;
}

// 获取Dmm番号的组成格式
export const getDmmCodeFormatter = (dmmCode: string): ICodeFormatterModel => {
    try {
        // 默认返回值
        const defaultResult: ICodeFormatterModel = {
            prefix: '',
            group: '',
            serial: '',
            serialNumber: 0
        };

        if (!dmmCode) return defaultResult;

        // 移除末尾的字母
        dmmCode = dmmCode.replace(/[a-z]+$/i, '');

        // 使用正则表达式匹配番号格式
        // 1. 匹配前缀（可选）：可能包含数字、字母和下划线，后面跟着字母
        // 2. 匹配组名：一个或多个字母
        // 3. 匹配序号：数字部分
        const regex = /^([a-z0-9_]*?)([a-z]+)(\d+)$/i;
        const match = dmmCode.toLowerCase().match(regex);

        if (!match) return defaultResult;

        const [, prefix, group, serialNum] = match;

        // 获取纯数字的序号值
        const serialNumber = parseInt(serialNum);

        // 构建返回值
        return {
            prefix: prefix || '',
            group: group,
            serial: serialNum.padStart(5, '0').slice(-5), // 确保序号是5位数，不足补0
            serialNumber: serialNumber
        };
    } catch (error) {
        // 发生错误时返回默认值
        return {
            prefix: '',
            group: '',
            serial: '',
            serialNumber: 0
        };
    }
}

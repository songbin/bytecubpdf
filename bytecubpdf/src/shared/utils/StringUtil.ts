import { v4 as uuidv4 } from 'uuid';
/**
 * 生成不带连字符(-)的UUID
 * @returns 不带连字符的UUID字符串
 */
export const buildId = ():string => {
    const uuid = uuidv4();
    return uuid.replace(/-/g, '');
}

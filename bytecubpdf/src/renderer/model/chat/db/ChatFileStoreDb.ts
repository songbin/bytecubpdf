export interface ChatFileStoreDb {
  /** 主键，自增 */
  id: number;
  /** 文件名 */
  file_name: string;
  /** 文件md5值 */
  file_md5: string;
  /** 文件内容 */
  file_content: string;
  /** 文件类型 */
  file_type: string;
  file_size: number;
  /** 关联messageId */
  msg_id: string;
  /** 关联chatId */
  chat_id: string;
  /** 创建时间 */
  create_time: string;
  /** 更新时间 */
  update_time: string;
  /** 扩展字段1 */
  ext1: string;
  /** 扩展字段2 */
  ext2: string;
  /** 扩展字段3 */
  ext3: string;
  /** 扩展字段4 */
  ext4: string;
  /** 扩展字段5 */
  ext5: string;
  /** 扩展字段6 */
  ext6: string;
  /** 扩展字段7 */
  ext7: string;
  /** 扩展字段8 */
  ext8: string;
  /** 扩展字段9 */
  ext9: string;
  /** 扩展字段10 */
  ext10: string;
  /** 扩展字段11 */
  ext11: string;
  /** 扩展字段12 */
  ext12: string;
  /** 扩展字段13 */
  ext13: string;
  /** 扩展字段14 */
  ext14: string;
  /** 扩展字段15 */
  ext15: string;
  /** 扩展字段16 */
  ext16: string;
  /** 扩展字段17 */
  ext17: string;
  /** 扩展字段18 */
  ext18: string;
  /** 扩展字段19 */
  ext19: string;
  /** 扩展字段20 */
  ext20: string;
}
export interface Feedback {
  userId: string;
  userTag: string;
  /** 서버 이름. DM에서 보내면 없다 */
  guild?: string;
  message: string;
}

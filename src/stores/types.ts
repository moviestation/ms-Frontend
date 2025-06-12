export interface authState {
  // 用户令牌
  token: string | null
  // 记住我
  remember: boolean
  // 原始路径
  originalPath?: string | null
}

export interface userState {
  // 是否属于超级管理员
  superUser: boolean
  // 用户ID
  userID: number
  // 用户名
  userName: string
  // 头像
  avatar: string
  // 用户认证等级 1-未认证 2-已认证
  level: number
  // 权限
  permissions: { [key: string]: any }
}

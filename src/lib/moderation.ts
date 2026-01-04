// Система модерации KuzTube

export interface BanInfo {
  oderId: string;
  reason: string;
  bannedAt: string;
  expiresAt: string | null; // null = навсегда
  duration: string;
}

export interface Warning {
  oderId: string;
  reason: string;
  createdAt: string;
}

export interface ModerationLog {
  id: string;
  moderatorId: string;
  moderatorName: string;
  action: 'ban' | 'unban' | 'warn' | 'delete_comment' | 'delete_video' | 'mute';
  targetUserId: string;
  targetUserName: string;
  reason: string;
  details?: string;
  createdAt: string;
}

// Длительности банов
export const BAN_DURATIONS = [
  { id: '10m', label: '10 минут', ms: 10 * 60 * 1000 },
  { id: '30m', label: '30 минут', ms: 30 * 60 * 1000 },
  { id: '1h', label: '1 час', ms: 60 * 60 * 1000 },
  { id: '1d', label: '1 день', ms: 24 * 60 * 60 * 1000 },
  { id: '1w', label: '1 неделя', ms: 7 * 24 * 60 * 60 * 1000 },
  { id: '1M', label: '1 месяц', ms: 30 * 24 * 60 * 60 * 1000 },
  { id: '1y', label: '1 год', ms: 365 * 24 * 60 * 60 * 1000 },
  { id: 'forever', label: 'Навсегда', ms: null },
];

// Проверка, является ли пользователь модератором
export function isModerator(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  const moderators = JSON.parse(localStorage.getItem('kuztube-moderators') || '[]');
  return moderators.includes(userId);
}

// Проверка, является ли пользователь админом
export function isAdmin(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('kuztube-admin') === 'true';
}

// Выдать роль модератора
export function grantModerator(userId: string): void {
  const moderators = JSON.parse(localStorage.getItem('kuztube-moderators') || '[]');
  if (!moderators.includes(userId)) {
    moderators.push(userId);
    localStorage.setItem('kuztube-moderators', JSON.stringify(moderators));
  }
}

// Снять роль модератора
export function revokeModerator(userId: string): void {
  const moderators = JSON.parse(localStorage.getItem('kuztube-moderators') || '[]');
  const filtered = moderators.filter((id: string) => id !== userId);
  localStorage.setItem('kuztube-moderators', JSON.stringify(filtered));
}

// Получить список модераторов
export function getModerators(): string[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('kuztube-moderators') || '[]');
}

// Забанить пользователя
export function banUser(
  userId: string,
  moderatorId: string,
  moderatorName: string,
  targetUserName: string,
  durationId: string,
  reason: string
): void {
  const duration = BAN_DURATIONS.find(d => d.id === durationId);
  if (!duration) return;

  const bans = JSON.parse(localStorage.getItem('kuztube-user-bans') || '{}');
  
  bans[userId] = {
    oderId: moderatorId,
    reason,
    bannedAt: new Date().toISOString(),
    expiresAt: duration.ms ? new Date(Date.now() + duration.ms).toISOString() : null,
    duration: duration.label,
  };
  
  localStorage.setItem('kuztube-user-bans', JSON.stringify(bans));
  
  // Логируем действие
  addModerationLog({
    moderatorId,
    moderatorName,
    action: 'ban',
    targetUserId: userId,
    targetUserName,
    reason,
    details: `Срок: ${duration.label}`,
  });
}

// Разбанить пользователя
export function unbanUser(
  userId: string,
  moderatorId: string,
  moderatorName: string,
  targetUserName: string
): void {
  const bans = JSON.parse(localStorage.getItem('kuztube-user-bans') || '{}');
  delete bans[userId];
  localStorage.setItem('kuztube-user-bans', JSON.stringify(bans));
  
  addModerationLog({
    moderatorId,
    moderatorName,
    action: 'unban',
    targetUserId: userId,
    targetUserName,
    reason: 'Разбан',
  });
}

// Проверить, забанен ли пользователь
export function isUserBanned(userId: string): { banned: boolean; info?: BanInfo } {
  if (typeof window === 'undefined') return { banned: false };
  
  const bans = JSON.parse(localStorage.getItem('kuztube-user-bans') || '{}');
  const ban = bans[userId];
  
  if (!ban) return { banned: false };
  
  // Проверяем, не истёк ли бан
  if (ban.expiresAt && new Date(ban.expiresAt) < new Date()) {
    // Бан истёк, удаляем
    delete bans[userId];
    localStorage.setItem('kuztube-user-bans', JSON.stringify(bans));
    return { banned: false };
  }
  
  return { banned: true, info: ban };
}

// Выдать предупреждение
export function warnUser(
  userId: string,
  moderatorId: string,
  moderatorName: string,
  targetUserName: string,
  reason: string
): void {
  const warnings = JSON.parse(localStorage.getItem('kuztube-user-warnings') || '{}');
  
  if (!warnings[userId]) {
    warnings[userId] = [];
  }
  
  warnings[userId].push({
    oderId: moderatorId,
    reason,
    createdAt: new Date().toISOString(),
  });
  
  localStorage.setItem('kuztube-user-warnings', JSON.stringify(warnings));
  
  addModerationLog({
    moderatorId,
    moderatorName,
    action: 'warn',
    targetUserId: userId,
    targetUserName,
    reason,
  });
}

// Получить предупреждения пользователя
export function getUserWarnings(userId: string): Warning[] {
  if (typeof window === 'undefined') return [];
  const warnings = JSON.parse(localStorage.getItem('kuztube-user-warnings') || '{}');
  return warnings[userId] || [];
}

// Добавить лог модерации
export function addModerationLog(log: Omit<ModerationLog, 'id' | 'createdAt'>): void {
  const logs = JSON.parse(localStorage.getItem('kuztube-moderation-logs') || '[]');
  
  logs.unshift({
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  });
  
  // Храним только последние 500 логов
  if (logs.length > 500) {
    logs.length = 500;
  }
  
  localStorage.setItem('kuztube-moderation-logs', JSON.stringify(logs));
}

// Получить логи модерации
export function getModerationLogs(): ModerationLog[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('kuztube-moderation-logs') || '[]');
}

// Удалить комментарий (для модератора)
export function deleteCommentAsModerator(
  videoId: string,
  commentId: string,
  moderatorId: string,
  moderatorName: string,
  commentAuthorId: string,
  commentAuthorName: string,
  reason: string
): boolean {
  const comments = JSON.parse(localStorage.getItem(`kuztube-comments-${videoId}`) || '[]');
  const filtered = comments.filter((c: { id: string }) => c.id !== commentId);
  
  if (filtered.length === comments.length) return false;
  
  localStorage.setItem(`kuztube-comments-${videoId}`, JSON.stringify(filtered));
  
  addModerationLog({
    moderatorId,
    moderatorName,
    action: 'delete_comment',
    targetUserId: commentAuthorId,
    targetUserName: commentAuthorName,
    reason,
  });
  
  return true;
}

// Форматирование оставшегося времени бана
export function formatBanTimeLeft(expiresAt: string | null): string {
  if (!expiresAt) return 'Навсегда';
  
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  
  if (diff <= 0) return 'Истёк';
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days} дн.`;
  if (hours > 0) return `${hours} ч.`;
  return `${minutes} мин.`;
}

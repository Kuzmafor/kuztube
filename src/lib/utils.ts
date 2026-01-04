export function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)} млн`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)} тыс.`;
  }
  return views.toString();
}

export function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} ${years === 1 ? 'год' : 'лет'} назад`;
  if (months > 0) return `${months} ${months === 1 ? 'месяц' : 'месяцев'} назад`;
  if (days > 0) return `${days} ${days === 1 ? 'день' : 'дней'} назад`;
  if (hours > 0) return `${hours} ${hours === 1 ? 'час' : 'часов'} назад`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'минуту' : 'минут'} назад`;
  return 'только что';
}

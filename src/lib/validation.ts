// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email обязателен' };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Неверный формат email' };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Пароль обязателен' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'Пароль должен быть не менее 6 символов' };
  }
  return { valid: true };
}

export function validateDisplayName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Имя обязательно' };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: 'Имя должно быть не менее 2 символов' };
  }
  return { valid: true };
}

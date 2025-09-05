// Security utilities for input validation and XSS protection
import DOMPurify from 'dompurify';

// Input validation and sanitization
export class SecurityUtils {
  // Sanitize HTML content to prevent XSS attacks
  static sanitizeHTML(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Configure DOMPurify with safe defaults
    const config = {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: ['href', 'target'],
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
    };
    
    return DOMPurify.sanitize(input, config);
  }

  // Validate and sanitize text input
  static sanitizeText(input: string, maxLength: number = 255): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove any HTML tags and limit length
    const cleaned = input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
      .trim()
      .substring(0, maxLength);
    
    return cleaned;
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Validate phone number (Indonesian format)
  static validatePhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') return false;
    
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }

  // Sanitize phone number
  static sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') return '';
    
    // Remove all non-numeric characters except + at the beginning
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Ensure + is only at the beginning
    if (cleaned.includes('+') && !cleaned.startsWith('+')) {
      cleaned = cleaned.replace(/\+/g, '');
    }
    
    return cleaned;
  }

  // Validate currency amount
  static validateCurrency(amount: any): boolean {
    const num = Number(amount);
    return !isNaN(num) && num >= 0 && num <= 999999999999; // Max 999 billion
  }

  // Sanitize file name for uploads
  static sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') return '';
    
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .substring(0, 255); // Limit length
  }

  // Validate file extension
  static validateFileExtension(fileName: string, allowedExtensions: string[]): boolean {
    if (!fileName || typeof fileName !== 'string') return false;
    
    const extension = fileName.toLowerCase().split('.').pop();
    return extension ? allowedExtensions.includes(extension) : false;
  }

  // Validate URL parameters to prevent injection
  static validateId(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    
    // Allow alphanumeric, hyphens, underscores (typical UUID/ID format)
    const idRegex = /^[a-zA-Z0-9_-]{1,50}$/;
    return idRegex.test(id);
  }

  // Rate limiting helper (simple in-memory implementation)
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  
  static checkRateLimit(identifier: string, maxRequests: number = 5, windowMs: number = 300000): boolean {
    const now = Date.now();
    const key = identifier;
    
    const current = this.rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset or initialize
      this.rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (current.count >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    current.count++;
    return true;
  }

  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  // Content Security Policy header generator
  static generateCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com",
      "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');
  }

  // Clean and validate form data
  static validateFormData(data: Record<string, any>, rules: Record<string, any>): { isValid: boolean; errors: string[]; cleanData: Record<string, any> } {
    const errors: string[] = [];
    const cleanData: Record<string, any> = {};

    for (const [field, value] of Object.entries(data)) {
      const rule = rules[field];
      if (!rule) continue;

      let cleanValue = value;

      // Required field check
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors.push(`${field} wajib diisi`);
        continue;
      }

      // Type-specific validation
      switch (rule.type) {
        case 'email':
          if (value && !this.validateEmail(value)) {
            errors.push(`${field} harus berupa email yang valid`);
          } else {
            cleanValue = this.sanitizeText(value, 254);
          }
          break;
          
        case 'phone':
          if (value && !this.validatePhone(value)) {
            errors.push(`${field} harus berupa nomor telepon yang valid`);
          } else {
            cleanValue = this.sanitizePhone(value);
          }
          break;
          
        case 'text':
          cleanValue = this.sanitizeText(value, rule.maxLength || 255);
          if (rule.minLength && cleanValue.length < rule.minLength) {
            errors.push(`${field} minimal ${rule.minLength} karakter`);
          }
          break;
          
        case 'currency':
          if (value && !this.validateCurrency(value)) {
            errors.push(`${field} harus berupa jumlah yang valid`);
          } else {
            cleanValue = Number(value) || 0;
          }
          break;
          
        case 'html':
          cleanValue = this.sanitizeHTML(value);
          break;
      }

      cleanData[field] = cleanValue;
    }

    return {
      isValid: errors.length === 0,
      errors,
      cleanData
    };
  }
}

// Enhanced safe HTML renderer component utility
export const createSafeHTMLRenderer = (content: string) => {
  const sanitized = SecurityUtils.sanitizeHTML(content.replace(/\n/g, '<br />'));
  return { __html: sanitized };
};

// Security headers for development
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': SecurityUtils.generateCSPHeader()
};
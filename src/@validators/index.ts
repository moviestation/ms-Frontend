import type { ValidationRule } from 'vuetify/types/services/validation'

// 必输校验
export const requiredValidator: ValidationRule = (value: any) => {
  return !!value
}

// 数字校验
export const numberValidator: ValidationRule = (value: any) => {
  return !isNaN(value)
}

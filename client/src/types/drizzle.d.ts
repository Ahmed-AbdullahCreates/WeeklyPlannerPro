declare module 'drizzle-orm/pg-core' {
  export const pgTable: any;
  export const text: any;
  export const serial: any;
  export const integer: any;
  export const boolean: any;
  export const date: any;
  export const timestamp: any;
}

declare module 'drizzle-zod' {
  export function createInsertSchema(table: any, schema?: any): any;
}

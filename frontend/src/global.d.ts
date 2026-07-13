export {}

declare global {
  function __(text: string): string

  interface String {
    format(...args: any[]): string
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    __: (text: string) => string
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
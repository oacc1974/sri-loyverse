import * as React from 'react';

declare module 'react' {
  // Exportar explícitamente los hooks y tipos que necesitamos
  export const useState: typeof React.useState;
  export const useEffect: typeof React.useEffect;
  export const useRef: typeof React.useRef;
  export const useCallback: typeof React.useCallback;
  export const useMemo: typeof React.useMemo;
  export const useContext: typeof React.useContext;
  export const useReducer: typeof React.useReducer;
  export const useLayoutEffect: typeof React.useLayoutEffect;
  
  // Tipos de eventos
  export interface ChangeEvent<T = Element> extends React.SyntheticEvent<T> {
    target: EventTarget & T;
  }
  
  export interface FormEvent<T = Element> extends React.SyntheticEvent<T> {
    target: EventTarget & T;
  }
  
  export interface MouseEvent<T = Element, E = NativeMouseEvent> extends React.SyntheticEvent<T, E> {
    altKey: boolean;
    button: number;
    buttons: number;
    clientX: number;
    clientY: number;
    ctrlKey: boolean;
    metaKey: boolean;
    movementX: number;
    movementY: number;
    pageX: number;
    pageY: number;
    relatedTarget: EventTarget | null;
    screenX: number;
    screenY: number;
    shiftKey: boolean;
  }
  
  export interface KeyboardEvent<T = Element> extends React.SyntheticEvent<T> {
    altKey: boolean;
    charCode: number;
    ctrlKey: boolean;
    key: string;
    keyCode: number;
    locale: string;
    location: number;
    metaKey: boolean;
    repeat: boolean;
    shiftKey: boolean;
    which: number;
  }
  
  // Tipos de componentes
  export type FC<P = {}> = React.FunctionComponent<P>;
  export type FunctionComponent<P = {}> = React.FunctionComponent<P>;
  export type ReactElement<P = any, T extends string | React.JSXElementConstructor<any> = string | React.JSXElementConstructor<any>> = React.ReactElement<P, T>;
  export type ReactNode = React.ReactNode;
  export type CSSProperties = React.CSSProperties;
  export type RefObject<T> = React.RefObject<T>;
  export type Ref<T> = React.Ref<T>;
  export type MutableRefObject<T> = React.MutableRefObject<T>;
}

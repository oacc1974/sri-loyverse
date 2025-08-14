// Declaración de tipos para React hooks en Next.js 14
import React from 'react';

declare module 'react' {
  export import useState = React.useState;
  export import useEffect = React.useEffect;
  export import useCallback = React.useCallback;
  export import useMemo = React.useMemo;
  export import useRef = React.useRef;
  export import useContext = React.useContext;
  export import useReducer = React.useReducer;
}

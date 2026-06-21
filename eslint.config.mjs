import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // react-hooks v6 flags any synchronous setState at the top of an effect.
      // This codebase uses the standard "setLoading(true) before fetch" and
      // "initialize client-only state from localStorage on mount" patterns,
      // which are intentional rather than bugs. Keep them visible as warnings
      // instead of failing the lint.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;

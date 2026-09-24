/**
 * Routes calls to Ethan's exercise implementations, falling back to lib/standins.ts
 * only while an exercise still throws "not implemented". Delete with standins.ts.
 */
import { compileSystemPrompt as realCompile } from "./policies/compile";
import { requireEnv as realRequireEnv } from "./config/env";
import { resolvePrecheck as realResolve } from "./pipeline/precheck";
import { compileSystemPromptStandin, requireEnvStandin, resolvePrecheckStandin } from "./standins";

const warned = new Set<string>();

function withStandin<A extends unknown[], R>(name: string, real: (...a: A) => R, standin: (...a: A) => R) {
  return (...args: A): R => {
    try {
      return real(...args);
    } catch (e) {
      if (e instanceof Error && e.message === "not implemented") {
        if (!warned.has(name)) {
          warned.add(name);
          console.warn(`[whetstone] ${name}: using temporary stand-in (TODO(ethan) not done yet)`);
        }
        return standin(...args);
      }
      throw e;
    }
  };
}

export const compileSystemPrompt = withStandin("compileSystemPrompt", realCompile, compileSystemPromptStandin);
export const requireEnv = withStandin("requireEnv", realRequireEnv, requireEnvStandin);
export const resolvePrecheck = withStandin("resolvePrecheck", realResolve, resolvePrecheckStandin);

import NameManager from "./NameManager";

const HELPERS = {
  interopRequireWildcard: `
    function interopRequireWildcard(obj) {
      if (obj && obj.__esModule) {
        return obj;
      } else {
        var newObj = {};
        if (obj != null) {
          for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              newObj[key] = obj[key];
            }
          }
        }
        newObj.default = obj;
        return newObj;
      }
    }
  `,
  interopRequireDefault: `
    function interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
  `,
  createNamedExportFrom: `
    function createNamedExportFrom(obj, localName, importedName) {
      Object.defineProperty(exports, localName, {enumerable: true, get: () => obj[importedName]});
    }
  `,
  // Note that TypeScript and Babel do this differently; TypeScript does a simple existence
  // check in the exports object and does a plain assignment, whereas Babel uses
  // defineProperty and builds an object of explicitly-exported names so that star exports can
  // always take lower precedence. For now, we do the easier TypeScript thing.
  createStarExport: `
    function createStarExport(obj) {
      Object.keys(obj)
        .filter((key) => key !== "default" && key !== "__esModule")
        .forEach((key) => {
          if (exports.hasOwnProperty(key)) {
            return;
          }
          Object.defineProperty(exports, key, {enumerable: true, get: () => obj[key]});
        });
    }
  `,
  nullishCoalesce: `
    function nullishCoalesce(lhs, rhsFn) {
      if (lhs != null) {
        return lhs;
      } else {
        return rhsFn();
      }
    }
  `,
  optionalChain: `
    function optionalChain(ops) {
      let lastAccessLHS = undefined;
      let value = ops[0];
      let i = 1;
      while (i < ops.length) {
        const op = ops[i];
        const fn = ops[i + 1];
        i += 2;
        if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) {
          return undefined;
        }
        if (op === 'access' || op === 'optionalAccess') {
          lastAccessLHS = value;
          value = fn(value);
        } else if (op === 'call' || op === 'optionalCall') {
          value = fn((...args) => value.call(lastAccessLHS, ...args));
          lastAccessLHS = undefined;
        }
      }
      return value;
    }
  `,
};

export class HelperManager {
  helperNames: {[baseName in keyof typeof HELPERS]?: string} = {};
  constructor(readonly nameManager: NameManager) {}

  getHelperName(baseName: keyof typeof HELPERS): string {
    let helperName = this.helperNames[baseName];
    if (helperName) {
      return helperName;
    }
    helperName = this.nameManager.claimFreeName(`_${baseName}`);
    this.helperNames[baseName] = helperName;
    return helperName;
  }

  emitHelpers(): string {
    let resultCode = "";
    for (const [baseName, helperCode] of Object.entries(HELPERS)) {
      const helperName = this.helperNames[baseName];
      if (helperName) {
        resultCode += " ";
        resultCode += helperCode
          .replace(baseName, helperName)
          .replace(/\s+/g, " ")
          .trim();
      }
    }
    return resultCode;
  }
}

// DSH: НІКОЛИ не матеріалізувати @deepseek-ai/* у profiles/web/node_modules.
//
// Чому: Node ESM на Windows не робить realpath junction'ів — той самий пакет,
// завантажений через шлях профілю і через шлях runtime/, вважається ДВОМА
// різними модулями. dsh-tools тримає символ scheduler (Symbol.for-like ключ
// у ctx.tools), і коли agent-loop бачить один інстанс, а ToolRuntime — інший,
// кожен tool call падає з:
//   "Cannot read properties of undefined (reading 'prepare')"
//
// Плагіни мають резолвити @deepseek-ai/* через profiles/node_modules (junction
// на runtime/node_modules, який dsh створює при бооті) — тоді URL модуля
// один, інстанс один, символи збігаються.
//
// Цей хук зрізає @deepseek-ai/* з dependencies/optionalDependencies/
// peerDependencies будь-якого пакета, щоб pnpm навіть транзитивно не тягнув
// їх у цей шар.
const FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies']

function stripDeepseekDeps(pkg) {
  for (const field of FIELDS) {
    if (!pkg[field]) continue
    for (const name of Object.keys(pkg[field])) {
      if (name.startsWith('@deepseek-ai/')) delete pkg[field][name]
    }
  }
  return pkg
}

module.exports = {
  hooks: {
    readPackage: stripDeepseekDeps,
  },
}

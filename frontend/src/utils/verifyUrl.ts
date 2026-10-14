import { PATHS } from '../routes/paths'

// Address anybody can open to check a recommendation code, for example https://skillgraph.app/verify/SG-7KQ2-M9XD-4TPA
export function buildVerifyUrl(code: string) {
  return `${window.location.origin}${PATHS.verifyCode(code)}`
}
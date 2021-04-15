export const ERROR = 'ERROR'

export const GET_FEEDS = 'GET_FEEDS'
export const FEEDS_UPDATED = 'FEEDS_UPDATED'
export const FEEDS_RETURNED = 'FEEDS_RETURNED'

// Fallback error handling of issue: https://github.com/OpenZeppelin/openzeppelin-contracts/issues/1870
// 0x8C379A000000000000000000000000000000000000000000000000000000000
// selector of `function Error(string)`
export const ERROR_SELECTOR = '3963877391197344453575983046348115674221700746820753546331534351508065746944';

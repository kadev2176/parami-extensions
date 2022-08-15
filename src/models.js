export const EMPTY_CONTRACT = '0x0000000000000000000000000000000000000000';

export const PREFIX_CONTRACT = '0x';

export const PREFIX_HTTP = 'http://';

export const PREFIX_HTTPS = 'https://';

export const PREFIX_IPFS = 'ipfs://';

export const PREFIX_IPFS_URL = 'https://ipfs.io/ipfs/';

export const PREFIX_WNFT = 'wnft://';

export const PREFIX_DID = 'did://';

export const LINK_BADGE_CLASSNAME = 'pfp-link-badge';

export const MULTI_JUMP_LIMIT = 5;

export const TYPE_ID_2_STRING = {
    '1': 'wnft',
    '2': 'did'
}

export const NETWORK_MAINNET = {
    graph: 'https://graph.parami.io/',
    rpc: 'https://app.parami.io/',
    paramiLinkAddress: '0xEC5ecECBd5375575503130ce6a01166eC875FEcD', // todo: change this
    chainId: 1
}

export const NETWORK_TEST = {
    graph: 'https://staging.parami.io/graph/',
    rpc: 'https://staging.parami.io/',
    paramiLinkAddress: '0x75EE8Ce53Bd26C21405Def16Dd416C90054E7146',
    chainId: 4
}

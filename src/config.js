export const config = {
  "socketServer": "wss://rpc-global.parami.io/ws",
  "ipfsEndpoint": "https://ipfs.parami.io/ipfs/",
  "paramiWallet": "http://app.parami.io",
  "subqueryServer": "https://graph.parami.io",
  rpc: {
    did: {
      getMetadata: {
        description: 'Get metadata of a DID',
        params: [
          {
            // DID
            name: 'did',
            type: 'H160',
          },
          {
            // Meta key
            name: 'key',
            type: 'String',
          },
          {
            // RPC ignore
            name: 'at',
            type: 'Hash',
            isOptional: true,
          },
        ],
        // Meta value
        type: 'String',
      },
      batchGetMetadata: {
        description: 'Get metadata of a DID',
        params: [
          {
            // DID
            name: 'did',
            type: 'H160',
          },
          {
            // List of meta keys
            name: 'keys',
            type: 'Vec<String>',
          },
          {
            // RPC ignore
            name: 'at',
            type: 'Hash',
            isOptional: true,
          },
        ],
        // List of meta values
        type: 'Vec<String>',
      },
    },
    nft: {
      getClaimInfo: {
        description: 'getClaimInfo',
        params: [
          {
            name: 'nft_id',
            type: 'u64',
          },
          {
            name: 'claimer',
            type: 'H160',
          }
        ],
        type: '(String, String, String)',
      }
    },
    swap: {
      drylyAddLiquidity: {
        description: 'Dryly add liquidity to the pool',
        params: [
          {
            // Token ID
            name: 'token_id',
            type: 'u64',
          },
          {
            //  AD3
            name: 'currency',
            type: 'String',
          },
          {
            //  max_tokens=  0
            name: 'max_tokens',
            type: 'String',
          },
          {
            // RPC ignore
            name: 'at',
            type: 'Hash',
            isOptional: true,
          },
        ],
        // Token Balance, LP* Balance
        type: '(String, String)',
      },
      drylyRemoveLiquidity: {
        description: 'Dryly remove liquidity from the pool',
        params: [
          {
            // Token ID
            name: 'lp_token_id',
            type: 'u64',
          },
          {
            // RPC igonre
            name: 'at',
            type: 'Hash',
            isOptional: true,
          },
        ],
        // Token ID, LP* Balance, Token Balance, AD3 Balance
        type: '(u64, String, String, String)',
      },
      drylyBuyTokens: {
        description: 'Dryly buy tokens from the pool',
        params: [
          {
            // Token ID
            name: 'token_id',
            type: 'u64',
          },
          {
            // Token amount
            name: 'tokens',
            type: 'String',
          },
          {
            // RPC igonre
            name: 'at',
            type: 'Hash',
            isOptional: true,
          },
        ],
        // AD3 needed
        type: 'String',
      },
      drylySellTokens: {
        description: 'Dryly sell tokens to the pool',
        params: [
          {
            // Token ID
            name: 'token_id',
            type: 'u64',
          },
          {
            //  Token amount
            name: 'tokens',
            type: 'String',
          },
          {
            // RPC igonre
            name: 'at',
            type: 'Hash',
            isOptional: true,
          },
        ],
        //  AD3 Balance
        type: 'String',
      },
      drylySellCurrency: {
        description: 'Dryly sell currency to the pool',
        params: [
          {
            // Token ID
            name: 'token_id',
            type: 'u64',
          },
          {
            //  AD3
            name: 'currency',
            type: 'String',
          },
          {
            // RPC igonre
            name: 'at',
            type: 'Hash',
            isOptional: true,
          },
        ],
        //  Token
        type: 'String',
      },
      drylyBuyCurrency: {
        description: 'Dryly buy currency from the pool',
        params: [
          {
            // Token ID
            name: 'token_id',
            type: 'u64',
          },
          {
            //  AD3
            name: 'currency',
            type: 'String',
          },
          {
            // RPC igonre
            name: 'at',
            type: 'Hash',
            isOptional: true,
          },
        ],
        //  Token
        type: 'String',
      },
      calculateReward: {
        description: 'Calculate staking reward',
        params: [
          {
            // Token ID
            name: 'lp_token_id',
            type: 'u64',
          },
          {
            // RPC igonre
            name: 'at',
            type: 'Hash',
            isOptional: true,
          },
        ],
        //  Token
        type: 'String',
      },
    },
  },
  runtime: {
    AdRuntimeApi: [
      {
        methods: {
          cal_reward: {
            description: 'pre calculate reward of this did, adId, nftId pair',
            params: [
              {
                name: 'ad_id',
                type: 'H256',
              },
              {
                name: 'nft_id',
                type: 'u32',
              },
              {
                name: 'visitor',
                type: 'H160',
              },
              {
                name: 'referrer',
                type: 'Option<H160>',
              }
            ],
            type: 'u128'
          }
        },
        version: 1
      }
    ]
  }
};
export default config;
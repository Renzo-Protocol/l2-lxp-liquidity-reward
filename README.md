# L2 Liquidity Reward Program
## TVL by User - Adapters

### Onboarding Checklist
Please complete the following:

1.  Set up a subquery indexer (e.g. Goldsky Subgraph)
    1.  Follow the docs here: https://docs.goldsky.com/guides/create-a-no-code-subgraph
    2. General Steps
        1.  create an account at app.goldsky.com
        2.  deploy a subgraph or migrate an existing subgraph - https://docs.goldsky.com/subgraphs/introduction
        3.  Use the slugs `linea-testnet` and `linea` when deploying the config
2.  Prepare Subquery query code according to the Data Requirement section below.
3.  Submit your response as a Pull Request to: https://github.com/delta-hq/l2-lxp-liquidity-reward
    1.  With path being `/<your_protocol_handle>` 
4.  Submit your contract addresses through this [Form](https://forms.gle/DJ2975hZwhz32t5r6)

### Code Changes Expected

1. Create a function like below:
```
  export const getUserTVLByBlock = async (blocks: BlockData) => {
      const { blockNumber, blockTimestamp } = blocks
          //    Retrieve data using block number and timestamp
        // YOUR LOGIC HERE
      
      return csvRows

  };
```
2. Interface for input Block Data is, in below blockTimestamp is in epoch format.
 ``` 
  interface BlockData {
    blockNumber: number;
    blockTimestamp: number;
}
```
3. Output "csvRow" is a list. 
```
const csvRows: OutputDataSchemaRow[] = [];

  type OutputDataSchemaRow = {
      block_number: number;
      timestamp: number;
      user_address: string;
      token_address: string;
      token_balance: bigint;
      token_symbol: string; //token symbol should be empty string if it is not available
      usd_price: number; //assign 0 if not available
  };
```
4. Make sure you add relevant package.json and tsconfig.json
5. You can check the index.ts in Gravita project to refer this in use. https://github.com/delta-hq/l2-lxp-liquidity-reward/blob/33a155a3c81e6cd5b8f4beec96056495b8146740/adapters/gravita/src/index.ts#L168

### Data Requirement
Goal: **Hourly snapshot of TVL by User by Asset**

For each protocol, we are looking for the following: 
1.  Query that fetches all relevant events required to calculate User TVL in the Protocol at hourly level.
2.  Code that uses the above query, fetches all the data and converts it to csv file in below given format.

Teams can refer to the example we have in there to write the code required.

### Output Data Schema

| Data Field                | Notes                                                                                  |
|---------------------------|----------------------------------------------------------------------------------------|
| block_number              |                                                                                        |
| timestamp                 |                                                                                        |
| user_address              |                                                                                        |
| token_address             |                                                                                        |
| token_symbol (optional)   | Symbol of token                                                                        |
| token_balance             | Balance of token (**If the token was borrowed, this balance should be negative**)      |
| usd_price (from oracle)   | Price of token (optional)                                                              |


Sample output row will look like this:

| blocknumber | timestamp | user_address | token_address | token_balance | token_symbol (optional) | usd_price(optional)|
|---|---|---|---|---|---|---|
| 2940306 | 2024-03-16 19:19:57 | 0x4874459FE…d689 | 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2 | 100 | WETH | 0|

Note: **Expect multiple entries per user if the protocols has more than one token asset**

### Query Example (DEX - CL MM)

Below is the query being used in the example we have in the repo link. For querying like this, please create a subgraph that has this data for your respective protocol. This data should be further transformed to get the data as per required Output schema.

```
{
            positions(  block: {number: 4004302} orderBy: transaction__timestamp, first:1000,skip:0) {
            id


                liquidity
                owner
                pool {
                    sqrtPrice
                    tick
                    id
                }
                tickLower{
                    tickIdx
                }
                tickUpper{
                    tickIdx
                }
                token0 {
                    id
                    decimals
                    derivedUSD
                    name
                    symbol
                }
                token1 {
                    id
                    decimals
                    derivedUSD
                    name
                    symbol
                }
            },
            _meta{
                    block{
                    number
                }
            }
        }
```

### Response Example:
```
{
   "id": "3",
   "liquidity": "0",
   "owner": "0x8ad255ee352420d3e257aa87a5811bd09f72d251",
   "pool": {
     "sqrtPrice": "4158475459167119976298502",
     "tick": -197109,
     "id": "0xf2e9c024f1c0b7a2a4ea11243c2d86a7b38dd72f"
   },
   "tickLower": {
     "tickIdx": -198790
   },
   "tickUpper": {
     "tickIdx": -198770
   },
   "token0": {
     "id": "0x4200000000000000000000000000000000000006",
     "decimals": "18",
     "derivedUSD": "2754.920801587090063443331457265368",
     "name": "Wrapped Ether",
     "symbol": "WETH"
   },
   "token1": {
     "id": "0xd988097fb8612cc24eec14542bc03424c656005f",
     "decimals": "6",
     "derivedUSD": "1",
     "name": "USD Coin",
     "symbol": "USDC"
   }
 }
```


### Adapter Example
In this repo, there is an adapter example. This adapter aims to get data positions from the subrgaph and calculate the TVL by users.
The main scripts is generating a output as CSV file.

[Adapter Example](adapters/example/dex/src/index.ts)


## How to execute this project?

```
npm install // install all packages
npm run watch //other terminal tab
npm run start // other terminal tab
```

By this, we'll be able to generate the output csv file.

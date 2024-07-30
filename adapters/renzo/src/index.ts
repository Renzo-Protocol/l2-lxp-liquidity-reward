import fs from 'fs'
import { format } from 'fast-csv'
import csv from 'csv-parser'
import { config } from 'dotenv'
import { BlockData, OutputDataRow } from './types'
import {
  EXCLUDED_ADDRESSES,
  LINEA_INDEXER_QUERY_ENDPOINT,
  EzETH_ADDRESS,
  EzETH_SYMBOL,
} from './const'

config()

const hourlyBlocksFile = 'hourly_blocks.csv'
const outputFile = 'outputData.csv'

const API_KEY = process.env.RENZO_API_KEY || ''
const QUERY_SIZE = 500000
const getSQLQuery = (blockNumber: number) => `
SELECT
  id, ezETHBalance
FROM
  AccountSnapshot t1
  JOIN (
    SELECT
      id,
      max(__genBlockNumber__) as block
    FROM
      AccountSnapshot
    WHERE
      __genBlockNumber__ <= ${blockNumber}
    GROUP BY id
  ) t2
  ON
    t1.id = t2.id AND
    t1.__genBlockNumber__ = t2.block
`

export const getUserTVLByBlock = async (block: BlockData): Promise<OutputDataRow[]> => {
  const { blockNumber, blockTimestamp } = block;
  try {
    const response = await fetch(LINEA_INDEXER_QUERY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
      },
      body: JSON.stringify({
        sqlQuery: {
          sql: getSQLQuery(blockNumber),
          size: QUERY_SIZE,
        }
      })
    })

    const data = await response.json()
    if (!data.result || !data.result.rows) {
      console.error(`No data found for block ${blockNumber}`)
      return []
    }

    return data.result.rows
      .filter((row: any) => !EXCLUDED_ADDRESSES.has(row.id.toLowerCase()))
      .map((row: any) => ({
        block_number: blockNumber,
        timestamp: blockTimestamp,
        user_address: row.id.toLowerCase(),
        token_address: EzETH_ADDRESS.toLowerCase(),
        token_balance: BigInt(row.ezETHBalance),
        token_symbol: EzETH_SYMBOL,
        usd_price: 0, // 0 as default
      }))
  } catch (err) {
    console.error(`An error occurred for block ${blockNumber}:`, err);
    return []
  }
}

async function processBlocks(blocks: BlockData[]) {
  console.log(blocks)

  // Open a write stream for the unified output file.
  const writeStream = fs.createWriteStream(outputFile, {
    flags: 'w', // 'w' to create a new file or overwrite the existing one.
  })

  const csvFormat = format({
    headers: true,
    includeEndRowDelimiter: true,
    writeHeaders: true,
  })
  csvFormat.pipe(writeStream)

  for (const block of blocks) {
    console.log(`Processing block: ${block.blockNumber}`)
    const csvRows = await getUserTVLByBlock(block)

    // Writing each row to the CSV format stream
    csvRows.forEach(row => csvFormat.write(row))
  }
  csvFormat.end()
  writeStream.on('finish', () => {
    console.log('CSV file has been written.')
  })
}

async function readBlocksFromCSV(filePath: string): Promise<BlockData[]> {
  return new Promise<BlockData[]>((resolve, reject) => {
    const blocks: BlockData[] = []
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const blockNumber = parseInt(row.number, 10)
        const blockTimestamp = parseInt(row.timestamp, 10)
        if (!isNaN(blockNumber) && blockTimestamp) {
          blocks.push({ blockNumber, blockTimestamp })
        }
      })
      .on('end', () => {
        resolve(blocks)
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

readBlocksFromCSV(hourlyBlocksFile)
  .then(blocks => processBlocks(blocks))
  .catch((err) => {
    console.error("Error reading CSV file:", err)
  })

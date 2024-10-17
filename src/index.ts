import { config } from 'dotenv'
import axios from 'axios'
import Period from './enums/Period'
import Candle from './models/Candle'
import { createMessageChannel } from './messages/messageChannel'

config()

const readMarketPrice = async (): Promise<number> => {
  const result = await axios.get(process.env.BITCOIN_URL!)
  const data = result.data

  return data.bitcoin.usd
}


const generateCandles = async (): Promise<void> => {
  const messageChannel = await createMessageChannel()
  if(messageChannel) {
    while(true) {
      const loopTimes: number = Period.ONE_MINUTE / Period.TEN_SECONDS
      const candle = new Candle('BTC', new Date())
      
      console.log('-------------------------------')
      console.info("Generating new Candle...")
      
      for(let i = 0; i < loopTimes; i++) {
        const price = await readMarketPrice()
        candle.addValue(price)
        
        console.log(`   Market price: #${i + 1} of ${loopTimes}`)
        
        // await new Promise(r => setTimeout(r, Period.THIRTY_SECONDS))
        await new Promise(r => setTimeout(r, 15000))
      }
      console.info('Candle closed')
      
      candle.closeCandle()
      const candleObj = candle.toSimpleObject()
      const candleJson = JSON.stringify(candleObj)
      
      messageChannel.sendToQueue(process.env.QUEUE_NAME, Buffer.from(candleJson))

      console.log('Candle send to queue')
      console.log(" ")
    }
  }
}

generateCandles()
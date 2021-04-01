
import async from 'async';
import configs from "./config";
import {
  GET_FEEDS,
  FEEDS_UPDATED,
  FEEDS_RETURNED,
  SET_NETWORK
} from '../constants';

import { StreamsManagerABI } from './abi/StreamsManagerABI'
import Web3 from 'web3';

const Dispatcher = require('flux').Dispatcher;
const Emitter = require('events').EventEmitter;
const dispatcher = new Dispatcher();
const emitter = new Emitter();

let web3Test = null;
let config = null;
class Store {
  constructor() {

    this.store = {
      network: 'heco',
      coingeckoFeeds: [

      ],
      stockFeeds: [

      ],
    }

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case GET_FEEDS:
            this.getStreams(payload);
            break;
          case SET_NETWORK:
            this.setNetwork(payload)
            break;
          default:
            break;
        }
      }.bind(this)
    );
  }
  setNetwork({ content }) {
    const { network = 'heco' } = content
    console.log('setNetwork: ', network);
    config = configs[network]
    web3Test = new Web3(config.hecoTestProvider)
    this.store = { ...this.store, network: network }
    return emitter.emit('StoreUpdated');
  };

  getStore(index) {
    return (this.store[index]);
  };

  setStore(obj) {
    this.store = { ...this.store, ...obj }
    return emitter.emit('StoreUpdated');
  };

  decoratePrice = (price, decimal) => {
    price = price / (10 ** decimal);
    if (price >= 10000) {
      return price.toFixed(0);
    } else if (price >= 100) {
      return price.toFixed(2);
    } else if (price >= 1) {
      return price.toFixed(3);
    } else {
      return price.toFixed(4);
    }
  }

  getStreams = async (payload) => {
    try {
      const { version } = payload.content
      let contractAddress;
      if (version === 'Coingecko') {
        contractAddress = config.CoingeckoStreamsManagerAddress
      } else if (version === 'Stock') {
        // contractAddress = config.StockStreamsManagerAddress
      }

      if (!contractAddress) {
        console.log(`network:${store.getStore('network')},${version} contract object doesn't have address set yet, please set an address first.`)
        return;
      }
      const streamsManagerContract = new web3Test.eth.Contract(StreamsManagerABI, contractAddress)
      let streams = await streamsManagerContract.methods.streams().call()
      if (!streams || streams.length === 1) {
        return emitter.emit(FEEDS_RETURNED)
      }
      streams = streams.slice(1);

      if (version === 'Coingecko') {
        if (store.getStore('coingeckoFeeds').length === 0) {
          store.setStore({ coingeckoFeeds: streams })
          emitter.emit(FEEDS_UPDATED)
        }
      } else if (version === 'Stock') {
        if (store.getStore('stockFeeds').length === 0) {
          store.setStore({ stockFeeds: streams })
          emitter.emit(FEEDS_UPDATED)
        }
      }
      async.map(streams, async (stream, callback) => {
        let streamPopulated = await this._polulateStreamData(streamsManagerContract, stream)
        streamPopulated.address = stream
        streamPopulated.type = version
        let latestResult = await this._polulateLatestResult(streamsManagerContract, stream)
        streamPopulated.lastPrice = this.decoratePrice(latestResult.price, streamPopulated.decimal)
        streamPopulated.lastUpdated = String(latestResult.timestamp)
        let twaps = await this._polulateTWAPResults(streamsManagerContract, stream)
        streamPopulated.twap1h = this.decoratePrice(twaps.twap1h, streamPopulated.decimal)
        streamPopulated.twap2h = this.decoratePrice(twaps.twap2h, streamPopulated.decimal)
        streamPopulated.twap4h = this.decoratePrice(twaps.twap4h, streamPopulated.decimal)
        streamPopulated.twap6h = this.decoratePrice(twaps.twap6h, streamPopulated.decimal)
        streamPopulated.twap8h = this.decoratePrice(twaps.twap8h, streamPopulated.decimal)
        streamPopulated.twap12h = this.decoratePrice(twaps.twap12h, streamPopulated.decimal)
        streamPopulated.twap1d = this.decoratePrice(twaps.twap1d, streamPopulated.decimal)

        if (callback) {
          callback(null, streamPopulated)
        } else {
          return streamPopulated
        }
      }, (err, streamsData) => {
        if (err) {
          console.log(err)
        }

        if (version === 'Coingecko') {
          store.setStore({ coingeckoFeeds: streamsData })
        } else if (version === 'Stock') {
          store.setStore({ stockFeeds: streamsData })
        }

        emitter.emit(FEEDS_RETURNED)
      })
    } catch (e) {
      console.log(e)
      return {}
    }
  }

  _polulateStreamData = async (streamsManagerContract, streamAddr) => {
    try {
      let s = {
        description: await streamsManagerContract.methods.description(streamAddr).call(),
        decimal: await streamsManagerContract.methods.decimal(streamAddr).call(),
        windowSize: await streamsManagerContract.methods.windowSize(streamAddr).call(),
        deviation: await streamsManagerContract.methods.deviation(streamAddr).call(),
        num24hPoints: await streamsManagerContract.methods.num24hPoints(streamAddr).call(),
        last24hData: await streamsManagerContract.methods.last24hResults(streamAddr).call(),
      }
      let maxPrice = 0
      let minPrice = 9999999
      s.last24hData = s.last24hData.map((item) => {
        const time = new Date(item.timestamp * 1000)
        const price = this.decoratePrice(item.price, s.decimal)
        maxPrice = price > maxPrice ? price : maxPrice;
        minPrice = price < minPrice ? price : minPrice;
        return {
          timestamp: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
          price: price,
        };
      })
      s.logoPrefix = s.description.substr(0, s.description.indexOf(' ')).toLowerCase()
      s.priceAxis = [minPrice, maxPrice];
      return s
    } catch (ex) {
      console.log(ex)
      console.log(streamAddr)
      return {
        description: null,
        decimal: null,
        windowSize: null,
        deviation: null,
        num24hPoints: null,
        logoPrefix: null,
        last24hData: null,
        error: ex,
      }
    }

  }

  _polulateLatestResult = async (streamsManagerContract, streamAddr) => {
    try {
      let latestResult = await streamsManagerContract.methods.latestResult(streamAddr).call()
      return {
        price: latestResult[0],
        timestamp: latestResult[1],
      }
    } catch (e) {
      return {
        price: 0,
        timestamp: 0,
      }
    }
  }

  _polulateTWAPResults = async (streamsManagerContract, streamAddr) => {
    let twap1h, twap2h, twap4h, twap6h, twap8h, twap12h, twap1d;
    try {
      twap1h = await streamsManagerContract.methods.TWAP1Hour(streamAddr).call()
    } catch (e) {
      twap1h = 0
    }
    try {
      twap2h = await streamsManagerContract.methods.TWAP2Hour(streamAddr).call()
    } catch (e) {
      twap2h = 0
    }
    try {
      twap4h = await streamsManagerContract.methods.TWAP4Hour(streamAddr).call()
    } catch (e) {
      twap4h = 0
    }
    try {
      twap6h = await streamsManagerContract.methods.TWAP6Hour(streamAddr).call()
    } catch (e) {
      twap6h = 0
    }
    try {
      twap8h = await streamsManagerContract.methods.TWAP8Hour(streamAddr).call()
    } catch (e) {
      twap8h = 0
    }
    try {
      twap12h = await streamsManagerContract.methods.TWAP12Hour(streamAddr).call()
    } catch (e) {
      twap12h = 0
    }
    try {
      twap1d = await streamsManagerContract.methods.TWAP1Day(streamAddr).call()
    } catch (e) {
      twap1d = 0
    }
    return {
      twap1h: twap1h,
      twap2h: twap2h,
      twap4h: twap4h,
      twap6h: twap6h,
      twap8h: twap8h,
      twap12h: twap12h,
      twap1d: twap1d,
    }
  }

}

var store = new Store();

export default {
  store: store,
  dispatcher: dispatcher,
  emitter: emitter
};

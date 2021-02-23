
import async from 'async';
import config from "./config";
import {
  GET_FEEDS,
  FEEDS_UPDATED,
  FEEDS_RETURNED,
} from '../constants';

import { ERC20ABI } from "./abi/erc20ABI";
import { StreamsManagerABI } from './abi/StreamsManagerABI'

import Web3 from 'web3';
const web3 = new Web3(config.provider)
const web3HecoTest = new Web3(config.hecoTestProvider)

const rp = require('request-promise');

const Dispatcher = require('flux').Dispatcher;
const Emitter = require('events').EventEmitter;

const dispatcher = new Dispatcher();
const emitter = new Emitter();

class Store {
  constructor() {

    this.store = {
      coingeckoFeeds: [

      ],
      coinbaseFeeds: [

      ],
    }

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case GET_FEEDS:
            this.getStreams(payload);
            break;
          default:
            break;
        }
      }.bind(this)
    );
  }

  getStore(index) {
    return(this.store[index]);
  };

  setStore(obj) {
    this.store = {...this.store, ...obj}
    return emitter.emit('StoreUpdated');
  };


  //get pairs

  // get hard-coded address to { decimals, name, icon }
  // populate pair token info
  // get missing pair token info
    // retunr temp data

  // get consult pricing
  // get coingecko USD/ETH pricing


  getStreams = async (payload) => {
    try {
      const { version } = payload.content
      let contractAddress;
      if (version === 'Coingecko') {
        contractAddress = config.CoingeckoStreamsManagerAddress
      } else if (version === 'Coinbase') {
        // contractAddress = config.CoinbaseStreamsManagerAddress
      }
      
      const streamsManagerContract = new web3HecoTest.eth.Contract(StreamsManagerABI, contractAddress)
      let streams = await streamsManagerContract.methods.streams().call()

      if(!streams || streams.length === 1) {
        return emitter.emit(FEEDS_RETURNED)
      }
      streams = streams.slice(1);

      if (version === 'Coingecko') {
        if(store.getStore('coingeckoFeeds').length === 0) {
          store.setStore({ coingeckoFeeds: streams })
          emitter.emit(FEEDS_UPDATED)
        }
      } else if (version === 'Coinbase') {
        if(store.getStore('coinbaseFeeds').length === 0) {
          store.setStore({ coinbaseFeeds: streams })
          emitter.emit(FEEDS_UPDATED)
        }
      }
      async.map(streams, async (stream, callback) => {
        let streamPopulated = await this._polulateStreamData(streamsManagerContract, stream)
        streamPopulated.address = stream
        streamPopulated.type = version
        let latestResult = await this._polulateLatestResult(streamsManagerContract, stream)
        streamPopulated.lastPrice = (latestResult.price / (10 ** streamPopulated.decimal)).toFixed(2)
        streamPopulated.lastUpdated = latestResult.timestamp
        let twaps = await this._polulateTWAPResults(streamsManagerContract, stream)
        streamPopulated.twap1h = (twaps.twap1h / (10 ** streamPopulated.decimal)).toFixed(2)
        streamPopulated.twap2h = (twaps.twap2h / (10 ** streamPopulated.decimal)).toFixed(2)
        streamPopulated.twap4h = (twaps.twap4h / (10 ** streamPopulated.decimal)).toFixed(2)
        streamPopulated.twap6h = (twaps.twap6h / (10 ** streamPopulated.decimal)).toFixed(2)
        streamPopulated.twap8h = (twaps.twap8h / (10 ** streamPopulated.decimal)).toFixed(2)
        streamPopulated.twap12h = (twaps.twap12h / (10 ** streamPopulated.decimal)).toFixed(2)
        streamPopulated.twap1d = (twaps.twap1d / (10 ** streamPopulated.decimal)).toFixed(2)

        if (callback) {
          callback(null, streamPopulated)
        } else {
          return streamPopulated
        }
      }, (err, streamsData) => {
        if (err) {
          console.log(err)
        }

        if(version === 'Coingecko') {
          store.setStore({ coingeckoFeeds: streamsData })
        } else if (version === 'Coinbase'){
          store.setStore({ coinbaseFeeds: streamsData })
        }

        console.log(streamsData);
        emitter.emit(FEEDS_RETURNED)
      })
    } catch(e) {
      console.log(e)
      return {}
    }
  }

  _polulateStreamData = async (streamsManagerContract, streamAddr) => {
    try {
      let streamData = {
        description: await streamsManagerContract.methods.description(streamAddr).call(),
        decimal: await streamsManagerContract.methods.decimal(streamAddr).call(),
        windowSize: await streamsManagerContract.methods.windowSize(streamAddr).call(),
        deviation: await streamsManagerContract.methods.deviation(streamAddr).call(),
        numPoints: await streamsManagerContract.methods.numPoints(streamAddr).call(),
      }
      return streamData
    } catch(ex) {
      console.log(ex)
      console.log(streamAddr)
      return {
        description: null,
        decimal: null,
        windowSize: null,
        deviation: null,
        numPoints: null,
        error: ex
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
    } catch(e) {
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
    } catch(e) {
      twap1h = 0
    }
    try {
      twap2h = await streamsManagerContract.methods.TWAP2Hour(streamAddr).call()
    } catch(e) {
      twap2h = 0
    }
    try {
      twap4h = await streamsManagerContract.methods.TWAP4Hour(streamAddr).call()
    } catch(e) {
      twap4h = 0
    }
    try {
      twap6h = await streamsManagerContract.methods.TWAP6Hour(streamAddr).call()
    } catch(e) {
      twap6h = 0
    }
    try {
      twap8h = await streamsManagerContract.methods.TWAP8Hour(streamAddr).call()
    } catch(e) {
      twap8h = 0
    }
    try {
      twap12h = await streamsManagerContract.methods.TWAP12Hour(streamAddr).call()
    } catch(e) {
      twap12h = 0
    }
    try {
      twap1d = await streamsManagerContract.methods.TWAP1Day(streamAddr).call()
    } catch(e) {
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

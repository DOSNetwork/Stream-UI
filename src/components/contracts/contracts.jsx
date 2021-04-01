import React, { Component } from "react";
import { withStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton'

import Store from "../../stores";
import { colors } from '../../theme'
import configs from "../../stores/config";
import {
  GET_FEEDS,
  FEEDS_RETURNED,
  FEEDS_UPDATED,
} from '../../constants'


const styles = theme => ({
  root: {
    flex: 1,
    maxWidth: '1100px',
    width: 'fit-content',
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginTop: '40px'
  },
  contractsContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '800px',
    border: '1px solid ' + colors.darkGray,
    borderRadius: '10px',
    padding: '24px 40px'
  },
  contractContainer: {
    display: 'flex',
    minHeight: '40px',
    alignItems: 'center',
  },
  contractName: {
    flex: 1,
  },
  contractAddress: {
    flex: 1,
    cursor: 'pointer',
    '&:hover': {
      borderBottom: "1px solid " + colors.blue,
    },
  },
  title: {
    padding: '40px',
    minWidth: '100%'
  },
  skeleton: {
    minWidth: '200px'
  }
})

const emitter = Store.emitter
const dispatcher = Store.dispatcher
const store = Store.store
let config = null
class Contracts extends Component {

  constructor(props) {
    super()

    const coingeckoFeeds = store.getStore('coingeckoFeeds')
    const stockFeeds = store.getStore('stockFeeds')
    const network = store.getStore('network')
    config = configs[network]
    this.state = {
      coingeckoFeeds: coingeckoFeeds,
      stockFeeds: stockFeeds,
      feeds: [...coingeckoFeeds, ...stockFeeds],
    }

    dispatcher.dispatch({ type: GET_FEEDS, content: { version: 'Coingecko' } })
    dispatcher.dispatch({ type: GET_FEEDS, content: { version: 'Stock' } })
  };

  componentWillMount() {
    emitter.on(FEEDS_UPDATED, this.feedsReturned);
    emitter.on(FEEDS_RETURNED, this.feedsReturned);
  };

  componentWillUnmount() {
    emitter.removeListener(FEEDS_UPDATED, this.feedsReturned);
    emitter.removeListener(FEEDS_RETURNED, this.feedsReturned);
  };

  feedsReturned = () => {
    const coingeckoFeeds = store.getStore('coingeckoFeeds')
    const stockFeeds = store.getStore('stockFeeds')

    this.setState({
      coingeckoFeeds: coingeckoFeeds,
      stockFeeds: stockFeeds,
      feeds: [...coingeckoFeeds, ...stockFeeds],
    })
  }

  contractClicked = (contract) => {
    window.open(config.explorerUrl + 'address/' + contract, '_blank')
  }

  renderQuoteContracts = () => {
    const { classes } = this.props;

    return (
      <div className={classes.contractsContainer}>
        <div className={classes.contractContainer}>
          <Typography variant='h3' className={classes.contractName}>CoingeckoDataStreamsManager </Typography>
          <Typography variant='h3' className={classes.contractAddress} color='textSecondary' onClick={() => { this.contractClicked(config.CoingeckoStreamsManagerAddress) }}>{config.CoingeckoStreamsManagerAddress}</Typography>
        </div>
        {config.StockStreamsManagerAddress &&
          <div className={classes.contractContainer}>
            <Typography variant='h3' className={classes.contractName}>StockDataStreamsManager </Typography>
            <Typography variant='h3' className={classes.contractAddress} color='textSecondary' onClick={() => { this.contractClicked(config.StockStreamsManagerAddress) }}>{config.StockStreamsManagerAddress}</Typography>
          </div>
        }
      </div>
    )
  }

  renderFeedContracts = () => {
    const { classes } = this.props;
    const { feeds } = this.state
    return (
      <div className={classes.contractsContainer}>
        {
          feeds && feeds.map((feed) => {
            let key = typeof feed === 'string' ? feed : feed.address
            return (
              <div className={classes.contractContainer} key={key}>
                { (feed && feed.description && feed.type) ? <Typography variant='h3' className={classes.contractName}>{feed.type} - {feed.description}</Typography> : <Skeleton className={classes.skeleton} />}
                { (feed && feed.address) ? <Typography variant='h3' className={classes.contractAddress} color='textSecondary' onClick={() => { this.contractClicked(feed.address) }}>{feed.address}</Typography> : <Skeleton className={classes.skeleton} />}
              </div>
            )
          })
        }
      </div>
    )
  }

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <Typography variant='h1' className={classes.title}>StreamsManager Addresses</Typography>
        { this.renderQuoteContracts()}
        <Typography variant='h1' className={classes.title}>Stream Addresses</Typography>
        { this.renderFeedContracts()}
      </div>
    )
  }
}

export default withStyles(styles)(Contracts);

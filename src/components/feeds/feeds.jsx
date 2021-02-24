import React, { Component } from "react";
import * as moment from 'moment';
import { withStyles } from '@material-ui/core/styles';
import {
  Typography,
  CircularProgress
} from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import Store from "../../stores";
import { colors } from '../../theme'
import config from "../../stores/config"

import {
  GET_FEEDS,
  FEEDS_RETURNED,
  FEEDS_UPDATED,
} from '../../constants'

const styles = theme => ({
  root: {
    flex: 1,
    display: 'flex',
    maxWidth: '1100px',
    width: '100%',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginTop: '40px'
  },
  feedContainer: {
    position: 'relative',
    background: colors.lightGray,
    width: '240px',
    padding: '24px 8px',
    minHeight: '280px',
    margin: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    cursor: 'pointer',
    '&:hover': {
      background: 'rgba(0,0,0,0.1)'
    }
  },
  pricePoint: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '6px 0px',
    zIndex: 1
  },
  updated: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '24px',
    marginBottom: '6px',
    zIndex: 1
  },
  pair: {
    marginBottom: '6px',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  twapHead: {
    marginTop: '24px',
    marginBottom: '6px',
    zIndex: 1
  },
  twap: {
    margin: '6px 0px',
    zIndex: 1
  },
  gray: {
    color: colors.darkGray,
    zIndex: 1
  },
  feedBackground: {
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    filter: 'grayscale(100%)',
    opacity: 0.05
  },
  toggleButton: {

  },
  filters: {
    minWidth: '100%',
    padding: '12px'
  },
  productIcon: {
    marginRight: '12px'
  },
  skeletonFrame: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  skeleton: {
    width: '100px',
    marginBottom: '12px'
  },
  skeletonTitle: {
    width: '150px',
    marginBottom: '6px',
    marginTop: '12px'
  }
})

const emitter = Store.emitter
const dispatcher = Store.dispatcher
const store = Store.store

class Feeds extends Component {

  constructor(props) {
    super()

    const coingeckoFeeds = store.getStore('coingeckoFeeds')
    const coinbaseFeeds = store.getStore('coinbaseFeeds')

    this.state = {
      coingeckoFeeds: coingeckoFeeds,
      coinbaseFeeds: coinbaseFeeds,
      feeds: [...coingeckoFeeds, ...coinbaseFeeds],
      feedFilter: null,

    }

    dispatcher.dispatch({ type: GET_FEEDS, content: { version: 'Coingecko' } })
    dispatcher.dispatch({ type: GET_FEEDS, content: { version: 'Coinbase' } })
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
    const coinbaseFeeds = store.getStore('coinbaseFeeds')

    this.setState({
      coingeckoFeeds: coingeckoFeeds,
      coinbaseFeeds: coinbaseFeeds,
      feeds: [...coingeckoFeeds, ...coinbaseFeeds]
    })
  }

  onFeedFilterChanged = (event, newVal) => {
    this.setState({ feedFilter: newVal })
  }

  feedClicked = (feed) => {
    if (feed.type === 'Coingecko') {
      window.open(config.explorerUrl + 'address/' + feed.address, '_blank')
    } else if (feed.type === 'Coinbase') {
      window.open('https://www.coinbase.com', '_blank')
    }
  }

  render() {
    const { classes } = this.props;

    return (
      <div className={ classes.root }>
        { this.renderFilters() }
        { this.renderFeeds() }
      </div>
    )
  }

  renderFilters = () => {
    const { classes } = this.props;
    const { feedFilter } = this.state;

    return (
      <div className={ classes.filters}>
        <ToggleButtonGroup
          value={ feedFilter }
          exclusive
          onChange={ this.onFeedFilterChanged }
          className={ classes.feedFilters }
          >
          <ToggleButton value="Coingecko" >
            <img src={require('../../assets/meta-sources/coingecko-logo.png')} alt='' width={ 30 } height={ 30 } className={ classes.productIcon }/>
            <Typography variant='h3'>Coingecko</Typography>
          </ToggleButton>
          <ToggleButton value="Coinbase">
            <img src={require('../../assets/meta-sources/coinbase-logo.png')} alt='' width={ 30 } height={ 30 } className={ classes.productIcon } />
            <Typography variant='h3'>Coinbase</Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
    )
  }

  renderFeeds = () => {
    const {
      feeds,
      feedFilter
    } = this.state

    if(!feeds) {
      return <div></div>
    }

    return feeds.filter((feed) => {
      if(!feedFilter) {
        return true
      }

      return feed.type === feedFilter
    }).map((feed, index) => {
      return this.renderFeed(feed, index)
    })
  }

  renderFeed = (feed, index) => {
    const { classes } = this.props;

    return (
      <div className={ classes.feedContainer } key={ index } onClick={ feed.address ? () => { this.feedClicked(feed) } : null }>
        { (!feed.description || !feed.lastPrice || !feed.twap1h) && <div className={ classes.skeletonFrame }>
            <Skeleton className={ classes.skeletonTitle } height={ 30 } />
            <Skeleton className={ classes.skeleton } />
            <Skeleton className={ classes.skeleton } />
            <Skeleton className={ classes.skeleton } />
            <Skeleton className={ classes.skeletonTitle } height={ 30 } />
            <Skeleton className={ classes.skeleton } />
            <Skeleton className={ classes.skeleton } />
            <Skeleton className={ classes.skeleton } />
            <Skeleton className={ classes.skeleton } />
            <Skeleton className={ classes.skeleton } />
            <Skeleton className={ classes.skeleton } />
            <Skeleton className={ classes.skeleton } />
            <Skeleton className={ classes.skeletonTitle } />
          </div>
        }
        { feed.description && feed.logoPrefix &&
          <div className={ classes.pair }>
            <img src={require('../../assets/cryptos/' + feed.logoPrefix + '.png')} alt={ feed.logoPrefix } width={ 30 } height={ 30 } className={ classes.productIcon }/>
            <Typography variant='h2'>{ feed.description }</Typography>
          </div>
        }
        { feed.lastPrice &&
          <div className={ classes.pricePoint }>
            <Typography variant='h3'>$ { feed.lastPrice > 0 ? feed.lastPrice : 'N/A' } </Typography>
          </div>
        }
        { feed.numPoints &&
          <div className={ classes.pricePoint }>
            <Typography variant='h3'>{ feed.numPoints } Data Points </Typography>
          </div>
        }
        { feed.deviation &&
          <div className={ classes.pricePoint }>
            <Typography variant='h3'>{ feed.deviation / 10 }% Update Threshold</Typography>
          </div>
        }
        { feed.twap1h &&
          <div className={ classes.twapHead }>
            <Typography variant='h2'>TWAP Results</Typography>
          </div>
        }
        { feed.twap1h &&
          <div className={ classes.twap }>
            <Typography variant='h6'>1 hour TWAP: $ { feed.twap1h > 0 ? feed.twap1h : 'N/A' } </Typography>
          </div>
        }
        { feed.twap2h &&
          <div className={ classes.twap }>
            <Typography variant='h6'>2 hour TWAP: $ { feed.twap2h > 0 ? feed.twap2h : 'N/A' } </Typography>
          </div>
        }
        { feed.twap4h &&
          <div className={ classes.twap }>
            <Typography variant='h6'>4 hour TWAP: $ { feed.twap4h > 0 ? feed.twap4h : 'N/A' } </Typography>
          </div>
        }
        { feed.twap6h &&
          <div className={ classes.twap }>
            <Typography variant='h6'>6 hour TWAP: $ { feed.twap6h > 0 ? feed.twap6h : 'N/A' } </Typography>
          </div>
        }
        { feed.twap8h &&
          <div className={ classes.twap }>
            <Typography variant='h6'>8 hour TWAP: $ { feed.twap8h > 0 ? feed.twap8h : 'N/A' } </Typography>
          </div>
        }
        { feed.twap12h &&
          <div className={ classes.twap }>
            <Typography variant='h6'>12 hour TWAP: $ { feed.twap12h > 0 ? feed.twap12h : 'N/A' } </Typography>
          </div>
        }
        { feed.twap1d &&
          <div className={ classes.twap }>
            <Typography variant='h6'>1 Day TWAP: $ { feed.twap1d > 0 ? feed.twap1d : 'N/A' } </Typography>
          </div>
        }
        { feed.lastUpdated &&
          <div className={ classes.updated }>
            <Typography variant='h6'>Last updated: { feed.lastUpdated > 0 ? moment(feed.lastUpdated*1000).fromNow() : 'N/A' }</Typography>
          </div>
        }
      </div>
    )
  }
}

export default withStyles(styles)(Feeds);

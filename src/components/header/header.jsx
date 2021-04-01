import React, { Component } from 'react'
import { withStyles } from '@material-ui/core/styles';
import { withRouter } from "react-router-dom";
import { colors } from '../../theme'
import { Typography } from '@material-ui/core'
import Store from '../../stores'
const styles = theme => ({
  root: {
    verticalAlign: 'top',
    width: '100%',
    display: 'flex',
    [theme.breakpoints.down('sm')]: {
      marginBottom: '40px'
    }
  },
  headerV2: {
    background: colors.white,
    borderBottom: '1px solid ' + colors.borderBlue,
    width: '100%',
    borderRadius: '0px',
    display: 'flex',
    padding: '24px 32px',
    alignItems: 'center',
    justifyContent: 'center',
    [theme.breakpoints.down('sm')]: {
      justifyContent: 'space-between',
      padding: '16px 24px'
    }
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    cursor: 'pointer'
  },
  links: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center'
  },
  link: {
    display: 'flex',
    padding: '12px 0px',
    margin: '0px 12px',
    cursor: 'pointer',
    '&:hover': {
      paddingBottom: '9px',
      borderBottom: "3px solid " + colors.blue,
    },
  },
  title: {
    textTransform: 'capitalize'
  },
  productIcon: {
    marginRight: '8px'
  },
  linkActive: {
    display: 'flex',
    padding: '12px 0px',
    margin: '0px 12px',
    cursor: 'pointer',
    paddingBottom: '9px',
    borderBottom: "3px solid " + colors.blue,
  },
  walletAddress: {
    padding: '12px',
    border: '2px solid rgb(174, 174, 174)',
    borderRadius: '50px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    '&:hover': {
      border: "2px solid " + colors.borderBlue,
      background: 'rgba(47, 128, 237, 0.1)'
    },
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      position: 'absolute',
      top: '90px',
      border: "1px solid " + colors.borderBlue,
      background: colors.white
    }
  },
  name: {
    paddingLeft: '24px',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    }
  },
  accountDetailsSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    [theme.breakpoints.down('sm')]: {
      padding: '6px',
    },
  },
  accountDetailsAddress: {
    color: colors.background,
    fontWeight: 'bold',
    padding: '0px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      textDecoration: 'underline'
    }
  },
  accountDetailsBalance: {
    color: colors.background,
    fontWeight: 'bold',
    padding: '0px 12px',
    borderRight: '2px solid ' + colors.text,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline'
    },
    [theme.breakpoints.down('sm')]: {
      padding: '0px 6px',
    },
  },
  connectedDot: {
    borderRadius: '100px',
    border: '8px solid ' + colors.green,
    marginLeft: '12px'
  },
});
const store = Store.store
class Header extends Component {

  constructor(props) {
    super()

    this.state = {
    }
  }

  render() {
    const {
      classes
    } = this.props;

    return (
      <div className={classes.root}>
        <div className={classes.headerV2}>
          <div className={classes.links}>
            {this.renderLink('Streams')}
            {this.renderLink('Contracts')}
            {this.renderLink('Docs')}
            {this.renderLink('Github')}
          </div>
          <div className={classes.account}>
          </div>
        </div>
      </div>
    )
  }

  renderLink = (screen) => {
    const {
      classes
    } = this.props;

    return (
      <div className={(window.location.pathname.includes(screen) || (screen === 'Streams' && window.location.pathname === '/')) ? classes.linkActive : classes.link} onClick={() => { this.nav(screen) }}>
        <img src={require('../../assets/headers/' + screen.toLowerCase() + '.png')} alt='' width={25} height={25} className={classes.productIcon} />
        <Typography variant={'h2'} className={`title`}>{screen}</Typography>
      </div>
    )
  }

  nav = (screen) => {
    let network = store.getStore('network')
    if (screen === 'Docs') {
      window.open("https://dosnetwork.github.io/docs/#/contents/streams/start", "_blank")
      return
    }
    if (screen === 'Github') {
      window.open("https://github.com/DOSNetwork/smart-contracts/tree/master/contracts", "_blank")
      return
    }
    if (screen === 'Streams') {
      this.props.history.push(`/${network}/feeds`)
    }
    if (screen === 'Contracts') {
      this.props.history.push(`/${network}/contracts`)
    }
  }
}

export default withRouter(withStyles(styles)(Header));

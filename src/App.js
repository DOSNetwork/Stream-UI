import React, { Component } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import IpfsRouter from 'ipfs-react-router'
import {
  Switch,
  Route,
  Redirect
} from "react-router-dom";

import interestTheme from './theme';
import { colors } from './theme';

import Feeds from './components/feeds';
import Contracts from './components/contracts';
import Header from './components/header';
import Store from "./stores";
import {
  SET_NETWORK
} from './constants'
const dispatcher = Store.dispatcher
class App extends Component {
  constructor(props) {
    super()
    // TODO: 更严谨的判断?
    let network = 'heco'
    const urlmatched = window.location.pathname.match(/(\w+)/g)
    if (urlmatched && urlmatched.length > 0) {
      network = window.location.pathname.match(/(\w+)/g)[0]
    }
    dispatcher.dispatch({ type: SET_NETWORK, content: { network: network } })
  };

  state = {
  };
  render() {
    return (
      <MuiThemeProvider theme={createMuiTheme(interestTheme)}>
        <CssBaseline />
        <IpfsRouter>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            alignItems: 'center',
            background: colors.white
          }}>
            <Header />
            <Switch>
              {/* <Route path="/feeds">
                <Feeds network='heco' />
              </Route>
              <Route path="/contracts">
                <Contracts network='heco' />
              </Route> */}
              <Route path="/heco/feeds">
                <Feeds network='heco' />
              </Route>
              <Route path="/heco/contracts">
                <Contracts network='heco' />
              </Route>
              <Route path="/bsc/feeds">
                <Feeds network='bsc' />
              </Route>
              <Route path="/bsc/contracts">
                <Contracts network='bsc' />
              </Route>
              <Route path="/">
                <Redirect to="/heco/feeds" />
              </Route>

            </Switch>
          </div>
        </IpfsRouter>
      </MuiThemeProvider>
    );
  }
}

export default App;

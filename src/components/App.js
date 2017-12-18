import React, { Component } from 'react';
import AppBar from 'material-ui/AppBar';
import muiTheme from './HOC/MuiTheme';
import Facebook from './Facebook/Facebook';
import './App.css';

class App extends Component {

  render() {
    return (
      <div className="App">
        <AppBar title="Post Whisperer" />
        <Facebook />
      </div>
    );
  }
}

export default muiTheme(App);

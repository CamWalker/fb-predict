import React, { Component } from 'react';
import brain from 'brain';
import FacebookLogin from 'react-facebook-login';
import _ from 'lodash';
import axios from 'axios';
import {
  calculateSummaryInfo,
  transformDataIO,
} from './data-transformer';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.network = new brain.NeuralNetwork();
    this.posts = [];
  }

  responseFacebook = (response) => {
    console.log('done getting data from Facebook');
    this.posts = _.concat(this.posts, response.posts.data);
    if (response.posts.paging) {
      this.getMoreData(_.get(response.posts.paging, 'next'));
    } else {
      this.transformData()
    }
  }

  getMoreData = (nextUrl) => {
    console.log('getting more from facebook');
    axios.get(nextUrl).then((response) => {
      const data = _.get(response, 'data');
      this.posts = _.concat(this.posts, data.data);
      const lastDateYear = _.toNumber(_.split(_.get(_.last(this.posts), 'created_time'), '-')[0]);
      if (data.paging && _.size(this.posts) < 1000 && lastDateYear > 2012) {
        this.getMoreData(_.get(data.paging, 'next'));
      } else {
        this.transformData()
      }
    })
  }

  transformData = () => {
    this.posts = _.filter(this.posts, (row) => {
      const dateYear = _.toNumber(_.split(_.get(row, 'created_time'), '-')[0]);
      return _.has(row, 'likes') && dateYear > 2012
    })
    const summaryInfo = calculateSummaryInfo(this.posts);
    const transformedIOData = _.map(this.posts, (row) => transformDataIO(row, summaryInfo));
    this.network.train(transformedIOData, {
      errorThresh: 0.005,  // error threshold to reach
      iterations: 20000,   // maximum training iterations
      log: true,           // console.log() progress periodically
      logPeriod: 10,       // number of iterations between logging
      learningRate: 0.3    // learning rate
    });

    console.log(this.network.toJSON());

    const output = this.network.run({
      reactionCount: 1,
      commentCount: 0,
    });

    console.log(output);

    // const output = this.network.run({
    //   //Status type -- link, status, photo, video, offer
    //   status: 0,
    //   link: 0,
    //   photo: 0,
    //   video: 0,
    //   offer: 0,
    //   //Date
    //   dayOfYear: 0, //calculate total
    //   dayOfMonth: 0,
    //   dayOfWeek: 0,
    //   //Time
    //   minutesOfDay: 0,
    //   // timeFromLastPost: 0, // DO THIS ONE!!!!
    //   //Dynamic Key Words - predetermined
    //   //Length of post
    //   postLength: 0.0, //calculate decimal place
    // });
    // console.log(
    //   'reactions: ',
    //   output.reactionCount * Math.pow(10, summaryInfo.reactionPlaceValue),
    //   'comments: ',
    //   output.commentCount * Math.pow(10, summaryInfo.commentPlaceValue)
    // );
    // reactions:  49.923180952088046 comments:  6.423513932086595 ZEROS
    // reactions:  45.353772055816414 comments:  5.756805171859125 postLength: 0.500
    // reactions:  51.55683385667638 comments:  6.463456692327092 postLength: 0.900
  }

  onFailure = (err) => {
    console.log(err);
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <FacebookLogin
          appId="926701747482913"
          autoLoad={true}
          fields="name,posts.limit(100){reactions.limit(1).summary(true),comments.limit(0).summary(true),likes.limit(1).summary(true),type,created_time,message}"
          scope="user_posts"
          callback={this.responseFacebook}
          onFailure={this.onFailure}
        />
      </div>
    );
  }
}

export default App;

const exclusions = [
  'a',
  'aboard',
  'about',
  'above',
  'across',
  'after',
  'against',
  'all',
  'along',
  'alongside',
  'although',
  'amid',
  'among',
  'an',
  'and',
  'around',
  'as if',
  'as long as',
  'as',
  'at',
  'bar',
  'because',
  'before',
  'behind',
  'below',
  'beneath',
  'beside',
  'besides',
  'between',
  'beyond',
  'but',
  'by',
  'come',
  'down',
  'during',
  'even if',
  'even though',
  'except',
  'for',
  'from',
  'he',
  'her',
  'hers',
  'herself',
  'him',
  'himself',
  'his',
  'i',
  'in',
  'inside',
  'into',
  'it',
  'itself',
  'less',
  'like',
  'me',
  'mine',
  'minus',
  'my',
  'myself',
  'near',
  'nor',
  'not',
  'of',
  'off',
  'on',
  'once',
  'one',
  'onto',
  'opposite',
  'or',
  'ours',
  'ourselves',
  'out',
  'outside',
  'over',
  'past',
  'per',
  'she',
  'short',
  'since',
  'so that',
  'so',
  'than',
  'that',
  'the',
  'their',
  'theirs',
  'them',
  'themselves',
  'there',
  'these',
  'they',
  'this',
  'those',
  'though',
  'through',
  'throughout',
  'till',
  'to',
  'toward',
  'towards',
  'under',
  'underneath',
  'unless',
  'unlike',
  'until',
  'up',
  'upon',
  'us',
  'we',
  'what',
  'when',
  'whenever',
  'wherever',
  'whether',
  'while',
  'will',
  'with',
  'within',
  'without',
  'would',
  'yet',
  'you',
  'yours',
  'yourself',
]

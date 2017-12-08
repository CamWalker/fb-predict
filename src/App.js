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
    console.log('Processing data');
    this.posts = _.filter(this.posts, (row) => {
      const dateYear = _.toNumber(_.split(_.get(row, 'created_time'), '-')[0]);
      return _.has(row, 'likes') && dateYear >= 2012
    })
    const summaryInfo = calculateSummaryInfo(this.posts);
    const transformedIOData = _.map(this.posts, (row, index) => transformDataIO(row, summaryInfo, _.get(_.get(this.posts, (index + 1), {}), 'created_time', null)));
    this.network.train(transformedIOData, {
      errorThresh: 0.005,  // error threshold to reach
      iterations: 20000,   // maximum training iterations
      log: true,           // console.log() progress periodically
      logPeriod: 10,       // number of iterations between logging
      learningRate: 0.3    // learning rate
    });

    const output = this.network.run({
      reactionCount: 1,
      commentCount: 1,
    });

    const keyWords = {};

    _.forEach(_.filter(_.keys(output), (value) => {
        return _.head(_.split(value, '-')) === 'kw';
      }), (key) => {
        keyWords[key] = output[key] * 100;
      }
    );

    console.log({
      dayOfWeek: {
        Monday: output.Monday * 100,
        Tuesday: output.Tuesday * 100,
        Wednesday: output.Wednesday * 100,
        Thursday: output.Thursday * 100,
        Friday: output.Friday * 100,
        Saturday: output.Saturday * 100,
        Sunday: output.Sunday * 100,
      },
      hoursFromLastPost: output.timeFromLastPost * Math.pow(10, summaryInfo.timeFromLastPostPlaceValue) / 60000 / 60,
      timeOfDay: output.minutesOfDay * 24,
      postMessage: {
        postLength: output.postLength * Math.pow(10, summaryInfo.postLengthPlaceValue),
        keyWords,
        sentenceType: {
          assertive: output.assertive * 100,
        	negative: output.negative * 100,
        	interrogative: output.interrogative * 100,
        	imperative: output.imperative * 100,
        	exclamatory: output.exclamatory * 100,
        }
      },
      postType: {
        status: output.status * 100,
        link: output.link * 100,
        photo: output.photo * 100,
        video: output.video * 100,
        event: output.event * 100,
        offer: output.offer * 100,
      },
    });

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

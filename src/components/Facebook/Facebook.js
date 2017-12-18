import React, { Component } from 'react';
import brain from 'brain';
import FacebookLogin from 'react-facebook-login';
import _ from 'lodash';
import axios from 'axios';
import {
  Step,
  Stepper,
  StepLabel,
  StepContent,
} from 'material-ui/Stepper';
import CircularProgress from 'material-ui/CircularProgress';
import Paper from 'material-ui/Paper';
import { HorizontalBar, Bar, Polar } from 'react-chartjs-2';
import {
  calculateSummaryInfo,
  transformDataIO,
} from '../../utils/data-transformer';
import './Facebook.css';

const style = {
  height: 280,
  width: 500,
  margin: 20,
  padding: 20,
  textAlign: 'center',
  display: 'inline-block',
};
const style2 = {
  height: 60,
  width: 500,
  padding: 20,
  margin: 20,
  textAlign: 'center',
  display: 'inline-block',
};

function secondsToString(seconds) {
  const numYears = Math.floor(seconds / 31536000) ? `${Math.floor(seconds / 31536000)} years ` : '';
  const numDays = Math.floor((seconds % 31536000) / 86400) ? `${Math.floor((seconds % 31536000) / 86400)} days ` : '';
  const numHours = Math.floor(((seconds % 31536000) % 86400) / 3600) ? `${Math.floor(((seconds % 31536000) % 86400) / 3600)} hours ` : '';
  const numMinutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60) ? `${Math.floor((((seconds % 31536000) % 86400) % 3600) / 60)} minutes` : '';
  console.log('Craig is cool');
  return numYears + numDays + numHours + numMinutes;
}

function secondsToTime(seconds) {
  const hour = Math.floor(((seconds % 31536000) % 86400) / 3600);
  const minute = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
  return `${hour > 12 ? hour - 12 : hour}:${minute < 10 ? '0' + minute : minute} ${hour >= 12 ? 'PM' : 'AM'}`
}

class Facebook extends Component {
  constructor(props) {
    super(props);
    this.network = new brain.NeuralNetwork();
    this.posts = [];
    this.state = {
      stepIndex: 0,
    };
  }

  handleNext = () => {
    const {stepIndex} = this.state;
    this.setState({
      stepIndex: stepIndex + 1,
    });
  };

  responseFacebook = (response) => {
    this.handleNext();
    this.posts = _.concat(this.posts, response.posts.data);
    if (response.posts.paging) {
      this.getMoreData(_.get(response.posts.paging, 'next'));
    } else {
      this.handleNext();
      this.transformData();
    }
  }

  getMoreData = (nextUrl) => {
    console.log('getting more from facebook');
    axios.get(nextUrl).then((response) => {
      const data = _.get(response, 'data');
      this.posts = _.concat(this.posts, data.data);
      const lastDateYear = _.toNumber(_.split(_.get(_.last(this.posts), 'created_time'), '-')[0]);
      if (data.paging && _.size(this.posts) < 500 && lastDateYear > 2012) {
        this.getMoreData(_.get(data.paging, 'next'));
      } else {
        this.handleNext();
        setTimeout(() => {
          this.transformData();
        }, 1000);
      }
    })
  }

  transformData = () => {

    this.posts = _.filter(this.posts, (row) => {
      const dateYear = _.toNumber(_.split(_.get(row, 'created_time'), '-')[0]);
      return _.has(row, 'likes') && dateYear >= 2012
    })
    const summaryInfo = calculateSummaryInfo(this.posts);
    const transformedIOData = _.map(this.posts, (row, index) => transformDataIO(row, summaryInfo, _.get(_.get(this.posts, (index + 1), {}), 'created_time', null)));
    this.network.train(transformedIOData, {
      errorThresh: 0.005,  // error threshold to reach
      iterations: 5000,   // maximum training iterations
      log: false,           // console.log() progress periodically
      logPeriod: 100,       // number of iterations between logging
      learningRate: 0.5    // learning rate
    });

    this.setState({
      stepIndex: this.state.stepIndex + 1,
    });

    const result = this.network.run({
      reactionCount: 1,
      commentCount: 1,
    });

    const reactionResult = this.network.run({
      reactionCount: 1,
      // commentCount: 0,
    });

    const commentResult = this.network.run({
      // reactionCount: 0,
      commentCount: 1,
    });

    const noResult = this.network.run({
      reactionCount: 0,
      commentCount: 0,
    });

    // const keyWords = {};
    //
    // _.forEach(_.filter(_.keys(output), (value) => {
    //     return _.head(_.split(value, '-')) === 'kw';
    //   }), (key) => {
    //     keyWords[key] = output[key] * 100;
    //   }
    // );

    // console.log({
      //   keyWords,
    // });

    const defaultDataset1 = {
      backgroundColor: 'rgba(255,99,132,0.2)',
      borderColor: 'rgba(255,99,132,1)',
      borderWidth: 1,
      hoverBackgroundColor: 'rgba(255,99,132,0.4)',
      hoverBorderColor: 'rgba(255,99,132,1)',
    }
    const defaultDataset2 = {
      backgroundColor: 'rgba(132,255,99,0.2)',
      borderColor: 'rgba(132,255,99,1)',
      borderWidth: 1,
      hoverBackgroundColor: 'rgba(132,255,99,0.4)',
      hoverBorderColor: 'rgba(132,255,99,1)',
    }
    const defaultDataset3 = {
      backgroundColor: 'rgba(99,132,255,0.2)',
      borderColor: 'rgba(99,132,255,1)',
      borderWidth: 1,
      hoverBackgroundColor: 'rgba(99,132,255,0.4)',
      hoverBorderColor: 'rgba(99,132,255,1)',
    }
    const defaultDataset4 = {
      backgroundColor: 'rgba(132,132,132,0.2)',
      borderColor: 'rgba(132,132,132,1)',
      borderWidth: 1,
      hoverBackgroundColor: 'rgba(132,132,132,0.4)',
      hoverBorderColor: 'rgba(132,132,132,1)',
    }

    const barData1 = {
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      datasets: [{
        ...defaultDataset1,
        label: '',
        data: [
          result.Monday * 100,
          result.Tuesday * 100,
          result.Wednesday * 100,
          result.Thursday * 100,
          result.Friday * 100,
          result.Saturday * 100,
          result.Sunday * 100
        ],
      }]
    };
    const barData2 = {
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      datasets: [{
        ...defaultDataset2,
        label: '',
        data: [
          reactionResult.Monday * 100,
          reactionResult.Tuesday * 100,
          reactionResult.Wednesday * 100,
          reactionResult.Thursday * 100,
          reactionResult.Friday * 100,
          reactionResult.Saturday * 100,
          reactionResult.Sunday * 100
        ],
      }]
    };
    const barData3 = {
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      datasets: [{
        ...defaultDataset3,
        label: '',
        data: [
          commentResult.Monday * 100,
          commentResult.Tuesday * 100,
          commentResult.Wednesday * 100,
          commentResult.Thursday * 100,
          commentResult.Friday * 100,
          commentResult.Saturday * 100,
          commentResult.Sunday * 100
        ],
      }]
    };
    const barData4 = {
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      datasets: [{
        ...defaultDataset4,
        label: '',
        data: [
          noResult.Monday * 100,
          noResult.Tuesday * 100,
          noResult.Wednesday * 100,
          noResult.Thursday * 100,
          noResult.Friday * 100,
          noResult.Saturday * 100,
          noResult.Sunday * 100
        ],
      }]
    };

    const sentenceBarData1 = {
      labels: ['Question', 'Command', 'Exclamation'],
      datasets: [{
        ...defaultDataset1,
        label: '',
        data: [
          result.interrogative * 100,
          result.imperative * 100,
          result.exclamatory * 100,
        ],
      }]
    };
    const sentenceBarData2 = {
      labels: ['Question', 'Command', 'Exclamation'],
      datasets: [{
        ...defaultDataset2,
        label: '',
        data: [
          reactionResult.interrogative * 100,
          reactionResult.imperative * 100,
          reactionResult.exclamatory * 100,
        ],
      }]
    };
    const sentenceBarData3 = {
      labels: ['Question', 'Command', 'Exclamation'],
      datasets: [{
        ...defaultDataset3,
        label: '',
        data: [
          commentResult.interrogative * 100,
          commentResult.imperative * 100,
          commentResult.exclamatory * 100,
        ],
      }]
    };
    const sentenceBarData4 = {
      labels: ['Question', 'Command', 'Exclamation'],
      datasets: [{
        ...defaultDataset4,
        label: '',
        data: [
          noResult.interrogative * 100,
          noResult.imperative * 100,
          noResult.exclamatory * 100,
        ],
      }]
    };


    const colors = {
      backgroundColor: [
        '#FF6384', //red
        '#4BC0C0', //green
        '#FFCE56', //yellow
        '#36A2EB', //blue
        '#C275EC', //purple
        '#E7E9ED', //gray
      ],
    };

    const postTypeData1 = {
      labels: ['status', 'photo', 'link', 'video', 'event', 'offer'],
      datasets: [{
        ...colors,
        label: '',
        data: [
          result.status * 100,
          result.photo * 100,
          result.link * 100,
          result.video * 100,
          result.event * 100,
          result.offer * 100
        ],
      }]
    }
    const postTypeData2 = {
      labels: ['status', 'photo', 'link', 'video', 'event', 'offer'],
      datasets: [{
        ...colors,
        label: '',
        data: [
          reactionResult.status * 100,
          reactionResult.photo * 100,
          reactionResult.link * 100,
          reactionResult.video * 100,
          reactionResult.event * 100,
          reactionResult.offer * 100
        ],
      }]
    }
    const postTypeData3 = {
      labels: ['status', 'photo', 'link', 'video', 'event', 'offer'],
      datasets: [{
        ...colors,
        label: '',
        data: [
          commentResult.status * 100,
          commentResult.photo * 100,
          commentResult.link * 100,
          commentResult.video * 100,
          commentResult.event * 100,
          commentResult.offer * 100
        ],
      }]
    }
    const postTypeData4 = {
      labels: ['status', 'photo', 'link', 'video', 'event', 'offer'],
      datasets: [{
        ...colors,
        label: '',
        data: [
          noResult.status * 100,
          noResult.photo * 100,
          noResult.link * 100,
          noResult.video * 100,
          noResult.event * 100,
          noResult.offer * 100
        ],
      }]
    }

    this.setState({
      barData1,
      barData2,
      barData3,
      barData4,
      postTypeData1,
      postTypeData2,
      postTypeData3,
      postTypeData4,
      timeOfDay1: result.minutesOfDay * 60 * 1440,
      timeOfDay2: reactionResult.minutesOfDay * 60 * 1440,
      timeOfDay3: commentResult.minutesOfDay * 60 * 1440,
      timeOfDay4: noResult.minutesOfDay * 60 * 1440,
      timeFromLastPost1: result.timeFromLastPost * summaryInfo.maxTimeFromLastPost / 1000,
      timeFromLastPost2: reactionResult.timeFromLastPost * summaryInfo.maxTimeFromLastPost / 1000,
      timeFromLastPost3: commentResult.timeFromLastPost * summaryInfo.maxTimeFromLastPost / 1000,
      timeFromLastPost4: noResult.timeFromLastPost * summaryInfo.maxTimeFromLastPost / 1000,
      postLength1: result.postLength * summaryInfo.maxPostLength,
      postLength2: reactionResult.postLength * summaryInfo.maxPostLength,
      postLength3: commentResult.postLength * summaryInfo.maxPostLength,
      postLength4: noResult.postLength * summaryInfo.maxPostLength,
      sentenceBarData1,
      sentenceBarData2,
      sentenceBarData3,
      sentenceBarData4,
    });
  }

  onFailure = (err) => {
    console.log(err);
  }

  render() {
    return (
      <div className="App">
        <Stepper activeStep={this.state.stepIndex} orientation="vertical">
          <Step>
            <StepLabel>Login to Facebook</StepLabel>
            <StepContent>
              <FacebookLogin
                appId="926701747482913"
                autoLoad={true}
                fields="name,posts.limit(100){reactions.limit(1).summary(true),comments.limit(0).summary(true),likes.limit(1).summary(true),type,created_time,message}"
                scope="user_posts"
                callback={this.responseFacebook}
                onFailure={this.onFailure}
              />
            </StepContent>
          </Step>
          <Step>
            <StepLabel>Getting Data from Facebook</StepLabel>
            <StepContent>
              <CircularProgress />
            </StepContent>
          </Step>
          <Step>
            <StepLabel>Processing Data</StepLabel>
            <StepContent>
              <CircularProgress />
            </StepContent>
          </Step>
        </Stepper>
        {this.state.barData1 &&
          <div>
            <Paper style={style} zDepth={1}>
              <Bar
              	data={this.state.barData1}
              	width={100}
              	height={50}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    yAxes: [{
                      ticks: {
                          min: 0,
                          max: 100,
                      }
                    }]
                  }
                }}
                legend={{ display: false }}
              />
            </Paper>
            <Paper style={style} zDepth={1}>
              <Polar
              	data={this.state.postTypeData1}
                options={{
                  scales: {
                    ticks: {
                      min: 0,
                      max: 100,
                    }
                  }
                }}
              />
            </Paper>
            <Paper style={style} zDepth={1}>
              <HorizontalBar
              	data={this.state.sentenceBarData1}
              	width={100}
              	height={50}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    xAxes: [{
                      ticks: {
                        min: 0,
                        max: 100,
                      }
                    }]
                  }
                }}
                legend={{ display: false }}
              />
            </Paper>
            <Paper style={style2} zDepth={1}>
              Best Time of Day -- {secondsToTime(this.state.timeOfDay1)}
            </Paper>
            <Paper style={style2} zDepth={1}>
              Time From Previous Post -- {secondsToString(this.state.timeFromLastPost1)}
            </Paper>
            <Paper style={style2} zDepth={1}>
              Post Length -- {Math.ceil(this.state.postLength1)} characters
            </Paper>
          </div>
        }
        {this.state.barData2 &&
          <div>
            <Paper style={style} zDepth={1}>
              <Bar
              	data={this.state.barData2}
              	width={100}
              	height={50}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    yAxes: [{
                      ticks: {
                        min: 0,
                        max: 100,
                      }
                    }]
                  }
                }}
                legend={{ display: false }}
              />
            </Paper>
            <Paper style={style} zDepth={1}>
              <Polar
              	data={this.state.postTypeData2}
                options={{
                  scales: {
                    ticks: {
                      min: 0,
                      max: 100,
                    }
                  }
                }}
              />
            </Paper>
            <Paper style={style} zDepth={1}>
              <HorizontalBar
              	data={this.state.sentenceBarData2}
              	width={100}
              	height={50}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    xAxes: [{
                      ticks: {
                        min: 0,
                        max: 100,
                      }
                    }]
                  }
                }}
                legend={{ display: false }}
              />
            </Paper>
            <Paper style={style2} zDepth={1}>
              Best Time of Day -- {secondsToTime(this.state.timeOfDay2)}
            </Paper>
            <Paper style={style2} zDepth={1}>
              Time From Previous Post -- {secondsToString(this.state.timeFromLastPost2)}
            </Paper>
            <Paper style={style2} zDepth={1}>
              Post Length -- {Math.ceil(this.state.postLength2)} characters
            </Paper>
          </div>
        }
        {this.state.barData3 &&
          <div>
            <Paper style={style} zDepth={1}>
              <Bar
              	data={this.state.barData3}
              	width={100}
              	height={50}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    yAxes: [{
                      ticks: {
                        min: 0,
                        max: 100,
                      }
                    }]
                  }
                }}
                legend={{ display: false }}
              />
            </Paper>
            <Paper style={style} zDepth={1}>
              <Polar
              	data={this.state.postTypeData3}
                options={{
                  scales: {
                    ticks: {
                      min: 0,
                      max: 100,
                    }
                  }
                }}
              />
            </Paper>
            <Paper style={style} zDepth={1}>
              <HorizontalBar
              	data={this.state.sentenceBarData3}
              	width={100}
              	height={50}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    xAxes: [{
                      ticks: {
                        min: 0,
                        max: 100,
                      }
                    }]
                  }
                }}
                legend={{ display: false }}
              />
            </Paper>
            <Paper style={style2} zDepth={1}>
              Best Time of Day -- {secondsToTime(this.state.timeOfDay3)}
            </Paper>
            <Paper style={style2} zDepth={1}>
              Time From Previous Post -- {secondsToString(this.state.timeFromLastPost3)}
            </Paper>
            <Paper style={style2} zDepth={1}>
              Post Length -- {Math.ceil(this.state.postLength3)} characters
            </Paper>
          </div>
        }
        {this.state.barData4 &&
          <div>
            <Paper style={style} zDepth={1}>
              <Bar
              	data={this.state.barData4}
              	width={100}
              	height={50}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    yAxes: [{
                      ticks: {
                        min: 0,
                        max: 100,
                      }
                    }]
                  }
                }}
                legend={{ display: false }}
              />
            </Paper>
            <Paper style={style} zDepth={1}>
              <Polar
              	data={this.state.postTypeData4}
                options={{
                  scales: {
                    ticks: {
                      min: 0,
                      max: 100,
                    }
                  }
                }}
              />
            </Paper>
            <Paper style={style} zDepth={1}>
              <HorizontalBar
              	data={this.state.sentenceBarData4}
              	width={100}
              	height={50}
              	options={{
                  maintainAspectRatio: true,
                  scales: {
                    xAxes: [{
                      ticks: {
                        min: 0,
                        max: 100,
                      }
                    }]
                  }
                }}
                legend={{ display: false }}
              />
            </Paper>
            <Paper style={style2} zDepth={1}>
              Best Time of Day -- {secondsToTime(this.state.timeOfDay4)}
            </Paper>
            <Paper style={style2} zDepth={1}>
              Time From Previous Post -- {secondsToString(this.state.timeFromLastPost4)}
            </Paper>
            <Paper style={style2} zDepth={1}>
              Post Length -- {Math.ceil(this.state.postLength4)} characters
            </Paper>
          </div>
        }
      </div>
    );
  }
}

export default Facebook;

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
import Slider from 'material-ui/Slider';
import Graph from './Graph';
import {
  calculateSummaryInfo,
  transformDataIO,
} from '../../utils/data-transformer';
import './Facebook.css';

class Facebook extends Component {
  constructor(props) {
    super(props);
    this.network = new brain.NeuralNetwork();
    // this.reverseNetwork = new brain.NeuralNetwork();
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
    this.summaryInfo = calculateSummaryInfo(this.posts);
    const transformedIOData = _.map(this.posts, (row, index) => transformDataIO(row, this.summaryInfo, _.get(_.get(this.posts, (index + 1), {}), 'created_time', null)));
    this.network.train(transformedIOData, {
      errorThresh: 0.005,
      iterations: 5000,
      log: false,
      logPeriod: 100,
      learningRate: 0.3
    });

    // const reverseTransformedIOData = _.map(this.posts, (row, index) => transformDataIO(row, this.summaryInfo, _.get(_.get(this.posts, (index + 1), {}), 'created_time', null), true));
    // this.reverseNetwork.train(reverseTransformedIOData, {
    //   errorThresh: 0.005,  // error threshold to reach
    //   iterations: 5000,   // maximum training iterations
    //   log: false,           // console.log() progress periodically
    //   logPeriod: 100,       // number of iterations between logging
    //   learningRate: 0.5    // learning rate
    // });

    this.setState({
      stepIndex: this.state.stepIndex + 1,
    });

    const result = this.network.run({
      reactionCount: 1,
      commentCount: 1,
      shareCount: 1,
    });

    // const reactionResult = this.network.run({
    //   reactionCount: 1,
    // });
    //
    // const commentResult = this.network.run({
    //   commentCount: 1,
    // });
    //
    // const shareResult = this.network.run({
    //   shareCount: 1,
    // });
    //
    // const noResult = this.network.run({
    //   reactionCount: 0,
    //   commentCount: 0,
    //   shareCount: 0,
    // });

    // console.log(result, reactionResult, commentResult, shareResult, noResult);
    this.setState({ result, complete: true, reactionCount: 1, commentCount: 1, shareCount: 1 });
  }

  onFailure = (err) => {
    console.log(err);
  }

  handleSlide = (slide, newValue) => {
    let result;
    switch (slide) {
      case 0:
        result = this.network.run({
          reactionCount: newValue,
          commentCount: this.state.commentCount,
          shareCount: this.state.shareCount,
        });
        this.setState({ reactionCount: newValue, result });
        break;
      case 1:
        result = this.network.run({
          reactionCount: this.state.reactionCount,
          commentCount: newValue,
          shareCount: this.state.shareCount,
        });
        this.setState({ commentCount: newValue, result });
        break;
      case 2:
        result = this.network.run({
          reactionCount: this.state.reactionCount,
          commentCount: this.state.commentCount,
          shareCount: newValue
        });
        this.setState({ shareCount: newValue, result });
        break;
      default:
        result = this.network.run({
          reactionCount: newValue,
          commentCount: this.state.commentCount,
          shareCount: this.state.shareCount,
        });
        this.setState({ reactionCount: newValue, result });
    }
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
                fields="name,posts.limit(100){reactions.limit(1).summary(true),comments.limit(0).summary(true),shares,privacy,likes.limit(1).summary(true),type,created_time,message}"
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
        {this.state.complete && <div className="slider-container">
          <div className="sliders">
            <div>Reactions:</div>
            <div>Comments:</div>
            <div>Shares:</div>
          </div>
          <div className="sliders">
            <Slider style={{width: 200}} step={0.10} value={this.state.reactionCount} onChange={(event, newValue) => this.handleSlide(0, newValue)}/>
            <Slider style={{width: 200}} step={0.10} value={this.state.commentCount} onChange={(event, newValue) => this.handleSlide(1, newValue)}/>
            <Slider style={{width: 200}} step={0.10} value={this.state.shareCount} onChange={(event, newValue) => this.handleSlide(2, newValue)}/>
          </div>
        </div>}
        <Graph result={this.state.result} summaryInfo={this.summaryInfo} />
      </div>
    );
  }
}

export default Facebook;

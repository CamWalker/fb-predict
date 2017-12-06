import _ from 'lodash';

const calculateSummaryInfo = (inputData) => {
  //calculate reaction decimal place

  const maxReaction = _.reduce(inputData, (max, value) => {
    if (!_.has(value, 'reactions')) {
      return max > _.get(value.likes.summary, 'total_count', 0) ? max : _.get(value.likes.summary, 'total_count', 0);
    }
    return max > _.get(value.reactions.summary, 'total_count', 0) ? max : _.get(value.reactions.summary, 'total_count', 0);
  }, 0);
  const reactionPlaceValue = Math.log(maxReaction) * Math.LOG10E + 1 | 0;

  //calculate comment decimal place
  const maxComment = _.reduce(inputData, (max, value) => {
    return max > _.get(value.comments.summary, 'total_count', 0) ? max : _.get(value.comments.summary, 'total_count', 0);
  }, 0);
  const commentPlaceValue = Math.log(maxComment) * Math.LOG10E + 1 | 0;

  //calculate post length decimal place
  const maxPostLength = _.reduce(inputData, (max, value) => {
    return max > _.get(value.message, 'length', 0) ? max : _.get(value.message, 'length', 0);
  }, 0);
  const postLengthPlaceValue = Math.log(maxPostLength) * Math.LOG10E + 1 | 0;

  //days of year - discontinued
  // const daysInYear = 366;

  return {
    reactionPlaceValue,
    commentPlaceValue,
    postLengthPlaceValue,
    // daysInYear,
  };
}

const transformDataIO = (inputData, summaryInfo) => {
  const finalData = {
    output: {
      // STATUS type -- link, status, photo, video, offer
      status: 0,
      link: 0,
      photo: 0,
      video: 0,
      offer: 0,
      // DATE
      // dayOfYear: 0, - discontinued
      // dayOfMonth: 0, - discontinued
      dayOfWeek: 0,
      // TIME
      minutesOfDay: 0,
      // timeFromLastPost: 0, // In Progress. DO THIS ONE!!!!
      // TEXT
      // Dynamic Key Words - predetermined // In Progress. DO THIS ONE!!!!
      // Punctuation // In Progress. DO THIS ONE!!!!
      postLength: 0,
      // PRIVACY - discontinued
      // allFriends: 0, - discontinued
      // friendsOfFriends: 0, - discontinued
      // everyone: 0, - discontinued
      // custom: 0, - discontinued
      // self: 0, - discontinued
    },
    input: {
      reactionCount: 0,
      commentCount: 0,
    },
  };

  // transform Date/Time
  const date = new Date(_.get(inputData, 'created_time'));

  // // DAY OF YEAR - discontinued
  // const oneDay = 1000 * 60 * 60 * 24;
  // const dayOfYear = Math.floor((date - (new Date(date.getFullYear(), 0, 0))) / oneDay);
  // finalData.output.dayOfYear = dayOfYear / summaryInfo.daysInYear;

  // // DAY OF MONTH  - discontinued
  // const currentMonth = new Date(date.getTime());
  // currentMonth.setDate(32);
  // currentMonth.setDate(0);
  // const daysInMonth = currentMonth.getDate();
  // finalData.output.dayOfMonth = date.getDate() / daysInMonth;

  // // DAY OF WEEK
  finalData.output.dayOfWeek = date.getDay() === 0 ? 1 : ((date.getDay() - 1) / 6);

  // // MINUTES OF DAY
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  finalData.output.minutesOfDay = (date.getTime() - midnight.getTime()) / 60000 / 1440;

  // transform Type
  finalData.output[inputData.type] = 1;

  // transform Text
  finalData.output.postLength = _.size(_.get(inputData, 'message')) / Math.pow(10, summaryInfo.postLengthPlaceValue);

  // transform Reactions
  if (!_.has(inputData, 'reactions')) {
    finalData.input.reactionCount = _.toNumber(_.get(inputData.likes.summary, 'total_count', 0)) / Math.pow(10, summaryInfo.reactionPlaceValue);
  } else {
    finalData.input.reactionCount = _.toNumber(_.get(inputData.reactions.summary, 'total_count', 0)) / Math.pow(10, summaryInfo.reactionPlaceValue);
  }

  // transform Comments
  finalData.input.commentCount = _.toNumber(_.get(inputData.comments.summary, 'total_count', 0)) / Math.pow(10, summaryInfo.commentPlaceValue);

  return finalData;
}

export {
  calculateSummaryInfo,
  transformDataIO,
};

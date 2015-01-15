var addZero = function(num) {
  return (num < 10) ? '0' + num : '' + num;
};

module.exports = {
  dateStr: function(date) {
    return '' + date.getUTCFullYear() + addZero(date.getUTCMonth() + 1) + addZero(date.getUTCDate());
  }
};
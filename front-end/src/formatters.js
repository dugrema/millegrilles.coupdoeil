import moment from 'moment';

class DateFormatter {

  date_default = 'YYYY/MM/DD';
  datetime_default = 'YYYY/MM/DD HH:mm:SS';
  datemonthhour_default  = 'MMM-DD HH:mm:ss';

  format_monthhour(date) {
    return moment(date).format(this.datemonthhour_default);
  }
}

const dateformatter = new DateFormatter();
export default dateformatter;

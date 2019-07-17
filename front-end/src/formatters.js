import moment from 'moment';

class DateFormatter {

  date_default = 'YYYY/MM/DD';
  datetime_default = 'YYYY/MM/DD HH:mm:SS';
  datemonthhour_default  = 'MMM-DD HH:mm:ss';

  format_monthhour(date) {
    // On assume que la date est en secondes (epoch).
    return moment(date*1000).format(this.datemonthhour_default);
  }

  format_numberdecimals(number, decimals) {
    if(number) {
      return number.toFixed(decimals);
    }
    return;
  }
}

const dateformatter = new DateFormatter();
export default dateformatter;

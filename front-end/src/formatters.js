// Utility class pour les formatteurs
import moment from 'moment';

class DateFormatter {

  date_default = 'YYYY/MM/DD';
  datetime_default = 'YYYY/MM/DD HH:mm:SS';
  datemonthhour_default  = 'MMM-DD HH:mm:ss';

  format_date(date) {
    // On assume que la date est en secondes (epoch).
    return moment(date*1000).format(this.date_default);
  }

  format_datetime(date) {
    // On assume que la date est en secondes (epoch).
    return moment(date*1000).format(this.datetime_default);
  }

  format_monthhour(date) {
    // On assume que la date est en secondes (epoch).
    return moment(date*1000).format(this.datemonthhour_default);
  }

}

class NumberFormatter {
  format_numberdecimals(number, decimals) {
    if(number) {
      return number.toFixed(decimals);
    }
    return;
  }
}

// Exports
const dateformatter = new DateFormatter();
const numberformatter = new NumberFormatter();
export {dateformatter, numberformatter};

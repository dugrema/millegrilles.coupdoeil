// Utility class pour les formatteurs
import moment from 'moment-timezone';

class DateFormatter {

  date_default = 'YYYY/MM/DD';
  datetime_default = 'YYYY/MM/DD HH:mm:SS';
  datemonthhour_default  = 'MMM-DD HH:mm:ss';

  timezone_default = 'America/Toronto';

  format_date(date) {
    // On assume que la date est en secondes (epoch).
    return moment(date*1000).tz(this.timezone_default).format(this.date_default);
  }

  format_datetime(date) {
    // On assume que la date est en secondes (epoch).
    return moment(date*1000).tz(this.timezone_default).format(this.datetime_default);
  }

  format_monthhour(date) {
    // On assume que la date est en secondes (epoch).
    return moment(date*1000).tz(this.timezone_default).format(this.datemonthhour_default);
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

// Utility class pour les formatteurs
import moment from 'moment-timezone';

class DateFormatter {

  date_default = 'YYYY/MM/DD';
  datetime_default = 'YYYY/MM/DD HH:mm:ss';
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

class FileSizeFormatter {

  constructor() {
    this.kb = 1024;
    this.mb = this.kb*1024;
    this.gb = this.mb*1024;
    this.tb = this.gb*1024;
    this.precision = 3;
  }

  format(nbBytes) {
    let result, unite;
    if(nbBytes > this.tb) {
      result = (nbBytes/this.tb).toPrecision(this.precision);
      unite = 'Tb';
    } else if(nbBytes > this.gb) {
      result = (nbBytes/this.gb).toPrecision(this.precision);
      unite = 'Gb';
    } else if(nbBytes > this.mb) {
      result = (nbBytes/this.mb).toPrecision(this.precision);
      unite = 'Mb';
    } else if(nbBytes > this.kb) {
      result = (nbBytes/this.kb).toPrecision(this.precision);
      unite = 'kb';
    } else {
      result = nbBytes;
      unite = 'bytes';
    }

    return result + ' ' + unite;
  }
}

// class IconeTypeFichier {}

// Exports
const dateformatter = new DateFormatter();
const numberformatter = new NumberFormatter();
const filesizeformatter = new FileSizeFormatter();
export {dateformatter, numberformatter, filesizeformatter};

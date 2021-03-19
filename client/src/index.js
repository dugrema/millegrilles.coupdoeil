import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
// import { ApplicationDev } from './AppDev';
import { AppDev } from './dev/AppDev';
import './components/i18n';

import * as serviceWorker from './serviceWorker';

ReactDOM.render(<AppDev />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

// import {ApplicationCoupdoeil} from './containers/App';
// export default ApplicationCoupdoeil

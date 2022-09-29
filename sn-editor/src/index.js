import 'tawian-frontend';
import 'typeface-cousine';
import React from 'react';
import ReactDOM from 'react-dom';
import App from 'containers/App';
// import registerServiceWorker from 'utils/registerServiceWorker';
import 'index.css';
import { Provider } from 'react-redux';
import store from './redux/store/store';
import 'dygraph.css';

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>
, document.getElementById('app'));
// registerServiceWorker();

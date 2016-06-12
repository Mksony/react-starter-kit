import { combineReducers } from 'redux';
import runtime from './runtime';
import intl from './intl';
import pages from './pages';

export default combineReducers({
  runtime,
  intl,
  pages,
});

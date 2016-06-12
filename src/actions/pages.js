import fetch from '../core/fetch';
import {
  FETCH_CONTENT_INIT,
  FETCH_CONTENT_SUCCESS,
  FETCH_CONTENT_ERROR,
} from '../constants';

function shouldFetchContent(state) {
  return state.pages.pages.length === 0;
}

export function fetchContent() {
  return async (dispatch, getState) => {
    if (shouldFetchContent(getState())) {
      dispatch({
        type: FETCH_CONTENT_INIT,
      });
      try {
        const resp = await fetch('/graphql?query={page{slug,content}}');
        if (resp.status !== 200) throw new Error(resp.statusText);
        const { data } = await resp.json();
        dispatch({
          type: FETCH_CONTENT_SUCCESS,
          payload: {
            pages: data.page,
          },
        });
      } catch (e) {
        dispatch({
          type: FETCH_CONTENT_ERROR,
          payload: {
            error: e,
          },
        });
        return false;
      }
      return true;
    }
    return false;
  };
}

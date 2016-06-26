import {
  FETCH_CONTENT_INIT,
  FETCH_CONTENT_SUCCESS,
  FETCH_CONTENT_ERROR,
} from '../constants';

const initialState = {
  isFetching: false,
  pages: [],
};

export default function pages(state = initialState, action) {
  switch (action.type) {
    case FETCH_CONTENT_INIT: {
      return {
        ...state,
        isFetching: true,
      };
    }

    case FETCH_CONTENT_SUCCESS: {
      return {
        isFetching: false,
        pages: action.payload.pages,
      };
    }

    case FETCH_CONTENT_ERROR: {
      return {
        isFetching: false,
        pages: null,
        error: action.payload.error,
      };
    }
    default: {
      return state;
    }
  }
}

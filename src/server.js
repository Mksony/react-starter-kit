/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-2016 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import 'babel-polyfill';
import './serverIntlPolyfill';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import requestLanguage from 'express-request-language';
import bodyParser from 'body-parser';
import expressJwt from 'express-jwt';
import expressGraphQL from 'express-graphql';
import jwt from 'jsonwebtoken';
import React from 'react';
import ReactDOM from 'react-dom/server';
import UniversalRouter from 'universal-router';
import PrettyError from 'pretty-error';
import passport from './core/passport';
import schema from './data/schema';
import routes from './routes';
import assets from './assets'; // eslint-disable-line import/no-unresolved
import { port, auth, analytics, locales } from './config';
import configureStore from './store/configureStore';
import { setRuntimeVariable } from './actions/runtime';
import { fetchContent } from './actions/pages';
import Provide from './components/Provide';
import { setLocale } from './actions/intl';
import fetch from './core/fetch';
import mongoose from 'mongoose';
import Page from './data/models/Page';
import secrets from '../secrets.json';

mongoose.connect('mongodb://localhost/max2');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:')); // eslint-disable-line no-console
async function saveContentToDB() {
  let content;
  try {
    const cosmicContent = await fetch(`https://api.cosmicjs.com/v1/mksony/objects?read_key=${secrets.COSMIC_JS_API_KEY}`);
    const data = await cosmicContent.json();
    content = await data.objects;
    const bulk = Page.collection.initializeUnorderedBulkOp();
    for (const it of content) {
      bulk.find({ _id: it._id }) // eslint-disable-line no-underscore-dangle
        .upsert()
        .update({ $set: it });
    }
    bulk.execute();
  } catch (e) {
    console.log(e); // eslint-disable-line no-console
  }
  return true;
}
db.once('open', () => {
  console.log('connected to database'); // eslint-disable-line no-console
});
// TODO uncomment to sync data from cms
// saveContentToDB();
const app = express();

//
// Tell any CSS tooling (such as Material UI) to use all vendor prefixes if the
// user agent is not known.
// -----------------------------------------------------------------------------
global.navigator = global.navigator || {};
global.navigator.userAgent = global.navigator.userAgent || 'all';

//
// Register Node.js middleware
// -----------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(requestLanguage({
  languages: locales,
  queryName: 'lang',
  cookie: {
    name: 'lang',
    options: {
      path: '/',
      maxAge: 3650 * 24 * 3600 * 1000, // 10 years in miliseconds
    },
    url: '/lang/{language}',
  },
}));
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(bodyParser.json());

//
// Authentication
// -----------------------------------------------------------------------------
app.use(expressJwt({
  secret: auth.jwt.secret,
  credentialsRequired: false,
  /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
  getToken: req => req.cookies.id_token,
  /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
}));
app.use(passport.initialize());

app.get('/login/facebook',
  passport.authenticate('facebook', {
    scope: ['email', 'user_location'],
    session: false,
  })
);
app.get('/login/facebook/return',
  passport.authenticate('facebook', {
    failureRedirect: '/login',
    session: false
  }),
  (req, res) => {
    const expiresIn = 60 * 60 * 24 * 180; // 180 days
    const token = jwt.sign(req.user, auth.jwt.secret, {
      expiresIn
    });
    res.cookie('id_token', token, {
      maxAge: 1000 * expiresIn,
      httpOnly: true,
    });
    res.redirect('/');
  }
);

//
// Register API middleware
// -----------------------------------------------------------------------------
app.use('/graphql', expressGraphQL(req => ({
  schema,
  graphiql: true,
  rootValue: {
    request: req
  },
  pretty: process.env.NODE_ENV !== 'production',
})));
// Remove trailing slashes, TODO maybe move to custom middleware
app.use((req, res, next) => {
  if (req.path.substr(-1) === '/' && req.path.length > 1) {
    const query = req.url.slice(req.path.length);
    res.redirect(301, `${req.path.slice(0, -1)}${query}`);
  } else {
    next();
  }
});

// Register server-side rendering middleware
// -----------------------------------------------------------------------------
app.get('*', async(req, res, next) => {
  try {
    let css = [];
    let statusCode = 200;
    // template is a function provided by webpack jade loader
    const template = require('./views/index.jade'); // eslint-disable-line global-require
    const locale = req.language;
    const data = {
      lang: locale,
      title: '',
      description: '',
      css: '',
      body: '',
      entry: assets.main.js,
    };

    if (process.env.NODE_ENV === 'production') {
      data.trackingId = analytics.google.trackingId;
    }

    const store = configureStore({});

    store.dispatch(setRuntimeVariable({
      name: 'initialNow',
      value: Date.now(),
    }));

    store.dispatch(setRuntimeVariable({
      name: 'availableLocales',
      value: locales,
    }));

    await store.dispatch(setLocale({
      locale,
    }));

    await store.dispatch(fetchContent());

    await UniversalRouter.resolve(routes, {
      path: req.path,
      query: req.query,
      context: {
        insertCss: (...styles) => {
          styles.forEach(style => css.push(style._getCss())); // eslint-disable-line no-underscore-dangle, max-len
        },

        setTitle: value => (data.title = value),
        setMeta: (key, value) => (data[key] = value),
      },
      render(component, status = 200) {
        css = [];
        statusCode = status;

        // Fire all componentWill... hooks
        data.body = ReactDOM.renderToString(<Provide store={store}>{component}</Provide>);

        // If you have async actions, wait for store when stabilizes here.
        // This may be asynchronous loop if you have complicated structure.
        // Then render again

        // If store has no changes, you do not need render again!
        // data.body = ReactDOM.renderToString(<Provide store={store}>{component}</Provide>);

        // It is important to have rendered output and state in sync,
        // otherwise React will write error to console when mounting on client
        data.state = JSON.stringify(store.getState());

        data.css = css.join('');
        return true;
      },
    });

    res.status(statusCode);
    res.send(template(data));
  } catch (err) {
    next(err);
  }
});

//
// Error handling
// -----------------------------------------------------------------------------
const pe = new PrettyError();
pe.skipNodeFiles();
pe.skipPackage('express');

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.log(pe.render(err)); // eslint-disable-line no-console
  const template = require('./views/error.jade'); // eslint-disable-line global-require
  const statusCode = err.status || 500;
  res.status(statusCode);
  res.send(template({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '' : err.stack,
  }));
});

//
// Launch the server
// -----------------------------------------------------------------------------
/* eslint-disable no-console */
app.listen(port, () => {
  console.log(`The server is running at http://localhost:${port}/`);
});
/* eslint-enable no-console */

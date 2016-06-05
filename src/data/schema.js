/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-2016 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import {
  GraphQLSchema as Schema,
  GraphQLObjectType as ObjectType,
} from 'graphql';

import me from './queries/me';
import content from './queries/content';
import news from './queries/news';
import intl from './queries/intl';
import page from './queries/page';

const schema = new Schema({
  query: new ObjectType({
    name: 'RootQuery',
    fields: {
      me,
      content,
      news,
      intl,
      page,
    },
  }),
});

export default schema;

import PageType from '../types/PageType';
import { GraphQLList as List } from 'graphql';
import { getPages } from '../models/Page';

const page = {
  type: new List(PageType),
  resolve: getPages,
};

export default page;

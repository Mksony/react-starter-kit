import {
  GraphQLObjectType as ObjectType,
  GraphQLString as StringType,
  GraphQLNonNull as NonNull,
} from 'graphql';

const PageType = new ObjectType({
  name: 'Page',
  fields: {
    slug: { type: StringType },
    content: { type: StringType },
  },
});

export default PageType;

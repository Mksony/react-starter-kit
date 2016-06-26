'use strict';

import mongoose from 'mongoose';

// const pageSchema = mongoose.Schema({
//     slug: String,
//     content: String,
// });

const Page = mongoose.model('Page', {});

export function getPages() {
  return new Promise((resolve, reject) => {
    Page.find({}).lean().exec((err, res) => {
      err ? reject(err) : resolve(res);
    })
  })
}

export default Page;

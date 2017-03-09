'use strict'

const assert = require('assert')
const natural = require('natural')
const MongoClient = require('mongodb').MongoClient
const async = require('async')
const redis = require('redis')
const client = redis.createClient()
const serialize = require('serialization')

const classifier = new natural.LogisticRegressionClassifier()
// const classifier = new natural.BayesClassifier()


client.get('187675408040102', (err, text) => {
  assert.equal(null, err);

  if(text) {
    let intentClassifierCopy = serialize.fromString(text, __dirname)
    console.log(intentClassifierCopy.classify('untuk lelaki boleh tak?'))
  } else {
    reFetch()
  }

})

function newClassifierFunction() {
  var limdu = require('limdu')
  // First, define our base classifier type (a multi-label classifier based on svm.js):
  var TextClassifier = limdu.classifiers.multilabel.BinaryRelevance.bind(0, {
    binaryClassifierType: limdu.classifiers.SvmJs.bind(0, {C: 1.0})
  });

  // Now define our feature extractor - a function that takes a sample and adds features to a given features set:
  return new limdu.classifiers.EnhancedClassifier({
    classifierType: TextClassifier,
    normalizer: limdu.features.LowerCaseNormalizer,
    featureExtractor: limdu.features.NGramsOfWords(1),  // each word ("1-gram") is a feature
    featureLookupTable: new limdu.features.FeatureLookupTable(),
    pastTrainingSamples: []
  });

}

function reFetch() {
  const url = 'mongodb://localhost:27017/bizsayaDotCom'

  MongoClient.connect(url, (err, db) => {
    assert.equal(null, err);

    let messenger_thread_log = db.collection('messenger_thread_log')

    messenger_thread_log.find({page_id: '187675408040102'}, {page_name: 1, message: 1, type: 1}).toArray((err, docs) => {
      assert.equal(null, err);
      let trainingData = []
      async.each(docs, (doc, callback) => {
        trainingData.push({
          input: doc.message,
          output: doc.type
        })
        callback()

      }, () => {
        var intentClassifier = newClassifierFunction()
        intentClassifier.trainBatch(trainingData)
        console.log(intentClassifier.classify('most welcome'));
        client.set('187675408040102', serialize.toString(intentClassifier, newClassifierFunction))
      })

    })

  })
}
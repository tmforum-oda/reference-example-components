const queryToMongo = require('query-to-mongo');

// Test how query-to-mongo handles URL query parameters
console.log('Testing query-to-mongo functionality:');

// Simulate query string parsing for ?name=DynamicRole1
const testQuery1 = 'name=DynamicRole1';
const result1 = queryToMongo(testQuery1);
console.log('\nQuery: ?name=DynamicRole1');
console.log('Result:', JSON.stringify(result1, null, 2));

// Test multiple parameters
const testQuery2 = 'name=DynamicRole1&status=active';
const result2 = queryToMongo(testQuery2);
console.log('\nQuery: ?name=DynamicRole1&status=active');
console.log('Result:', JSON.stringify(result2, null, 2));

// Test with limit and offset
const testQuery3 = 'name=DynamicRole1&limit=10&offset=0';
const result3 = queryToMongo(testQuery3);
console.log('\nQuery: ?name=DynamicRole1&limit=10&offset=0');
console.log('Result:', JSON.stringify(result3, null, 2));

// Test partial matching (like)
const testQuery4 = 'name=/Dynamic/i';
const result4 = queryToMongo(testQuery4);
console.log('\nQuery: ?name=/Dynamic/i (regex)');
console.log('Result:', JSON.stringify(result4, null, 2));

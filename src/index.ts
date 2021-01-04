import nodeFetch from 'node-fetch';

const config = require('../config/exampleConfig.json');


async function testLoop() {
    for (const test of config.tests) {
        console.log(`TESTING: ${test.name}`);
        const uri = `${config.host}${test.path}`;
        const response = await nodeFetch(uri, test.request);
        if (response.status === 200) {
            console.log('SUCCESS');
        } else {
            console.log('FAILURE');
        }
    }
}

testLoop();
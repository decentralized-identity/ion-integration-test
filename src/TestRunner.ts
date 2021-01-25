import { IonDocumentModel, IonKey, IonNetwork, IonRequest, IonSdkConfig, IonPublicKeyPurpose } from '@decentralized-identity/ion-sdk';
import HelperFunction from './enums/HelperFunction';
import IEventEmitter from './interfaces/IEventEmitter';
import nodeFetch from 'node-fetch';

export default class TestRunner {
    public static async start(eventEmitter: IEventEmitter, baseUrl?: string, isMainnet?: boolean) {
        let config;
        if (isMainnet) {
            config = require('../config/mainnetConfig.json');
        } else {
            config = require('../config/testnetConfig.json');
        }
        if (baseUrl !== undefined) {
            config.host = baseUrl;
        }
        const successfulTests: string[] = [];
        const failedTests: string[] = [];
        for (const test of config.tests) {
            console.log(`====== TESTING: ${test.name} ======`);
            const uri = `${config.host}${test.path}`;
            console.log(uri);
    
            if (test.helperFunction === HelperFunction.GenerateCreateRequest) {
                test.request.body = JSON.stringify(await this.generateCreateRequest());
            }
    
            console.log(test.request);
            const response = await nodeFetch(uri, test.request);
            if (response.status === 200) {
                console.log('REQUEST SUCCESS');
                if (test.request.method === 'GET') {
                    console.log('SUCCESS');
                    successfulTests.push(test.name);
                } else {
                    // 60 seconds a minute, 1000 milliseconds a second
                    const beginTime = Date.now();
                    const timeout = test.timeOutInMinutes * 60 * 1000 + beginTime;
                    const did = (await response.json()).didDocument.id;
                    let success = false;
                    while (Date.now() < timeout) {
                        console.log(`${config.host}${config.validatePath}${did}`);
                        console.log(`time left: ${(timeout - Date.now()) / 1000} seconds`);
                        const validateResponse = await nodeFetch(`${config.host}${config.validatePath}${did}`);
                        if (validateResponse.status === 200) {
                            console.log('SUCCESS');
                            successfulTests.push(test.name);
                            success = true;
                            break;
                        }
                        console.log('waiting for validation...')
                        await new Promise(resolve => setTimeout( resolve, 30 * 1000));
                    }
    
                    if (!success) {
                        console.log('FAILED TO OBSERVE');
                        failedTests.push(test.name);
                    }
                }
            } else {
                console.log('REQUEST FAILED');
                console.log(await response.status);
                failedTests.push(test.name);
            }
        }
    
        if (successfulTests.length > 0) {
            console.log(`Successful Tests: ${JSON.stringify(successfulTests)}`);
            for (let testName of successfulTests) {
                await eventEmitter.emit(testName, {'status': 'success'});
            }
        }
        
        if (failedTests.length > 0) {
            console.log(`Failed Tests: ${JSON.stringify(failedTests)}`);
            for (let testName of failedTests) {
                await eventEmitter.emit(testName, {'status': 'failure'});
            }
        }

    }

    private static async generateCreateRequest (): Promise<IonRequest> {
        IonSdkConfig.network = IonNetwork.Testnet;
    
        // Generate recovery key and update key for the operation
        // index 0 is the public key and index 1 is the private key
        const [recoveryKey] = await IonKey.generateEs256kOperationKeyPair();
        const [updateKey] = await IonKey.generateEs256kOperationKeyPair();
    
        const keyId = 'someKeyId';
        const purpose = IonPublicKeyPurpose.Authentication;
        const [publicKey] = await IonKey.generateEs256kDidDocumentKeyPair({id: keyId, purposes: [purpose]});
        const publicKeys = [publicKey];
    
        const exampleService = {
            id: 'someId',
            type: 'website',
            serviceEndpoint: 'https://www.ionIsCool.com'
        }
        const services = [exampleService];
    
        const document : IonDocumentModel = {
            publicKeys,
            services
        }
        const input = { recoveryKey, updateKey, document };
        return IonRequest.createCreateRequest(input);
    }
}

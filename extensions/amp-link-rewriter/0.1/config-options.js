/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {getChildJsonConfig} from '../../../src/json';
import {hasOwn} from '../../../src/utils/object';
import {user, userAssert} from '../../../src/log';

/**
 * @typedef {{output: string, section:Array, attribute:Object, vars:Object}}
 */
let ConfigOptsDef;

/**
 *@typedef {{output: string, attribute: Object, vars: Object, reportLinks: Object, linkers: Object }}
 */
let oneTagOptsDef;

/**
 * @param {!AmpElement} element
 * @return {!ConfigOptsDef|oneTagOptsDef}
 */
export function getConfigOpts(element) {
  const config = getConfigJson(element);
  let configOpts;
  if (hasOwn(config, 'remoteConfig')) {
    // userAssert(config['remoteConfig']['urls'],
    // 'amp-amazon-onetag: urls config property is required');
    // function to call api's in the 'reportLinks'
    // some function to convert get the localConfig File from AES
    /*
        fuction callApis()
        function getAesConfig()
        */
    const text =
      '{' +
      '"localConfig": {' +
      '"output": "https://visit.foo.net/?pid=110&url=${href}&customerId=${customerId}&impressionToken=${impressionToken}&tagValue=${tagValue}",' +
      '"attribute": {' +
      '"href": "((?!(https://amazon.com)).)*"' +
      '},' +
      '"vars": {' +
      '"customerId": "12345",' +
      '"impressionToken": "123456",' +
      '"tagValue": "abc-20"' +
      '},' +
      '"reportlinks": {' +
      '"url": "https://assoc-na.associates-amazon.com/onetag/pixel/",' +
      '"slotNum": true' +
      '},' +
      '"linkers": {' +
      '"enabled": true' +
      '}' +
      '}' +
      '}';

    /*
          // pixel calling function
          fuction reportlinks()
        */
    const aesConfig = JSON.parse(text);
    configOpts = {
      output: aesConfig['localConfig']['output'].toString(),
      section: hasOwn(aesConfig, 'section') ? aesConfig['section'] : [],

      attribute: hasOwn(aesConfig['localConfig'], 'attribute')
        ? parseAttribute(aesConfig['localConfig']['attribute'])
        : {},
      vars: hasOwn(aesConfig['localConfig'], 'vars')
        ? aesConfig['localConfig']['vars']
        : {},
      linkers: hasOwn(aesConfig['localConfig'], 'linkers')
        ? aesConfig['localConfig']['linkers']
        : {},
    };
    // if (hasOwn(aesConfig['localconfig'], 'linkers')) {
    //   const transitId = amznTransitRecorder(aesConfig);
    // }
  } else {
    userAssert(
      config['output'],
      'amp-link-rewriter: output config property is required'
    );
    configOpts = {
      output: config['output'].toString(),
      section: hasOwn(config, 'section') ? config['section'] : [],

      attribute: hasOwn(config, 'attribute')
        ? parseAttribute(config['attribute'])
        : {},

      vars: hasOwn(config, 'vars') ? config['vars'] : {},
    };
  }

  return configOpts;
}

/**
 * @param {!AmpElement} element
 * @return {JsonObject}
 */
function getConfigJson(element) {
  const TAG = 'amp-link-rewriter';

  try {
    return getChildJsonConfig(element);
  } catch (e) {
    throw user(element).createError('%s: %s', TAG, e);
  }
}

/**
 * @param {!Object} attribute
 * @return {Object}
 */
function parseAttribute(attribute) {
  const newAttr = {};

  Object.keys(attribute).forEach((key) => {
    newAttr[key] = '^' + attribute[key] + '$';
  });

  return newAttr;
}

/**
 * @param {!Object} aesConfig
 * @return {Object}
 */

// function amznTransitRecorder(aesConfig) {
//   const that = {};
//   const TRANSIT_ID_KEY = 'assocPayloadId';
//   const trackingEnabled = aesConfig['localConfig']['linkers']['enabled'];
//   const TRANSIT_ID_VALUE = JSON.stringify(aesConfig['localConfig']['vars']);

//   if (trackingEnabled === 'false') {
//     return that;
//   }

//   if (trackingEnabled === 'true' && !getTransitId()) {
//     sessionStorage.setItem(TRANSIT_ID_KEY, TRANSIT_ID_VALUE);
//   }

//   //To check if the 'assocPayloadId' is already present
//   function getTransitId() {
//     const existingTransitId = sessionStorage.getItem(TRANSIT_ID_KEY);
//     return existingTransitId;
//   }

//   return sessionStorage.getItem(TRANSIT_ID_KEY);
// }

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
        let aesConfig;
        function success(obj)
        {
          aesConfig = obj;
        }
        fetch(config['remoteConfig']['urls'][0].toString())
        .then(response => response.json())
        .then(data => success(data));
        */
    const text =
      '{' +
      '"localConfig": {' +
      '"output": "https://visit.foo.net/${impressionId}/?pid=110&url=${href}&customerId=${customerId}&impressionToken=${impressionToken}&tagValue=${tagValue}",' +
      '"attribute": {' +
      // '"href": "((?!(https:\/\/amazon\.com)).)*"' +
      '"href": "https://[^ ]*amazon.[^ ]*/?[^ ]*/?"' +
      '},' +
      '"vars": {' +
      '"customerId": "12345",' +
      '"impressionToken": "123456",' +
      '"impressionId": "987654321",' +
      '"tagValue": "abc-20"' +
      '},' +
      '"reportlinks": {' +
      '"url": "https://assoc-na.associates-amazon.com/onetag/${impressionId}/pixel/payload=${payload}",' +
      '"slotNum": true' +
      '},' +
      '"linkers": {' +
      '"enabled": true' +
      '}' +
      '}' +
      '}';
    let trackingService_;
    const aesConfig = JSON.parse(text);
    configOpts = {
      output: aesConfig['localConfig']['output'].toString(),
      section: hasOwn(aesConfig['localConfig'], 'section')
        ? aesConfig['localConfig']['section']
        : [],

      attribute: hasOwn(aesConfig['localConfig'], 'attribute')
        ? parseAttribute(aesConfig['localConfig']['attribute'])
        : {},
      vars: hasOwn(aesConfig['localConfig'], 'vars')
        ? aesConfig['localConfig']['vars']
        : {},
      reportlinks: hasOwn(aesConfig['localConfig'], 'reportlinks')
        ? aesConfig['localConfig']['reportlinks']
        : {},
      linkers: hasOwn(aesConfig['localConfig'], 'linkers')
        ? aesConfig['localConfig']['linkers']
        : {},
    };

    /*const targetNode = document.getElementsByTagName('a');
        const targetNodeConfig = {attributes: true, childList: true, subtree: true};
        const callback = function(mutationsList, observer) {
          for(let mutation of mutationsList) {
              
              if (mutation.type === 'childList') {
                  console.log('A child node has been added or removed.');
              }
              else if (mutation.type === 'attributes') {
                  console.log(mutation);
                  console.log('The ' + mutation.attributeName + ' attribute was modified.');
              }
          }
        }
        const observer = new MutationObserver(callback);
        try {
          for(let i = 0 ; i < targetNode.length ; i++)
          observer.observe(targetNode[i], targetNodeConfig);  
        } 
        catch (error) {
          console.log("Error : "+ error);  
        }
        // An example of for making analytics calls using 
        // CustomEventReporterBuilder Api
        // **********************************************************
        // const builder = new CustomeEventReporterBuilder(element);
        // builder.track('onetag_pageload','assoc-na.associates-amazon.com/onetag/{impressionId}/pixel');
        // const reporter = builder.build();
        // getIdPromise.then(impressionId => 
        // {
        //   reporter.trigger('onetag_pageload',{'impressionId' : impressionId});
        // });
        */
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
 * Initialise tracking module.
 * @return {!./tracking.Tracking}
 * @private
 */
function initTracking_() {
  // 'amp-analytics' API is waiting for CommonSignals.LOAD_START to be
  // triggered before sending requests.
  // Normally CommonSignals.LOAD_START is sent from layoutCallback but since
  // we are using layout = 'nodisplay', 'layoutCallback' is never called.
  // We need to call it manually to have CustomEventReporterBuilder working.
  this.signals().signal(CommonSignals.LOAD_START);
  return new Tracking(
    this.element,
    this.skimOptions_,
    /** @type {string} */ (this.referrer_)
  );
}

/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
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
import {CustomEventReporterBuilder} from '../../../src/extension-analytics.js';
import {dict} from '../../../src/utils/object';

/**
 *@typedef {{output: string, attribute: Object, vars: Object, reportLinks: Object, linkers: Object }}
 */
let oneTagOptsDef;

export class Tracking {
  /**
   * @param {string} referrer
   * @param {!oneTagOptsDef} configOpts
   * @param {!AmpElement} ampElement
   * @param {!Array<!Element>} listElements
   * @param {!../../../src/service/ampdoc-impl.AmpDoc} ampDoc
   * @param {string} transitId
   */
  constructor(
    referrer,
    configOpts,
    ampElement,
    listElements,
    ampDoc,
    transitId
  ) {
    /** @private {string} */
    this.referrer_ = referrer;

    /**@private {Object} */
    this.configOpts_ = configOpts;

    /** @private {Array<!Element>} */
    this.listElements_ = listElements;

    /** @private {!Object} */
    this.analytics_ = this.setUpAnalytics(ampElement);

    /** @private {?../../../src/service/ampdoc-impl.AmpDoc} */
    this.ampDoc_ = ampDoc;

    /** @private {string} */
    this.transitId_ = transitId;
  }

  /**
   *
   * @param {!AmpElement} element
   * @return {Object}
   * @private
   */
  setUpAnalytics(element) {
    const analyticsBuilder = new CustomEventReporterBuilder(element);
    analyticsBuilder.track(
      'page-tracker',
      this.configOpts_['reportlinks']['url']
    );
    analyticsBuilder.track(
      'link-tracker',
      this.configOpts_['reportlinks']['url']
    );
    analyticsBuilder.setTransportConfig(
      dict({
        'beacon': false,
        'image': {'suppressWarnings': true},
        'xhrpost': false,
      })
    );
    return analyticsBuilder.build();
  }

  /**
   * @private
   */
  sendPageImpression() {
    const pageImpression = dict({
      'refUrl': this.referrer_,
      'assocPayloadID': this.transitId_,
      'pageTitle': this.ampDoc_.getRootNode().title,
      'trackingId': 'apartmentth0a20', // get it from local config
      'logType': 'onetag_pageload', // get it from local config
      'linkCode': 'w49', // get it from local config
    });
    const pageConfig = dict({
      'impressionId': this.configOpts_['vars']['impressionId'],
      'assoc_payload': JSON.stringify(pageImpression),
    });
    this.analytics_.trigger('page-tracker', pageConfig);
  }

  /**
   * @private
   */
  sendLinkImpressions() {
    for (let i = 0; i < this.listElements_.length; i++) {
      const linkImpression = dict({
        'refUrl': this.referrer_,
        'assocPayloadID': this.transitId_,
        'pageTitle': this.ampDoc_.getRootNode().title,
        'trackingId': 'apartmentth0a20', // get it from local config
        'logType': 'onetag_pageload', // get it from local config
      });
      linkImpression['destinationUrl'] = this.listElements_[i].href;
      linkImpression['slotNum'] = i; //Bug here we havr to retire slotNumber from tag's attribute
      linkImpression['linkCode'] = 'w' + (60 + i); // will have to fix this too
      this.analytics_.trigger(
        'link-tracker',
        dict({
          'impressionId': this.configOpts_['vars']['impressionId'],
          'assoc_payload': JSON.stringify(linkImpression),
        })
      );
    }
  }

  /**
   * @private
   * @param element
   */
  fireCalls(element) {
    const linkImpression = dict({
      'refUrl': this.referrer_,
      'assocPayloadID': this.transitId_,
      'pageTitle': this.ampDoc_.getRootNode().title,
      'trackingId': 'apartmentth0a20', // get it from local config
      'logType': 'onetag_pageload', // get it from local config
    });
    linkImpression['destinationUrl'] = element.href;
    linkImpression['slotNum'] = i; //Bug here we havr to retire slotNumber from tag's attribute
    linkImpression['linkCode'] = 'w' + (60 + i); // will have to fix this too
    this.analytics_.trigger(
      'link-tracker',
      dict({
        'impressionId': this.configOpts_['vars']['impressionId'],
        'assoc_payload': JSON.stringify(linkImpression),
      })
    );
  }
}

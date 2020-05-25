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

import {CommonSignals} from '../../../src/common-signals';
import {CustomEventReporterBuilder} from '../../../src/extension-analytics.js';
import {Layout} from '../../../src/layout';
import {LinkRewriter} from './link-rewriter';
import {Priority} from '../../../src/service/navigation';
import {Services} from '../../../src/services';
import {dict, hasOwn} from '../../../src/utils/object';

export class AmpLinkRewriter extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private {?./link-rewriter.LinkRewriter} */
    this.rewriter_ = null;

    /** @private {string} */
    this.referrer_ = '';

    /**@private {Object} */
    this.configOpts = null;

    /**@private {string} */
    this.transitId = '';

    /** @private {?../../../src/service/ampdoc-impl.AmpDoc} */
    this.ampDoc_ = null;
  }

  /** @override */
  buildCallback() {
    this.ampDoc_ = this.getAmpDoc();

    const viewer = Services.viewerForDoc(this.ampDoc_);

    /**
     * We had to get referrerUrl here because when we use expandUrlSync()
     * inside LinkRewriter it doesn't retrieve the referrerUrl
     */
    return this.getAmpDoc()
      .whenReady()
      .then(() => viewer.getReferrerUrl())
      .then((referrer) => (this.referrer_ = referrer))
      .then(this.letsRockIt_.bind(this));
  }

  /**
   * @private
   */
  letsRockIt_() {
    this.rewriter_ = new LinkRewriter(
      this.referrer_,
      this.element,
      this.getAmpDoc()
    );
    this.configOpts = this.rewriter_.configOpts_;
    this.attachClickEvent_();
    if (hasOwn(this.configOpts, 'linkers')) {
      this.amznTransitRecorder();
    }
    this.analyticsCall();
  }

  /**
   * @private
   * @return {*} TODO(#23582): Specify return type
   */
  attachClickEvent_() {
    const nav = Services.navigationForDoc(this.getAmpDoc());
    nav.registerAnchorMutator((anchor) => {
      this.rewriter_.handleClick(anchor);
    }, Priority.LINK_REWRITER_MANAGER);

    return true;
  }

  /**
   *
   * @param {*} layout
   */
  analyticsCall() {
    if (hasOwn(this.configOpts, 'reportlinks')) {
      console.log(this.element);
      this.ampDoc_.waitForBodyOpen().then(() => {
        this.signals().signal(CommonSignals.LOAD_START);
        const analyticsBuilder = new CustomEventReporterBuilder(this.element);
        const url =
          'https://assoc-na.associates-amazon.com/onetag/${impressionId}/pixel?assoc_payload=${assoc_payload}';
        // let link_url1 = 'https://assoc-na.associates-amazon.com/onetag/56b91b61-e37c-f6b7-0f5/pixel?assoc_payload=%7B%22refUrl%22%3A%22https%3A%2F%2Fwww.apartmenttherapy.com'+
        // '%2Fmarie-kondo-konmari-amazon-oxo-drawer-divider-266253%22%2C%22assocPayloadId%22%3A%2276b91b61-b106-0273-109%22%2C%22pageTitle%22%3A%22Amazon%20OXO%'+
        // '20Drawer%20Divider%20For%20Marie%20Kondo%E2%80%99s%20KonMari%20%7C%20Apartment%20Therapy%22%2C%22trackingId%22%3A%22apartmentth0a-20%22%2C%22logType'+
        // '%22%3A%22onetag_textlink%22%2C%22slotNum%22%3A0%2C%22destinationURL%22%3A%22https%3A%2F'+
        // '%2Fwww.amazon.com%2FOXO-Expandable-Dresser-Drawer-Divider%2Fdp%2FB077GFXBW8%2Fref%3Dsr_1_1%3Fie%3DUTF8%26qid%3D1547676074%26sr%3D8-1%26keywords%'+
        // '3Doxo%2Bdrawer%2Bdividers%26tag%3Dapartmentth0a-20%22%2C%22linkCode%22%3A%22w61%22%7D';
        // let link_url2 = 'https://assoc-na.associates-amazon.com/onetag/56b91b61-e37c-f6b7-0f5/pixel?assoc_payload=%7B%22refUrl%22%3A%22https%3A%2F%2Fwww.apartmenttherapy.com'+
        // '%2Fmarie-kondo-konmari-amazon-oxo-drawer-divider-266253%22%2C%22assocPayloadId%22%3A%2276b91b61-b106-0273-109%22%2C%22pageTitle%22%3A%22Amazon%20OXO%'+
        // '20Drawer%20Divider%20For%20Marie%20Kondo%E2%80%99s%20KonMari%20%7C%20Apartment%20Therapy%22%2C%22trackingId%22%3A%22apartmentth0a-20%22%2C%22logType'+
        // '%22%3A%22onetag_textlink%22%2C%22slotNum%22%3A1%2C%22destinationURL%22%3A%22https%3A%2F%'+
        // '2Fwww.amazon.com%2FOXO-Expandable-Dresser-Drawer-Divider%2Fdp%2FB077GFXBW8%2Fref%3Dsr_1_1%3Fie%3DUTF8%26qid%3D1547676074%26sr%3D8-1%26keywords%'+
        // '3Doxo%2Bdrawer%2Bdividers%22%2C%22linkCode%22%3A%22w61%22%7D';
        const config1 = {
          'refUrl':
            'https://www.apartmenttherapy.com/marie-kondo-konmari-amazon-oxo-drawer-divider-266253',
          'assocPayloadId': this.transitId,
          'pageTitle':
            'Amazon OXO Drawer Divider For Marie Kondo’s KonMari | Apartment Therapy',
          'trackingId': 'apartmentth0a20',
          'logType': 'onetag_pageload',
          'linkCode': 'w49',
        };
        const config2 = {
          'refUrl':
            'https://www.apartmenttherapy.com/marie-kondo-konmari-amazon-oxo-drawer-divider-266253',
          'assocPayloadId': this.transitId,
          'pageTitle':
            'Amazon OXO Drawer Divider For Marie Kondo’s KonMari | Apartment Therapy',
          'trackingId': 'apartmentth0a20',
          'logType': 'onetag_textlink',
          'slotNum': 0,
          'destinationURL':
            'https://www.amazon.com/OXO-Expandable-DresserDrawerDivider/dp/B077GFXBW8/ref=sr_1_1?ie=UTF8&qid=1547676074&sr=81&keywords=oxo+drawer+dividers&tag=apartmentth0a20',
          'linkCode': 'w61',
        };
        const config3 = {
          'refUrl':
            'https://www.apartmenttherapy.com/marie-kondo-konmari-amazon-oxo-drawer-divider-266253',
          'assocPayloadId': this.transitId,
          'pageTitle':
            'Amazon OXO Drawer Divider For Marie Kondo’s KonMari | Apartment Therapy',
          'trackingId': 'apartmentth0a20',
          'logType': 'onetag_textlink',
          'slotNum': 1,
          'destinationURL':
            'https://www.amazon.com/OXO-Expandable-DresserDrawerDivider/dp/B077GFXBW8/ref=sr_1_1?ie=UTF8&qid=1547676074&sr=81&keywords=oxo+drawer+dividers',
          'linkCode': 'w61',
        };
        analyticsBuilder.track('page-tracker', [url]);
        analyticsBuilder.track('link-tracker', [url]);
        analyticsBuilder.setTransportConfig(
          dict({
            'beacon': false,
            'image': {'suppressWarnings': true},
            'xhrpost': false,
          })
        );
        const reporter = analyticsBuilder.build();
        reporter.trigger(
          'page-tracker',
          dict({
            'impressionId': '56b91b61-e37c-f6b7-0f5',
            'assoc_payload': JSON.stringify(config1),
          })
        );
        reporter.trigger(
          'link-tracker',
          dict({
            'impressionId': '56b91b61-e37c-f6b7-0f5',
            'assoc_payload': JSON.stringify(config2),
          })
        );
        reporter.trigger(
          'link-tracker',
          dict({
            'impressionId': '56b91b61-e37c-f6b7-0f5',
            'assoc_payload': JSON.stringify(config3),
          })
        );
      });
    }
  }

  /**
   * @private
   */

  amznTransitRecorder() {
    const configObject = this.configOpts;
    const that = '';
    const TRANSIT_ID_KEY = 'assocPayloadId';
    const trackingEnabled = configObject['linkers']['enabled'];
    const TRANSIT_ID_VALUE =
      configObject['vars']['impressionToken'] +
      '-' +
      configObject['vars']['impressionId'];

    if (trackingEnabled === false) {
      return that;
    }

    if (trackingEnabled === true && !getTransitId()) {
      sessionStorage.setItem(TRANSIT_ID_KEY, TRANSIT_ID_VALUE);
    }

    //To check if the 'assocPayloadId' is already present
    function getTransitId() {
      const existingTransitId = sessionStorage.getItem(TRANSIT_ID_KEY);
      return existingTransitId;
    }

    this.transitId = sessionStorage.getItem(TRANSIT_ID_KEY);
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout === Layout.NODISPLAY;
  }
}

AMP.extension('amp-link-rewriter', '0.1', (AMP) => {
  AMP.registerElement('amp-link-rewriter', AmpLinkRewriter);
  AMP.registerElement('amp-amazon-onetag', AmpLinkRewriter);
});

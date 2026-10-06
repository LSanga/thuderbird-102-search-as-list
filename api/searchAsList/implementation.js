/* SPDX-License-Identifier: MIT */

"use strict";

var { ExtensionCommon } = ChromeUtils.import(
  "resource://gre/modules/ExtensionCommon.jsm"
);
var { ExtensionSupport } = ChromeUtils.import(
  "resource:///modules/ExtensionSupport.jsm"
);
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

const MESSENGER_URL = "chrome://messenger/content/messenger.xhtml";
const PATCH_KEY = "__searchAsListPatch";

/**
 * Convert the arguments of a "glodaFacet" tab into arguments for a
 * "glodaList" tab (the same tab the facet view's "Open as list" button opens).
 * Returns null when the request should be left to the faceted view.
 */
function toListArgs(win, args) {
  if (!args || typeof args != "object") {
    return null;
  }

  let listArgs = null;

  if (args.searcher) {
    // Search bar / in-tab search box: a GlodaMsgSearcher.
    let searchString = (args.searcher.searchString || "").trim();
    if (!searchString) {
      return null;
    }
    listArgs = {
      query: args.searcher.buildFulltextQuery(),
      title: searchString,
    };
  } else if (args.query) {
    // Autocomplete suggestions (contacts, tags, identities...).
    listArgs = { query: args.query, title: queryTitle(win) };
  } else if (args.collection) {
    listArgs = { collection: args.collection, title: queryTitle(win) };
  } else {
    return null;
  }

  if ("background" in args) {
    listArgs.background = args.background;
  }
  return listArgs;
}

function queryTitle(win) {
  try {
    return win.glodaFacetTabType.strings.GetStringFromName(
      "glodaFacetView.tab.query.label"
    );
  } catch (e) {
    return "Search";
  }
}

function patchWindow(win) {
  let tabmail = win.document.getElementById("tabmail");
  if (!tabmail || tabmail[PATCH_KEY]) {
    return;
  }

  let hadOwnOpenTab = Object.prototype.hasOwnProperty.call(tabmail, "openTab");
  let originalOpenTab = tabmail.openTab;

  let wrappedOpenTab = function(modeName, args, ...rest) {
    if (modeName == "glodaFacet") {
      try {
        let listArgs = toListArgs(win, args);
        if (listArgs) {
          return originalOpenTab.call(this, "glodaList", listArgs, ...rest);
        }
      } catch (e) {
        Cu.reportError(e);
      }
    }
    return originalOpenTab.call(this, modeName, args, ...rest);
  };

  tabmail.openTab = wrappedOpenTab;
  tabmail[PATCH_KEY] = { hadOwnOpenTab, originalOpenTab, wrappedOpenTab };
}

function unpatchWindow(win) {
  let tabmail = win.document.getElementById("tabmail");
  let patch = tabmail && tabmail[PATCH_KEY];
  if (!patch) {
    return;
  }

  // Only restore if nobody wrapped our wrapper in the meantime.
  if (tabmail.openTab === patch.wrappedOpenTab) {
    if (patch.hadOwnOpenTab) {
      tabmail.openTab = patch.originalOpenTab;
    } else {
      delete tabmail.openTab;
    }
    delete tabmail[PATCH_KEY];
  }
}

this.searchAsList = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    let self = this;
    let listenerId = "searchAsList-" + context.extension.id;

    return {
      searchAsList: {
        async enable() {
          if (self.listenerId) {
            return;
          }
          self.listenerId = listenerId;
          ExtensionSupport.registerWindowListener(listenerId, {
            chromeURLs: [MESSENGER_URL],
            onLoadWindow: patchWindow,
            onUnloadWindow: unpatchWindow,
          });
        },
        async disable() {
          self._disable();
        },
      },
    };
  }

  _disable() {
    if (!this.listenerId) {
      return;
    }
    ExtensionSupport.unregisterWindowListener(this.listenerId);
    this.listenerId = null;
    for (let win of Services.wm.getEnumerator("mail:3pane")) {
      unpatchWindow(win);
    }
  }

  onShutdown(isAppShutdown) {
    if (isAppShutdown) {
      return;
    }
    this._disable();
    // Make sure an updated implementation.js is picked up on reinstall.
    Services.obs.notifyObservers(null, "startupcache-invalidate");
  }
};

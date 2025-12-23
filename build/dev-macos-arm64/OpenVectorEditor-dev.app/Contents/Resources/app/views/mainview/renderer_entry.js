// node_modules/rpc-anywhere/dist/esm/rpc.js
var MAX_ID = 10000000000;
var DEFAULT_MAX_REQUEST_TIME = 1000;
function missingTransportMethodError(methods, action) {
  const methodsString = methods.map((method) => `"${method}"`).join(", ");
  return new Error(`This RPC instance cannot ${action} because the transport did not provide one or more of these methods: ${methodsString}`);
}
function _createRPC(options = {}) {
  let debugHooks = {};
  function _setDebugHooks(newDebugHooks) {
    debugHooks = newDebugHooks;
  }
  let transport = {};
  function setTransport(newTransport) {
    if (transport.unregisterHandler)
      transport.unregisterHandler();
    transport = newTransport;
    transport.registerHandler?.(handler);
  }
  let requestHandler = undefined;
  function setRequestHandler(handler2) {
    if (typeof handler2 === "function") {
      requestHandler = handler2;
      return;
    }
    requestHandler = (method, params) => {
      const handlerFn = handler2[method];
      if (handlerFn)
        return handlerFn(params);
      const fallbackHandler = handler2._;
      if (!fallbackHandler)
        throw new Error(`The requested method has no handler: ${method}`);
      return fallbackHandler(method, params);
    };
  }
  const { maxRequestTime = DEFAULT_MAX_REQUEST_TIME } = options;
  if (options.transport)
    setTransport(options.transport);
  if (options.requestHandler)
    setRequestHandler(options.requestHandler);
  if (options._debugHooks)
    _setDebugHooks(options._debugHooks);
  let lastRequestId = 0;
  function getRequestId() {
    if (lastRequestId <= MAX_ID)
      return ++lastRequestId;
    return lastRequestId = 0;
  }
  const requestListeners = new Map;
  const requestTimeouts = new Map;
  function requestFn(method, ...args) {
    const params = args[0];
    return new Promise((resolve, reject) => {
      if (!transport.send)
        throw missingTransportMethodError(["send"], "make requests");
      const requestId = getRequestId();
      const request2 = {
        type: "request",
        id: requestId,
        method,
        params
      };
      requestListeners.set(requestId, { resolve, reject });
      if (maxRequestTime !== Infinity)
        requestTimeouts.set(requestId, setTimeout(() => {
          requestTimeouts.delete(requestId);
          reject(new Error("RPC request timed out."));
        }, maxRequestTime));
      debugHooks.onSend?.(request2);
      transport.send(request2);
    });
  }
  const request = new Proxy(requestFn, {
    get: (target, prop, receiver) => {
      if (prop in target)
        return Reflect.get(target, prop, receiver);
      return (params) => requestFn(prop, params);
    }
  });
  const requestProxy = request;
  function sendFn(message, ...args) {
    const payload = args[0];
    if (!transport.send)
      throw missingTransportMethodError(["send"], "send messages");
    const rpcMessage = {
      type: "message",
      id: message,
      payload
    };
    debugHooks.onSend?.(rpcMessage);
    transport.send(rpcMessage);
  }
  const send = new Proxy(sendFn, {
    get: (target, prop, receiver) => {
      if (prop in target)
        return Reflect.get(target, prop, receiver);
      return (payload) => sendFn(prop, payload);
    }
  });
  const sendProxy = send;
  const messageListeners = new Map;
  const wildcardMessageListeners = new Set;
  function addMessageListener(message, listener) {
    if (!transport.registerHandler)
      throw missingTransportMethodError(["registerHandler"], "register message listeners");
    if (message === "*") {
      wildcardMessageListeners.add(listener);
      return;
    }
    if (!messageListeners.has(message))
      messageListeners.set(message, new Set);
    messageListeners.get(message)?.add(listener);
  }
  function removeMessageListener(message, listener) {
    if (message === "*") {
      wildcardMessageListeners.delete(listener);
      return;
    }
    messageListeners.get(message)?.delete(listener);
    if (messageListeners.get(message)?.size === 0)
      messageListeners.delete(message);
  }
  async function handler(message) {
    debugHooks.onReceive?.(message);
    if (!("type" in message))
      throw new Error("Message does not contain a type.");
    if (message.type === "request") {
      if (!transport.send || !requestHandler)
        throw missingTransportMethodError(["send", "requestHandler"], "handle requests");
      const { id, method, params } = message;
      let response;
      try {
        response = {
          type: "response",
          id,
          success: true,
          payload: await requestHandler(method, params)
        };
      } catch (error) {
        if (!(error instanceof Error))
          throw error;
        response = {
          type: "response",
          id,
          success: false,
          error: error.message
        };
      }
      debugHooks.onSend?.(response);
      transport.send(response);
      return;
    }
    if (message.type === "response") {
      const timeout = requestTimeouts.get(message.id);
      if (timeout != null)
        clearTimeout(timeout);
      const { resolve, reject } = requestListeners.get(message.id) ?? {};
      if (!message.success)
        reject?.(new Error(message.error));
      else
        resolve?.(message.payload);
      return;
    }
    if (message.type === "message") {
      for (const listener of wildcardMessageListeners)
        listener(message.id, message.payload);
      const listeners = messageListeners.get(message.id);
      if (!listeners)
        return;
      for (const listener of listeners)
        listener(message.payload);
      return;
    }
    throw new Error(`Unexpected RPC message type: ${message.type}`);
  }
  const proxy = { send: sendProxy, request: requestProxy };
  return {
    setTransport,
    setRequestHandler,
    request,
    requestProxy,
    send,
    sendProxy,
    addMessageListener,
    removeMessageListener,
    proxy,
    _setDebugHooks
  };
}

// node_modules/rpc-anywhere/dist/esm/create-rpc.js
function createRPC(options) {
  return _createRPC(options);
}
// node_modules/electrobun/dist/api/browser/webviewtag.ts
var ConfigureWebviewTags = (enableWebviewTags, internalRpc, bunRpc) => {
  if (!enableWebviewTags) {
    return;
  }

  class WebviewTag extends HTMLElement {
    webviewId;
    internalRpc;
    bunRpc;
    maskSelectors = new Set;
    resizeObserver;
    positionCheckLoop;
    positionCheckLoopReset;
    lastRect = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
    lastMasksJSON = "";
    lastMasks = [];
    transparent = false;
    passthroughEnabled = false;
    hidden = false;
    hiddenMirrorMode = false;
    wasZeroRect = false;
    isMirroring = false;
    masks = "";
    partition = null;
    constructor() {
      super();
      this.internalRpc = internalRpc;
      this.bunRpc = bunRpc;
      requestAnimationFrame(() => {
        this.initWebview();
      });
    }
    addMaskSelector(selector) {
      this.maskSelectors.add(selector);
      this.syncDimensions();
    }
    removeMaskSelector(selector) {
      this.maskSelectors.delete(selector);
      this.syncDimensions();
    }
    async initWebview() {
      const rect = this.getBoundingClientRect();
      this.lastRect = rect;
      const url = this.src || this.getAttribute("src");
      const html = this.html || this.getAttribute("html");
      const maskSelectors = this.masks || this.getAttribute("masks");
      if (maskSelectors) {
        maskSelectors.split(",").forEach((s) => {
          this.maskSelectors.add(s);
        });
      }
      const webviewId = await this.internalRpc.request.webviewTagInit({
        hostWebviewId: window.__electrobunWebviewId,
        windowId: window.__electrobunWindowId,
        renderer: this.renderer,
        url,
        html,
        preload: this.preload || this.getAttribute("preload") || null,
        partition: this.partition || this.getAttribute("partition") || null,
        frame: {
          width: rect.width,
          height: rect.height,
          x: rect.x,
          y: rect.y
        },
        navigationRules: null
      });
      console.log("electrobun webviewid: ", webviewId);
      this.webviewId = webviewId;
      this.id = `electrobun-webview-${webviewId}`;
      this.setAttribute("id", this.id);
    }
    asyncResolvers = {};
    callAsyncJavaScript({ script }) {
      return new Promise((resolve, reject) => {
        const messageId = "" + Date.now() + Math.random();
        this.asyncResolvers[messageId] = {
          resolve,
          reject
        };
        this.internalRpc.request.webviewTagCallAsyncJavaScript({
          messageId,
          webviewId: this.webviewId,
          hostWebviewId: window.__electrobunWebviewId,
          script
        });
      });
    }
    setCallAsyncJavaScriptResponse(messageId, response) {
      const resolvers = this.asyncResolvers[messageId];
      delete this.asyncResolvers[messageId];
      try {
        response = JSON.parse(response);
        if (response.result) {
          resolvers.resolve(response.result);
        } else {
          resolvers.reject(response.error);
        }
      } catch (e) {
        resolvers.reject(e.message);
      }
    }
    async canGoBack() {
      return this.internalRpc.request.webviewTagCanGoBack({ id: this.webviewId });
    }
    async canGoForward() {
      return this.internalRpc.request.webviewTagCanGoForward({
        id: this.webviewId
      });
    }
    updateAttr(name, value) {
      if (value) {
        this.setAttribute(name, value);
      } else {
        this.removeAttribute(name);
      }
    }
    get src() {
      return this.getAttribute("src");
    }
    set src(value) {
      this.updateAttr("src", value);
    }
    get html() {
      return this.getAttribute("html");
    }
    set html(value) {
      this.updateAttr("html", value);
    }
    get preload() {
      return this.getAttribute("preload");
    }
    set preload(value) {
      this.updateAttr("preload", value);
    }
    get renderer() {
      const _renderer = this.getAttribute("renderer") === "cef" ? "cef" : "native";
      return _renderer;
    }
    set renderer(value) {
      const _renderer = value === "cef" ? "cef" : "native";
      this.updateAttr("renderer", _renderer);
    }
    adjustDimensionsForHiddenMirrorMode(rect) {
      if (this.hiddenMirrorMode) {
        rect.x = 0 - rect.width;
      }
      return rect;
    }
    on(event, listener) {
      this.addEventListener(event, listener);
    }
    off(event, listener) {
      this.removeEventListener(event, listener);
    }
    emit(event, detail) {
      this.dispatchEvent(new CustomEvent(event, { detail }));
    }
    syncDimensions(force = false) {
      if (!this.webviewId || !force && this.hidden) {
        return;
      }
      const rect = this.getBoundingClientRect();
      const { x, y, width, height } = this.adjustDimensionsForHiddenMirrorMode(rect);
      const lastRect = this.lastRect;
      if (width === 0 && height === 0) {
        if (this.wasZeroRect === false) {
          console.log("WAS NOT ZERO RECT", this.webviewId);
          this.wasZeroRect = true;
          this.toggleTransparent(true, true);
          this.togglePassthrough(true, true);
        }
        return;
      }
      const masks = [];
      this.maskSelectors.forEach((selector) => {
        const els = document.querySelectorAll(selector);
        for (let i = 0;i < els.length; i++) {
          const el = els[i];
          if (el) {
            const maskRect = el.getBoundingClientRect();
            masks.push({
              x: maskRect.x - x,
              y: maskRect.y - y,
              width: maskRect.width,
              height: maskRect.height
            });
          }
        }
      });
      const masksJson = masks.length ? JSON.stringify(masks) : "";
      if (force || lastRect.x !== x || lastRect.y !== y || lastRect.width !== width || lastRect.height !== height || this.lastMasksJSON !== masksJson) {
        this.setPositionCheckLoop(true);
        this.lastRect = rect;
        this.lastMasks = masks;
        this.lastMasksJSON = masksJson;
        this.internalRpc.send.webviewTagResize({
          id: this.webviewId,
          frame: {
            width,
            height,
            x,
            y
          },
          masks: masksJson
        });
      }
      if (this.wasZeroRect) {
        this.wasZeroRect = false;
        console.log("WAS ZERO RECT", this.webviewId);
        this.toggleTransparent(false, true);
        this.togglePassthrough(false, true);
      }
    }
    boundSyncDimensions = () => this.syncDimensions();
    boundForceSyncDimensions = () => this.syncDimensions(true);
    setPositionCheckLoop(accelerate = false) {
      if (this.positionCheckLoop) {
        clearInterval(this.positionCheckLoop);
        this.positionCheckLoop = undefined;
      }
      if (this.positionCheckLoopReset) {
        clearTimeout(this.positionCheckLoopReset);
        this.positionCheckLoopReset = undefined;
      }
      const delay = accelerate ? 0 : 300;
      if (accelerate) {
        this.positionCheckLoopReset = setTimeout(() => {
          this.setPositionCheckLoop(false);
        }, 2000);
      }
      this.positionCheckLoop = setInterval(() => this.syncDimensions(), delay);
    }
    connectedCallback() {
      this.setPositionCheckLoop();
      this.resizeObserver = new ResizeObserver(() => {
        this.syncDimensions();
      });
      window.addEventListener("resize", this.boundForceSyncDimensions);
      window.addEventListener("scroll", this.boundSyncDimensions);
    }
    disconnectedCallback() {
      clearInterval(this.positionCheckLoop);
      this.resizeObserver?.disconnect();
      window.removeEventListener("resize", this.boundForceSyncDimensions);
      window.removeEventListener("scroll", this.boundSyncDimensions);
      if (this.webviewId) {
        this.internalRpc.send.webviewTagRemove({ id: this.webviewId });
        this.webviewId = undefined;
      }
    }
    static get observedAttributes() {
      return ["src", "html", "preload", "class", "style"];
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "src" && oldValue !== newValue) {
        this.updateIFrameSrc(newValue);
      } else if (name === "html" && oldValue !== newValue) {
        this.updateIFrameHtml(newValue);
      } else if (name === "preload" && oldValue !== newValue) {
        this.updateIFramePreload(newValue);
      } else {
        this.syncDimensions();
      }
    }
    updateIFrameSrc(src) {
      if (!this.webviewId) {
        console.warn("updateIFrameSrc called on removed webview");
        return;
      }
      this.internalRpc.send.webviewTagUpdateSrc({
        id: this.webviewId,
        url: src
      });
    }
    updateIFrameHtml(html) {
      if (!this.webviewId) {
        console.warn("updateIFrameHtml called on removed webview");
        return;
      }
      this.internalRpc.send.webviewTagUpdateHtml({
        id: this.webviewId,
        html
      });
    }
    updateIFramePreload(preload) {
      if (!this.webviewId) {
        console.warn("updateIFramePreload called on removed webview");
        return;
      }
      this.internalRpc.send.webviewTagUpdatePreload({
        id: this.webviewId,
        preload
      });
    }
    goBack() {
      if (!this.webviewId) {
        console.warn("goBack called on removed webview");
        return;
      }
      this.internalRpc.send.webviewTagGoBack({ id: this.webviewId });
    }
    goForward() {
      if (!this.webviewId) {
        console.warn("goForward called on removed webview");
        return;
      }
      this.internalRpc.send.webviewTagGoForward({ id: this.webviewId });
    }
    reload() {
      if (!this.webviewId) {
        console.warn("reload called on removed webview");
        return;
      }
      this.internalRpc.send.webviewTagReload({ id: this.webviewId });
    }
    loadURL(url) {
      if (!this.webviewId) {
        console.warn("loadURL called on removed webview");
        return;
      }
      this.setAttribute("src", url);
      this.internalRpc.send.webviewTagUpdateSrc({
        id: this.webviewId,
        url
      });
    }
    loadHTML(html) {
      if (!this.webviewId) {
        console.warn("loadHTML called on removed webview");
        return;
      }
      this.setAttribute("html", html);
      this.internalRpc.send.webviewTagUpdateHtml({
        id: this.webviewId,
        html
      });
    }
    toggleTransparent(transparent, bypassState) {
      if (!this.webviewId) {
        console.warn("toggleTransparent called on removed webview");
        return;
      }
      let newValue;
      if (typeof transparent === "undefined") {
        newValue = !this.transparent;
      } else {
        newValue = Boolean(transparent);
      }
      if (!bypassState) {
        this.transparent = newValue;
      }
      this.internalRpc.send.webviewTagSetTransparent({
        id: this.webviewId,
        transparent: newValue
      });
    }
    togglePassthrough(enablePassthrough, bypassState) {
      if (!this.webviewId) {
        console.warn("togglePassthrough called on removed webview");
        return;
      }
      let newValue;
      if (typeof enablePassthrough === "undefined") {
        newValue = !this.passthroughEnabled;
      } else {
        newValue = Boolean(enablePassthrough);
      }
      if (!bypassState) {
        this.passthroughEnabled = newValue;
      }
      this.internalRpc.send.webviewTagSetPassthrough({
        id: this.webviewId,
        enablePassthrough: this.passthroughEnabled || Boolean(enablePassthrough)
      });
    }
    toggleHidden(hidden, bypassState) {
      if (!this.webviewId) {
        console.warn("toggleHidden called on removed webview");
        return;
      }
      let newValue;
      if (typeof hidden === "undefined") {
        newValue = !this.hidden;
      } else {
        newValue = Boolean(hidden);
      }
      if (!bypassState) {
        this.hidden = newValue;
      }
      console.trace("electrobun toggle hidden: ", this.hidden, this.webviewId);
      this.internalRpc.send.webviewTagSetHidden({
        id: this.webviewId,
        hidden: this.hidden || Boolean(hidden)
      });
    }
  }
  customElements.define("electrobun-webview", WebviewTag);
  insertWebviewTagNormalizationStyles();
};
var insertWebviewTagNormalizationStyles = () => {
  var style = document.createElement("style");
  style.type = "text/css";
  var css = `
electrobun-webview {
    display: block;
    width: 800px;
    height: 300px;
    background: #fff;
    background-repeat: no-repeat!important;   
    overflow: hidden; 
}
`;
  style.appendChild(document.createTextNode(css));
  var head = document.getElementsByTagName("head")[0];
  if (!head) {
    return;
  }
  if (head.firstChild) {
    head.insertBefore(style, head.firstChild);
  } else {
    head.appendChild(style);
  }
};

// node_modules/electrobun/dist/api/browser/stylesAndElements.ts
var isAppRegionDrag = (e) => {
  return e.target?.classList.contains("electrobun-webkit-app-region-drag");
};

// node_modules/electrobun/dist/api/browser/index.ts
var WEBVIEW_ID = window.__electrobunWebviewId;
var WINDOW_ID = window.__electrobunWindowId;
var RPC_SOCKET_PORT = window.__electrobunRpcSocketPort;

class Electroview {
  bunSocket;
  rpc;
  rpcHandler;
  internalRpc;
  internalRpcHandler;
  constructor(config) {
    this.rpc = config.rpc;
    this.init();
  }
  init() {
    this.initInternalRpc();
    this.initSocketToBun();
    ConfigureWebviewTags(true, this.internalRpc, this.rpc);
    this.initElectrobunListeners();
    window.__electrobun = {
      receiveMessageFromBun: this.receiveMessageFromBun.bind(this),
      receiveInternalMessageFromBun: this.receiveInternalMessageFromBun.bind(this)
    };
    if (this.rpc) {
      this.rpc.setTransport(this.createTransport());
    }
  }
  initInternalRpc() {
    this.internalRpc = createRPC({
      transport: this.createInternalTransport(),
      maxRequestTime: 1000
    });
  }
  initSocketToBun() {
    const socket = new WebSocket(`ws://localhost:${RPC_SOCKET_PORT}/socket?webviewId=${WEBVIEW_ID}`);
    this.bunSocket = socket;
    socket.addEventListener("open", () => {});
    socket.addEventListener("message", async (event) => {
      const message = event.data;
      if (typeof message === "string") {
        try {
          const encryptedPacket = JSON.parse(message);
          const decrypted = await window.__electrobun_decrypt(encryptedPacket.encryptedData, encryptedPacket.iv, encryptedPacket.tag);
          this.rpcHandler?.(JSON.parse(decrypted));
        } catch (err) {
          console.error("Error parsing bun message:", err);
        }
      } else if (message instanceof Blob) {} else {
        console.error("UNKNOWN DATA TYPE RECEIVED:", event.data);
      }
    });
    socket.addEventListener("error", (event) => {
      console.error("Socket error:", event);
    });
    socket.addEventListener("close", (event) => {});
  }
  receiveInternalMessageFromBun(msg) {
    if (this.internalRpcHandler) {
      this.internalRpcHandler(msg);
    }
  }
  isProcessingQueue = false;
  sendToInternalQueue = [];
  sendToBunInternal(message) {
    try {
      const strMessage = JSON.stringify(message);
      this.sendToInternalQueue.push(strMessage);
      this.processQueue();
    } catch (err) {
      console.error("failed to send to bun internal", err);
    }
  }
  processQueue() {
    const that = this;
    if (that.isProcessingQueue) {
      setTimeout(() => {
        that.processQueue();
      });
      return;
    }
    if (that.sendToInternalQueue.length === 0) {
      return;
    }
    that.isProcessingQueue = true;
    const batchMessage = JSON.stringify(that.sendToInternalQueue);
    that.sendToInternalQueue = [];
    window.__electrobunInternalBridge?.postMessage(batchMessage);
    setTimeout(() => {
      that.isProcessingQueue = false;
    }, 2);
  }
  initElectrobunListeners() {
    document.addEventListener("mousedown", (e) => {
      if (isAppRegionDrag(e)) {
        this.internalRpc?.send.startWindowMove({ id: WINDOW_ID });
      }
    });
    document.addEventListener("mouseup", (e) => {
      if (isAppRegionDrag(e)) {
        this.internalRpc?.send.stopWindowMove({ id: WINDOW_ID });
      }
    });
  }
  createTransport() {
    const that = this;
    return {
      send(message) {
        try {
          const messageString = JSON.stringify(message);
          that.bunBridge(messageString);
        } catch (error) {
          console.error("bun: failed to serialize message to webview", error);
        }
      },
      registerHandler(handler) {
        that.rpcHandler = handler;
      }
    };
  }
  createInternalTransport() {
    const that = this;
    return {
      send(message) {
        message.hostWebviewId = WEBVIEW_ID;
        that.sendToBunInternal(message);
      },
      registerHandler(handler) {
        that.internalRpcHandler = handler;
      }
    };
  }
  async bunBridge(msg) {
    if (this.bunSocket?.readyState === WebSocket.OPEN) {
      try {
        const { encryptedData, iv, tag } = await window.__electrobun_encrypt(msg);
        const encryptedPacket = {
          encryptedData,
          iv,
          tag
        };
        const encryptedPacketString = JSON.stringify(encryptedPacket);
        this.bunSocket.send(encryptedPacketString);
        return;
      } catch (error) {
        console.error("Error sending message to bun via socket:", error);
      }
    }
    if (true) {
      window.__electrobunBunBridge?.postMessage(msg);
    } else {
      var xhr;
    }
  }
  receiveMessageFromBun(msg) {
    if (this.rpcHandler) {
      this.rpcHandler(msg);
    }
  }
  static defineRPC(config) {
    const builtinHandlers = {
      requests: {
        evaluateJavascriptWithResponse: ({ script }) => {
          return new Promise((resolve) => {
            try {
              const resultFunction = new Function(script);
              const result = resultFunction();
              if (result instanceof Promise) {
                result.then((resolvedResult) => {
                  resolve(resolvedResult);
                }).catch((error) => {
                  console.error("bun: async script execution failed", error);
                  resolve(String(error));
                });
              } else {
                resolve(result);
              }
            } catch (error) {
              console.error("bun: failed to eval script", error);
              resolve(String(error));
            }
          });
        }
      }
    };
    const rpcOptions = {
      maxRequestTime: config.maxRequestTime,
      requestHandler: {
        ...config.handlers.requests,
        ...builtinHandlers.requests
      },
      transport: {
        registerHandler: () => {}
      }
    };
    const rpc = createRPC(rpcOptions);
    const messageHandlers = config.handlers.messages;
    if (messageHandlers) {
      rpc.addMessageListener("*", (messageName, payload) => {
        const globalHandler = messageHandlers["*"];
        if (globalHandler) {
          globalHandler(messageName, payload);
        }
        const messageHandler = messageHandlers[messageName];
        if (messageHandler) {
          messageHandler(payload);
        }
      });
    }
    return rpc;
  }
}

// src/renderer_entry.ts
var rpc = Electroview.defineRPC({
  handlers: {
    requests: {},
    messages: {}
  }
});
console.log("Electroview initialized");
window.api = {
  send: async (channel, data) => {
    console.log("Bridge send:", channel, data);
    if (channel === "ove_saveFile") {
      return await rpc.request.ove_saveFile(data);
    } else if (channel === "ove_showSaveDialog") {
      return await rpc.request.ove_showSaveDialog(data);
    }
  }
};

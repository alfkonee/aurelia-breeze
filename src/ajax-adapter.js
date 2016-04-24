import breeze from 'breeze';

const extend = breeze.core.extend;
export class HttpResponse {
  constructor(aureliaResponse, config) {
    this.config = config;
    this.status = aureliaResponse.statusCode;
    this.data = aureliaResponse.content;
    this.headers = aureliaResponse.headers;
  }

  getHeader(headerName) {
    if (headerName === null || headerName === undefined || headerName === '') {
      return this.headers.headers;
    }
    return this.headers.get(headerName);
  }
}

export class AjaxAdapter {
  constructor() {
    this.name = 'aurelia';
    this.requestInterceptor = null;
  }

  setHttpClientFactory(createHttpClient) {
    this.createHttpClient = createHttpClient;
  }

  get httpClient() {
    return this.client || (this.client = this.createHttpClient());
  }

  initialize() { }

  ajax(config) {
    // build the request info object.
    let requestInfo = {
      adapter: this,
      config: extend({}, config),
      zConfig: config,
      success: config.success,
      error: config.error
    };
    requestInfo.config.request = this.httpClient;
    requestInfo.config.headers = extend({}, config.headers);

    // submit the request-info for interception.
    if (breeze.core.isFunction(this.requestInterceptor)) {
      this.requestInterceptor(requestInfo);
      if (this.requestInterceptor.oneTime) {
        this.requestInterceptor = null;
      }
      if (!requestInfo.config) {
        return;
      }
    }

    config = requestInfo.config;
    let init = {
      method: config.type
    }
    // headers: fetch
    init.headers = new Headers();
    for (let header in config.headers) {
      if (config.headers.hasOwnProperty(header)) {
        init.headers.append(header, config.headers[header]);
      }
    }

    if (config.hasOwnProperty('data')) {
      init.body = config.data;
    }

    if (config.contentType) {
      init.headers.append('Content-Type', config.contentType);
    }

    // configure the request...:fetch
    let request = new Request(config.url, init);

    // send the request.
    requestInfo.config.request.fetch(request)
      .then(response => {
        var responseInput = new HttpResponse(response, requestInfo.zConfig);
        response.json()
          .then(x => {
            responseInput.data = x;
            requestInfo.success(responseInput);
          })
          .catch((err) => {
            responseInput.data = err;
            requestInfo.error(responseInput)
          });
      },
      response => {
        var responseInput = new HttpResponse(response, requestInfo.zConfig);
        response.json()
          .then(x => {
            responseInput.data = x;
            requestInfo.error(responseInput);
          })
          .catch(err => {
            responseInput.data = err;
            requestInfo.error(responseInput)
          });
      });
  }
}

breeze.config.registerAdapter('ajax', AjaxAdapter);
